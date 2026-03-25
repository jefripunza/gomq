package topic

import (
	"encoding/json"
	"gomqtt/http/dto"
	"gomqtt/variable"

	"github.com/gofiber/fiber/v2"
)

type CreateTopicRequest struct {
	Type    string   `json:"type"`
	Name    string   `json:"name"`
	Method  *string  `json:"method,omitempty"`
	URL     *string  `json:"url,omitempty"`
	Origins []string `json:"origins,omitempty"`
}

func GetAll(c *fiber.Ctx) error {
	entries := make([]Topic, 0)
	if err := variable.Db.Order("created_at DESC").Find(&entries).Error; err != nil {
		return dto.InternalServerError(c, "Failed to get topic entries", nil)
	}
	return dto.OK(c, "Topic entries retrieved successfully", entries)
}

func Create(c *fiber.Ctx) error {
	var req CreateTopicRequest
	if err := c.BodyParser(&req); err != nil {
		return dto.BadRequest(c, "Invalid request body", nil)
	}

	if req.Type != "pub_to_sub" && req.Type != "pub_to_api" && req.Type != "api_to_sub" {
		return dto.BadRequest(c, "Type must be 'pub_to_sub', 'pub_to_api', or 'api_to_sub'", nil)
	}
	if req.Name == "" {
		return dto.BadRequest(c, "Name is required", nil)
	}

	entry := Topic{
		Type: req.Type,
		Name: req.Name,
	}

	if req.Type == "pub_to_api" {
		if req.Method == nil || *req.Method == "" {
			return dto.BadRequest(c, "Method is required for Publish to API", nil)
		}
		if req.URL == nil || *req.URL == "" {
			return dto.BadRequest(c, "URL is required for Publish to API", nil)
		}
		entry.Method = req.Method
		entry.URL = req.URL
	}

	if req.Type == "api_to_sub" {
		if len(req.Origins) > 0 {
			originsJSON, err := json.Marshal(req.Origins)
			if err != nil {
				return dto.InternalServerError(c, "Failed to encode origins", nil)
			}
			originsStr := string(originsJSON)
			entry.Origins = &originsStr
		}
	}

	if err := variable.Db.Create(&entry).Error; err != nil {
		return dto.InternalServerError(c, "Failed to create topic entry", nil)
	}

	return dto.OK(c, "Topic entry created successfully", entry)
}

func Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return dto.BadRequest(c, "ID is required", nil)
	}

	var entry Topic

	if err := variable.Db.Where("id = ?", id).First(&entry).Error; err != nil {
		return dto.NotFound(c, "Topic entry not found", nil)
	}

	if err := variable.Db.Delete(&entry).Error; err != nil {
		return dto.InternalServerError(c, "Failed to delete topic entry", nil)
	}

	return dto.OK(c, "Topic entry deleted successfully", nil)
}
