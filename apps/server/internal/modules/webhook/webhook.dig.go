package webhook

import (
	"vigi/internal/config"

	"go.uber.org/dig"
)

func RegisterDependencies(container *dig.Container, cfg *config.Config) {
	container.Provide(NewWebhookController)
	container.Provide(NewRoute)
}
