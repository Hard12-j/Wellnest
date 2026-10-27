package com.wellnest.gateway.filter;

import com.wellnest.gateway.security.JwtUtil;
import io.jsonwebtoken.JwtException;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

/**
 * Optional-auth gateway filter: if a valid JWT is present, enriches the request
 * with X-User-Id and X-User-Role headers. If the JWT is absent or invalid,
 * the request is passed through unchanged (downstream service allows anonymous access).
 *
 * Used for content-service routes where some endpoints are public (GET blogs, tip-of-the-day)
 * and others require identity.
 */
@Component
public class JwtAuthOptionalGatewayFilterFactory
        extends AbstractGatewayFilterFactory<AbstractGatewayFilterFactory.NameConfig> {

    private final JwtUtil jwtUtil;

    public JwtAuthOptionalGatewayFilterFactory(JwtUtil jwtUtil) {
        super(NameConfig.class);
        this.jwtUtil = jwtUtil;
    }

    @Override
    public GatewayFilter apply(NameConfig config) {
        return (exchange, chain) -> {
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            // Always strip any client-forged identity headers first
            ServerWebExchange.Builder mutateBuilder = exchange.mutate()
                    .request(r -> r.headers(headers -> {
                        headers.remove("X-User-Id");
                        headers.remove("X-User-Role");
                        headers.remove("X-UserRole");
                    }));

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    String userId = jwtUtil.extractUserId(token);
                    String role = jwtUtil.extractRole(token);
                    mutateBuilder = exchange.mutate()
                            .request(r -> r.headers(headers -> {
                                headers.set("X-User-Id", userId);
                                headers.set("X-User-Role", role);
                                headers.set("X-UserRole", role);
                            }));
                } catch (JwtException | IllegalArgumentException ignored) {
                    // Invalid token treated as anonymous
                }
            }

            return chain.filter(mutateBuilder.build());
        };
    }
}
