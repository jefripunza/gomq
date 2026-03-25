package modules

import (
	"gomqtt/http/modules/apikey"
	"gomqtt/http/modules/setting"
	"gomqtt/http/modules/topic"

	"gorm.io/gorm"
)

func Models() []interface{} {
	return []interface{}{
		&setting.Setting{},
		&topic.Topic{},
		&apikey.ApiKey{},
	}
}

func SeedAll(db *gorm.DB) {
	setting.Seed(db)
}
