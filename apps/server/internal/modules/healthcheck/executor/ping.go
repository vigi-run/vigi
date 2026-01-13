package executor

import (
	"context"
	"fmt"
	"net"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"time"
	"vigi/internal/modules/shared"

	"go.uber.org/zap"
	"golang.org/x/net/icmp"
	"golang.org/x/net/ipv4"
)

type PingConfig struct {
	Host              string `json:"host" validate:"required" example:"example.com"`
	PacketSize        int    `json:"packet_size" validate:"omitempty,min=0,max=65507" example:"32"`
	Count             int    `json:"count" validate:"omitempty,min=1,max=100" example:"1"`
	PerRequestTimeout int    `json:"per_request_timeout" validate:"omitempty,min=1,max=60" example:"2"`
}

type PingExecutor struct {
	logger *zap.SugaredLogger
}

func NewPingExecutor(logger *zap.SugaredLogger) *PingExecutor {
	return &PingExecutor{
		logger: logger,
	}
}

func (s *PingExecutor) Unmarshal(configJSON string) (any, error) {
	return GenericUnmarshal[PingConfig](configJSON)
}

func (s *PingExecutor) Validate(configJSON string) error {
	cfg, err := s.Unmarshal(configJSON)
	if err != nil {
		return err
	}
	return GenericValidator(cfg.(*PingConfig))
}

func (p *PingExecutor) Execute(ctx context.Context, m *Monitor, proxyModel *Proxy) *Result {
	cfgAny, err := p.Unmarshal(m.Config)
	if err != nil {
		return DownResult(err, time.Now().UTC(), time.Now().UTC())
	}
	cfg := cfgAny.(*PingConfig)

	// Set defaults
	if cfg.PacketSize == 0 {
		cfg.PacketSize = 32
	}
	if cfg.Count < 1 {
		cfg.Count = 1
	}
	if cfg.PerRequestTimeout < 1 {
		cfg.PerRequestTimeout = 2
	}

	p.logger.Debugf("execute ping cfg: %+v, monitor_timeout=%d", cfg, m.Timeout)

	startTime := time.Now().UTC()

	// Calculate per-request timeout duration
	perReqTimeout := time.Duration(cfg.PerRequestTimeout) * time.Second

	// Try native ICMP first
	success, rtt, err := p.tryNativePing(ctx, cfg.Host, cfg.PacketSize, cfg.Count, perReqTimeout)
	if err != nil {
		// Only fallback if error is related to privileges or socket creation
		// If it's a timeout or host resolution failure, system ping likely won't help or isn't needed
		if strings.Contains(err.Error(), "socket") || strings.Contains(err.Error(), "permission") || strings.Contains(err.Error(), "privileged") {
			p.logger.Debugf("Native ping failed permission/socket check: %v, trying system ping", err)

			// For system ping, we rely on the command's timeout handling
			// We give it slightly more time than Count * PerRequestTimeout to accommodate overhead
			cmdTimeout := time.Duration(m.Timeout) * time.Second
			if cmdTimeout < perReqTimeout*time.Duration(cfg.Count) {
				cmdTimeout = perReqTimeout*time.Duration(cfg.Count) + 2*time.Second
			}

			success, rtt, err = p.trySystemPing(ctx, cfg.Host, cfg.PacketSize, cfg.Count, cmdTimeout)
		} else {
			p.logger.Debugf("Native ping failed: %v", err)
		}
	}

	endTime := time.Now().UTC()

	if err != nil {
		p.logger.Infof("Ping failed: %s, %s", m.Name, err.Error())
		return &Result{
			Status:    shared.MonitorStatusDown,
			Message:   fmt.Sprintf("Ping failed: %v", err),
			StartTime: startTime,
			EndTime:   endTime,
		}
	}

	if !success {
		return &Result{
			Status:    shared.MonitorStatusDown,
			Message:   "Ping failed: no packets received",
			StartTime: startTime,
			EndTime:   endTime,
		}
	}

	p.logger.Infof("Ping successful: %s, RTT: %v", m.Name, rtt)

	return &Result{
		Status:    shared.MonitorStatusUp,
		Message:   fmt.Sprintf("Ping successful, RTT: %v", rtt),
		StartTime: startTime,
		EndTime:   endTime,
	}
}

