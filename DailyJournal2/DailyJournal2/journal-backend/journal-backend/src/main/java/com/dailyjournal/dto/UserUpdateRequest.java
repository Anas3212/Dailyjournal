package com.dailyjournal.dto;

import lombok.Data;

@Data
public class UserUpdateRequest {
    private String name;
    private String email;
    private String community;    // optional: area name, institution, workspace, etc.
    private String password;     // new password
    private String oldPassword;  // optional: validate before update
}
