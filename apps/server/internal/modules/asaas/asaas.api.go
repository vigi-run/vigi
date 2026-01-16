package asaas

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
)

type AsaasClient struct {
	baseURL string
	apiKey  string
}

func NewAsaasClient(config *AsaasConfig) *AsaasClient {
	baseURL := "https://api-sandbox.asaas.com/v3"
	if config.Environment == "production" {
		baseURL = "https://api.asaas.com/v3"
	}
	return &AsaasClient{baseURL: baseURL, apiKey: config.ApiKey}
}

// --- DTOs for API ---

type AsaasCustomer struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	CpfCnpj       string `json:"cpfCnpj"`
	MobilePhone   string `json:"mobilePhone,omitempty"`
	Address       string `json:"address,omitempty"`
	AddressNumber string `json:"addressNumber,omitempty"`
	Province      string `json:"province,omitempty"` // Bairro
	PostalCode    string `json:"postalCode,omitempty"`
}

type AsaasCustomerResponse struct {
	Data []AsaasCustomer `json:"data"`
}

type AsaasPaymentRequest struct {
	Customer          string  `json:"customer"`
	BillingType       string  `json:"billingType"` // BOLETO
	Value             float64 `json:"value"`
	DueDate           string  `json:"dueDate"` // YYYY-MM-DD
	Description       string  `json:"description,omitempty"`
	ExternalReference string  `json:"externalReference,omitempty"`
}

type AsaasPaymentResponse struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

// --- Methods ---

func (c *AsaasClient) GetCustomerByDoc(cpfCnpj string) (*AsaasCustomer, error) {
	reqUrl := fmt.Sprintf("%s/customers?cpfCnpj=%s", c.baseURL, url.QueryEscape(cpfCnpj))
	req, err := http.NewRequest("GET", reqUrl, nil)
	if err != nil {
		return nil, err
	}
	c.setHeaders(req)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("asaas api error: %s", resp.Status)
	}

	var result AsaasCustomerResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if len(result.Data) > 0 {
		return &result.Data[0], nil
	}
	return nil, nil
}

func (c *AsaasClient) CreateCustomer(customer AsaasCustomer) (*AsaasCustomer, error) {
	body, err := json.Marshal(customer)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", c.baseURL+"/customers", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	c.setHeaders(req)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Read body for details
		return nil, fmt.Errorf("asaas api create customer error: %s", resp.Status)
	}

	var created AsaasCustomer
	if err := json.NewDecoder(resp.Body).Decode(&created); err != nil {
		return nil, err
	}

	return &created, nil
}

func (c *AsaasClient) CreatePayment(payment AsaasPaymentRequest) (*AsaasPaymentResponse, error) {
	body, err := json.Marshal(payment)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", c.baseURL+"/payments", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	c.setHeaders(req)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("asaas api create payment error: %s", resp.Status)
	}

	var created AsaasPaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&created); err != nil {
		return nil, err
	}

	return &created, nil
}

func (c *AsaasClient) setHeaders(req *http.Request) {
	req.Header.Set("access_token", c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Vigi-System")
}
