package modules

import (
	http_middlewares "gomqtt/http/middlewares"
	"gomqtt/http/modules/apikey"
	"gomqtt/http/modules/auth"
	"gomqtt/http/modules/dashboard"
	"gomqtt/http/modules/example"
	"gomqtt/http/modules/setting"
	"gomqtt/http/modules/topic"
	"gomqtt/http/modules/user"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, api fiber.Router) {
	// /api
	example.RegisterRoutes(api)

	// /api/auth
	auth.RegisterPublicRoutes(api.Group("/auth"))
	auth.RegisterProtectedRoutes(api.Group("/auth", http_middlewares.UseToken))

	// /api/setting (protected)
	setting.RegisterRoutes(api.Group("/setting", http_middlewares.UseToken))

	// /api/dashboard (protected)
	dashboard.RegisterRoutes(api.Group("/dashboard", http_middlewares.UseToken))

	// /api/user (protected)
	user.RegisterRoutes(api.Group("/user", http_middlewares.UseToken))

	// /api/topic (protected)
	topic.RegisterRoutes(api.Group("/topic", http_middlewares.UseToken))

	// /api/apikey (protected)
	apikey.RegisterRoutes(api.Group("/apikey", http_middlewares.UseToken))
}
