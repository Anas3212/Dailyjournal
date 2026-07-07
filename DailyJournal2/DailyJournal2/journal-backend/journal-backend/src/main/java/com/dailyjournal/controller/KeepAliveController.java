package com.dailyjournal.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/keep-alive")
public class KeepAliveController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<String> keepAlive() {
        try {
            // Run a lightweight query to keep TiDB awake
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return ResponseEntity.ok("Backend and Database are alive!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Backend is alive, but Database connection failed.");
        }
    }
}
