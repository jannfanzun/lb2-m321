# Tic-Tac-Toe Multiplayer

## Installation

1. Docker Desktop starten
2. Terminal öffnen und ausführen:
```bash
docker-compose up -d
```

## Spielen

### Host (du):
1. Browser: `http://localhost:8080`
2. Registrieren + Login
3. "Create Game" → **Game ID kopieren**

### Freund:
1. Browser: `http://DEINE-IP:8080`
2. Registrieren + Login
3. Game ID eingeben → "Join Game"

## IP-Adresse finden

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```powershell
ipconfig | findstr IPv4
```

## Firewall

**Mac:**
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

**Windows:**
```powershell
New-NetFirewallRule -DisplayName "TicTacToe" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

## Befehle

```bash
docker-compose down    # Stoppen
docker-compose up -d   # Starten
docker-compose ps      # Status
```
