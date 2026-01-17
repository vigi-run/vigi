package inter

import (
	"io"
	"net/http"
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
		logger:  logger.Named("[inter-controller]"),
	}
}

func (c *Controller) SaveConfig(ctx *gin.Context) {
	orgIDStr := ctx.Param("id")
	orgID, err := uuid.Parse(orgIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid organization ID"))
		return
	}

	// We bind to UpdateInterConfigDTO first because it allows optional fields (pointers).
	// If it's a creation, we will manually validate that all required fields are present.
	var dto UpdateInterConfigDTO
	if err := ctx.ShouldBindJSON(&dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse(err.Error()))
		return
	}

	// Check if config exists
	existing, err := c.service.GetConfig(ctx.Request.Context(), orgID)
	// We handle error/nil check below

	var config *InterConfig

	if existing != nil {
		// Update logic
		config, err = c.service.UpdateConfig(ctx.Request.Context(), orgID, dto)
	} else {
		// Creation logic - Validate required fields
		if dto.ClientID == nil || *dto.ClientID == "" {
			ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("clientID is required for initial setup"))
			return
		}
		if dto.ClientSecret == nil || *dto.ClientSecret == "" {
			ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("clientSecret is required for initial setup"))
			return
		}
		if dto.Certificate == nil || *dto.Certificate == "" {
			ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("certificate is required for initial setup"))
			return
		}
		if dto.Key == nil || *dto.Key == "" {
			ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("key is required for initial setup"))
			return
		}
		if dto.Environment == nil {
			ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("environment is required for initial setup"))
			return
		}

		createDto := CreateInterConfigDTO{
			ClientID:      *dto.ClientID,
			ClientSecret:  *dto.ClientSecret,
			Certificate:   *dto.Certificate,
			Key:           *dto.Key,
			AccountNumber: dto.AccountNumber,
			Environment:   *dto.Environment,
		}

		config, err = c.service.CreateConfig(ctx.Request.Context(), orgID, createDto)
	}

	if err != nil {
		c.logger.Errorw("Failed to save inter config", "orgId", orgID, "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Internal server error"))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("Inter configuration saved successfully", config))
}

func (c *Controller) GetConfig(ctx *gin.Context) {
	orgIDStr := ctx.Param("id")
	orgID, err := uuid.Parse(orgIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid organization ID"))
		return
	}

	config, err := c.service.GetConfig(ctx.Request.Context(), orgID)
	if err != nil {
		// Return 200 with null or 404?
		// If not found, return null data is fine.
		// Check error string?
		c.logger.Errorw("Failed to fetch inter config", "orgId", orgID, "error", err)
		// Assuming error means not found for now or actual error.
		// Let's return null config
		ctx.JSON(http.StatusOK, utils.NewSuccessResponse[*InterConfig]("success", nil))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("success", config))
}

func (c *Controller) GenerateCharge(ctx *gin.Context) {
	var dto GenerateChargeDTO
	if err := ctx.ShouldBindJSON(&dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse(err.Error()))
		return
	}

	orgIDStr := ctx.Param("id")
	orgID, err := uuid.Parse(orgIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid organization ID"))
		return
	}

	err = c.service.CreateCharge(ctx.Request.Context(), orgID, dto)
	if err != nil {
		c.logger.Errorw("Failed to create charge", "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse(err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse[any]("Charge created successfully", nil))
}

func (c *Controller) HandleWebhook(ctx *gin.Context) {
	body, err := io.ReadAll(ctx.Request.Body)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("failed to read body"))
		return
	}

	if len(body) == 0 {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("empty body"))
		return
	}

	if err := c.service.HandleWebhook(ctx.Request.Context(), body); err != nil {
		c.logger.Errorw("Failed to handle webhook", "error", err)
		// Return 200 even on error to avoid Inter retrying endlessly if it's an internal error that won't be fixed by retrying same payload immediately?
		// Or 500?
		// Usually 500 triggers retry.
		// If DB is down, we want retry.
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse(err.Error()))
		return
	}

	ctx.Status(http.StatusOK)
}
