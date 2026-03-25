package modules

import (
	http_middlewares "gomqtt/http/middlewares"
	"gomqtt/http/modules/apikey"
	"gomqtt/http/modules/auth"
	"gomqtt/http/modules/dashboard"
	"gomqtt/http/modules/example"
	"gomqtt/http/modules/setting"
	"gomqtt/http/modules/whitelist"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, api fiber.Router) {
	// /api
	example.RegisterRoutes(api)

	// /api/auth
	authApi := api.Group("/auth")
	auth.RegisterPublicRoutes(authApi)
	auth.RegisterProtectedRoutes(authApi)

	// /api/setting (protected)
	settingProtected := api.Group("/setting", http_middlewares.UseToken)
	setting.RegisterRoutes(settingProtected)

	// /api/dashboard (protected)
	dashboardProtected := api.Group("/dashboard", http_middlewares.UseToken)
	dashboard.RegisterRoutes(dashboardProtected)

	// /api/whitelist (protected)
	whitelistProtected := api.Group("/whitelist", http_middlewares.UseToken)
	whitelist.RegisterRoutes(whitelistProtected)

	// /api/apikey (protected)
	apikeyProtected := api.Group("/apikey", http_middlewares.UseToken)
	apikey.RegisterRoutes(apikeyProtected)
}
