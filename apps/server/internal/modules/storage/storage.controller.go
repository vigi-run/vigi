package storage

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strings"
	"vigi/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type Controller struct {
	service Service
	logger  *zap.SugaredLogger
}

func NewController(
	service Service,
	logger *zap.SugaredLogger,
) *Controller {
	return &Controller{
		service: service,
		logger:  logger,
	}
}

type PresignedURLRequestDto struct {
	Filename    string `json:"filename" validate:"required"`
	ContentType string `json:"contentType" validate:"required"`
	Type        string `json:"type" validate:"required,oneof=user organization"` // To organize files in folder structure
}

type PresignedURLResponseDto struct {
	UploadURL string `json:"uploadUrl"`
	Key       string `json:"key"`
	PublicURL string `json:"publicUrl"` // This might vary based on your S3 setup (CDN, public bucket, etc.)
}

type StorageConfigResponseDto struct {
	Enabled bool `json:"enabled"`
}

// @Router		/storage/config [get]
// @Summary		Get storage configuration
// @Tags			Storage
// @Produce		json
// @Success		200	{object}	utils.ApiResponse[StorageConfigResponseDto]
func (c *Controller) GetConfig(ctx *gin.Context) {
	enabled := c.service.IsS3Enabled()
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("Storage configuration", StorageConfigResponseDto{
		Enabled: enabled,
	}))
}

// @Router		/storage/presigned-url [post]
// @Summary		Get presigned URL for file upload
// @Tags			Storage
// @Produce		json
// @Accept		json
// @Security    JwtAuth
// @Param       body body     PresignedURLRequestDto  true  "Request data"
// @Success		200	{object}	utils.ApiResponse[PresignedURLResponseDto]
// @Failure		400	{object}	utils.APIError[any]
// @Failure		500	{object}	utils.APIError[any]
func (c *Controller) GetPresignedURL(ctx *gin.Context) {
	if !c.service.IsS3Enabled() {
		ctx.JSON(http.StatusServiceUnavailable, utils.NewFailResponse("Storage service is not enabled"))
		return
	}

	var dto PresignedURLRequestDto
	if err := ctx.ShouldBindJSON(&dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse(err.Error()))
		return
	}

	// Validate content type (allow only images for now)
	if !strings.HasPrefix(dto.ContentType, "image/") {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Only image files are allowed"))
		return
	}

	ext := filepath.Ext(dto.Filename)
	if ext == "" {
		// Try to deduce from content type or just default?
		// For now require extension in filename
		// Or maybe we can trust the client's filename for extension
	}

	// Generate a unique key
	// Structure: {type}/{uuid}{ext}
	newFilename := uuid.New().String() + ext
	key := fmt.Sprintf("%s/%s", dto.Type, newFilename)

	url, err := c.service.GetPresignedURL(ctx, key, dto.ContentType)
	if err != nil {
		c.logger.Errorw("Failed to generate presigned URL", "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Failed to generate upload URL"))
		return
	}

	// For public URL, usually it's endpoint/bucket/key or cdn/key
	// Assuming simple S3 structure for now. If using MinIO/AWS proper:
	// We'll construct a likely public URL. Note: this assumes the bucket/folder is public.
	// If the bucket is private, we'd need another endpoint to proxy the image or generate a GET presigned URL.
	// Let's assume the user will configure the bucket to be public for these images for now, as is common for avatars.

	// We need to return the key/path that will be saved in the DB.
	// And maybe a full URL for immediate display if the client can't construct it.

	// WARNING: This assumes standard path style access or valid subdomain.
	// Ideally successful upload response should just return the key/url.
	// But here we are just generating the upload URL.
	// The client uploads to S3, then uses the 'key' (or constructed URL) to update their user profile.

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("Presigned URL generated", PresignedURLResponseDto{
		UploadURL: url,
		Key:       key,
	}))
}
