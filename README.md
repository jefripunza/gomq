# Go MQTT Engine

> A lightweight, high-performance MQTT broker built with Go. Features real-time messaging, HTTP API integration, and graceful shutdown capabilities for reliable IoT and microservices communication.

## 🚀 Features

- **High Performance**: Built with Go for optimal speed and concurrency
- **MQTT Protocol**: Full MQTT broker implementation for IoT and real-time messaging
- **HTTP API**: Integrated HTTP server for REST API endpoints
- **Graceful Shutdown**: Clean service termination with proper resource cleanup
- **Self-Hosted**: Complete control over your message broker infrastructure
- **Lightweight**: Minimal resource footprint for efficient deployment

## 📦 Installation

```bash
git clone https://github.com/yourusername/go-mqtt-engine.git
cd go-mqtt-engine
go mod download
```

## 🏃 Quick Start

```bash
go run main.go
```

The application will start:

- MQTT Broker on the configured port
- HTTP Server for API access

## 🛠️ Configuration

Configure your environment settings in the `environment/` directory.

## 📝 Usage

The broker supports standard MQTT operations:

- Publish/Subscribe messaging
- Quality of Service (QoS) levels
- Retained messages
- Clean sessions

## 🔧 Development

Built with:

- Go (Golang)
- MQTT protocol implementation
- HTTP server with graceful shutdown

## 📄 License

[Add your license here]

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
