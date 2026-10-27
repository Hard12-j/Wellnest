package com.wellnest.content.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/** Serves uploaded blog images at /api/content/uploads/** (so the gateway route /api/content/** covers them). */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final Path uploadDir;

    public WebConfig(@Value("${content.upload-dir}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uri = uploadDir.toUri().toString();
        if (!uri.endsWith("/")) {
            uri += "/";
        }
        registry.addResourceHandler("/api/content/uploads/**")
                .addResourceLocations(uri);
    }
}