// tryNativePing attempts to use native ICMP implementation with enhanced stability
func (p *PingExecutor) tryNativePing(ctx context.Context, host string, packetSize int, count int, perOneTimeout time.Duration) (bool, time.Duration, error) {
	// Context-aware DNS resolution
	ips, err := net.DefaultResolver.LookupIPAddr(ctx, host)
	if err != nil {
		return false, 0, fmt.Errorf("failed to resolve host: %v", err)
	}
	if len(ips) == 0 {
		return false, 0, fmt.Errorf("no IP addresses found for host %s", host)
	}
	dst := &net.IPAddr{IP: ips[0].IP}

	// Create ICMP socket
	conn, err := icmp.ListenPacket("ip4:icmp", "0.0.0.0")
	if err != nil {
		return false, 0, fmt.Errorf("failed to create ICMP socket: %v", err)
	}
	defer conn.Close()

	// Prepare data
	dataSize := packetSize
	if dataSize < 0 {
		dataSize = 0
	}
	data := make([]byte, dataSize)
	copy(data, []byte("Vigi"))

	var totalRTT time.Duration
	successCount := 0

	for i := 0; i < count; i++ {
		// Check context cancellation before each attempt
		select {
		case <-ctx.Done():
			return false, 0, ctx.Err()
		default:
		}

		msg := &icmp.Message{
			Type: ipv4.ICMPTypeEcho,
			Code: 0,
			Body: &icmp.Echo{
				ID:   1, // We could use PID, but 1 is fine for simple monitoring
				Seq:  i + 1,
				Data: data,
			},
		}

		msgBytes, err := msg.Marshal(nil)
		if err != nil {
			return false, 0, fmt.Errorf("failed to marshal ICMP message: %v", err)
		}

		// Set deadline for this specific ping
		if err := conn.SetDeadline(time.Now().Add(perOneTimeout)); err != nil {
			return false, 0, fmt.Errorf("failed to set deadline: %v", err)
		}

		start := time.Now()
		if _, err := conn.WriteTo(msgBytes, dst); err != nil {
			p.logger.Debugf("Ping write failed: %v", err)
			continue
		}

		// Use a goroutine to read so we can respect context cancellation immediately
		// rather than waiting for ReadFrom to timeout/return
		type pingResult struct {
			peer net.Addr
			err  error
		}

		resCh := make(chan pingResult, 1)

		go func() {
			reply := make([]byte, 1500)
			// This will block until packet received or deadline exceeded
			n, peer, err := conn.ReadFrom(reply)
			if err != nil {
				resCh <- pingResult{err: err}
				return
			}

			// Parse message
			replyMsg, err := icmp.ParseMessage(1, reply[:n])
			if err != nil {
				resCh <- pingResult{err: err}
				return
			}

			if replyMsg.Type == ipv4.ICMPTypeEchoReply {
				resCh <- pingResult{peer: peer}
			} else {
				resCh <- pingResult{err: fmt.Errorf("unexpected msg type: %v", replyMsg.Type)}
			}
		}()

		select {
		case <-ctx.Done():
			return false, 0, ctx.Err()
		case res := <-resCh:
			if res.err == nil {
				totalRTT += time.Since(start)
				successCount++
			} else {
				p.logger.Debugf("Ping read failed: %v", res.err)
			}
		}

		// Small delay between pings if we have more to send
		if i < count-1 {
			select {
			case <-ctx.Done():
				return false, 0, ctx.Err()
			case <-time.After(200 * time.Millisecond):
			}
		}
	}

	if successCount > 0 {
		avgRTT := totalRTT / time.Duration(successCount)
		return true, avgRTT, nil
	}

	return false, 0, fmt.Errorf("all %d pings failed", count)
}

// trySystemPing falls back to using the system ping command
func (p *PingExecutor) trySystemPing(ctx context.Context, host string, packetSize int, count int, timeout time.Duration) (bool, time.Duration, error) {
	var cmd *exec.Cmd

	p.logger.Debugf("System ping: host=%s, count=%d, packetSize=%d", host, count, packetSize)

	// Calculate approximate timeout in seconds for flags
	timeoutSec := int(timeout.Seconds())
	if timeoutSec < 1 {
		timeoutSec = 1
	}

	switch runtime.GOOS {
	case "windows":
		// Windows ping: -n count, -l size, -w timeout(ms)
		// Note: Windows timeout is per-echo in ms
		cmd = exec.CommandContext(ctx, "ping", "-n", strconv.Itoa(count), "-l", strconv.Itoa(packetSize), "-w", strconv.Itoa(timeoutSec*1000), host)
	case "darwin":
		// MacOS ping: -c count, -s size, -W timeout(ms) - waits max W ms for reply
		cmd = exec.CommandContext(ctx, "ping", "-c", strconv.Itoa(count), "-s", strconv.Itoa(packetSize), "-W", strconv.Itoa(timeoutSec*1000), host)
	default: // linux
		// Linux ping: -c count, -s size, -W timeout(sec)
		cmd = exec.CommandContext(ctx, "ping", "-c", strconv.Itoa(count), "-s", strconv.Itoa(packetSize), "-W", strconv.Itoa(timeoutSec), host)
	}

	start := time.Now()
	output, err := cmd.Output()
	rtt := time.Since(start)

	if err != nil {
		// Exit code 1 usually means packet loss, but we check output to be sure
		p.logger.Debugf("System ping command error: %v, output: %s", err, string(output))
	}

	outputStr := string(output)

	// Basic parsing logic - can be improved based on OS
	if strings.Contains(outputStr, "100% packet loss") ||
		strings.Contains(outputStr, "100% loss") ||
		(strings.Contains(outputStr, "0 packets received") && !strings.Contains(outputStr, "bytes from")) {
		return false, rtt, fmt.Errorf("packet loss detected")
	}

	// Checks for success
	if strings.Contains(outputStr, "bytes from") || strings.Contains(outputStr, "Reply from") {
		// Try to parse RTT if possible (simplified for now, just total time / count if needed)
		// For now returning total command execution time normalized by count is a rough estimate if we assume serial pings
		if count > 1 {
			rtt = rtt / time.Duration(count)
		}
		return true, rtt, nil
	}

	return false, rtt, fmt.Errorf("ping failed")
}
