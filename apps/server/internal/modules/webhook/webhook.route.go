package webhook

import (
	"github.com/gin-gonic/gin"
)

type Route struct {
	controller *WebhookController
}

func NewRoute(controller *WebhookController) *Route {
	return &Route{controller: controller}
}

func (r *Route) Register(router *gin.RouterGroup) {
	group := router.Group("/webhooks")
	RegisterRoutes(group, r.controller)
}
