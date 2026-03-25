package http

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
)

func Start() *fiber.App {
	http_port := os.Getenv("HTTP_PORT")
	if http_port == "" {
		http_port = "3000"
	}

	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
	})

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World!")
	})

	go func() {
		log.Println("🌐 HTTP Server running on port", http_port)
		if err := app.Listen(":" + http_port); err != nil {
			log.Fatal("❌ HTTP server error:", err)
		}
	}()

	return app
}
