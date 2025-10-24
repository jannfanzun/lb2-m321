# Projektplanung: Remote Tic-Tac-Toe System
**Modul M321 - Verteilte Systeme programmieren**

## 📋 Projektübersicht

### Beschreibung des verteilten Systems
Wir entwickeln ein webbasiertes Tic-Tac-Toe-System, das es zwei Spielern ermöglicht, in Echtzeit gegeneinander zu spielen. Das System besteht aus mehreren unabhängigen Microservices, die über REST-APIs und WebSockets kommunizieren.

### Hauptfunktionen
- Benutzeranmeldung und -verwaltung
- Erstellen und Beitreten von Spielräumen
- Echtzeit-Spielführung mit sofortiger Synchronisation
- Spielhistorie und Statistiken
- Automatische Gewinn-/Unentschieden-Erkennung

### Anforderungen an das System
- **Skalierbarkeit**: Mehrere gleichzeitige Spiele möglich
- **Echtzeitfähigkeit**: Züge werden sofort an beide Spieler übertragen
- **Ausfallsicherheit**: Services können unabhängig ausfallen/neu starten
- **Sicherheit**: Authentifizierte Benutzer, validierte Spielzüge
- **Monitoring**: Logging aller wichtigen Ereignisse

## Systemarchitektur

### Systemkomponenten

| Komponente | Beschreibung | Technologien |
|------------|--------------|--------------|
| **User-Service** | Benutzeranmeldung, Authentifizierung, Profilverwaltung | Node.js/Express, JWT |
| **Game-Service** | Spiellogik, Spielzustand-Verwaltung, Gewinn-Erkennung | Node.js/Express, Socket.IO |
| **Database** | Persistente Datenspeicherung | MongoDB/PostgreSQL |
| **Web-Client** | Benutzeroberfläche, Spieldarstellung | HTML5, CSS3, JavaScript |
| **API-Gateway** | Routing, Load Balancing | NGINX/Express Gateway |

### Datenmodell
```
User: { id, username, email, password_hash, created_at }
Game: { id, player1_id, player2_id, board, current_player, status, winner, created_at }
Move: { id, game_id, player_id, position, timestamp }
```

## Aufgabenverteilung

### Person A: Jann Fanzun
**Verantwortlichkeiten:**
- **User-Service** (vollständig)
  - Benutzerregistrierung und Login
  - JWT-Token-Verwaltung
  - Passwort-Hashing und Validierung
  - User-Profile API
- **Datenbank-Setup und -verwaltung**
  - Schema-Design und Migration
  - Datenbankverbindungen
  - Backup-Strategien
- **API-Gateway-Konfiguration**
  - Routing-Regeln
  - CORS-Einstellungen

### Person B: Noah Benz  
**Verantwortlichkeiten:**
- **Game-Service** (vollständig)
  - Spiellogik-Implementierung
  - WebSocket-Verbindungen (Socket.IO)
  - Spielzustand-Synchronisation
  - Gewinn-/Unentschieden-Erkennung
- **Web-Client** (vollständig)
  - Frontend-Design und UI/UX
  - Socket.IO-Client-Integration
  - API-Aufrufe an User- und Game-Service
  - Responsive Design

## Schnittstellen zwischen Services

### User-Service API (REST)
```
POST /api/users/register    # Benutzerregistrierung
POST /api/users/login       # Benutzeranmeldung
GET  /api/users/profile     # Profil abrufen (JWT required)
PUT  /api/users/profile     # Profil aktualisieren (JWT required)
```

### Game-Service API (REST + WebSocket)
```
POST /api/games/create      # Neues Spiel erstellen (JWT required)
POST /api/games/:id/join    # Spiel beitreten (JWT required)
GET  /api/games/:id         # Spielstand abrufen
```

**WebSocket Events:**
```
game:join          # Spieler tritt Spiel bei
game:move          # Spielzug ausführen
game:update        # Spielzustand aktualisiert
game:end           # Spiel beendet
```

## Technologie-Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Echtzeitkommunikation**: Socket.IO
- **Datenbank**: MongoDB
- **Authentifizierung**: JWT (JSON Web Tokens)
- **Containerisierung**: Docker (optional)
- **Versionskontrolle**: Git

## Repository-Struktur

```
tic-tac-toe-distributed/
├── user-service/          # Jann's Verantwortung
├── game-service/          # Noah's Verantwortung  
├── web-client/           # Noah's Verantwortung
├── database/             # Jann's Verantwortung
├── api-gateway/          # Jann's Verantwortung
└── docker-compose.yml    # Gemeinsam
```

## Meilensteine

