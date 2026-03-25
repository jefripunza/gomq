package modules

import (
	"gomqtt/http/modules/apikey"
	"gomqtt/http/modules/setting"
	"gomqtt/http/modules/whitelist"

	"gorm.io/gorm"
)

func Models() []interface{} {
	return []interface{}{
		&setting.Setting{},
		&whitelist.Whitelist{},
		&apikey.ApiKey{},
	}
}

func SeedAll(db *gorm.DB) {
	setting.Seed(db)
}
