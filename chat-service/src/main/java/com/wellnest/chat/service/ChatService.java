package com.wellnest.chat.service;

import com.wellnest.chat.dto.ConversationResponse;
import com.wellnest.chat.dto.MessageResponse;
import com.wellnest.chat.dto.PageResponse;
import com.wellnest.chat.model.ChatMessage;
import com.wellnest.chat.model.Conversation;
import com.wellnest.chat.repository.ChatMessageRepository;
import com.wellnest.chat.repository.ConversationRepository;
import com.wellnest.chat.web.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    public record SendResult(MessageResponse message, Long recipientId, boolean notifyIfOffline) {}

    private final ConversationRepository conversations;
    private final ChatMessageRepository messages;
    private final int maxLength;
    private final boolean notifyOnlyFirstUnread;

    public ChatService(ConversationRepository conversations, ChatMessageRepository messages,
                       @Value("${chat.max-message-length:2000}") int maxLength,
                       @Value("${chat.notify-only-first-unread:true}") boolean notifyOnlyFirstUnread) {
        this.conversations = conversations;
        this.messages = messages;
        this.maxLength = maxLength;
        this.notifyOnlyFirstUnread = notifyOnlyFirstUnread;
    }

    /** Called by the TrainerMatched consumer. Idempotent: the (user, trainer) pair is unique. */
    @Transactional
    public Conversation openConversation(Long userId, Long trainerId) {
        return conversations.findByUserIdAndTrainerId(userId, trainerId).orElseGet(() -> {
            Conversation c = new Conversation();
            c.setUserId(userId);
            c.setTrainerId(trainerId);
            return conversations.save(c);
        });
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> conversations(Long me) {
        List<Conversation> list = conversations.findForParticipant(me);
        Map<Long, Long> unread = new HashMap<>();
        if (!list.isEmpty()) {
            for (Object[] row : messages.unreadPerConversation(list.stream().map(Conversation::getId).toList(), me)) {
                unread.put((Long) row[0], (Long) row[1]);
            }
        }
        return list.stream()
                .map(c -> new ConversationResponse(c.getId(), c.otherParticipant(me),
                        c.getLastMessagePreview(), c.getLastMessageAt(), unread.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<MessageResponse> history(Long me, Long conversationId, int page, int size) {
        owned(me, conversationId);
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "sentAt").and(Sort.by(Sort.Direction.DESC, "id")));
        return PageResponse.of(messages.findByConversationId(conversationId, pageable).map(MessageResponse::of));
    }

    @Transactional
    public int markRead(Long me, Long conversationId) {
        owned(me, conversationId);
        return messages.markRead(conversationId, me, Instant.now());
    }

    @Transactional(readOnly = true)
    public long totalUnread(Long me) { return messages.totalUnread(me); }

    @Transactional
    public SendResult send(Long senderId, Long conversationId, String rawContent) {
        if (conversationId == null) throw new ApiException(HttpStatus.BAD_REQUEST, "conversationId is required");
        String content = rawContent == null ? "" : rawContent.trim();
        if (content.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "Message is empty");
        if (content.length() > maxLength)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Message is too long (max " + maxLength + ")");

        Conversation c = owned(senderId, conversationId);
        Long recipientId = c.otherParticipant(senderId);

        boolean firstUnread = messages.countByConversationIdAndSenderIdAndReadAtIsNull(conversationId, senderId) == 0;

        ChatMessage m = new ChatMessage();
        m.setConversationId(conversationId);
        m.setSenderId(senderId);
        m.setContent(content);
        m.setSentAt(Instant.now());
        m = messages.save(m);

        c.setLastMessageAt(m.getSentAt());
        c.setLastMessagePreview(content.length() > 100 ? content.substring(0, 100) : content);
        conversations.save(c);

        return new SendResult(MessageResponse.of(m), recipientId, !notifyOnlyFirstUnread || firstUnread);
    }

    /** 404 for both "does not exist" and "not yours", so ids can't be probed. */
    private Conversation owned(Long me, Long conversationId) {
        return conversations.findById(conversationId)
                .filter(c -> c.hasParticipant(me))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Conversation not found"));
    }
}
