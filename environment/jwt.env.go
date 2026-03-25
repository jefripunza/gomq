package environment

import "os"

func GetJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "gomqtt-secret-key"
	}
	return []byte(secret)
}
