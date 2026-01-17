package recurring_invoice

import (
	"net/http"

	"vigi/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Controller struct {
	service *Service
}

func NewController(service *Service) *Controller {
	return &Controller{service: service}
}

func (c *Controller) Create(ctx *gin.Context) {
	orgIDStr := ctx.Param("id")
	orgID, err := uuid.Parse(orgIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid organization ID"))
		return
	}
	var dto CreateRecurringInvoiceDTO
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
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Failed to create recurring invoice"))
		return
	}

	ctx.JSON(http.StatusCreated, utils.NewSuccessResponse("created", entity))
}

func (c *Controller) GetByOrganizationID(ctx *gin.Context) {
	orgIDStr := ctx.Param("id")
	orgID, err := uuid.Parse(orgIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid organization ID"))
		return
	}

	var pagination utils.PaginatedQueryParams
	ctx.ShouldBindQuery(&pagination)

	if pagination.Page == 0 {
		pagination.Page = 1
	}
	if pagination.Limit == 0 {
		pagination.Limit = 10
	}

	filter := RecurringInvoiceFilter{
		Page:  pagination.Page,
		Limit: pagination.Limit,
	}

	if search := ctx.Query("q"); search != "" {
		filter.Search = &search
	}
	if status := ctx.Query("status"); status != "" {
		s := RecurringInvoiceStatus(status)
		filter.Status = &s
	}
	if clientIDStr := ctx.Query("clientId"); clientIDStr != "" {
		clientID, err := uuid.Parse(clientIDStr)
		if err == nil {
			filter.ClientID = &clientID
		}
	}

	entities, count, err := c.service.GetByOrganizationID(ctx, orgID, filter)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Internal server error"))
		return
	}

	response := utils.NewPaginatedResponse(entities, count, pagination.Page, pagination.Limit)
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("success", response))
}

func (c *Controller) GetByID(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid ID"))
		return
	}

	entity, err := c.service.GetByID(ctx, id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, utils.NewFailResponse("Recurring invoice not found"))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("success", entity))
}

func (c *Controller) Update(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid ID"))
		return
	}

	var dto UpdateRecurringInvoiceDTO
	if err := ctx.ShouldBindJSON(&dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid input"))
		return
	}

	entity, err := c.service.Update(ctx, id, dto)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Failed to update recurring invoice"))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("success", entity))
}

func (c *Controller) Delete(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid ID"))
		return
	}

	if err := c.service.Delete(ctx, id); err != nil {
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Failed to delete recurring invoice"))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse[any]("success", nil))
}

func (c *Controller) GenerateInvoice(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid ID"))
		return
	}

	invoice, err := c.service.GenerateInvoice(ctx, id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Failed to generate invoice: "+err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("generated", invoice))
}
