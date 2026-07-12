---
name: termux-quick-ref
description: |
  Quick reference for top 15 Termux API commands. Lightweight alternative to full termux-api skill. Use when context is limited.
---

# Termux Quick Reference

Top 15 commands. For full reference, use `termux-api` skill or run `termux_list` to discover available commands on device.

## Setup

```bash
source termux-state.sh
```

## Commands

| Command | Description |
|---------|-------------|
| `termux-battery-status` | Battery level, charging, temperature |
| `termux-notification -t "title" -c "msg"` | Show notification |
| `termux-toast "message"` | Toast popup |
| `termux-tts-speak "text"` | Text to speech |
| `termux-location` | Get GPS location |
| `termux-camera-photo -c <id> <file>` | Take photo (0=back, 1=front) |
| `termux-clipboard-get` | Get clipboard |
| `termux-clipboard-set "text"` | Set clipboard |
| `termux-vibrate -d <ms>` | Vibrate |
| `termux-torch on/off` | Toggle flashlight |
| `termux-brightness <0-255>` | Set screen brightness |
| `termux-wifi-connectioninfo` | WiFi connection info |
| `termux-contact-list` | List contacts |
| `termux-sms-list -l 10` | List recent SMS |
| `termux-open-url <url>` | Open URL in browser |

## Execute

```bash
# Always use termux_exec — handles native/proot/SSH automatically
termux_exec termux-battery-status
termux_exec termux-notification -t "Alert" -c "Hello"
```

## Discover More

```bash
# List ALL available termux-* commands on this device
termux_list

# Get help for a specific command
termux_help termux-notification
```

## Environment

```bash
# Check detected environment
cat ~/.termux-skill-state

# Re-detect if something changed
rm ~/.termux-skill-state && source termux-state.sh
```
