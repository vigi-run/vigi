package executor

import (
	"context"
	"testing"
	"time"
	"vigi/internal/modules/shared"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

func TestPingExecutor_RespectsContext(t *testing.T) {
	// Arrange
	logger := zap.NewNop().Sugar()
	executor := NewPingExecutor(logger)

	monitor := &Monitor{
		Name:    "Test Timeout",
		Type:    "ping",
		Timeout: 1,                                                             // 1 second Global Timeout
		Config:  `{"host": "192.0.2.1", "count": 5, "per_request_timeout": 5}`, // Unreachable IP, config that would take 25s > 1s
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second) // Test watchdog
	defer cancel()

	// Act
	start := time.Now()
	// Create a sub-context for execution that simulates the worker's timeout
	execCtx, execCancel := context.WithTimeout(ctx, time.Duration(monitor.Timeout)*time.Second)
	defer execCancel()

	result := executor.Execute(execCtx, monitor, nil)
	duration := time.Since(start)

	// Assert
	assert.Equal(t, shared.MonitorStatusDown, result.Status)

	// Should return roughly within the timeout (allow slight overhead for process/setup)
	// If it takes > 2s (watchdog), it means it ignored the 1s timeout
	assert.Less(t, duration.Milliseconds(), int64(1500), "Execute took too long, likely ignored context timeout")
}

func TestPingExecutor_Defaults(t *testing.T) {
	// Arrange
	logger := zap.NewNop().Sugar()
	executor := NewPingExecutor(logger)

	monitor := &Monitor{
		Name:    "Test Defaults",
		Type:    "ping",
		Timeout: 5,
		Config:  `{"host": "localhost"}`, // Missing count/timeout
	}

	ctx := context.Background()

	// Act
	// We just want to ensure it doesn't panic and populates config correctly internally
	// Since we can't inspect internal config easily without expose, we rely on logs or side effects.
	// But mostly we check it runs.
	result := executor.Execute(ctx, monitor, nil)

	// Assert
	assert.NotNil(t, result)
}
