# chat-service (port 8088)

Needs: Neon database `ChatService`, Kafka (default 192.168.1.10:9094).
Env vars: CHAT_DB_URL, CHAT_DB_USER, CHAT_DB_PASSWORD, JWT_SECRET (same value auth-service uses), optional KAFKA_BOOTSTRAP.

## Flow
1. trainer-service publishes `TrainerMatched` (topic trainer.events) -> chat-service creates the conversation (idempotent).
2. Client opens a WebSocket to `/ws` and sends the JWT in the STOMP CONNECT frame header `Authorization: Bearer <token>`.
3. Client sends to `/app/chat.send` with `{"conversationId": 1, "content": "hi"}`. The sender is taken from the token.
4. Both people receive the saved message on `/user/queue/messages`. Errors arrive on `/user/queue/errors`.
5. If the recipient has no open WebSocket, `MessageReceived` is published to `chat.events`
   (only for the first unread message of a burst; set `chat.notify-only-first-unread: false` for every message).

## REST (gateway adds X-User-Id)
| Method + path | Returns |
|---|---|
| GET /api/chat/conversations | `[{id, otherUserId, lastMessage, lastMessageAt, unreadCount}]`, newest first |
| GET /api/chat/conversations/{id}/messages?page=0&size=30 | page of messages, NEWEST first (page 0 = latest) |
| POST /api/chat/conversations/{id}/read | `{updated: n}` marks the other person's messages as read |
| GET /api/chat/unread-count | `{unread: n}` for the navbar badge |

## Events
Consumes `trainer.events`: TrainerMatched (`userId` = client, `data.trainerId` = trainer). Other types ignored.
Publishes `chat.events`: envelope `{eventId, eventType: "MessageReceived", userId: <recipient>, timestamp, data: {conversationId, messageId, senderId, preview}}`.

## Gateway changes needed
- `/ws/**` route to ws://chat-service:8088. This route must NOT require a JWT at the HTTP handshake
  (browsers cannot set headers on a WebSocket). chat-service checks the JWT on the STOMP CONNECT frame instead.
- `/api/chat/**` route to http://chat-service:8088, normal JWT check + X-User-Id header.

## Quick test (browser console or any STOMP client)
connectHeaders `{Authorization: 'Bearer <accessToken>'}`, subscribe `/user/queue/messages`,
publish `/app/chat.send` body `{"conversationId":1,"content":"hello"}`.
