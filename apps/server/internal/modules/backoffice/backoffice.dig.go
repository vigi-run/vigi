package backoffice

import (
	"vigi/internal/modules/auth"
	"vigi/internal/modules/organization"
	"vigi/internal/modules/stats"

	"go.uber.org/dig"
)

func RegisterDependencies(container *dig.Container) {
	container.Provide(NewRoute)

	container.Provide(func(authRepo auth.Repository, orgRepo organization.OrganizationRepository, statsRepo stats.Repository) Service {
		return NewService(authRepo, orgRepo, statsRepo)
	})

	container.Provide(NewController)
}
