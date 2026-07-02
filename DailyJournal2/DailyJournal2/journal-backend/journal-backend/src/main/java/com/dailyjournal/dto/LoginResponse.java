package com.dailyjournal.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private String message;
    private boolean isAdmin;

    public LoginResponse(String message, boolean isAdmin) {
        this.message = message;
        this.isAdmin = isAdmin;
    }
}

