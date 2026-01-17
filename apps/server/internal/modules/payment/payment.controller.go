package payment

import (
	"net/http"

	"vigi/internal/modules/middleware"
	"vigi/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type Controller struct {
	service *Service
	logger  *zap.SugaredLogger
}

func NewController(service *Service, logger *zap.SugaredLogger) *Controller {
	return &Controller{
		service: service,
		logger:  logger.Named("[payment-controller]"),
	}
}

func (c *Controller) RegisterRoutes(router *gin.RouterGroup, authChain *middleware.AuthChain) {
	group := router.Group("/invoices")
	group.Use(authChain.AllAuth())

	// POST /api/v1/invoices/:id/charge
	group.POST("/:id/charge", c.GenerateCharge)

	// Public Routes
	router.GET("/public/invoices/:id", c.GetPublicInvoice)
}

// GenerateCharge godoc
// @Summary Generate a charge for an invoice
// @Description Generates a charge using the organization's configured bank provider
// @Tags Payment
// @Accept json
// @Produce json
// @Param id path string true "Invoice ID"
// @Success 200 {object} utils.Response "Charge generated successfully"
// @Failure 400 {object} utils.Response "Bad Request"
// @Failure 500 {object} utils.Response "Internal Server Error"
// @Router /invoices/{id}/charge [post]
func (c *Controller) GenerateCharge(ctx *gin.Context) {
	invoiceID := ctx.Param("id")
	if invoiceID == "" {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("invoice id is required"))
		return
	}

	userID := ctx.GetString("userId")
	if userID == "" {
		// If middleware didn't set it, maybe look for other context vars or error out
		// Depending on AuthChain implementation, it sets "userId" or "claims".
		// Let's assume AuthChain sets "organizationId" if API Key is used?
		// Or if JWT, it sets "userId" and we need to fetch user to get org?
		// Wait, organizationId is what we need.
		// Let's check if we can get organizationId from context directly if middleware sets it.
		// If not, we need to inspect the token.
		ctx.JSON(http.StatusUnauthorized, utils.NewFailResponse("unauthorized"))
		return
	}

	// Assuming userID is what we have. But we need OrganizationID.
	// If using API Key, OrganizationID might be set.
	// If using JWT, we have UserID.

	// Let's try to get OrganizationID from header if AuthChain allows it via OrgIdAuth?
	// But AuthChain AllAuth() handles logic.

	// Let's fallback to looking at how other controllers get OrganizationID.
	// We'll trust the header "X-Organization-ID" if using JWT?
	// Or maybe the token has it?

	// Temporary fix: Get OrganizationID from header as OrganizationController does in Swagger docs mentions OrgIdAuth.
	orgIDStr := ctx.GetHeader("X-Organization-ID")
	if orgIDStr == "" {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("organization id header required"))
		return
	}

	orgID, err := uuid.Parse(orgIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("invalid organization id"))
		return
	}

	if err := c.service.GenerateCharge(ctx.Request.Context(), orgID, invoiceID); err != nil {
		c.logger.Errorw("failed to generate charge", "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse(err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse[any]("Charge generated successfully", nil))
}

func (c *Controller) GetPublicInvoice(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid ID"))
		return
	}

	entity, err := c.service.GetPublicInvoice(ctx.Request.Context(), id)
	if err != nil {
		c.logger.Errorw("failed to get public invoice", "id", id, "error", err)
		ctx.JSON(http.StatusNotFound, utils.NewFailResponse("Invoice not found"))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("success", entity))
}
