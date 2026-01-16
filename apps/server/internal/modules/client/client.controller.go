package client

import (
	"net/http"
	"vigi/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type Controller struct {
	clientService *Service
	logger        *zap.SugaredLogger
}

func NewController(
	clientService *Service,
	logger *zap.SugaredLogger,
) *Controller {
	return &Controller{
		clientService: clientService,
		logger:        logger.Named("[client-controller]"),
	}
}

// @Router		/organizations/{orgId}/clients [post]
// @Summary		Create client
// @Tags			Clients
// @Produce		json
// @Accept		json
// @Security  JwtAuth
// @Security  ApiKeyAuth
// @Security  OrgIdAuth
// @Param     orgId   path    string  true  "Organization ID"
// @Param     body body   CreateClientDTO  true  "Client object"
// @Success		201	{object}	utils.ApiResponse[Client]
// @Failure		400	{object}	utils.APIError[any]
// @Failure		401	{object}	utils.APIError[any]
// @Failure		500	{object}	utils.APIError[any]
func (c *Controller) Create(ctx *gin.Context) {
	orgIDStr := ctx.Param("id")
	orgID, err := uuid.Parse(orgIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid organization ID"))
		return
	}

	var dto CreateClientDTO
	if err := ctx.ShouldBindJSON(&dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse(err.Error()))
		return
	}

	if err := utils.Validate.Struct(dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse(err.Error()))
		return
	}

	client, err := c.clientService.Create(ctx, orgID, dto)
	if err != nil {
		c.logger.Errorw("Failed to create client", "orgId", orgID, "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Internal server error"))
		return
	}

	ctx.JSON(http.StatusCreated, utils.NewSuccessResponse("Client created successfully", client))
}

// @Router		/organizations/{orgId}/clients [get]
// @Summary		List clients by organization
// @Tags			Clients
// @Produce		json
// @Security  JwtAuth
// @Security  ApiKeyAuth
// @Security  OrgIdAuth
// @Param     orgId   path    string  true  "Organization ID"
// @Param     page    query   int     false "Page number"
// @Param     limit   query   int     false "Items per page"
// @Param     q       query   string  false "Search query"
// @Param     classification query string false "Filter by classification"
// @Success		200	{object}	utils.PaginatedResponse[Client]
// @Failure		401	{object}	utils.APIError[any]
// @Failure		500	{object}	utils.APIError[any]
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
	classification := ctx.Query("classification")

	filter := ClientFilter{
		Page:  pagination.Page,
		Limit: pagination.Limit,
	}

	if search != "" {
		filter.Search = &search
	}
	if classification != "" {
		filter.Classification = &classification
	}

	clients, count, err := c.clientService.GetByOrganizationID(ctx, orgID, filter)
	if err != nil {
		c.logger.Errorw("Failed to fetch clients", "orgId", orgID, "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Internal server error"))
		return
	}

	// Convert []*Client to []Client for response matching utils.ApiResponse logic if needed,
	// but here we return *Client generally. We need to respect the generic T.
	// However the service methods return []*Client.
	// Let's create a slice of values if needed or just pass pointers.
	// utils.PaginatedResponse expects []T.

	response := utils.NewPaginatedResponse(clients, count, pagination.Page, pagination.Limit)
	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("success", response))
}

// @Router		/clients/{id} [get]
// @Summary		Get client by ID
// @Tags			Clients
// @Produce		json
// @Security  JwtAuth
// @Security  ApiKeyAuth
// @Param     id   path    string  true  "Client ID"
// @Success		200	{object}	utils.ApiResponse[Client]
// @Failure		404	{object}	utils.APIError[any]
// @Failure		500	{object}	utils.APIError[any]
func (c *Controller) GetByID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid client ID"))
		return
	}

	client, err := c.clientService.GetByID(ctx, id)
	if err != nil {
		c.logger.Errorw("Failed to fetch client", "id", id, "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Internal server error"))
		return
	}

	if client == nil {
		ctx.JSON(http.StatusNotFound, utils.NewFailResponse("Client not found"))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("success", client))
}

// @Router		/clients/{id} [patch]
// @Summary		Update client
// @Tags			Clients
// @Produce		json
// @Accept		json
// @Security  JwtAuth
// @Security  ApiKeyAuth
// @Param     id   path    string  true  "Client ID"
// @Param     body body   UpdateClientDTO  true  "Client object"
// @Success		200	{object}	utils.ApiResponse[Client]
// @Failure		400	{object}	utils.APIError[any]
// @Failure		404	{object}	utils.APIError[any]
// @Failure		500	{object}	utils.APIError[any]
func (c *Controller) Update(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid client ID"))
		return
	}

	var dto UpdateClientDTO
	if err := ctx.ShouldBindJSON(&dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse(err.Error()))
		return
	}

	if err := utils.Validate.Struct(dto); err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse(err.Error()))
		return
	}

	client, err := c.clientService.Update(ctx, id, dto)
	if err != nil {
		c.logger.Errorw("Failed to update client", "id", id, "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Internal server error"))
		return
	}

	if client == nil {
		ctx.JSON(http.StatusNotFound, utils.NewFailResponse("Client not found"))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse("Client updated successfully", client))
}

// @Router		/clients/{id} [delete]
// @Summary		Delete client
// @Tags			Clients
// @Produce		json
// @Security  JwtAuth
// @Security  ApiKeyAuth
// @Param     id   path    string  true  "Client ID"
// @Success		200	{object}	utils.ApiResponse[any]
// @Failure		400	{object}	utils.APIError[any]
// @Failure		500	{object}	utils.APIError[any]
func (c *Controller) Delete(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, utils.NewFailResponse("Invalid client ID"))
		return
	}

	if err := c.clientService.Delete(ctx, id); err != nil {
		c.logger.Errorw("Failed to delete client", "id", id, "error", err)
		ctx.JSON(http.StatusInternalServerError, utils.NewFailResponse("Internal server error"))
		return
	}

	ctx.JSON(http.StatusOK, utils.NewSuccessResponse[any]("Client deleted successfully", nil))
}
