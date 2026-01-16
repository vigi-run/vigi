package inter

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

func (r *Route) ConnectRoute(rg *gin.RouterGroup) {
	// Organization based routes
	orgRouter := rg.Group("organizations/:id/integrations/inter")
	orgRouter.Use(r.middleware.AllAuth())
	orgRouter.POST("", r.controller.SaveConfig)
	orgRouter.GET("", r.controller.GetConfig)
	orgRouter.POST("/charge", r.controller.GenerateCharge)
}
