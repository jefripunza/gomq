package variable

import (
	"log"
	"sync"

	mqtt "github.com/mochi-mqtt/server/v2"
)

var MqttServer *mqtt.Server

// TopicSubscribers tracks which clients are subscribed to which topics
// Structure: map[topicName] -> map[clientID] -> *mqtt.Client
type topicSubscribers struct {
	sync.RWMutex
	data map[string]map[string]*mqtt.Client
}

var MqttTopicSubs = &topicSubscribers{
	data: make(map[string]map[string]*mqtt.Client),
}

// Subscribe adds a client to a topic's subscriber list
func (ts *topicSubscribers) Subscribe(topicName, clientID string, client *mqtt.Client) {
	ts.Lock()
	defer ts.Unlock()
	if ts.data[topicName] == nil {
		ts.data[topicName] = make(map[string]*mqtt.Client)
	}
	ts.data[topicName][clientID] = client
	log.Printf("📋 [TRACK] client_id=%s subscribed to topic=%s (total_subs=%d)\n", clientID, topicName, len(ts.data[topicName]))
}

// Unsubscribe removes a client from a topic's subscriber list
func (ts *topicSubscribers) Unsubscribe(topicName, clientID string) {
	ts.Lock()
	defer ts.Unlock()
	if ts.data[topicName] != nil {
		delete(ts.data[topicName], clientID)
		log.Printf("📋 [UNTRACK] client_id=%s unsubscribed from topic=%s\n", clientID, topicName)
		if len(ts.data[topicName]) == 0 {
			delete(ts.data, topicName)
			log.Printf("📋 [UNTRACK] topic=%s removed (no subscribers)\n", topicName)
		}
	}
}

// UnsubscribeAll removes a client from all topics (on disconnect)
func (ts *topicSubscribers) UnsubscribeAll(clientID string) {
	ts.Lock()
	defer ts.Unlock()
	for topicName, clients := range ts.data {
		delete(clients, clientID)
		if len(clients) == 0 {
			delete(ts.data, topicName)
		}
	}
}

// UnsubscribeClient removes a specific client pointer from all topics.
// Only removes if the stored client pointer matches (handles takeover scenario).
func (ts *topicSubscribers) UnsubscribeClient(cl *mqtt.Client) {
	ts.Lock()
	defer ts.Unlock()
	for topicName, clients := range ts.data {
		// Only delete if the stored pointer matches this client
		if stored, ok := clients[cl.ID]; ok && stored == cl {
			delete(clients, cl.ID)
			log.Printf("📋 [UNTRACK-CLIENT] client_id=%s removed from topic=%s (pointer match)\n", cl.ID, topicName)
			if len(clients) == 0 {
				delete(ts.data, topicName)
				log.Printf("📋 [UNTRACK-CLIENT] topic=%s removed (no subscribers)\n", topicName)
			}
		} else if stored != nil && stored != cl {
			log.Printf("📋 [UNTRACK-CLIENT] client_id=%s skipped for topic=%s (pointer mismatch - takeover)\n", cl.ID, topicName)
		}
	}
}

// GetSubscribers returns all clients subscribed to a topic
func (ts *topicSubscribers) GetSubscribers(topicName string) []*mqtt.Client {
	ts.RLock()
	defer ts.RUnlock()
	clients := make([]*mqtt.Client, 0)
	if ts.data[topicName] != nil {
		for _, cl := range ts.data[topicName] {
			clients = append(clients, cl)
		}
	}
	return clients
}

// DisconnectAndClear stops all clients subscribed to a topic and removes the topic from the map.
// Also removes clients from mochi-mqtt's internal map to prevent takeover loop on reconnect.
// Returns the list of disconnected client IDs.
func (ts *topicSubscribers) DisconnectAndClear(topicName string, stopErr error) []string {
	ts.Lock()
	defer ts.Unlock()

	log.Printf("🔄 [DISCONNECT-CLEAR] starting for topic=%s (subscribers=%d)\n", topicName, len(ts.data[topicName]))

	disconnected := make([]string, 0)
	if ts.data[topicName] != nil {
		for clientID, cl := range ts.data[topicName] {
			if !cl.Closed() {
				log.Printf("🔄 [DISCONNECT-CLEAR] stopping client_id=%s\n", clientID)
				cl.Stop(stopErr)
				disconnected = append(disconnected, clientID)
			} else {
				log.Printf("🔄 [DISCONNECT-CLEAR] client_id=%s already closed, skipping\n", clientID)
			}
		}
		// Mark all disconnected clients for cooldown (will be set by caller)
		delete(ts.data, topicName)
		log.Printf("🔄 [DISCONNECT-CLEAR] topic=%s cleared from tracking\n", topicName)
	}
	log.Printf("🔄 [DISCONNECT-CLEAR] completed for topic=%s (disconnected=%d)\n", topicName, len(disconnected))
	return disconnected
}
