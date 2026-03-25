package environment

import "os"

func GetHttpPort() string {
	http_port := os.Getenv("HTTP_PORT")
	if http_port == "" {
		http_port = "3000"
	}
	return http_port
}
