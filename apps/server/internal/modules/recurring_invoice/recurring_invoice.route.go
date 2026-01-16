package recurring_invoice

import (
	"vigi/internal/modules/middleware"

	"github.com/gin-gonic/gin"
)

type Route struct {
	controller *Controller
}

func NewRoute(controller *Controller) *Route {
	return &Route{controller: controller}
}

func (r *Route) ConnectRoute(router *gin.RouterGroup, authChain *middleware.AuthChain) {
	// Organization-scoped routes
	orgGroup := router.Group("/organizations/:id")
	orgGroup.Use(authChain.AllAuth())
	{
		orgGroup.POST("/recurring-invoices", r.controller.Create)
		orgGroup.GET("/recurring-invoices", r.controller.GetByOrganizationID)
	}

	// Entity routes
	entityGroup := router.Group("/recurring-invoices")
	entityGroup.Use(authChain.AllAuth())
	{
		entityGroup.GET("/:id", r.controller.GetByID)
		entityGroup.PATCH("/:id", r.controller.Update)
		entityGroup.POST("/:id/generate", r.controller.GenerateInvoice)
		entityGroup.DELETE("/:id", r.controller.Delete)
	}
}
