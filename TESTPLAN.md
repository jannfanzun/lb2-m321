# Testplan - Tic-Tac-Toe Verteiltes System

## 📋 Dokumentinformation

| Feld | Wert |
|------|------|
| **Projekt** | Tic-Tac-Toe Verteiltes System (M321) |
| **Testdatum** | 2025-10-25 |
| **Tester** | Jann Fanzun, Noah Benz |
| **Version** | 1.0 |
| **Gültig ab** | 2025-10-25 |

---

## 1. Testumgebung

### 1.1 Hardware

```
Entwicklungsmaschine:
- OS: Windows 11 / macOS / Linux
- RAM: Mindestens 8GB
- Festplatte: Mindestens 10GB frei
- Prozessor: Intel i5 oder besser
```

### 1.2 Software

```
Erforderlich:
- Docker Desktop (Version 4.0+)
- Git (für Repository Verwaltung)
- Node.js 18+ (für lokale Entwicklung optional)
- cURL (für API Tests)
- Web Browser (Chrome, Firefox, Safari)

Optional:
- Postman (für detaillierte API Tests)
- MongoDB Compass (für Database Inspektion)
```

### 1.3 Netzwerk

```
Lokale Umgebung:
- Alle Services laufen auf localhost
- Ports verfügbar: 3000, 3001, 3002, 3011, 3012, 8080, 27017-27019
- Keine Internet-Verbindung erforderlich
- Firewall darf nicht HTTP Ports blockieren

Netzwerk-Test (optional):
- LAN mit mindestens 2 PCs
- Gleicher WLAN oder verbunden über Switch
```

### 1.4 Testumgebung Setup

```bash
# 1. Repository klonen
git clone <repository-url>
cd lb2-m321

# 2. Docker starten
docker-compose down -v  # Clean slate
docker-compose build --no-cache
docker-compose up -d

# 3. Warten auf Services
sleep 15

# 4. Überprüfung
docker-compose ps
curl http://localhost:3000/health
```

---

## 2. Testcases

### 2.1 Health Check Tests

#### TC-01: API Gateway Health Check
**Beschreibung**: Überprüfe ob API Gateway erreichbar und healthy ist

**Vorbedingung**:
- Docker Container laufen
- API Gateway Port 3000 ist erreichbar

**Testschritte**:
```bash
curl http://localhost:3000/health
```

**Erwartetes Ergebnis**:
```json
{
  "status": "UP",
  "service": "api-gateway",
  "timestamp": "2025-10-25T..."
}
HTTP Status: 200 OK
```

**Priorität**: 🔴 CRITICAL
**Kategorie**: System Health

---

#### TC-02: User Service Health Check
**Beschreibung**: Überprüfe ob User Service und Datenbank verbunden sind

**Vorbedingung**:
- Docker Container laufen
- User Service Port 3001 ist erreichbar

**Testschritte**:
```bash
curl http://localhost:3001/health
```

**Erwartetes Ergebnis**:
```json
{
  "status": "UP",
  "service": "user-service",
  "database": "CONNECTED",
  "uptime": 45.123,
  "memory": {...},
  "timestamp": "2025-10-25T..."
}
HTTP Status: 200 OK
```

**Priorität**: 🔴 CRITICAL
**Kategorie**: System Health

---

#### TC-03: Game Service Health Check
**Beschreibung**: Überprüfe ob Game Service und Datenbank verbunden sind

**Vorbedingung**:
- Docker Container laufen
- Game Service Port 3002 ist erreichbar

**Testschritte**:
```bash
curl http://localhost:3002/health
```

**Erwartetes Ergebnis**:
```json
{
  "status": "UP",
  "service": "game-service",
  "database": "CONNECTED",
  "connectedClients": 0,
  "uptime": 45.123,
  "memory": {...},
  "timestamp": "2025-10-25T..."
}
HTTP Status: 200 OK
```

**Priorität**: 🔴 CRITICAL
**Kategorie**: System Health

---

### 2.2 User Authentication Tests

#### TC-04: User Registration
**Beschreibung**: Neuen Benutzer registrieren

**Vorbedingung**:
- System läuft
- User Service ist erreichbar
- Email existiert nicht bereits

**Testschritte**:
1. Öffne Browser: http://localhost:8080
2. Klicke "Register"
3. Fülle Formular aus:
   - Username: `testuser_$(date +%s)`
   - Email: `test_$(date +%s)@example.com`
   - Password: `testpass123`
4. Klicke "Register"

**Erwartetes Ergebnis**:
- Status 201 Created
- Response enthält JWT Token
- Response enthält User ID
- Nachricht "Registration successful!"

