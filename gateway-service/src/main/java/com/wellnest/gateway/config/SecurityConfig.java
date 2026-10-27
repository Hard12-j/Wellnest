package com.wellnest.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Spring Security config for the gateway.
 *
 * The gateway itself does NOT use Spring Security for JWT validation —
 * that is handled by our custom JwtAuthGatewayFilterFactory. Security here
 * is configured to permit all requests at the security layer so that our
 * custom filters have full control. The CORS bean in CorsConfig is used instead.
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            // Disable CSRF – stateless API gateway, no form logins
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            // Disable Spring Security's built-in CORS (we use CorsWebFilter bean)
            .cors(ServerHttpSecurity.CorsSpec::disable)
            // Permit all: our gateway filters enforce JWT per-route
            .authorizeExchange(exchanges -> exchanges.anyExchange().permitAll())
            // No session
            .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
            .formLogin(ServerHttpSecurity.FormLoginSpec::disable);

        return http.build();
    }
}
