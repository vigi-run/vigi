package organization

import (
	"vigi/internal/config"
	"vigi/internal/utils"

	"go.uber.org/dig"
)

func RegisterDependencies(container *dig.Container, cfg *config.Config) {
	utils.RegisterRepositoryByDBType(container, cfg, NewSQLRepository, NewMongoRepository)
	container.Provide(NewService)
	container.Provide(NewMiddleware)
	container.Provide(NewOrganizationController)
	container.Provide(NewOrganizationRoute)
}
