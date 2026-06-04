---
name: termux-api
description: |
  Control Android devices via Termux API. Auto-detects direct access (Termux/proot-distro) or falls back to SSH. Access camera, sensors, location, notifications, SMS, clipboard, TTS, and 70+ other device APIs.
---

# Termux API Skill

Control Android devices via Termux API commands. Detects if running inside Termux/proot-distro for direct access, or uses SSH for remote control.

## Prerequisites

### Para cualquier escenario
- Termux app instalada desde F-Droid o GitHub Releases
- Termux:API app instalada y permisos concedidos (Android Settings → Apps → Termux:API → Permissions)
- `termux-api` package: `pkg install termux-api`

### Native Termux (openCode corriendo directo en Termux)
- openCode compilado para aarch64 (ej: `guysoft/opencode-termux`)
- Los binarios `termux-*` ya están en `$PREFIX/bin` (en PATH por defecto)
- `termux-api-start` para iniciar el servicio si es necesario

### proot-distro (openCode desde Ubuntu/Debian/Arch via proot)
- Montar `/data/data/com.termux/files` dentro del proot (viene por defecto)
- Acceso a binarios via ruta completa: `/data/data/com.termux/files/usr/bin/termux-*`
- O agregar al PATH: `export PATH=$PATH:/data/data/com.termux/files/usr/bin`

### Remoto (SSH desde otro dispositivo)
- SSH configurado en Termux: `pkg install openssh && sshd`
- Puerto por defecto: 8022
- Autenticación: `passwd` o llaves SSH en `~/.ssh/authorized_keys`

## Environment Detection

Before running commands, check if direct access is available:

```bash
# Detect environment: native Termux, proot-distro, or remote
# Native Termux:   binaries in PATH (termux-battery-status etc.)
# proot-distro:    binaries at /data/data/com.termux/files/usr/bin/
# Remote:          must use SSH

if command -v termux-battery-status &>/dev/null; then
  echo "Native Termux — binaries directly available in PATH"
  TERMUX_PREFIX=""
elif [ -d /data/data/com.termux/files/usr/bin ] && ls /data/data/com.termux/files/usr/bin/termux-* &>/dev/null 2>&1; then
  echo "proot-distro — binaries at /data/data/com.termux/files/usr/bin"
  TERMUX_PREFIX="/data/data/com.termux/files/usr/bin"
else
  echo "No direct access — use SSH"
  TERMUX_PREFIX="ssh"
fi
```

```bash
# Helper function: auto-detect and run any termux command
termux-exec() {
  if command -v "${1%% *}" &>/dev/null 2>&1; then
    "$@"
  elif [ -x /data/data/com.termux/files/usr/bin/"$1" ]; then
    /data/data/com.termux/files/usr/bin/"$@"
  else
    ssh -p 8022 <device-ip> "$*"
  fi
}
```

## Direct Access (native Termux or proot-distro)

### Native Termux (opencode compilado corriendo directamente en Termux)
Los binarios termux-* ya están en el PATH automáticamente:

```bash
# Funciona directo — $PREFIX/bin ya está en PATH
termux-battery-status
termux-notification -t "Hola" -c "Mundo"
termux-location
```

### proot-distro (openCode desde una distro como Ubuntu)
Los binarios están en el directorio de Termux, no en PATH:

```bash
# Usar ruta completa
/data/data/com.termux/files/usr/bin/termux-battery-status

# O agregar al PATH
export PATH=$PATH:/data/data/com.termux/files/usr/bin
termux-battery-status
```

### Start API service
```bash
# Termux nativo
termux-api-start

# proot-distro
/data/data/com.termux/files/usr/bin/termux-api-start
```

## Remote Access via SSH

If on a different machine:

```bash
ssh -p 8022 <device-ip> '<termux-api-command>'
```

## Important Notes

1. **Termux must be in foreground** for camera/microphone commands
2. **Permissions must be granted** in Android Settings → Termux:API → Permissions
3. **Start API service** if commands timeout: `termux-api-start`

## API Commands Reference

### Device Info
| Command | Description |
|---------|-------------|
| `termux-battery-status` | Battery level, charging status, temperature |
| `termux-audio-info` | Audio device info |
| `termux-wifi-connectioninfo` | Current WiFi connection details |
| `termux-wifi-scaninfo` | Scan nearby WiFi networks |
| `termux-telephony-deviceinfo` | Phone/SIM info |
| `termux-telephony-cellinfo` | Cell tower info |
| `termux-sensor -l` | List available sensors |
| `termux-sensor -s <sensor> -n 1` | Read sensor once |

