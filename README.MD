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

### Option 1: Beide mit Docker (EINFACHSTE METHODE)

1. **Host-Computer:**
   - Starte das Projekt mit `docker-compose up -d`
   - Finde deine lokale IP-Adresse:
     ```bash
     # macOS/Linux
     ifconfig | grep "inet "

     # Windows
     ipconfig
     ```
   - Deine IP sieht z.B. so aus: `192.168.1.100`

2. **Kollege im gleichen WLAN:**
   - Öffne Browser und gehe zu: `http://192.168.1.100:8080`
   - (Ersetze `192.168.1.100` mit der IP des Host-Computers)

### Option 2: Localhost anpassen für Netzwerk-Zugriff

Falls ihr **nicht** Docker nutzt, musst du die URLs im Frontend anpassen:

1. Öffne `web-client/app.js`
2. Ändere die URLs:
   ```javascript
   // Von:
   const USER_SERVICE_URL = 'http://localhost:3000';
   const GAME_SERVICE_URL = 'http://localhost:3000';

   // Zu (ersetze mit deiner lokalen IP):
   const USER_SERVICE_URL = 'http://192.168.1.100:3000';
   const GAME_SERVICE_URL = 'http://192.168.1.100:3000';
   ```

### Firewall-Einstellungen

Stelle sicher, dass die Ports freigegeben sind:
- **macOS:** System Settings → Network → Firewall → Optionen → Ports 3000, 8080 erlauben
- **Windows:** Windows Defender Firewall → Eingehende Regeln → Neue Regel für Ports 3000, 8080

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
