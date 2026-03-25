package middlewares

import (
	"fmt"
	"gomqtt/variable"
	"log"

	mqtt "github.com/mochi-mqtt/server/v2"
	"github.com/mochi-mqtt/server/v2/packets"
)

// ================================
// MIDDLEWARE HOOK
// ================================
type MiddlewareHook struct {
	mqtt.HookBase
}

func (h *MiddlewareHook) ID() string {
	return "middleware-hook"
}

func (h *MiddlewareHook) Provides(b byte) bool {
	return b == mqtt.OnConnect ||
		b == mqtt.OnDisconnect ||
		b == mqtt.OnSubscribe ||
		b == mqtt.OnUnsubscribe ||
		b == mqtt.OnPublish
}

type ClientInfo struct {
	Username string
	Password string
}

var clients = make(map[string]ClientInfo)

// validateCredentials checks if the given username and password match a user in the database.
// Only called when both username and password are non-empty.
func validateCredentials(username, password string) error {
	var count int64
	if err := variable.Db.Table("users").Where("username = ? AND password = ?", username, password).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to query users: %w", err)
	}
	if count == 0 {
		return fmt.Errorf("invalid credentials for username=%s", username)
	}
	return nil
}

// validateTopicAccess checks if the given topic is accessible by the user identified by username+password.
// Only called when both username and password are non-empty.
// Logic: First check if topic exists. If topic has no user_id, allow access. If topic has user_id, validate it matches the user.
func validateTopicAccess(username, password, topicName string) error {
	var result struct {
		UserID *string
	}
	if err := variable.Db.Table("topics").
		Select("user_id").
		Where("name = ?", topicName).
		First(&result).Error; err != nil {
		return fmt.Errorf("topic '%s' not found", topicName)
	}

	// if topic has no credential, allow access
	if result.UserID == nil || *result.UserID == "" {
		return nil
	}
	// log.Printf("🔍 [DEBUG] topic '%s' has credential: user_id=%s", topicName, *result.UserID)

	// topic has credential, validate user match
	var count int64
	if err := variable.Db.Table("users").
		Where("id = ? AND username = ? AND password = ?", *result.UserID, username, password).
		Count(&count).Error; err != nil {
		return fmt.Errorf("failed to query user: %w", err)
	}
	if count == 0 {
		return fmt.Errorf("topic '%s' requires different credentials", topicName)
	}
	return nil
}

// --------------------------------
// ON CONNECT
// --------------------------------
func (h *MiddlewareHook) OnConnect(cl *mqtt.Client, pk packets.Packet) error {
	username := string(pk.Connect.Username)
	password := string(pk.Connect.Password)

	// validate credentials only when both are provided
	if username != "" && password != "" {
		if err := validateCredentials(username, password); err != nil {
			log.Printf("❌ [CONNECT] client_id=%s auth failed: %s\n", cl.ID, err.Error())
			return fmt.Errorf("authentication failed")
		}
	}

	log.Printf("🔌 [CONNECT] client_id=%s username=%s password=%s remote_addr=%s\n",
		cl.ID,
		username,
		password,
		cl.Net.Remote,
	)
	clients[cl.ID] = ClientInfo{
		Username: username,
		Password: password,
	}
	return nil
}

// --------------------------------
// ON DISCONNECT
// --------------------------------
func (h *MiddlewareHook) OnDisconnect(cl *mqtt.Client, err error, expire bool) {
	// remove client from topic subscriptions (pass client pointer to avoid race condition)
	variable.MqttTopicSubs.UnsubscribeClient(cl)
	// Note: Don't delete from clients map here - OnConnect will overwrite it on reconnect
	// This prevents race condition where OnDisconnect from old connection deletes
	// the entry just registered by OnConnect of new connection (takeover scenario)

	if err != nil {
		log.Printf("❌ [DISCONNECT] client_id=%s reason=%s expire=%v\n", cl.ID, err.Error(), expire)
	} else {
		log.Printf("🔴 [DISCONNECT] client_id=%s expire=%v\n", cl.ID, expire)
	}
}

// --------------------------------
// ON SUBSCRIBE
// --------------------------------
func (h *MiddlewareHook) OnSubscribe(cl *mqtt.Client, pk packets.Packet) packets.Packet {
	clientInfo, exists := clients[cl.ID]
	if !exists {
		log.Printf("❌ [SUBSCRIBE] client_id=%s not found\n", cl.ID)
		return pk
	}

	// track all subscriptions in MqttTopicSubs for force disconnect support
	for _, sub := range pk.Filters {
		variable.MqttTopicSubs.Subscribe(sub.Filter, cl.ID, cl)
	}

	validFilters := make([]packets.Subscription, 0, len(pk.Filters))
	for _, sub := range pk.Filters {
		// validate topic access only when both username and password are provided
		if clientInfo.Username != "" && clientInfo.Password != "" {
			if err := validateTopicAccess(clientInfo.Username, clientInfo.Password, sub.Filter); err != nil {
				log.Printf("❌ [SUBSCRIBE] client_id=%s topic access denied: %s\n", cl.ID, err.Error())
				continue
			}
		}
		log.Printf("📥 [SUBSCRIBE] client_id=%s username=%s password=%s topic=%s qos=%d\n",
			cl.ID,
			clientInfo.Username,
			clientInfo.Password,
			sub.Filter,
			sub.Qos,
		)
		validFilters = append(validFilters, sub)
	}

	pk.Filters = validFilters
	return pk
}

// --------------------------------
// ON UNSUBSCRIBE
// --------------------------------
func (h *MiddlewareHook) OnUnsubscribe(cl *mqtt.Client, pk packets.Packet) packets.Packet {
	for _, sub := range pk.Filters {
		log.Printf("📤 [UNSUBSCRIBE] client_id=%s topic=%s\n",
			cl.ID,
			sub.Filter,
		)
		// remove subscription from MqttTopicSubs
		variable.MqttTopicSubs.Unsubscribe(sub.Filter, cl.ID)
	}
	return pk
}

// --------------------------------
// ON PUBLISH
// --------------------------------
func (h *MiddlewareHook) OnPublish(cl *mqtt.Client, pk packets.Packet) (packets.Packet, error) {
	clientInfo, exists := clients[cl.ID]
	if !exists {
		log.Printf("❌ [PUBLISH] client_id=%s not found\n", cl.ID)
		return pk, nil
	}

	// validate topic access only when both username and password are provided
	if clientInfo.Username != "" && clientInfo.Password != "" {
		if err := validateTopicAccess(clientInfo.Username, clientInfo.Password, pk.TopicName); err != nil {
			log.Printf("❌ [PUBLISH] client_id=%s topic access denied: %s\n", cl.ID, err.Error())
			// pk.Payload = []byte(``) // empty payload
			// pk.FixedHeader.Retain = false
			return packets.Packet{}, nil // fmt.Errorf("topic access denied")
		}
	}

	log.Printf("📨 [PUBLISH] client_id=%s username=%s password=%s topic=%s qos=%d\n",
		cl.ID,
		clientInfo.Username,
		clientInfo.Password,
		pk.TopicName,
		pk.FixedHeader.Qos,
	)
	return pk, nil
}
