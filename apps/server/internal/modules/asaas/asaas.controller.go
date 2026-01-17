package asaas

import (
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
		logger:  logger.Named("[asaas-controller]"),
	}
}

func (c *Controller) SaveConfig(ctx *gin.Context) {
	orgIDStr := ctx.Param("id")
	orgID, err := uuid.Parse(orgIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid organization ID"))
		return
	}

	var dto UpdateAsaasConfigDTO
	if err := ctx.ShouldBindJSON(&dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse(err.Error()))
		return
	}

	existing, err := c.service.GetConfig(ctx.Request.Context(), orgID)
	// handle err below

	var config *AsaasConfig

	if existing != nil {
		config, err = c.service.UpdateConfig(ctx.Request.Context(), orgID, dto)
	} else {
		if dto.ApiKey == nil || *dto.ApiKey == "" {
			ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("apiKey is required"))
			return
		}
		if dto.Environment == nil {
			ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("environment is required"))
			return
		}

		createDto := CreateAsaasConfigDTO{
			ApiKey:      *dto.ApiKey,
			Environment: *dto.Environment,
		}
		config, err = c.service.CreateConfig(ctx.Request.Context(), orgID, createDto)
	}

	if err != nil {
		c.logger.Errorw("Failed to save asaas config", "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Internal error"))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("Asaas config saved", config))
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
		c.logger.Errorw("Failed to fetch asaas config", "error", err)
		ctx.JSON(http.StatusOK, utils.NewSuccessResponse[*AsaasConfig]("success", nil))
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
		c.logger.Errorw("Failed to create asaas charge", "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse(err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse[any]("Charge created successfully", nil))
}
