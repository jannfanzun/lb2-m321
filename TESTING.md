# Testing Guide

## Überblick

Dieses Dokument beschreibt die Testing-Strategie und verfügbaren Test-Tools für das Tic-Tac-Toe System.

## Test Levels

### 1. Unit Tests
- Tests für einzelne Funktionen/Komponenten
- **Status**: Können manuell hinzugefügt werden mit Jest oder Mocha
- **Beispiel**: Password hashing, Game logic validation

### 2. Integration Tests
- Tests für Service-zu-Service Kommunikation
- **Location**: `tests/integration.test.js`
- **Umfang**: Health checks, User registration, Game creation

### 3. End-to-End Tests
- Vollständige User Workflows
- Kann manuell mit Browser getestet werden
- **Szenario**: Registrieren → Login → Spiel erstellen → Spielen

## Verfügbare Test-Tools

### Integration Test Suite

**Location**: `tests/integration.test.js`

**Test Cases**:
1. Health Checks
   - API Gateway health check
   - User Service health check
   - Game Service health check

2. User Authentication
   - User registration
   - User login
   - Get user profile

3. Game Service
   - Create game
   - Get game
   - Join game

4. Circuit Breaker
   - Status endpoint check

**Ausführung**:
```bash
# Stelle sicher, dass alle Services laufen
docker-compose up -d

# Warte 5-10 Sekunden bis Services bereit sind
sleep 10

# Führe Tests aus
node tests/integration.test.js
```

**Erwartet**:
```
✓ API Gateway health check
✓ User Service health check
✓ Game Service health check
✓ User registration
✓ User login
✓ Get user profile
✓ Create game
✓ Get game
✓ Circuit breaker status endpoint
```

### HA Verification Script

**Location**: `scripts/verify-ha.sh`

**Überprüfungen**:
1. Service Health Status
2. MongoDB Replica Set Status
3. Load Balancer Status
4. Docker Container Status
5. Circuit Breaker Status

**Ausführung**:
```bash
# Mit Bash
bash scripts/verify-ha.sh

# Mit Sh
sh scripts/verify-ha.sh
```

**Beispiel Output**:
```
==========================================
Verifying HA Implementation
==========================================

Service Health Check:
Checking API Gateway (port 3000)... ✓ UP
Checking User Service (port 3001)... ✓ UP
Checking Game Service (port 3002)... ✓ UP
Checking Web Client (port 8080)... ✓ UP

Load Balancers:
User Service Load Balancer... ✓ UP
Game Service Load Balancer... ✓ UP
```

## Manual Testing

### Test Scenario 1: User Registration & Login

**Steps**:
1. Öffne http://localhost:8080
2. Klicke "Register"
3. Gib Benutzerdaten ein
4. Submitte Form
5. Login mit denselben Credentials

**Expected Result**:
- ✓ Registration erfolgreich
- ✓ Login erfolgreich
- ✓ Lobby wird angezeigt

### Test Scenario 2: Game Creation & Joining

**Player 1 (Host)**:
1. Login
2. Klicke "Create Game"
3. Kopiere Game ID

**Player 2 (Client)**:
1. Login
2. Gib Game ID ein
3. Klicke "Join Game"

**Expected Result**:
- ✓ Game wird erstellt
- ✓ Game ID wird angezeigt
- ✓ Spieler 2 kann beitreten
- ✓ Board wird angezeigt

### Test Scenario 3: Game Play

**Steps**:
1. Beide Spieler im Game
2. Spieler X (Player 1) macht einen Zug
3. Board wird aktualisiert
4. Spieler O (Player 2) macht einen Zug
5. Spieler weisen sich ab, bis Gewinner erkannt wird

**Expected Result**:
- ✓ Züge werden in Echtzeit synchronisiert
- ✓ Current player wird angezeigt
- ✓ Gewinner wird erkannt
- ✓ Modal wird angezeigt mit Ergebnis

### Test Scenario 4: Failover Testing

#### Szenario A: Service Instance Ausfall

**Setup**:
```bash
# Ein Service Instance herunterfallen
docker-compose pause game-service-2
```

**Test**:
1. Spiel läuft normal
2. Mache einen Zug
3. Zug wird verarbeitet (Load Balancer leitet zu Instance 1)

**Expected Result**:
- ✓ Spiel läuft weiter ohne Unterbrechung
- ✓ Load Balancer erkennt Fehler
- ✓ Nach 30 Sekunden wird Failover ausgelöst

**Cleanup**:
```bash
docker-compose unpause game-service-2
```

#### Szenario B: Database Failover

**Setup**:
```bash
# MongoDB Primary herunterfahren
docker-compose stop mongodb-primary
```

**Test**:
1. Services versuchen zu reconnecten
2. Replica Set wählt neuen Primary
3. Neue Spiele können erstellt werden