**API Request**:
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Priorität**: 🔴 CRITICAL
**Kategorie**: Authentication

---

#### TC-05: User Login
**Beschreibung**: Existierenden Benutzer anmelden

**Vorbedingung**:
- User ist registriert (TC-04)
- System läuft

**Testschritte**:
1. Öffne Browser: http://localhost:8080
2. Gib Email und Password vom registrierten User ein
3. Klicke "Login"

**Erwartetes Ergebnis**:
- Status 200 OK
- Response enthält JWT Token
- Response enthält User ID und Username
- Lobby wird angezeigt
- "Welcome [Username]" Nachricht

**API Request**:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Priorität**: 🔴 CRITICAL
**Kategorie**: Authentication

---

#### TC-06: Get User Profile
**Beschreibung**: Benutzer-Profil abrufen

**Vorbedingung**:
- User ist eingeloggt (TC-05)
- JWT Token ist vorhanden

**Testschritte**:
```bash
TOKEN="<jwt_token_from_login>"
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Erwartetes Ergebnis**:
- Status 200 OK
- Response enthält User Daten (ID, Username, Email)
- Password ist NICHT im Response

**Priorität**: 🟡 HIGH
**Kategorie**: User Management

---

### 2.3 Game Service Tests

#### TC-07: Game Erstellen
**Beschreibung**: Neues Spiel erstellen

**Vorbedingung**:
- User ist eingeloggt (TC-05)
- JWT Token vorhanden

**Testschritte**:
1. Login durchführen
2. Klicke "Create Game"
3. Game ID wird angezeigt

**Erwartetes Ergebnis**:
- Status 201 Created
- Response enthält Game Objekt
- Game ID ist vorhanden
- Game Status ist "waiting"
- Player 1 ID ist gespeichert

**API Request**:
```bash
curl -X POST http://localhost:3000/api/games/create \
  -H "Content-Type: application/json" \
  -d '{"player1_id": "user_id"}'
```

**Priorität**: 🔴 CRITICAL
**Kategorie**: Game Management

---

#### TC-08: Game Abrufen
**Beschreibung**: Spielstand abrufen

**Vorbedingung**:
- Spiel existiert (TC-07)
- Game ID ist bekannt

**Testschritte**:
```bash
GAME_ID="<game_id_from_tc_07>"
curl http://localhost:3000/api/games/$GAME_ID
```

**Erwartetes Ergebnis**:
- Status 200 OK
- Response enthält komplettes Game Objekt
- Board Array ist vorhanden (9 Positionen)
- Current Player ist angegeben
- Status ist "waiting" oder "active"

**Priorität**: 🟡 HIGH
**Kategorie**: Game Management

---

#### TC-09: Game Beitreten
**Beschreibung**: Zweiter Spieler tritt Spiel bei

**Vorbedingung**:
- Spiel existiert (TC-07)
- Zweiter User ist eingeloggt
- Game ID ist bekannt

**Testschritte**:
1. Player 1 erstellt Spiel, kopiert Game ID
2. Player 2 gibt Game ID ein
3. Player 2 klickt "Join Game"

**Erwartetes Ergebnis**:
- Status 200 OK
- Game Status wird auf "active" gesetzt
- Player 2 ID wird gespeichert
- Board wird für beide Spieler angezeigt
- Spieler können Züge machen

**API Request**:
```bash
GAME_ID="<game_id>"
curl -X POST http://localhost:3000/api/games/$GAME_ID/join \
  -H "Content-Type: application/json" \
  -d '{"player2_id": "user_id"}'
