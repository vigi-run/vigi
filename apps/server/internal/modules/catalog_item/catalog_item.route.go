package catalog_item

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
		orgGroup.POST("/catalog-items", r.controller.Create)
		orgGroup.GET("/catalog-items", r.controller.GetByOrganizationID)
	}

	// Entity routes
	entityGroup := router.Group("/catalog-items")
	entityGroup.Use(authChain.AllAuth())
	{
		entityGroup.GET("/:id", r.controller.GetByID)
		entityGroup.PATCH("/:id", r.controller.Update)
		entityGroup.DELETE("/:id", r.controller.Delete)
	}
}
