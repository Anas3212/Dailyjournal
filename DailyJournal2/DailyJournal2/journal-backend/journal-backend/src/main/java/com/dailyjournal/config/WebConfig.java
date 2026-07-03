package com.dailyjournal.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:3000,https://dailyjournal-one.vercel.app}")
    private String corsAllowedOrigins;

    // Enable CORS for frontend access (React at localhost:3000)
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        java.util.List<String> origins = new java.util.ArrayList<>(java.util.Arrays.asList(corsAllowedOrigins.split(",")));
        if (!origins.contains("https://dailyjournal-one.vercel.app")) {
            origins.add("https://dailyjournal-one.vercel.app");
        }
        if (!origins.contains("https://dailyjournal-5dnq.onrender.com")) {
            origins.add("https://dailyjournal-5dnq.onrender.com");
        }
        
        registry.addMapping("/**")
                .allowedOrigins(origins.toArray(new String[0]))
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
