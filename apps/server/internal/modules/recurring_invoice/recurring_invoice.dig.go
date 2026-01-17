package recurring_invoice

import (
	"vigi/internal/config"

	"go.uber.org/dig"
)

func RegisterDependencies(container *dig.Container, cfg *config.Config) {
	if cfg.DBType == "mongo" || cfg.DBType == "mongodb" {
		// Not implemented
	} else {
		container.Provide(NewSQLRepository)
		container.Provide(func(r *SQLRepository) Repository { return r })
	}

	container.Provide(NewService)
	container.Provide(NewController)
	container.Provide(NewRoute)
}