```

**Priorität**: 🔴 CRITICAL
**Kategorie**: Game Management

---

### 2.4 Real-Time Game Tests

#### TC-10: Spielzug Machen & Synchronisation
**Beschreibung**: Spielzug machen und in Echtzeit synchronisieren

**Vorbedingung**:
- Spiel ist active (TC-09)
- Beide Spieler sind verbunden
- WebSocket Verbindung aktiv

**Testschritte**:
1. Player 1 klickt auf Feld (z.B. Position 0)
2. Beobachte ob Board bei Player 2 aktualisiert wird
3. Player 2 klickt auf leeres Feld
4. Beobachte ob Board bei Player 1 aktualisiert wird

**Erwartetes Ergebnis**:
- Player 1's Zug wird sofort angezeigt
- Player 2 sieht das Update in < 500ms
- Board ist bei beiden identisch
- Current Player wechselt
- Disabled Fields werden markiert

**Priorität**: 🔴 CRITICAL
**Kategorie**: Real-Time Communication

---

### 2.5 High Availability Tests

#### TC-11: Circuit Breaker Status
**Beschreibung**: Überprüfe Circuit Breaker Status

**Vorbedingung**:
- System läuft
- API Gateway ist erreichbar

**Testschritte**:
```bash
curl http://localhost:3000/status/circuit-breakers
```

**Erwartetes Ergebnis**:
```json
{
  "circuitBreakers": [
    {
      "name": "user-service",
      "state": "CLOSED",
      "failures": 0,
      "lastFailure": null
    },
    {
      "name": "game-service",
      "state": "CLOSED",
      "failures": 0,
      "lastFailure": null
    }
  ],
  "timestamp": "2025-10-25T..."
}
HTTP Status: 200 OK
```

**Priorität**: 🟡 HIGH
**Kategorie**: Reliability

---

#### TC-12: Service Instance Failover
**Beschreibung**: Überprüfe ob System bei Service Ausfall weiter funktioniert

**Vorbedingung**:
- System läuft
- Game Service Instance 1 läuft

**Testschritte**:
1. Überprüfe dass Health Check funktioniert:
   ```bash
   curl http://localhost:3002/health  # Status 200
   ```
2. Stoppe Game Service Instance 1:
   ```bash
   docker-compose pause game-service-1
   ```
3. Warte 10 Sekunden
4. Überprüfe dass Health Check noch funktioniert:
   ```bash
   curl http://localhost:3002/health  # Status sollte 200 sein
   ```
5. Starte Instance 1 wieder:
   ```bash
   docker-compose unpause game-service-1
   ```

**Erwartetes Ergebnis**:
- Service antwortet auch nach Ausfall von Instance 1
- Load Balancer leitet zu Instance 2
- Health Check schlägt nicht fehl
- Keine Unterbrechung für Spieler

**Priorität**: 🟡 HIGH
**Kategorie**: Failover Testing

---

#### TC-13: Database Failover
**Beschreibung**: Überprüfe MongoDB Replica Set Failover

**Vorbedingung**:
- System läuft
- MongoDB Primary läuft (Port 27017)

**Testschritte**:
1. Überprüfe dass Services healthy sind:
   ```bash
   curl http://localhost:3001/health  # Status 200
   curl http://localhost:3002/health  # Status 200
   ```
2. Stoppe MongoDB Primary:
   ```bash
   docker-compose stop mongodb-primary
   ```
3. Warte 10-15 Sekunden für Replica Set Failover
4. Überprüfe dass Services wieder functional sind:
   ```bash
   curl http://localhost:3001/health  # Status sollte 200 sein
   curl http://localhost:3002/health  # Status sollte 200 sein
   ```
5. Starte MongoDB Primary wieder:
   ```bash
   docker-compose start mongodb-primary
   ```

**Erwartetes Ergebnis**:
- Nach kurzer Unterbrechung (< 30s) sind Services wieder UP
- MongoDB wählt neue Primary automatisch
- Daten sind nicht verloren
- Services reconnecten automatisch

**Priorität**: 🟡 HIGH
**Kategorie**: Disaster Recovery

---

#### TC-14: Health Check während Shutdown
**Beschreibung**: Überprüfe dass Health Checks während Shutdown 503 returnen

**Vorbedingung**:
- System läuft

**Testschritte**:
1. Öffne Terminal 1 und beobachte Service:
   ```bash
   watch curl http://localhost:3001/health
   ```
2. In Terminal 2, stoppe Service mit SIGTERM:
   ```bash
   docker-compose stop user-service-1 --time 30
   ```
3. Beobachte Health Check Response während Shutdown

**Erwartetes Ergebnis**:
- Während Normal Operation: Status 200, status: "UP"
- Nach SIGTERM: Status 503, status: "SHUTTING_DOWN"
- Nach Shutdown: Keine Response

**Priorität**: 🟢 MEDIUM
**Kategorie**: Graceful Shutdown

---

### 2.6 Integration Tests

#### TC-15: Kompletter User Journey
**Beschreibung**: Durchführe kompletten User Journey von Registrierung bis Spielende

**Vorbedingung**:
- System läuft
- Zwei Browser/Fenster verfügbar

**Testschritte**:

**Player 1**:
1. Öffne http://localhost:8080
2. Klicke "Register"
3. Registriere mit: user1, user1@test.com, pass123
4. Login durchführen
5. Klicke "Create Game"
6. Kopiere Game ID

**Player 2** (anderer Browser):
1. Öffne http://localhost:8080
2. Klicke "Register"
3. Registriere mit: user2, user2@test.com, pass123
4. Login durchführen
5. Gib Game ID ein
6. Klicke "Join Game"

**Gameplay**:
1. Player 1 macht Zug (z.B. Mitte)
2. Beobachte Board Update bei Player 2
3. Player 2 macht Zug (z.B. Ecke)
4. Fortsetzen bis Gewinner oder Draw
5. Überprüfe Winner Modal

**Erwartetes Ergebnis**:
- Alle Schritte erfolgreich durchführbar
- Echtzeit Synchronisation funktioniert
- Gewinner wird korrekt erkannt
- Modal zeigt korrektes Ergebnis
- Beide Spieler können "Play Again" oder "Back to Lobby" klicken

**Priorität**: 🔴 CRITICAL
**Kategorie**: End-to-End

---

## 3. Testausführung

### 3.1 Automatisierte Tests

```bash
# Integration Tests ausführen
cd /path/to/project
node tests/integration.test.js

