package variable

import (
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
}

// Unsubscribe removes a client from a topic's subscriber list
func (ts *topicSubscribers) Unsubscribe(topicName, clientID string) {
	ts.Lock()
	defer ts.Unlock()
	if ts.data[topicName] != nil {
		delete(ts.data[topicName], clientID)
		if len(ts.data[topicName]) == 0 {
			delete(ts.data, topicName)
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
