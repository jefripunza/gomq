package gomq

import (
	"gomq/middlewares"
	"log"
	"os"

	mqtt "github.com/mochi-mqtt/server/v2"
	"github.com/mochi-mqtt/server/v2/hooks/auth"
	"github.com/mochi-mqtt/server/v2/listeners"
)

func Start() *mqtt.Server {
	mqtt_port := os.Getenv("MQTT_PORT")
	if mqtt_port == "" {
		mqtt_port = "1883"
	}

	// ================================
	// CREATE MQTT SERVER
	// ================================
	server := mqtt.New(nil)

	err := server.AddHook(new(auth.Hook), &auth.Options{
		Ledger: &auth.Ledger{
			Auth: []auth.AuthRule{
				{Allow: true},
			},
		},
	})
	if err != nil {
		log.Fatal("❌ Failed to setup open auth:", err)
	}

	if err := server.AddHook(new(middlewares.MiddlewareHook), nil); err != nil {
		log.Fatal("❌ Failed to add middleware hook:", err)
	}

	tcp := listeners.NewTCP(listeners.Config{
		ID:      "gomq",
		Address: ":" + mqtt_port,
	})
	if err := server.AddListener(tcp); err != nil {
		log.Fatal("❌ Failed to add listener:", err)
	}

	// ================================
	// RUN MQTT SERVER (non-blocking)
	// ================================
	go func() {
		log.Println("🚀 MQTT Broker running on port", mqtt_port)
		if err := server.Serve(); err != nil {
			log.Fatal("❌ MQTT server error:", err)
		}
	}()

	return server
}
