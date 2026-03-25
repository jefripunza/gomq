package topic

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Topic struct {
	ID        uuid.UUID  `json:"id" gorm:"type:char(36);primaryKey"`
	Type      string     `json:"type" gorm:"not null"`                                // "pub_to_sub", "pub_to_api", "api_to_sub"
	Name      string     `json:"name" gorm:"not null"`                                // MQTT topic name
	Method    *string    `json:"method,omitempty" gorm:"default:null"`                // HTTP method (for pub_to_api)
	URL       *string    `json:"url,omitempty" gorm:"default:null"`                   // target URL (for pub_to_api)
	Origins   *string    `json:"origins,omitempty" gorm:"default:null"`               // JSON array of whitelist origins (for api_to_sub)
	UserID    *uuid.UUID `json:"user_id,omitempty" gorm:"type:char(36);default:null"` // optional credential user
	CreatedAt time.Time  `json:"created_at" gorm:"autoCreateTime"`
}

func (t *Topic) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}
