package environment

import "os"

func GetMqttPort() string {
	mqtt_port := os.Getenv("MQTT_PORT")
	if mqtt_port == "" {
		mqtt_port = "1883"
	}
	return mqtt_port
}
