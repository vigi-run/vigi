package inter

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	ProdBaseURL    = "https://cdpj.partners.bancointer.com.br"
	SandboxBaseURL = "https://cdpj-sandbox.partners.uatinter.co"
)

type InterClient struct {
	httpClient   *http.Client
	baseURL      string
	clientID     string
	clientSecret string
	token        string
	tokenExp     time.Time
}

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
	Scope       string `json:"scope"`
}

type InterPayer struct {
	CpfCnpj     string `json:"cpfCnpj"`
	TipoPessoa  string `json:"tipoPessoa"`
	Nome        string `json:"nome"`
	Endereco    string `json:"endereco"`
	Numero      string `json:"numero"`
	Complemento string `json:"complemento"`
	Bairro      string `json:"bairro"`
	Cidade      string `json:"cidade"`
	Uf          string `json:"uf"`
	Cep         string `json:"cep"`
	Email       string `json:"email"`
	Ddd         string `json:"ddd"`
	Telefone    string `json:"telefone"`
}

type InterDiscount struct {
	Codigo         string  `json:"codigo"` // "NAOTEM", "VALORFIXODATAINFORMADA", "PERCENTUALDATAINFORMADA"
	QuantidadeDias int     `json:"quantidadeDias"`
	Taxa           float64 `json:"taxa"`
	Valor          float64 `json:"valor"`
	Data           string  `json:"data"`
}

type InterChargeRequest struct {
	SeuNumero      string         `json:"seuNumero"`
	ValorNominal   float64        `json:"valorNominal"` // Gross value
	DataVencimento string         `json:"dataVencimento"`
	NumDiasAgenda  int            `json:"numDiasAgenda"` // "30"
	Pagador        InterPayer     `json:"pagador"`
	Desconto       *InterDiscount `json:"desconto,omitempty"`
}

type InterChargeResponse struct {
	CodigoSolicitacao string `json:"codigoSolicitacao"`
	SeuNumero         string `json:"seuNumero"`
	// Add other fields if needed
}

func NewInterClient(config *InterConfig) (*InterClient, error) {
	cert, err := tls.X509KeyPair([]byte(config.Certificate), []byte(config.Key))
	if err != nil {
		return nil, fmt.Errorf("failed to load certificate: %w", err)
	}

	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
	}

	transport := &http.Transport{
		TLSClientConfig: tlsConfig,
	}

	client := &http.Client{
		Transport: transport,
		Timeout:   30 * time.Second,
	}

	baseURL := SandboxBaseURL
	if config.Environment == InterEnvironmentProduction {
		baseURL = ProdBaseURL
	}

	return &InterClient{
		httpClient:   client,
		baseURL:      baseURL,
		clientID:     config.ClientID,
		clientSecret: config.ClientSecret,
	}, nil
}

func (c *InterClient) Authenticate() error {
	// Check if token is valid
	if c.token != "" && time.Now().Before(c.tokenExp) {
		return nil
	}

	data := url.Values{}
	data.Set("client_id", c.clientID)
	data.Set("client_secret", c.clientSecret)
	data.Set("grant_type", "client_credentials")
	data.Set("scope", "boleto-cobranca.write boleto-cobranca.read")

	req, err := http.NewRequest("POST", c.baseURL+"/oauth/v2/token", strings.NewReader(data.Encode()))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("authentication failed: %d - %s", resp.StatusCode, string(body))
	}

	var tokenResp TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return err
	}

	c.token = tokenResp.AccessToken
	// expires_in is seconds
	c.tokenExp = time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second).Add(-1 * time.Minute)

	return nil
}

func (c *InterClient) CreateCharge(reqData InterChargeRequest) (*InterChargeResponse, error) {
	if err := c.Authenticate(); err != nil {
		return nil, err
	}

	jsonData, err := json.Marshal(reqData)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", c.baseURL+"/cobranca/v3/cobrancas", bytes.NewReader(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("request failed: %d - %s", resp.StatusCode, string(respBody))
	}

	var chargeResp InterChargeResponse
	if err := json.Unmarshal(respBody, &chargeResp); err != nil {
		// If response is not JSON or unexpected, return error or maybe success if 200?
		// Sometimes they return just 200 OK.
		// But we need the ID.
		// If unmarshal fails but status is 200, maybe we should inspect body.
		// For now return error.
		return nil, fmt.Errorf("failed to decode response: %w, body: %s", err, string(respBody))
	}

	return &chargeResp, nil
}

type InterPixInfo struct {
	Txid          string `json:"txid"`
	PixCopiaECola string `json:"pixCopiaECola"`
}

type InterCobrancaInfo struct {
	Situacao string `json:"situacao"`
}

type InterGetChargeResponse struct {
	Cobranca InterCobrancaInfo `json:"cobranca"`
	Boleto   struct {
		NossoNumero    string `json:"nossoNumero"`
		CodigoBarras   string `json:"codigoBarras"`
		LinhaDigitavel string `json:"linhaDigitavel"`
	} `json:"boleto"`
	Pix InterPixInfo `json:"pix"`
}

func (c *InterClient) GetCharge(requestCode string) (*InterGetChargeResponse, error) {
	if err := c.Authenticate(); err != nil {
		return nil, err
	}

	req, err := http.NewRequest("GET", c.baseURL+"/cobranca/v3/cobrancas/"+requestCode, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+c.token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get charge: %d - %s", resp.StatusCode, string(body))
	}

	var result InterGetChargeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

type WebhookRequest struct {
	WebhookUrl string `json:"webhookUrl"`
}

func (c *InterClient) RegisterWebhook(webhookUrl string) error {
	if err := c.Authenticate(); err != nil {
		return err
	}

	reqData := WebhookRequest{
		WebhookUrl: webhookUrl,
	}

	jsonData, err := json.Marshal(reqData)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("PUT", c.baseURL+"/cobranca/v3/cobrancas/webhook", bytes.NewReader(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("webhook registration failed: %d - %s", resp.StatusCode, string(respBody))
	}

	return nil
}
