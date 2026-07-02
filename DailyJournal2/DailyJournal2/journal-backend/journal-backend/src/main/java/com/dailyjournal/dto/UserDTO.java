package com.dailyjournal.dto;

import lombok.Data;
import java.util.List;

@Data
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private String profilePicture;
    private String community;
    private List<RoleDTO> roles;
}
