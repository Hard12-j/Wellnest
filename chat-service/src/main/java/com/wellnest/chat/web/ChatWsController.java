package com.wellnest.chat.web;

import com.wellnest.chat.dto.MessageResponse;
import com.wellnest.chat.dto.SendMessageRequest;
import com.wellnest.chat.event.ChatEventPublisher;
import com.wellnest.chat.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

/**
 * STOMP: client sends to /app/chat.send, listens on /user/queue/messages (and /user/queue/errors).
 * The sender id is the Principal set from the JWT on CONNECT.
 */
@Controller
public class ChatWsController {
    private static final Logger log = LoggerFactory.getLogger(ChatWsController.class);

    private final ChatService chat;
    private final SimpMessagingTemplate template;
    private final SimpUserRegistry users;
    private final ChatEventPublisher events;

    public ChatWsController(ChatService chat, SimpMessagingTemplate template,
                            SimpUserRegistry users, ChatEventPublisher events) {
        this.chat = chat;
        this.template = template;
        this.users = users;
        this.events = events;
    }

    @MessageMapping("/chat.send")
    public void send(@Payload SendMessageRequest req, Principal principal) {
        Long senderId = Long.valueOf(principal.getName());
        ChatService.SendResult r = chat.send(senderId, req.conversationId(), req.content());   // committed here
        MessageResponse msg = r.message();

        // to the recipient, and back to the sender (confirmation with the real id, and other open tabs)
        template.convertAndSendToUser(String.valueOf(r.recipientId()), "/queue/messages", msg);
        template.convertAndSendToUser(String.valueOf(senderId), "/queue/messages", msg);

        boolean recipientOnline = users.getUser(String.valueOf(r.recipientId())) != null;
        if (!recipientOnline && r.notifyIfOffline()) {
            events.messageReceived(r.recipientId(), senderId, msg);
        }
    }

    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public Map<String, String> onError(Exception e) {
        if (!(e instanceof ApiException)) log.warn("Chat message failed", e);
        return Map.of("message", e instanceof ApiException ? e.getMessage() : "Could not send message");
    }
}
