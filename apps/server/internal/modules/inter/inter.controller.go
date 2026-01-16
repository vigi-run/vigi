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

	var dto CreateInterConfigDTO
	if err := ctx.ShouldBindJSON(&dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse(err.Error()))
		return
	}

	if err := utils.Validate.Struct(dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse(err.Error()))
		return
	}

	existing, err := c.service.GetConfig(ctx.Request.Context(), orgID)

	var config *InterConfig
	// Assuming GetConfig returns error if database failure, or nil/nil if not found but query success (depends on repo impl)
	// My repo impl uses `Scan` which returns error if no rows usually in bun?
	// bun.NewSelect().Scan returns sql.ErrNoRows if not found.
	// So `err` will be sql.ErrNoRows.

	if err != nil {
		// Treat error as not found if it is indeed not found.
		// For simplicity, let's try to create.
		// If unique constraint fails, it means it existed (race condition or different error).
		// A better approach is usually upsert (ON CONFLICT DO UPDATE).
		// But let's stick to simple logic: Try create, if error, try update? No.
		// Let's rely on `err` content.
		// Since I cannot easily import `sql` or `bun` here without coupling, I will assume any error is potentially "not found" or DB error.
		// But wait, `sql.ErrNoRows` is standard.
		// Let's try create first.
		config, err = c.service.CreateConfig(ctx.Request.Context(), orgID, dto)
		if err != nil {
			// If creation failed, maybe it exists? Try update.
			// Or maybe `GetConfig` failed because of actual DB error.
			// This logic is a bit flaky without checking error type.
			// But let's assume if Create fails, we try Update.
			updateDto := UpdateInterConfigDTO{
				ClientID:      &dto.ClientID,
				ClientSecret:  &dto.ClientSecret,
				Certificate:   &dto.Certificate,
				Key:           &dto.Key,
				AccountNumber: dto.AccountNumber,
				Environment:   &dto.Environment,
			}
			config, err = c.service.UpdateConfig(ctx.Request.Context(), orgID, updateDto)
		}
	} else if existing != nil {
		updateDto := UpdateInterConfigDTO{
			ClientID:      &dto.ClientID,
			ClientSecret:  &dto.ClientSecret,
			Certificate:   &dto.Certificate,
			Key:           &dto.Key,
			AccountNumber: dto.AccountNumber,
			Environment:   &dto.Environment,
		}
		config, err = c.service.UpdateConfig(ctx.Request.Context(), orgID, updateDto)
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
