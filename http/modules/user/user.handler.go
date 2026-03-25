package user

import (
	"gomqtt/http/dto"
	"gomqtt/variable"

	"github.com/gofiber/fiber/v2"
)

type CreateUserRequest struct {
	Title    string `json:"title"`
	Username string `json:"username"`
	Password string `json:"password"`
}

func GetAll(c *fiber.Ctx) error {
	entries := make([]User, 0)
	if err := variable.Db.Order("created_at DESC").Find(&entries).Error; err != nil {
		return dto.InternalServerError(c, "Failed to get user entries", nil)
	}
	return dto.OK(c, "User entries retrieved successfully", entries)
}

func Create(c *fiber.Ctx) error {
	var req CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return dto.BadRequest(c, "Invalid request body", nil)
	}

	if req.Title == "" {
		return dto.BadRequest(c, "Title is required", nil)
	}
	if req.Username == "" {
		return dto.BadRequest(c, "Username is required", nil)
	}
	if req.Password == "" {
		return dto.BadRequest(c, "Password is required", nil)
	}

	// Check if username already exists
	var existing User
	if err := variable.Db.Where("username = ?", req.Username).First(&existing).Error; err == nil {
		return dto.BadRequest(c, "Username already exists", nil)
	}

	entry := User{
		Title:    req.Title,
		Username: req.Username,
		Password: req.Password,
	}
	if err := variable.Db.Create(&entry).Error; err != nil {
		return dto.InternalServerError(c, "Failed to create user entry", nil)
	}

	return dto.OK(c, "User entry created successfully", entry)
}

type UpdateUserRequest struct {
	Title    string `json:"title"`
	Username string `json:"username"`
	Password string `json:"password"`
}

func Update(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return dto.BadRequest(c, "ID is required", nil)
	}

	var req UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return dto.BadRequest(c, "Invalid request body", nil)
	}

	var entry User
	if err := variable.Db.Where("id = ?", id).First(&entry).Error; err != nil {
		return dto.NotFound(c, "User entry not found", nil)
	}

	// Check if new username already exists (if changed)
	if req.Username != "" && req.Username != entry.Username {
		var existing User
		if err := variable.Db.Where("username = ? AND id != ?", req.Username, id).First(&existing).Error; err == nil {
			return dto.BadRequest(c, "Username already exists", nil)
		}
		entry.Username = req.Username
	}

	if req.Title != "" {
		entry.Title = req.Title
	}
	if req.Password != "" {
		entry.Password = req.Password
	}

	if err := variable.Db.Save(&entry).Error; err != nil {
		return dto.InternalServerError(c, "Failed to update user entry", nil)
	}

	return dto.OK(c, "User entry updated successfully", entry)
}

func Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return dto.BadRequest(c, "ID is required", nil)
	}

	var entry User

	if err := variable.Db.Where("id = ?", id).First(&entry).Error; err != nil {
		return dto.NotFound(c, "User entry not found", nil)
	}

	// Check if any topic uses this user
	var topicCount int64
	if err := variable.Db.Table("topics").Where("user_id = ?", id).Count(&topicCount).Error; err != nil {
		return dto.InternalServerError(c, "Failed to check topic usage", nil)
	}
	if topicCount > 0 {
		return dto.BadRequest(c, "Cannot delete user: still used by one or more topics", nil)
	}

	if err := variable.Db.Delete(&entry).Error; err != nil {
		return dto.InternalServerError(c, "Failed to delete user entry", nil)
	}

	return dto.OK(c, "User entry deleted successfully", nil)
}
