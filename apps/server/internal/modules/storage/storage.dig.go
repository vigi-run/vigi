package storage

import (
	"go.uber.org/dig"
)

func RegisterDependencies(container *dig.Container) {
	container.Provide(NewService)
	container.Provide(NewController)
	container.Provide(NewRoute)
}
