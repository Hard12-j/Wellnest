package com.wellnest.chat.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

/**
 * CONNECT: validates the JWT from the "Authorization: Bearer ..." STOMP header and sets the user.
 * SUBSCRIBE/SEND: refuse anonymous sessions; clients may only subscribe to their own /user/queue/** queues.
 */
@Component
public class StompAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwt;

    public StompAuthInterceptor(JwtUtil jwt) { this.jwt = jwt; }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (acc == null || acc.getCommand() == null) return message;

        StompCommand cmd = acc.getCommand();
        if (StompCommand.CONNECT.equals(cmd)) {
            String header = acc.getFirstNativeHeader("Authorization");
            if (header == null || !header.startsWith("Bearer ")) {
                throw new MessageDeliveryException("Missing token");
            }
            Claims claims;
            try {
                claims = jwt.parse(header.substring(7));
            } catch (JwtException | IllegalArgumentException e) {
                throw new MessageDeliveryException("Invalid or expired token");
            }
            Number uid = claims.get("uid", Number.class);
            if (uid == null) throw new MessageDeliveryException("Token has no uid");
            acc.setUser(new StompUser(String.valueOf(uid.longValue()), claims.get("role", String.class)));
        } else if (StompCommand.SUBSCRIBE.equals(cmd) || StompCommand.SEND.equals(cmd)) {
            if (acc.getUser() == null) throw new MessageDeliveryException("Not authenticated");
            if (StompCommand.SUBSCRIBE.equals(cmd)) {
                String dest = acc.getDestination();
                if (dest == null || !dest.startsWith("/user/queue/")) {
                    throw new MessageDeliveryException("Subscription not allowed");
                }
            }
        }
        return message;
    }
}
