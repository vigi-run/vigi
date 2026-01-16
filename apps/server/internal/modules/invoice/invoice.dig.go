package invoice

import (
	"vigi/internal/config"
	"vigi/internal/pkg/usesend"

	"go.uber.org/dig"
)

func RegisterDependencies(container *dig.Container, cfg *config.Config) {
	if cfg.DBType == "mongo" || cfg.DBType == "mongodb" {
		// Not implemented for main invoice repo yet
		container.Provide(NewEmailRepository)
	} else {
		container.Provide(NewSQLRepository)
		container.Provide(func(r *SQLRepository) Repository { return r })
		container.Provide(NewEmailSQLRepository)
	}

	// Provide Usesend Client
	container.Provide(func(cfg *config.Config) *usesend.Client {
		return usesend.NewClient(cfg.UsesendAPIKey, cfg.UsesendDomain)
	})

	container.Provide(NewService)
	container.Provide(NewController)
	container.Provide(NewRoute)
}