### Camera & Media
| Command | Description |
|---------|-------------|
| `termux-camera-info` | List cameras (id 0=back, 1=front) |
| `termux-camera-photo -c <id> <file.jpg>` | Take photo (needs foreground) |
| `termux-microphone-record -f <file>` | Record audio |
| `termux-media-player play <file>` | Play audio file |
| `termux-tts-speak "text"` | Text to speech |
| `termux-tts-engines` | List TTS engines |

### Notifications & Feedback
| Command | Description |
|---------|-------------|
| `termux-notification -t "title" -c "content"` | Show notification |
| `termux-notification-remove --id <id>` | Remove notification |
| `termux-toast "message"` | Show toast popup |
| `termux-vibrate -d <ms>` | Vibrate for duration |
| `termux-torch on/off` | Toggle flashlight |
| `termux-dialog` | Show dialog (various types) |

### Communication (needs permissions)
| Command | Description |
|---------|-------------|
| `termux-sms-list -l 10` | List recent SMS |
| `termux-sms-send -n <number> "message"` | Send SMS |
| `termux-contact-list` | List contacts |
| `termux-call-log -l 10` | Recent call history |
| `termux-telephony-call <number>` | Make phone call |

### Clipboard
| Command | Description |
|---------|-------------|
| `termux-clipboard-get` | Get clipboard content |
| `termux-clipboard-set "text"` | Set clipboard |

### Location
| Command | Description |
|---------|-------------|
| `termux-location` | Get GPS location (needs permission) |
| `termux-location -p gps` | Use GPS provider |
| `termux-location -p network` | Use network provider |

### System Control
| Command | Description |
|---------|-------------|
| `termux-volume` | Get/set volume levels |
| `termux-brightness <0-255>` | Set screen brightness |
| `termux-wallpaper -f <file>` | Set wallpaper |
| `termux-wake-lock` | Prevent sleep |
| `termux-wake-unlock` | Allow sleep |

### Storage & Sharing
| Command | Description |
|---------|-------------|
| `termux-share -a send <file>` | Share file via Android intent |
| `termux-open <file>` | Open file with default app |
| `termux-open-url <url>` | Open URL in browser |
| `termux-download <url>` | Download file |
| `termux-storage-get <dest>` | Pick file from storage |

## Common Patterns

### Using the helper (auto-detect)
```bash
# Reusable helper — works in Termux nativo, proot-distro, y remoto
termux-exec() {
  if command -v "${1%% *}" &>/dev/null 2>&1; then
    "$@"                              # nativo
  elif [ -x /data/data/com.termux/files/usr/bin/"$1" ]; then
    /data/data/com.termux/files/usr/bin/"$@"  # proot
  else
    ssh -p 8022 <ip> "$*"             # remoto
  fi
}

# Usage examples
termux-exec termux-battery-status
termux-exec termux-notification -t "Alert" -c "Task complete"
termux-exec termux-camera-photo -c 1 ~/selfie.jpg
termux-exec termux-location -p network
termux-exec termux-battery-status | jq '.percentage, .status'
```

### Take a selfie
```bash
# Native Termux
termux-camera-photo -c 1 ~/selfie.jpg

# proot-distro
/data/data/com.termux/files/usr/bin/termux-camera-photo -c 1 ~/selfie.jpg

# Remote via SSH
ssh -p 8022 <ip> 'termux-camera-photo -c 1 ~/selfie.jpg'
scp -P 8022 <ip>:~/selfie.jpg /local/path/
```

### Send notification with action
```bash
termux-exec termux-notification -t "Alert" -c "Task complete" --id myalert --vibrate 200,100,200
```

### Get device location
```bash
termux-exec termux-location -p network
```

### Monitor battery
```bash
termux-exec termux-battery-status | jq '.percentage, .status'
```

## Troubleshooting

### Command times out
1. Start API service: `termux-api-start`
2. Check if Termux:API app is installed
3. For camera/mic: ensure Termux app is in foreground

### Permission denied
1. Open Android Settings → Apps → Termux:API → Permissions
2. Grant required permissions (camera, location, SMS, etc.)

### Direct path not found
```bash
# Verify binaries exist
ls -la /data/data/com.termux/files/usr/bin/termux-* 2>/dev/null || echo "Not in Termux environment"
```

### SSH connection refused
1. In Termux: `pkg install openssh && sshd`
2. SSH runs on port 8022 by default
3. Set password with `passwd` or add SSH key to `~/.ssh/authorized_keys`
