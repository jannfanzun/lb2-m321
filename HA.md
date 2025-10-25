# High Availability Implementation

## Überblick

Dieses Dokument beschreibt die High-Availability (HA) Massnahmen, die in diesem verteilten Tic-Tac-Toe System implementiert wurden.

## 1. MongoDB Replica Set

### Architektur
- **3 MongoDB Instanzen**: 1 Primary + 2 Secondaries
- **Automatische Failover**: Bei Ausfall des Primary wird automatisch ein Secondary zum Primary
- **Datenreplikation**: Alle Schreibvorgänge werden auf alle Replicas repliziert

### Konfiguration
```
- mongodb-primary:27017 (Port 27017)
- mongodb-secondary-1:27017 (Port 27018)
- mongodb-secondary-2:27017 (Port 27019)
```

### Vorteile
- Automatische Failover bei Datenbankausfall
- Read-Skalierung durch Reads von Secondaries
- Datensicherheit durch Replikation

## 2. Service Redundancy

### Implementierung
Jeder Service läuft in **2 Instanzen**:
- **User Service**: Instance 1 (Port 3001) + Instance 2 (Port 3011)
- **Game Service**: Instance 1 (Port 3002) + Instance 2 (Port 3012)

### Netzwerk-Topologie
```
              [Web Client]
                   |
              [API Gateway]
                   |
        ___________|___________
       |                       |
   [User Service LB]    [Game Service LB]
       |                       |
   ____|____              ____|____
  |         |            |        |
USR-1    USR-2         GS-1     GS-2
```

## 3. Load Balancing mit NGINX

### Konfiguration
NGINX läuft als Load Balancer für jeden Service mit folgenden Features:

#### Algorithmns
- **Least Connections** (`least_conn`): Requests werden an den Server mit den wenigsten aktiven Verbindungen verteilt

#### Health Checks
- Jeder Backend-Server wird überwacht
- Nach 3 Fehlversuchen wird der Server als "down" markiert
- Timeout: 30 Sekunden

#### Rate Limiting
- 10 requests pro Sekunde pro IP-Adresse
- Burst bis 20 Requests erlaubt
- Schützt vor DDoS-Angriffen

### Load Balancer Endpunkte
```
- User Service LB: localhost:3101 → http://user-service-lb:3001
- Game Service LB: localhost:3102 → http://game-service-lb:3002
```

## 4. Health Checks

### Implementierte Health Check Endpoints

#### API Gateway
```
GET /health
Response: { status: "UP", service: "api-gateway", timestamp: "..." }

GET /ready
Response: { ready: true }

GET /status/circuit-breakers
Response: { circuitBreakers: [...], timestamp: "..." }
```

#### User Service
```
GET /health
Response: {
  status: "UP",
  service: "user-service",
  database: "CONNECTED",
  uptime: 123.45,
  memory: {...},
  timestamp: "..."
}

GET /ready
Response: { ready: true }
```

#### Game Service
```
GET /health
Response: {
  status: "UP",
  service: "game-service",
  database: "CONNECTED",
  connectedClients: 5,
  uptime: 123.45,
  memory: {...},
  timestamp: "..."
}

GET /ready
Response: { ready: true }
```

### Health Check Policies

**Docker Health Checks** sind konfiguriert für:
- Interval: 10 Sekunden (Web Client: 15 Sekunden)
- Timeout: 5 Sekunden
- Retries: 3 Versuche
- Startet nach dem Container startet

Status ist verfügbar über: `docker-compose ps`

## 5. Circuit Breaker Pattern

### Implementierung im API Gateway

Der Circuit Breaker schützt vor kaskadierten Ausfällen:

#### States
- **CLOSED**: Normal operation, requests are forwarded
- **OPEN**: Service is failing, requests are rejected immediately
- **HALF_OPEN**: Attempting to recover after reset timeout

#### Konfiguration
```javascript
- Failure Threshold: 5 consecutive failures
- Reset Timeout: 60 seconds
- Monitored Services: User Service, Game Service
```

#### Beispiel Response
```json
{
  "error": "User service temporarily unavailable (circuit breaker open)",
  "service": "user-service",
  "state": "OPEN"
}
```

### Status Endpoint
```
GET /status/circuit-breakers

Response: {
  "circuitBreakers": [
    {
      "name": "user-service",
      "state": "CLOSED",
      "failures": 0,
      "lastFailure": null
    },
    ...
  ]
}
```

## 6. Graceful Shutdown

### Implementierung

Alle Services implementieren einen graceful shutdown mit:

1. **Signal Handling**: SIGTERM, SIGINT
2. **Request Draining**: Neue Requests werden nicht akzeptiert
3. **Connection Cleanup**: Bestehende Connections werden sauber geschlossen
4. **Database Disconnection**: MongoDB wird sauber getrennt
5. **Timeout**: Nach 30 Sekunden wird erzwungenes Exit durchgeführt

