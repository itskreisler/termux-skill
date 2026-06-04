# termux-skill

**Termux API skill for AI agents** — control Android devices via Termux API.

```bash
npx -y termux-skill
```

Installs a `SKILL.md` in `.agents/skills/termux-api/` (and other agent directories) so your AI agent (OpenCode, Claude Code, Cursor, Copilot, etc.) can control Android via Termux API.

## What it does

- Auto-detects native Termux, proot-distro, or falls back to SSH (port 8022)
- 70+ device APIs: camera, sensors, GPS, SMS, notifications, clipboard, TTS, torch, WiFi, battery
- Installs to all supported agent directories automatically
- Writes `skills-lock.json` and updates `CLAUDE.md`

## Usage

```bash
npx -y termux-skill
```

Re-run to update. Use `--force` to overwrite existing installations.

## API examples

| Command | Description |
|---------|-------------|
| `termux-battery-status` | Battery level, charging status |
| `termux-camera-photo -c 1 ~/foto.jpg` | Take photo (front camera) |
| `termux-notification -t "Hola" -c "Mundo"` | Show notification |
| `termux-location -p network` | Get GPS location |
| `termux-sms-send -n +123 "message"` | Send SMS |
| `termux-tts-speak "Hello"` | Text to speech |
| `termux-clipboard-get` | Get clipboard text |
| `termux-torch on` | Toggle flashlight |

See the full skill at `.agents/skills/termux-api/SKILL.md` after installation.
