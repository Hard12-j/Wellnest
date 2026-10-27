package com.wellnest.chat.repository;

import com.wellnest.chat.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByUserIdAndTrainerId(Long userId, Long trainerId);

    @Query("select c from Conversation c where c.userId = :uid or c.trainerId = :uid order by c.lastMessageAt desc")
    List<Conversation> findForParticipant(@Param("uid") Long uid);
}
