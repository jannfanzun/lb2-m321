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
