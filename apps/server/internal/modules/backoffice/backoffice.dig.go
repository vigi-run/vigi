package backoffice

import (
	"vigi/internal/modules/auth"
	"vigi/internal/modules/maintenance"
	"vigi/internal/modules/monitor"
	"vigi/internal/modules/notification_channel"
	"vigi/internal/modules/organization"
	"vigi/internal/modules/stats"
	"vigi/internal/modules/status_page"

	"go.uber.org/dig"
)

func ProvideService(
	authRepo auth.Repository,
	orgRepo organization.OrganizationRepository,
	statsRepo stats.Repository,
	monitorRepo monitor.MonitorRepository,
	statusPageRepo status_page.Repository,
	maintenanceRepo maintenance.Repository,
	notificationChannelRepo notification_channel.Repository,
) Service {
	return NewService(authRepo, orgRepo, statsRepo, monitorRepo, statusPageRepo, maintenanceRepo, notificationChannelRepo)
}

func RegisterDependencies(container *dig.Container) {
	container.Provide(NewRoute)

	container.Provide(ProvideService)

	container.Provide(NewController)
}
