# Prompt for Antigravity: WellNest chat UI

Build a chat page for the WellNest React app. It is used by clients (role USER) and trainers (role TRAINER);
the UI is the same for both. Keep the existing WellNest look (same theme, colors, navbar, cards).

## Layout
- Left panel: conversation list. Each row: avatar with initial, the other person's name, last message preview (one line),
  time of last message, and a round unread-count badge when unreadCount > 0. Newest conversation first.
- Right panel: selected conversation. Header with the other person's name. Message bubbles (mine on the right,
  theirs on the left) with time under each bubble. Input box with Send button (Enter sends, Shift+Enter = new line).
- On mobile: show only the list, or only the open conversation with a back button.
- Empty states: "No conversations yet. Once a trainer accepts your request you can chat here." (user) /
  "Your clients will appear here once you accept their requests." (trainer).
- Navbar chat icon with a total unread badge.

## Data (all through the gateway, JWT access token in Authorization header)
- GET /api/chat/conversations -> [{id, otherUserId, lastMessage, lastMessageAt, unreadCount}]
- GET /api/chat/conversations/{id}/messages?page=0&size=30 -> {content:[{id, conversationId, senderId, content, sentAt, readAt}], page, totalPages, ...}
  Newest first. Reverse each page for display. Load the next page (page+1) when the user scrolls to the top and keep the scroll position.
- POST /api/chat/conversations/{id}/read -> call when a conversation is opened and when a new message arrives in the open one.
- GET /api/chat/unread-count -> {unread: n}
- Names: the chat API only returns otherUserId. Get the display name from the trainer/profile endpoints that already exist
  (trainer name for users, client info for trainers). Fall back to "Trainer #id" / "Client #id".

## Real time (WebSocket + STOMP, use @stomp/stompjs with the native WebSocket, no SockJS)
- brokerURL: ws://<gateway-host>/ws
- connectHeaders: { Authorization: 'Bearer ' + accessToken }
- Subscribe to /user/queue/messages: each frame is a message object (same shape as above).
  If it belongs to the open conversation, append it and mark it read; otherwise increase that row's unreadCount and move the row to the top.
  Messages I sent also come back on this queue: use them to replace the temporary "sending" bubble.
- Subscribe to /user/queue/errors: show a small toast with the message.
- Send: publish to /app/chat.send with body JSON {"conversationId": id, "content": text}. Never send a sender id.
- reconnectDelay 5000, heartbeat 10000. On reconnect, refetch the conversation list. When the access token is refreshed, use the new one for the next connect.
- Show a thin "Reconnecting..." banner while disconnected and disable Send.
- Max message length 2000 characters.
