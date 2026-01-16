package catalog_item

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

func NewController(
	service *Service,
	logger *zap.SugaredLogger,
) *Controller {
	return &Controller{
		service: service,
		logger:  logger.Named("[catalog-item-controller]"),
	}
}

func (c *Controller) Create(ctx *gin.Context) {
	orgIDStr := ctx.Param("id")
	orgID, err := uuid.Parse(orgIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid organization ID"))
		return
	}

	var dto CreateCatalogItemDTO
	if err := ctx.ShouldBindJSON(&dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse(err.Error()))
		return
	}

	if err := utils.Validate.Struct(dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse(err.Error()))
		return
	}

	entity, err := c.service.Create(ctx, orgID, dto)
	if err != nil {
		c.logger.Errorw("Failed to create catalog item", "orgId", orgID, "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Internal server error"))
		return
	}

	ctx.JSON(http.StatusCreated, utils.NewSuccessResponse("Catalog item created successfully", entity))
}

func (c *Controller) GetByOrganizationID(ctx *gin.Context) {
	orgIDStr := ctx.Param("id")
	orgID, err := uuid.Parse(orgIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid organization ID"))
		return
	}

	var pagination utils.PaginatedQueryParams
	if err := ctx.ShouldBindQuery(&pagination); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid pagination parameters"))
		return
	}

	if pagination.Page == 0 {
		pagination.Page = 1
	}
	if pagination.Limit == 0 {
		pagination.Limit = 10
	}

	search := ctx.Query("q")
	typeStr := ctx.Query("type")

	filter := CatalogItemFilter{
		Page:  pagination.Page,
		Limit: pagination.Limit,
	}

	if search != "" {
		filter.Search = &search
	}
	if typeStr != "" {
		t := CatalogItemType(typeStr)
		filter.Type = &t
	}

	entities, count, err := c.service.GetByOrganizationID(ctx, orgID, filter)
	if err != nil {
		c.logger.Errorw("Failed to fetch catalog items", "orgId", orgID, "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Internal server error"))
		return
	}

	response := utils.NewPaginatedResponse(entities, count, pagination.Page, pagination.Limit)
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("success", response))
}

func (c *Controller) GetByID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid catalog item ID"))
		return
	}

	entity, err := c.service.GetByID(ctx, id)
	if err != nil {
		c.logger.Errorw("Failed to fetch catalog item", "id", id, "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Internal server error"))
		return
	}

	if entity == nil {
		ctx.JSON(http.StatusNotFound, utils.NewFailResponse("Catalog item not found"))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("success", entity))
}

func (c *Controller) Update(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid catalog item ID"))
		return
	}

	var dto UpdateCatalogItemDTO
	if err := ctx.ShouldBindJSON(&dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse(err.Error()))
		return
	}

	if err := utils.Validate.Struct(dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse(err.Error()))
		return
	}

	entity, err := c.service.Update(ctx, id, dto)
	if err != nil {
		c.logger.Errorw("Failed to update catalog item", "id", id, "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Internal server error"))
		return
	}

	if entity == nil {
		ctx.JSON(http.StatusNotFound, utils.NewFailResponse("Catalog item not found"))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("Catalog item updated successfully", entity))
}

func (c *Controller) Delete(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid catalog item ID"))
		return
	}

	if err := c.service.Delete(ctx, id); err != nil {
		c.logger.Errorw("Failed to delete catalog item", "id", id, "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Internal server error"))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse[any]("Catalog item deleted successfully", nil))
}
