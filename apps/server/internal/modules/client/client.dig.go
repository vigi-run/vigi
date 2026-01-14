package client

import (
	"vigi/internal/config"

	"go.uber.org/dig"
)

func RegisterDependencies(container *dig.Container, cfg *config.Config) {
	// For now we only have SQL implementation
	if cfg.DBType == "mongo" || cfg.DBType == "mongodb" {
		// container.Provide(NewMongoRepository) // Not implemented yet
		// We could panic or just not provide it, which would cause error if requested
	} else {
		container.Provide(NewSQLRepository)
		// Bind implementation to interface
		container.Provide(func(r *SQLRepository) Repository {
			return r
		})
	}

	container.Provide(NewService)
	container.Provide(NewController)
	container.Provide(NewRoute)

	// Utils helper would be better but if it requires both implementations I can't use it yet.
	// utils.RegisterRepositoryByDBType(container, cfg, NewSQLRepository, nil)
}
