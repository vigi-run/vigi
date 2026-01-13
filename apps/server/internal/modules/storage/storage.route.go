package storage

import (
	"vigi/internal/modules/auth"

	"github.com/gin-gonic/gin"
)

type Route struct {
	controller     *Controller
	authMiddleware *auth.MiddlewareProvider
}

func NewRoute(
	controller *Controller,
	authMiddleware *auth.MiddlewareProvider,
) *Route {
	return &Route{
		controller:     controller,
		authMiddleware: authMiddleware,
	}
}

func (r *Route) Register(router *gin.RouterGroup) {
	group := router.Group("/storage")

	// Protected routes
	group.Use(r.authMiddleware.Auth())
	{
		group.POST("/presigned-url", r.controller.GetPresignedURL)
		group.GET("/config", r.controller.GetConfig)
	}
}
