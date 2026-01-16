package usesend

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	apiKey string
	domain string
	client *http.Client
}

func NewClient(apiKey, domain string) *Client {
	return &Client{
		apiKey: apiKey,
		domain: domain,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *Client) SendEmail(ctx context.Context, req SendEmailRequest) (*SendEmailResponse, error) {
	var url string
	if strings.Contains(c.domain, "webhook.site") {
		url = c.domain
	} else {
		url = fmt.Sprintf("%s/api/v1/emails", strings.TrimSuffix(c.domain, "/"))
	}

	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Read body to include in errors or parse as JSON
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("failed to send email to %s: status %d. Body: %s", url, resp.StatusCode, string(bodyBytes))
	}

	var result SendEmailResponse
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		// return body sample in error for debugging
		sample := string(bodyBytes)
		if len(sample) > 500 {
			sample = sample[:500] + "..."
		}
		return nil, fmt.Errorf("failed to decode response: %w. Body: %s", err, sample)
	}

	return &result, nil
}
