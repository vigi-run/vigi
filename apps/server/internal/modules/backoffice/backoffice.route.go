package backoffice

import (
	"github.com/gin-gonic/gin"
)

type Route struct {
}

func NewRoute() *Route {
	return &Route{}
}

func (r *Route) ConnectRoute(router *gin.RouterGroup, controller *Controller) {
	controller.RegisterRoutes(router)
}
