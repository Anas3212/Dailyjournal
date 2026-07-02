package com.dailyjournal.mapper;

import com.dailyjournal.dto.UserDTO;
import com.dailyjournal.entity.User;
import com.dailyjournal.dto.RoleDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    @Value("${app.base-url:http://localhost:8080}") // fallback value
    private String baseUrl;

    public UserDTO toDTO(User user) {
        if (user == null) return null;

        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setCommunity(user.getCommunity());

        // ✅ Convert stored filename to full URL
        if (user.getProfilePicture() != null) {
            dto.setProfilePicture(baseUrl + user.getProfilePicture());
        }

        // Map roles to RoleDTO
        if (user.getRoles() != null) {
            dto.setRoles(user.getRoles().stream().map(role -> {
                RoleDTO r = new RoleDTO();
                r.setId(role.getId());
                r.setName(role.getName());
                return r;
            }).collect(Collectors.toList()));
        }

        return dto;
    }

    // Optional: Convert DTO back to entity
    public User toEntity(UserDTO dto) {
        if (dto == null) return null;

        User user = new User();
        user.setId(dto.getId());
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setCommunity(dto.getCommunity());

        // Since the DTO now has full URL, remove base URL before saving (optional)
        if (dto.getProfilePicture() != null && dto.getProfilePicture().startsWith(baseUrl)) {
            String relativePath = dto.getProfilePicture().substring(baseUrl.length());
            user.setProfilePicture(relativePath);
        } else {
            user.setProfilePicture(dto.getProfilePicture());
        }

        return user;
    }
}