# HA Verification Script
bash scripts/verify-ha.sh
```

**Erwartet**: 8-10 Tests bestanden

---

### 3.2 Manuelle Tests

```bash
# System starten
docker-compose up -d

# Warten auf Services
sleep 15

# Health Checks überprüfen
docker-compose ps  # Alle sollten healthy sein

# Browser Tests
# Öffne http://localhost:8080 und führe TC-04, TC-05, TC-09, TC-15 durch
```

---

### 3.3 Test Reihenfolge

```
1. Health Check Tests (TC-01 bis TC-03)
   ↓
2. User Authentication Tests (TC-04, TC-05, TC-06)
   ↓
3. Game Service Tests (TC-07, TC-08, TC-09)
   ↓
4. Real-Time Game Tests (TC-10)
   ↓
5. HA Tests (TC-11 bis TC-14)
   ↓
6. Integration Test (TC-15)
   ↓
7. Automatisierte Tests
```

---

## 4. Testabnahme Kriterien

### ✅ Bestanden wenn:
- [ ] Alle Health Check Tests (TC-01, TC-02, TC-03) bestanden
- [ ] User kann sich registrieren (TC-04) ✓
- [ ] User kann sich anmelden (TC-05) ✓
- [ ] User Profile abrufbar (TC-06) ✓
- [ ] Spiel erstellbar (TC-07) ✓
- [ ] Spiel abrufbar (TC-08) ✓
- [ ] Zweiter Spieler kann beitreten (TC-09) ✓
- [ ] Züge funktionieren in Echtzeit (TC-10) ✓
- [ ] Circuit Breaker funktioniert (TC-11) ✓
- [ ] Service Failover funktioniert (TC-12) ✓
- [ ] Database Failover funktioniert (TC-13) ✓
- [ ] Graceful Shutdown funktioniert (TC-14) ✓
- [ ] Kompletter User Journey funktioniert (TC-15) ✓
- [ ] Automatisierte Tests: 8+ bestanden

### ❌ Nicht bestanden wenn:
- Service Crashes bei Tests
- Daten werden verloren
- Spieler können nicht kommunizieren
- Health Checks fehlgeschlagen
- HA-Failover funktioniert nicht

---

## 5. Fehlerbehandlung

### Wenn Tests fehlschlagen:

```bash
# 1. Logs überprüfen
docker-compose logs -f <service_name>

# 2. Container Status überprüfen
docker-compose ps

# 3. Ports überprüfen (Windows)
netstat -ano | findstr :3000

# 4. System neu starten
docker-compose down -v
docker-compose up -d
sleep 15

# 5. Manuell debuggen
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

---

## 6. Performance Ziele (Optional)

| Operation | Target | Limit |
|-----------|--------|-------|
| Health Check Response | < 100ms | 500ms |
| User Registration | < 500ms | 2000ms |
| User Login | < 500ms | 2000ms |
| Game Creation | < 200ms | 1000ms |
| Game Join | < 200ms | 1000ms |
| Game Move | < 100ms | 500ms |
| WebSocket Update | < 500ms | 1000ms |

---

## 7. Testumgebung Cleanup

```bash
# Nach Tests aufräumen
docker-compose down -v

# Alle Container entfernen
docker-compose down --remove-orphans -v

# Images entfernen (optional)
docker rmi lb2-m321-api-gateway
docker rmi lb2-m321-user-service
docker rmi lb2-m321-game-service
```

---

## 8. Signoff

| Person | Rolle | Datum | Unterschrift |
|--------|-------|-------|--------------|
| Jann Fanzun | Developer | 2025-10-25 | ____________ |
| Noah Benz | Developer | 2025-10-25 | ____________ |
| [Lehrperson] | Reviewer | _____ | ____________ |

---

**Testplan Version**: 1.0
**Gültig ab**: 2025-10-25
**Nächste Überprüfung**: Nach jedem Deploy
