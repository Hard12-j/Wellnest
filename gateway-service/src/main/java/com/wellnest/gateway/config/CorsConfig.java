package com.wellnest.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Global CORS configuration for all routes.
 * Allows the React dev server (and production origin) to call the gateway.
 */
@Configuration
public class CorsConfig {

    @Value("${gateway.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOriginsRaw;

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();

        // Allowed origins from config
        List<String> origins = Arrays.asList(allowedOriginsRaw.split(","));
        corsConfig.setAllowedOrigins(origins);

        // Allow all standard HTTP methods
        corsConfig.setAllowedMethods(List.of(
                HttpMethod.GET.name(),
                HttpMethod.POST.name(),
                HttpMethod.PUT.name(),
                HttpMethod.DELETE.name(),
                HttpMethod.PATCH.name(),
                HttpMethod.OPTIONS.name()
        ));

        // Allow all headers commonly used by the frontend (including X-User-Id, X-User-Role, etc.)
        corsConfig.setAllowedHeaders(List.of("*"));

        // Expose headers the frontend might need to read
        corsConfig.setExposedHeaders(List.of(
                HttpHeaders.AUTHORIZATION,
                "X-Auth-Error"
        ));

        // Required for cookies (refresh token cookie from auth-service)
        corsConfig.setAllowCredentials(true);

        // Cache preflight result for 1 hour
        corsConfig.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}
