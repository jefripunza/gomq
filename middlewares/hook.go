package middlewares

import (
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

// --------------------------------
// ON CONNECT
// --------------------------------
func (h *MiddlewareHook) OnConnect(cl *mqtt.Client, pk packets.Packet) error {
	// check if username and password not empty
	if string(pk.Connect.Username) != "" && string(pk.Connect.Password) != "" {
		// check if username and password is ok
	}
	log.Printf("🔌 [CONNECT] client_id=%s username=%s password=%s remote_addr=%s\n",
		cl.ID,
		string(pk.Connect.Username),
		string(pk.Connect.Password),
		cl.Net.Remote,
	)
	clients[cl.ID] = ClientInfo{
		Username: string(pk.Connect.Username),
		Password: string(pk.Connect.Password),
	}
	return nil
}

// --------------------------------
// ON DISCONNECT
// --------------------------------
func (h *MiddlewareHook) OnDisconnect(cl *mqtt.Client, err error, expire bool) {
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
	for _, sub := range pk.Filters {
		log.Printf("📥 [SUBSCRIBE] client_id=%s username=%s password=%s topic=%s qos=%d\n",
			cl.ID,
			clientInfo.Username,
			clientInfo.Password,
			sub.Filter,
			sub.Qos,
		)
	}
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
	log.Printf("📨 [PUBLISH] client_id=%s username=%s password=%s topic=%s qos=%d payload=%s\n",
		cl.ID,
		clientInfo.Username,
		clientInfo.Password,
		pk.TopicName,
		pk.FixedHeader.Qos,
		string(pk.Payload),
	)
	return pk, nil
}