### Beispiel Process
```
1. Container empfängt SIGTERM Signal
2. Service setzt isShuttingDown Flag
3. Health checks returnen 503
4. Load Balancer entfernt Server aus Rotation
5. Bestehende Requests werden vollendet
6. Database wird getrennt
7. Process wird beendet
```

## 7. Error Handling & Retry Logic

### Implementierte Measures

#### Retry Pattern
```javascript
async function retryOperation(operation, maxRetries = 3, delayMs = 100) {
  // Exponential backoff: 100ms, 200ms, 400ms
}
```

#### Retryable Errors
- `ECONNREFUSED` - Connection refused
- `ECONNRESET` - Connection reset
- `ETIMEDOUT` - Timeout
- `MongoNetworkError` - Database network error
- `MongoWriteConcernError` - Write concern error

#### Error Logging
```javascript
{
  timestamp: "2025-10-25T...",
  service: "user-service",
  level: "ERROR",
  message: "...",
  error: {
    message: "...",
    code: "...",
    stack: "..."
  }
}
```

## 8. Request Logging

### Strukturierte Logs
Alle Requests werden mit folgendem Format geloggt:

```
[2025-10-25T10:30:00Z] POST /api/users/register 201 45ms
```

Detaillierte Logs im JSON Format (für Logging-Systeme):
```json
{
  "timestamp": "2025-10-25T10:30:00.000Z",
  "service": "api-gateway",
  "level": "INFO",
  "message": "HTTP Request",
  "method": "POST",
  "path": "/api/users/register",
  "statusCode": 201,
  "durationMs": 45
}
```

## Testing & Verification

### Verifikations-Script
```bash
# Überprüfe HA Implementation
./scripts/verify-ha.sh
```

### Integration Tests
```bash
# Starte Integration Tests
node tests/integration.test.js
```

### Docker Compose Health Status
```bash
# Überprüfe Container Status
docker-compose ps
```

## Monitoring & Observability

### Verfügbare Metriken

1. **Service Health**
   - Status (UP/DOWN/SHUTTING_DOWN)
   - Database connectivity
   - Memory usage
   - Uptime
   - Connected clients (Game Service)

2. **Circuit Breaker Status**
   - State (CLOSED/OPEN/HALF_OPEN)
   - Failure count
   - Last failure timestamp

3. **Request Metrics**
   - Response time
   - Status codes
   - Error rates

### Log Aggregation
Strukturierte JSON Logs können in folgende Systeme integriert werden:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Datadog
- CloudWatch
- Splunk

## Failover Scenarios

### Szenario 1: Database Primary Failure
```
1. Primary MongoDB fällt aus
2. Replica Set wählt automatisch neuen Primary
3. Services reconnecten automatisch
4. Keine Datenverluste (Replikation aktiv)
5. Recovery Time: < 30 Sekunden
```

### Szenario 2: Service Instance Failure
```
1. User Service Instance 1 stürzt ab
2. Load Balancer markiert als "down"
3. Neue Requests gehen zu Instance 2
4. Alte Requests timeout nach Health Check
5. Recovery Time: < 15 Sekunden (2x Health Check Interval)
```

### Szenario 3: Load Balancer Failure
```
1. NGINX Load Balancer stürzt ab
2. Docker Container Restart wird ausgelöst
3. Service ist nach Neustart verfügbar
4. Keine Request-Verluste (Direct Ports verfügbar)
5. Recovery Time: 5-10 Sekunden
```

## Performance Tuning

### Buffer Sizes (NGINX)
```
- proxy_buffer_size: 128k
- proxy_buffers: 4x256k
- proxy_busy_buffers_size: 256k
```

### Connection Settings
```
- proxy_connect_timeout: 30s
- proxy_send_timeout: 30s
- proxy_read_timeout: 30s
```

### Rate Limiting
```
- 10 requests/second per IP
- Burst: 20 requests allowed
```

## Best Practices

1. **Monitoring**: Regelmässig Health Checks durchführen
2. **Logging**: Strukturierte Logs für Troubleshooting
3. **Circuit Breaker**: Immer konfigurieren für externe Services
4. **Graceful Shutdown**: In allen Services implementieren
5. **Retry Logic**: Nur für idempotente Operationen verwenden
6. **Timeouts**: Angemessene Timeouts setzen
7. **Health Checks**: Regelmässig testen und anpassen

## Disaster Recovery

### RTO (Recovery Time Objective)
- **Service Failure**: < 30 Sekunden
- **Database Failure**: < 60 Sekunden
- **Complete System Failure**: < 5 Minuten (mit Docker Compose Restart)

### RPO (Recovery Point Objective)
- **Database**: Synchrone Replikation → 0 Datenverlust
- **Application State**: Im Memory → Datenverlust möglich (Akzeptabel für Spielzustände)

## Weitere Verbesserungen (Zukünftig)

- [ ] Distributed Tracing (Jaeger, Zipkin)
- [ ] Metrics Collection (Prometheus)
- [ ] Advanced Monitoring (Grafana)
- [ ] Automated Rollback
- [ ] Chaos Engineering Tests
- [ ] Load Testing under HA conditions
