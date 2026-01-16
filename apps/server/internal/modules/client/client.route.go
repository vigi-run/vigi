package client

import (
	"vigi/internal/modules/middleware"

	"github.com/gin-gonic/gin"
)

type Route struct {
	controller *Controller
	middleware *middleware.AuthChain
}

func NewRoute(
	controller *Controller,
	middleware *middleware.AuthChain,
) *Route {
	return &Route{
		controller: controller,
		middleware: middleware,
	}
}

func (r *Route) ConnectRoute(
	rg *gin.RouterGroup,
) {
	// Organization based routes
	orgRouter := rg.Group("organizations/:id/clients")
	orgRouter.Use(r.middleware.AllAuth())
	orgRouter.POST("", r.controller.Create)
	orgRouter.GET("", r.controller.GetByOrganizationID)

	// Direct client routes
	clientRouter := rg.Group("clients")
	clientRouter.Use(r.middleware.AllAuth())
	clientRouter.GET(":id", r.controller.GetByID)
	clientRouter.PATCH(":id", r.controller.Update)
	clientRouter.DELETE(":id", r.controller.Delete)
}
