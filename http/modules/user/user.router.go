package user

import "github.com/gofiber/fiber/v2"

func RegisterRoutes(r fiber.Router) {
	r.Get("/all", GetAll)
	r.Post("/create", Create)
	r.Put("/update/:id", Update)
	r.Delete("/remove/:id", Delete)
}
