package inter

import "go.uber.org/dig"

type Module struct {
	dig.In

	Controller *Controller
	Service    *Service
	Repository Repository
	Route      *Route
}

func RegisterDependencies(container *dig.Container) {
	container.Provide(NewSQLRepository)
	container.Provide(func(r *SQLRepository) Repository {
		return r
	})
	container.Provide(NewService)
	container.Provide(NewController)
	container.Provide(NewRoute)
	container.Provide(NewSQLWebhookRepository)
	container.Provide(func(r *SQLWebhookRepository) WebhookRepository {
		return r
	})

}
