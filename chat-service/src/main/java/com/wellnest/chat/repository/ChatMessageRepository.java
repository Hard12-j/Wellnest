package com.wellnest.chat.repository;

import com.wellnest.chat.model.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    Page<ChatMessage> findByConversationId(Long conversationId, Pageable pageable);

    /** Unread messages that "senderId" sent in this conversation (used to throttle offline alerts). */
    long countByConversationIdAndSenderIdAndReadAtIsNull(Long conversationId, Long senderId);

    @Modifying(clearAutomatically = true)
    @Query("update ChatMessage m set m.readAt = :now " +
           "where m.conversationId = :cid and m.senderId <> :me and m.readAt is null")
    int markRead(@Param("cid") Long conversationId, @Param("me") Long me, @Param("now") Instant now);

    /** Rows of [conversationId, unreadCount] for messages sent by the other person. */
    @Query("select m.conversationId, count(m) from ChatMessage m " +
           "where m.conversationId in :ids and m.senderId <> :me and m.readAt is null " +
           "group by m.conversationId")
    List<Object[]> unreadPerConversation(@Param("ids") Collection<Long> ids, @Param("me") Long me);

    @Query("select count(m) from ChatMessage m, Conversation c " +
           "where m.conversationId = c.id and (c.userId = :me or c.trainerId = :me) " +
           "and m.senderId <> :me and m.readAt is null")
    long totalUnread(@Param("me") Long me);
}
