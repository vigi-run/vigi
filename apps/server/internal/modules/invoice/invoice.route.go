package invoice

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
		orgGroup.POST("/invoices", r.controller.Create)
		orgGroup.GET("/invoices", r.controller.GetByOrganizationID)
	}

	// Entity routes
	entityGroup := router.Group("/invoices")
	entityGroup.Use(authChain.AllAuth())
	{
		entityGroup.GET("/:id", r.controller.GetByID)
		entityGroup.PATCH("/:id", r.controller.Update)
		entityGroup.DELETE("/:id", r.controller.Delete)

		entityGroup.POST("/:id/email/first", r.controller.SendFirstEmail)
		entityGroup.POST("/:id/email/second", r.controller.SendSecondReminder)
		entityGroup.POST("/:id/email/third", r.controller.SendThirdReminder)
		entityGroup.POST("/:id/email/preview", r.controller.PreviewEmail)
		entityGroup.POST("/:id/email/send", r.controller.SendManualEmail)
		entityGroup.GET("/:id/emails", r.controller.GetEmailHistory)
		entityGroup.POST("/:id/emit", r.controller.EmitNFSe)
	}
}
