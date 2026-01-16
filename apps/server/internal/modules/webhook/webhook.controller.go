package webhook

import (
	"net/http"
	"vigi/internal/modules/invoice"
	"vigi/internal/pkg/usesend"

	"github.com/gin-gonic/gin"
)

type WebhookController struct {
	emailRepo invoice.EmailRepository
}

func NewWebhookController(emailRepo invoice.EmailRepository) *WebhookController {
	return &WebhookController{emailRepo: emailRepo}
}

func (c *WebhookController) HandleUsesendWebhook(ctx *gin.Context) {
	var event usesend.WebhookEvent
	if err := ctx.ShouldBindJSON(&event); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	emailID := event.Payload.EmailID
	// statusStr := event.Payload.Status // Unused for now as we map based on Event type
	// Map usesend status to EmailStatus if needed, but usesend.EmailStatus covers it.
	// User provided mappings:
	// Send -> SENT
	// Delivery -> DELIVERED
	// etc.
	// The Payload.Status provided by user example is "CLICKED".
	// The user also listed events: "Send", "Delivery", etc.
	// And code snippet: if (eventType === "Send") ...
	// The struct I created `WebhookEvent` has `Event` field.
	// User snippet seems to map `eventType` (which corresponds to `Event` in JSON?) to `EmailStatus`.

	// Let's verify JSON structure again from prompt.
	/*
		{
		  "event": "EMAIL_CLICKED",
		  "payload": {
		    "emailId": "...",
		    "status": "CLICKED",
		    ...
		  }
		}
	*/
	// User listed events: Return EmailStatus.SENT if eventType === "Send".
	// But JSON event is "EMAIL_CLICKED".
	// Maybe User meant the suffix or the mapping logic provided is from another system or just example?
	// The user said: "Os email v~ao ser enviado para a usend: ... O webhook vai enviar isso: { "event": "EMAIL_CLICKED", ... }"
	// And then "Com os eventos: if (eventType === "Send") ..."
	// It seems "Send" maps to SENT. "Click" maps to CLICKED.
	// But the example JSON has "EMAIL_CLICKED". Maybe "EMAIL_CLICKED" corresponds to "Click"?

	// I will use a switch based on `event.Event` or `event.Payload.Status`.
	// Let's assume `event.Payload.Status` is the source of truth for status update if available.
	// BUT, generally we want to log the event in history.

	status := convertToEmailStatus(event.Event)

	if err := c.emailRepo.AddEvent(ctx.Request.Context(), emailID, event, status); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update email record"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func convertToEmailStatus(eventType string) usesend.EmailStatus {
	// Simple mapping based on loose string matching or exact matches if known.
	// Given user prompt mappings:
	switch eventType {
	case "Send", "EMAIL_SEND":
		return usesend.EmailStatusSent
	case "Delivery", "EMAIL_DELIVERED":
		return usesend.EmailStatusDelivered
	case "Bounce", "EMAIL_BOUNCED":
		return usesend.EmailStatusBounced
	case "Complaint", "EMAIL_COMPLAINT":
		return usesend.EmailStatusComplained
	case "Reject", "EMAIL_REJECTED":
		return usesend.EmailStatusRejected
	case "Open", "EMAIL_OPENED":
		return usesend.EmailStatusOpened
	case "Click", "EMAIL_CLICKED":
		return usesend.EmailStatusClicked
	case "Rendering Failure", "EMAIL_RENDERING_FAILURE":
		return usesend.EmailStatusRenderingFailure
	case "DeliveryDelay", "EMAIL_DELIVERY_DELAY":
		return usesend.EmailStatusDeliveryDelayed
	default:
		// Fallback or keep existing
		return usesend.EmailStatus(eventType)
	}
}

func RegisterRoutes(r *gin.RouterGroup, c *WebhookController) {
	r.POST("/usesend", c.HandleUsesendWebhook)
}