**Expected Result**:
- ✓ Kurze Unterbrechung (< 30 Sekunden)
- ✓ Automatisches Failover
- ✓ System ist wieder operativ

**Cleanup**:
```bash
docker-compose start mongodb-primary
```

#### Szenario C: Health Check Validierung

```bash
# Überprüfe Healthchecks
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health

# Detaillierte Informationen
curl http://localhost:3000/status/circuit-breakers
```

## Testmetriken

### Erfolgs-Kriterien

#### Unit Tests
- [ ] Alle Funktionen haben Tests
- [ ] Testabdeckung > 70%

#### Integration Tests
- [ ] API Health Checks funktionieren
- [ ] User Registration/Login funktioniert
- [ ] Game Creation/Joining funktioniert
- [ ] Circuit Breaker funktioniert

#### Manual Testing
- [ ] User kann sich registrieren/login
- [ ] Zwei Spieler können ein Spiel spielen
- [ ] Echtzeit Synchronisation funktioniert
- [ ] Fehler werden sauber behandelt

#### Failover Testing
- [ ] Service Instance Ausfall → Failover < 30s
- [ ] Database Failover → Automatische Recovery
- [ ] Circuit Breaker öffnet bei wiederholten Fehlern
- [ ] Graceful Shutdown funktioniert

## Performance Testing

### Basisiline Metrics

**Request Response Times**:
- GET /health: < 100ms
- POST /register: < 500ms
- POST /login: < 500ms
- POST /create game: < 200ms
- POST /join game: < 200ms

**Database Operations**:
- User lookup: < 50ms
- Game creation: < 100ms
- Game update: < 100ms

### Load Testing Commands

```bash
# Mit Apache Bench (wenn installiert)
# 100 Requests mit 10 Parallel Connections
ab -n 100 -c 10 http://localhost:3000/health

# Mit curl Loop (simple Alternative)
for i in {1..100}; do
  curl -w "%{http_code}\t%{time_total}\n" http://localhost:3000/health
done
```

## Continuous Testing

### Pre-Deployment Checklist

- [ ] Health Checks alle grün
- [ ] Integration Tests passing
- [ ] Keine error logs in den Containers
- [ ] Memory Usage normal
- [ ] Circuit Breakers im CLOSED state

### Docker Compose Testing

```bash
# Full Stack Test
docker-compose down -v
docker-compose up -d

# Warte bis services ready
sleep 10

# Führe Verification aus
bash scripts/verify-ha.sh

# Führe Integration Tests aus
node tests/integration.test.js

# Überprüfe Logs
docker-compose logs
```

## Troubleshooting

### Test Failures

#### "Connection refused"
```bash
# Überprüfe ob alle Services laufen
docker-compose ps

# Starte fehlerhafte Service neu
docker-compose restart service-name
```

#### "Health check failed"
```bash
# Überprüfe Service Logs
docker-compose logs service-name

# Überprüfe Database Connectivity
docker exec -it tictactoe-mongodb-primary mongosh

# Überprüfe Replica Set Status
docker exec -it tictactoe-mongodb-primary mongosh --eval "rs.status()"
```

#### "Circuit breaker open"
```bash
# Überprüfe Circuit Breaker Status
curl http://localhost:3000/status/circuit-breakers

# Überprüfe Back-end Service Logs
docker-compose logs user-service-1
docker-compose logs game-service-1

# Warte auf Reset (default: 60 Sekunden)
```

## Test Reports

### Generieren von Test Reports

```bash
# Integration Test Report (einfache Version)
node tests/integration.test.js 2>&1 | tee test-report.log

# Docker Status Report
docker-compose ps > docker-status.txt
docker-compose logs > docker-logs.txt
```

## Best Practices

1. **Automatisiert**: Teste vor jedem Deploy
2. **Isoliert**: Jeder Test sollte unabhängig sein
3. **Wiederholbar**: Tests sollten deterministisch sein
4. **Schnell**: Tests sollten < 5 Minuten laufen
5. **Aussagekräftig**: Fehlermeldungen sollten klar sein

## Weitere Test-Tools (Optional)

### Jest für Unit Tests
```bash
npm install --save-dev jest
npx jest
```

### Mocha + Chai für Integration Tests
```bash
npm install --save-dev mocha chai
npx mocha tests/
```

### Artillery für Load Testing
```bash
npm install -g artillery
artillery quick --count 100 --num 1000 http://localhost:3000/health
```

### Postman Collection
Erstelle eine Postman Collection mit folgenden Requests:
- POST /api/users/register
- POST /api/users/login
- POST /api/games/create
- GET /api/games/:id
- POST /api/games/:id/join
- GET /health (all services)
- GET /status/circuit-breakers
