# gateway-service (port 8080)

Single entry point for all WellNest frontend traffic. Validates JWTs, enriches requests with `X-User-Id` / `X-User-Role` headers, and reverse-proxies to the correct downstream service.

## Port Map

| Service          | Internal Port |
|------------------|---------------|
| gateway-service  | **8080**      |
| auth-service     | 8081          |
| profile-service  | 8082          |
| tracker-service  | 8083          |
| analytics-service| 8084          |
| trainer-service  | 8085          |
| content-service  | 8086          |
| chat-service     | 8088          |

## Required Environment Variables

```
JWT_SECRET=<same secret used by auth-service>
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Optional per-service host overrides (default: `localhost`):
```
AUTH_SERVICE_HOST=localhost
PROFILE_SERVICE_HOST=localhost
TRACKER_SERVICE_HOST=localhost
ANALYTICS_SERVICE_HOST=localhost
TRAINER_SERVICE_HOST=localhost
CONTENT_SERVICE_HOST=localhost
CHAT_SERVICE_HOST=localhost
```

## Route Table

| Incoming Path       | Auth Required | Downstream                     |
|---------------------|---------------|--------------------------------|
| `/auth/**`          | No            | auth-service:8081              |
| `/api/profile/**`   | Yes           | profile-service:8082           |
| `/api/tracker/**`   | Yes           | tracker-service:8083           |
| `/api/analytics/**` | Yes           | analytics-service:8084         |
| `/api/trainers/**`  | Yes           | trainer-service:8085           |
| `/api/content/**`   | Optional      | content-service:8086           |
| `/api/chat/**`      | Yes           | chat-service:8088              |
| `/ws/**`            | No (HTTP)     | chat-service:8088 (WebSocket)  |

> **WebSocket note**: Browsers cannot send custom headers on WebSocket upgrades, so `/ws` is passed through without a JWT check at the HTTP level. The chat-service validates the JWT on the STOMP `CONNECT` frame instead.

## JWT Enrichment

For authenticated routes, the gateway:
1. Extracts the `Authorization: Bearer <token>` header
2. Verifies the token (HS256, same secret as auth-service)
3. Adds `X-User-Id` (numeric user ID from the `uid` claim) and `X-User-Role` / `X-UserRole` (from the `role` claim)
4. Strips any client-supplied `X-User-Id` / `X-User-Role` headers (security hardening)

## Run

```bash
# Set env vars, then:
mvn spring-boot:run
```

## Health / Routes

```
GET http://localhost:8080/actuator/health
GET http://localhost:8080/actuator/routes
```
