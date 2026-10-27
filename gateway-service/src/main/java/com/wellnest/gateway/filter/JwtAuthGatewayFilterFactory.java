package com.wellnest.gateway.filter;

import com.wellnest.gateway.security.JwtUtil;
import io.jsonwebtoken.JwtException;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Gateway filter: validates the JWT, then adds X-User-Id and X-User-Role headers
 * for downstream services. Rejects unauthenticated requests with 401.
 *
 * Used for routes that require authentication (profile, tracker, analytics, trainers, chat REST).
 */
@Component
public class JwtAuthGatewayFilterFactory
        extends AbstractGatewayFilterFactory<AbstractGatewayFilterFactory.NameConfig> {

    private final JwtUtil jwtUtil;

    public JwtAuthGatewayFilterFactory(JwtUtil jwtUtil) {
        super(NameConfig.class);
        this.jwtUtil = jwtUtil;
    }

    @Override
    public GatewayFilter apply(NameConfig config) {
        return (exchange, chain) -> {
            // Bypass preflight OPTIONS requests
            if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
                return chain.filter(exchange);
            }

            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return unauthorized(exchange, "Missing or malformed Authorization header");
            }

            String token = authHeader.substring(7);
            String userId;
            String role;

            try {
                userId = jwtUtil.extractUserId(token);
                role = jwtUtil.extractRole(token);
            } catch (JwtException | IllegalArgumentException e) {
                return unauthorized(exchange, "Invalid or expired JWT: " + e.getMessage());
            }

            // Mutate the request: strip any client-supplied identity headers, add verified ones
            ServerWebExchange mutated = exchange.mutate()
                    .request(r -> r.headers(headers -> {
                        headers.set("X-User-Id", userId);
                        headers.set("X-User-Role", role);
                        headers.set("X-UserRole", role);   // trainer-service uses X-UserRole
                    }))
                    .build();

            return chain.filter(mutated);
        };
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String reason) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().add("X-Auth-Error", reason);
        return exchange.getResponse().setComplete();
    }
}
