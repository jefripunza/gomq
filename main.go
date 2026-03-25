package main

import (
	"context"
	"gomqtt/gomqtt"
	"gomqtt/http"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// ================================
	// RUN MQTT SERVER (non-blocking)
	// ================================
	mqtt := gomqtt.Start()

	// ================================
	// RUN HTTP SERVER (non-blocking)
	// ================================
	app := http.Start()

	// ================================
	// GRACEFUL SHUTDOWN
	// ================================
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("🛑 Shutting down MQTT broker & HTTP Server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// shutdown HTTP
	if err := app.ShutdownWithContext(ctx); err != nil {
		log.Println("❌ Error shutting down HTTP server:", err)
	}

	// shutdown MQTT
	if err := mqtt.Close(); err != nil {
		log.Println("❌ Error shutting down MQTT broker:", err)
	}

	<-ctx.Done()
	log.Println("✅ All services stopped cleanly")

	// delay 3 detik
	time.Sleep(3 * time.Second)
}
