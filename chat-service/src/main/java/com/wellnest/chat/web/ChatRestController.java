package com.wellnest.chat.web;

import com.wellnest.chat.dto.ConversationResponse;
import com.wellnest.chat.dto.MessageResponse;
import com.wellnest.chat.dto.PageResponse;
import com.wellnest.chat.service.ChatService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** The gateway validates the JWT and forwards X-User-Id; this service trusts it. */
@RestController
@RequestMapping("/api/chat")
public class ChatRestController {

    private final ChatService chat;

    public ChatRestController(ChatService chat) { this.chat = chat; }

    @GetMapping("/conversations")
    public List<ConversationResponse> conversations(@RequestHeader("X-User-Id") Long userId) {
        return chat.conversations(userId);
    }

    /** Newest first: page 0 is the latest messages. The UI reverses each page and loads page+1 when scrolling up. */
    @GetMapping("/conversations/{id}/messages")
    public PageResponse<MessageResponse> history(@RequestHeader("X-User-Id") Long userId,
                                                 @PathVariable Long id,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "30") int size) {
        return chat.history(userId, id, page, size);
    }

    @PostMapping("/conversations/{id}/read")
    public Map<String, Integer> markRead(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return Map.of("updated", chat.markRead(userId, id));
    }

    /** Total unread across all conversations (navbar badge). */
    @GetMapping("/unread-count")
    public Map<String, Long> unread(@RequestHeader("X-User-Id") Long userId) {
        return Map.of("unread", chat.totalUnread(userId));
    }
}
