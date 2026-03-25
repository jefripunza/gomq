package auth

import (
	"github.com/gofiber/fiber/v2"
)

func RegisterPublicRoutes(r fiber.Router) {
	r.Post("/login", Login)
	r.Delete("/logout", Logout)
}

func RegisterProtectedRoutes(r fiber.Router) {
	r.Get("/validate", Validate)
}