1. **Woche 1**: Setup, Grundgerüst aller Services
2. **Woche 2**: User-Service fertig, Game-Service Grundlogik
3. **Woche 3**: WebSocket-Integration, Frontend-Development
4. **Woche 4**: Integration Testing, Bugfixes
5. **Woche 5**: Deployment, Dokumentation, Präsentation

## Testing-Strategie

- **Unit Tests**: Jeder Service testet seine Geschäftslogik
- **Integration Tests**: API-Endpunkte und Service-Kommunikation
- **E2E Tests**: Komplette Spielabläufe über Frontend
- **Load Tests**: Mehrere gleichzeitige Spiele

## Monitoring & Logging

- Strukturierte Logs in allen Services
- Performance-Metriken (Antwortzeiten, aktive Spiele)
- Error-Tracking und Alerting
- Health-Check-Endpoints für alle Services

---

# 🚀 Installation & Setup

## Voraussetzungen

- **Docker Desktop** installiert und gestartet ([Download](https://www.docker.com/products/docker-desktop))
- **Git** installiert
- **Node.js 18+** (nur für lokale Entwicklung ohne Docker)
- **MongoDB** (nur für lokale Entwicklung ohne Docker)

## Schnellstart mit Docker (EMPFOHLEN)

### 1. Repository klonen
```bash
git clone <repository-url>
cd lb2-m321
```

### 2. Docker Desktop starten
- Stelle sicher, dass Docker Desktop läuft
- Öffne Docker Desktop und warte bis es vollständig gestartet ist

### 3. Projekt starten
```bash
docker-compose up -d
```

### 4. Anwendung öffnen
Öffne deinen Browser und gehe zu: **http://localhost:8080**

### 5. Projekt stoppen
```bash
docker-compose down
```

### 6. Projekt neu starten (nach Code-Änderungen)
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Services & Ports

Nach dem Start laufen folgende Services:

| Service | URL | Beschreibung |
|---------|-----|--------------|
| **Web Client** | http://localhost:8080 | Frontend (Spieloberfläche) |
| **API Gateway** | http://localhost:3000 | API Routing |
| **User Service** | http://localhost:3001 | Benutzerverwaltung |
| **Game Service** | http://localhost:3002 | Spiellogik |
| **MongoDB** | localhost:27017 | Datenbank |

## Lokale Entwicklung ohne Docker

Falls du ohne Docker entwickeln möchtest:

### 1. MongoDB starten
```bash
# macOS mit Homebrew
brew services start mongodb-community

# Windows - MongoDB Service starten
net start MongoDB

# Linux
sudo systemctl start mongod
```

### 2. Dependencies installieren
```bash
# In jedem Service-Ordner ausführen
cd api-gateway && npm install
cd ../user-service && npm install
cd ../game-service && npm install
```

### 3. Environment-Variablen erstellen
Die `.env.example` Dateien sind bereits vorhanden. Sie wurden automatisch zu `.env` kopiert.

### 4. Services starten (4 verschiedene Terminals)

**Terminal 1 - API Gateway:**
```bash
cd api-gateway
npm start
```

**Terminal 2 - User Service:**
```bash
cd user-service
npm start
```

**Terminal 3 - Game Service:**
```bash
cd game-service
npm start
```

**Terminal 4 - Web Client:**
```bash
cd web-client
python3 -m http.server 8080
```

## Im gleichen Netzwerk spielen

### ⚠️ WICHTIG: Voraussetzungen

**Beide Spieler müssen im SELBEN WLAN/Netzwerk sein!**
- Verbindet euch beide mit demselben WLAN (z.B. "HomeNetwork")
- Hotspot funktioniert auch: Einer erstellt einen Hotspot, der andere verbindet sich
- **NICHT über Internet** - nur lokales Netzwerk!

### Schritt-für-Schritt Anleitung (MIT DOCKER)

#### Schritt 1: Firewall-Einstellungen (SEHR WICHTIG!)

**macOS (Host-Computer):**
1. System Settings → Network → Firewall
2. Falls Firewall AN ist:
   - Klicke "Options"
   - Stelle sicher, "Block all incoming connections" ist NICHT aktiviert
3. **ODER** Firewall komplett ausschalten (nur zum Testen):
   - Firewall → OFF

**Windows (Host-Computer):**
1. Windows Defender Firewall → Erweiterte Einstellungen
2. Eingehende Regeln → Neue Regel → Port
3. TCP, Port 8080 hinzufügen
4. "Verbindung zulassen" wählen
5. Profil: Privat UND Öffentlich aktivieren
6. Wiederholen für Port 3000

**Alternativ (einfacher aber unsicherer):**
- Windows Defender Firewall → Firewall komplett ausschalten (nur zum Testen!)

#### Schritt 2: Docker starten (Host-Computer)

```bash
# Im Projektordner
docker-compose up -d

# Warte bis alles läuft
docker-compose ps
```

#### Schritt 3: IP-Adresse finden (Host-Computer)

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows (PowerShell)
ipconfig | findstr IPv4

# Windows (CMD)
ipconfig
```

Beispiel-Output:
```
inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
```
→ Deine IP ist: **192.168.1.100**

#### Schritt 4: Verbindung testen (Kollege)

**Auf dem Computer deines Kollegen:**

1. Öffne Browser
2. Gehe zu: `http://192.168.1.100:8080` (ersetze mit deiner IP!)
3. Wenn es **NICHT** funktioniert:
   - Prüfe ob beide im selben WLAN sind
   - Prüfe Firewall-Einstellungen nochmal
   - Teste ob Port erreichbar ist: `telnet 192.168.1.100 8080`

#### Schritt 5: Spielen!

1. **Host (du):**
   - Gehe zu `http://localhost:8080`
   - Registriere dich (z.B. User "Noah")
   - Login
   - Klicke "Create Game"
   - **WICHTIG:** Kopiere die Game ID (z.B. `507f1f77bcf86cd799439011`)

2. **Kollege:**
   - Gehe zu `http://192.168.1.100:8080` (deine IP!)
   - Registriere dich (z.B. User "Jann")
   - Login
   - Gib die Game ID ein die du bekommen hast
   - Klicke "Join Game"

3. **Viel Spass!** 🎮

### Alternative: Hotspot verwenden

Falls ihr kein gemeinsames WLAN habt:

1. **Host-Computer:**
   - Erstelle einen Hotspot (z.B. "TicTacToe-Game")
   - Windows: Einstellungen → Netzwerk → Mobiler Hotspot
   - macOS: System Preferences → Sharing → Internet Sharing

2. **Kollege:**
   - Verbinde dich mit dem Hotspot
   - Folge Schritt 3-5 von oben

### Häufige Probleme beim Netzwerk-Spielen

#### Problem: "Connection refused" oder Seite lädt nicht
**Lösung:**
```bash
# 1. Prüfe ob Docker läuft auf Host
docker-compose ps

# 2. Prüfe ob Ports offen sind (auf Host-Computer)
# macOS/Linux:
lsof -i :8080
lsof -i :3000

# Windows:
netstat -an | findstr 8080
netstat -an | findstr 3000

# 3. Firewall temporär ausschalten zum Testen
# Wenn es dann funktioniert → Firewall-Regel fehlt!
```

#### Problem: Kann Game nicht beitreten
**Lösung:**
- Prüfe ob Game ID richtig kopiert wurde (keine Leerzeichen!)
- Beide Spieler müssen eingeloggt sein
- Spiel darf noch keinen 2. Spieler haben

## Spielablauf

1. **Registrierung**: Beide Spieler müssen sich registrieren
2. **Spiel erstellen**: Spieler 1 klickt auf "Create Game" → erhält Game ID
3. **Spiel beitreten**: Spieler 2 gibt die Game ID ein und klickt "Join Game"
4. **Spielen**: Spieler X beginnt, dann abwechselnd
5. **Gewinner**: Das Spiel endet automatisch bei Gewinn oder Unentschieden

## Troubleshooting

### Problem: "Cannot connect to Docker daemon"
**Lösung:** Starte Docker Desktop

### Problem: "Address already in use"
**Lösung:**
```bash
# Ports freigeben
docker-compose down
lsof -ti:3000,3001,3002,8080 | xargs kill -9
```

### Problem: Registrierung hängt/keine Response
**Lösung:**
```bash
# Container neu bauen
docker-compose down
docker-compose build --no-cache api-gateway
docker-compose up -d
```

### Problem: MongoDB Connection Error
**Lösung:**
```bash
# Warte bis MongoDB healthy ist
docker-compose ps
# Wenn MongoDB nicht healthy ist:
docker-compose restart mongodb
```

### Logs anschauen
```bash
# Alle Services
docker-compose logs -f

# Nur ein Service
docker-compose logs -f api-gateway
docker-compose logs -f user-service
docker-compose logs -f game-service
```

## Nützliche Befehle

```bash
# Status aller Container anzeigen
docker-compose ps

# Container neu starten
docker-compose restart

# Alle Container und Volumes löschen (VORSICHT: Löscht alle Daten!)
docker-compose down -v

# In einen Container einloggen
docker exec -it tictactoe-api-gateway sh

# MongoDB Shell öffnen
docker exec -it tictactoe-mongodb mongosh tictactoe
```
