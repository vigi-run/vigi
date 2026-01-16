package utils

type APIError struct {
	Status  string `json:"status" binding:"required"`
	Message string `json:"message" binding:"required"`
}

type ApiResponse[T any] struct {
	Message string `json:"message" binding:"required"`
	Data    T      `json:"data" binding:"required"`
}

// NewSuccessResponse creates a successful API response.
func NewSuccessResponse[T any](message string, data T) ApiResponse[T] {
	return ApiResponse[T]{
		Message: message,
		Data:    data,
	}
}

// NewFailResponse creates a failed API response.
func NewFailResponse(message string) ApiResponse[any] {
	return ApiResponse[any]{
		Message: message,
		Data:    nil,
	}
}

type URIParams struct {
	ID string `uri:"id" binding:"required"` // e.g., /items/:id
}

type PaginatedQueryParams struct {
	Page  int `form:"page" binding:"numeric"`
	Limit int `form:"limit" binding:"numeric,max=50"`
}

type PaginatedResponse[T any] struct {
	Data       []T `json:"data"`
	TotalCount int `json:"totalCount"`
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalPages int `json:"totalPages"`
}

func NewPaginatedResponse[T any](data []T, count int, page, limit int) PaginatedResponse[T] {
	totalPages := 0
	if limit > 0 {
		totalPages = (count + limit - 1) / limit
	}
	return PaginatedResponse[T]{
		Data:       data,
		TotalCount: count,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}
}
