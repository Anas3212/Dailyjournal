package com.dailyjournal.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

import java.time.Instant;

@RestController
public class PingController {

    @GetMapping("/api/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "message", "pong",
            "timestamp", Instant.now()
        ));
    }
}
