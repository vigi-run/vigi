package backoffice

import (
	"net/http"
	"vigi/internal/modules/auth"
	"vigi/internal/utils"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	service            Service
	middlewareProvider *auth.MiddlewareProvider
}

func NewController(service Service, middlewareProvider *auth.MiddlewareProvider) *Controller {
	return &Controller{
		service:            service,
		middlewareProvider: middlewareProvider,
	}
}

func (c *Controller) RegisterRoutes(router *gin.RouterGroup) {
	// Protected backoffice routes
	group := router.Group("/backoffice")
	group.Use(c.middlewareProvider.Auth())
	group.Use(c.middlewareProvider.RequireAdmin())
	{
		group.GET("/stats", c.GetStats)
		group.GET("/users", c.ListUsers)
		group.GET("/organizations", c.ListOrganizations)
	}
}

// GetStats returns global stats
// @Summary Get global stats
// @Description Get global stats including total users, orgs, and pings
// @Tags Backoffice
// @Accept json
// @Produce json
// @Success 200 {object} StatsDto
// @Failure 401 {object} utils.FailResponse
// @Failure 403 {object} utils.FailResponse
// @Router /backoffice/stats [get]
func (c *Controller) GetStats(ctx *gin.Context) {
	stats, err := c.service.GetStats(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse(err.Error()))
		return
	}
	ctx.JSON(http.StatusOK, stats)
}

// ListUsers returns list of users
// @Summary List all users
// @Description List all users with organization count
// @Tags Backoffice
// @Accept json
// @Produce json
// @Success 200 {array} UserListDto
// @Failure 401 {object} utils.FailResponse
// @Failure 403 {object} utils.FailResponse
// @Router /backoffice/users [get]
func (c *Controller) ListUsers(ctx *gin.Context) {
	users, err := c.service.ListUsers(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse(err.Error()))
		return
	}
	ctx.JSON(http.StatusOK, users)
}

// ListOrganizations returns list of organizations
// @Summary List all organizations
// @Description List all organizations with user count
// @Tags Backoffice
// @Accept json
// @Produce json
// @Success 200 {array} OrgListDto
// @Failure 401 {object} utils.FailResponse
// @Failure 403 {object} utils.FailResponse
// @Router /backoffice/organizations [get]
func (c *Controller) ListOrganizations(ctx *gin.Context) {
	orgs, err := c.service.ListOrganizations(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse(err.Error()))
		return
	}
	ctx.JSON(http.StatusOK, orgs)
}
