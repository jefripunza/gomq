package modules

import (
	"gomqtt/http/modules/apikey"
	"gomqtt/http/modules/setting"
	"gomqtt/http/modules/topic"
	"gomqtt/http/modules/user"

	"gorm.io/gorm"
)

func Models() []interface{} {
	return []interface{}{
		&setting.Setting{},
		&user.User{},
		&topic.Topic{},
		&apikey.ApiKey{},
	}
}

func SeedAll(db *gorm.DB) {
	setting.Seed(db)
}
