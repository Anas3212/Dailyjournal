package com.dailyjournal.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins}")
    private String corsAllowedOrigins;

    // Enable CORS for frontend access (React at localhost:3000)
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(corsAllowedOrigins.split(","))
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
