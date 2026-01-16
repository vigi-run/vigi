package auth

import (
	"time"
)

const (
	RoleAdmin = "ADMIN"
	RoleUser  = "USER"
)

type Model struct {
	ID             string    `json:"id"`
	Email          string    `json:"email"`
	Name           string    `json:"name"`
	ImageURL       string    `json:"imageUrl"`
	Password       string    `json:"-"`
	Active         bool      `json:"active"`
	TwoFASecret    string    `json:"-"`
	TwoFAStatus    bool      `json:"twofa_status"`
	TwoFALastToken string    `json:"-"`
	Role           string    `json:"role"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type UpdateModel struct {
	Email          *string `json:"email"`
	Name           *string `json:"name"`
	ImageURL       *string `json:"imageUrl"`
	Password       *string `json:"password"`
	Active         *bool   `json:"active"`
	TwoFASecret    *string `json:"twofa_secret"`
	TwoFAStatus    *bool   `json:"twofa_status"`
	TwoFALastToken *string `json:"twofa_last_token"`
	Role           *string `json:"role"`
}
