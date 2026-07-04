package com.dailyjournal.service;

import com.dailyjournal.dto.UserDTO;
import com.dailyjournal.dto.UserUpdateRequest;
import com.dailyjournal.entity.User;
import com.dailyjournal.mapper.UserMapper;
import com.dailyjournal.repository.UserRepository;
import com.dailyjournal.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final CloudinaryService cloudinaryService;

    public String updateUser(Long userId, UserUpdateRequest req) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Optional: verify old password
        if (req.getOldPassword() != null && req.getPassword() != null) {
            if (!passwordEncoder.matches(req.getOldPassword(), user.getPassword())) {
                throw new RuntimeException("Old password doesn't match");
            }
        }

        // Update name and email if provided
        if (req.getName() != null && !req.getName().isBlank()) {
            user.setName(req.getName());
        }

        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            user.setEmail(req.getEmail());
        }

        // Update community if provided (can be null or empty to clear)
        if (req.getCommunity() != null) {
            user.setCommunity(req.getCommunity().trim().isEmpty() ? null : req.getCommunity().trim());
        }

        // Update new password if provided
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }

        userRepo.save(user);
        return "User profile updated successfully.";
    }

    public String updateProfilePicture(Long userId, MultipartFile file) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty or missing.");
        }

        // ✅ File size limit: 2MB
        long maxFileSize = 2 * 1024 * 1024; // 2MB in bytes
        if (file.getSize() > maxFileSize) {
            throw new RuntimeException("File size exceeds 2MB limit.");
        }

        // ✅ Validate file type
        String contentType = file.getContentType();
        if (!isValidImageType(contentType)) {
            throw new RuntimeException("Invalid file type. Only PNG, JPEG, JPG, WEBP are allowed.");
        }

        try {
            // Delete old profile picture from Cloudinary if it exists and is a Cloudinary URL
            if (user.getProfilePicture() != null && user.getProfilePicture().startsWith("http")) {
                cloudinaryService.delete(user.getProfilePicture());
            }

            String secureUrl = cloudinaryService.upload(file);

            // Store URL for database
            user.setProfilePicture(secureUrl);
            userRepo.save(user);

            return "Profile picture uploaded successfully.";
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload profile picture: " + e.getMessage());
        }
    }

    private boolean isValidImageType(String contentType) {
        return contentType != null && (
                contentType.equalsIgnoreCase("image/jpeg") ||
                        contentType.equalsIgnoreCase("image/jpg") ||
                        contentType.equalsIgnoreCase("image/png") ||
                        contentType.equalsIgnoreCase("image/webp")
        );
    }

    public List<UserDTO> getCommunityMembers() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) auth.getPrincipal();
        
        if (currentUser.getCommunity() == null || currentUser.getCommunity().trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        // Get all users from the same community INCLUDING the current user
        List<User> communityUsers = userRepo.findByCommunityIgnoreCase(currentUser.getCommunity().trim());
        
        return communityUsers.stream()
                .map(userMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> searchCommunities(String query) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) auth.getPrincipal();
        
        List<Map<String, Object>> communities = new ArrayList<>();
        
        // Get all unique communities from users
        List<String> allCommunities = userRepo.findDistinctCommunities();
        
        // Filter communities based on query
        List<String> filteredCommunities;
        if (query == null || query.trim().isEmpty()) {
            filteredCommunities = allCommunities;
        } else {
            String searchQuery = query.toLowerCase().trim();
            filteredCommunities = allCommunities.stream()
                    .filter(community -> community.toLowerCase().contains(searchQuery))
                    .collect(Collectors.toList());
        }
        
        // Build community data with member counts
        for (String community : filteredCommunities) {
            Long memberCount = userRepo.countByCommunityIgnoreCase(community);
            
            Map<String, Object> communityData = new HashMap<>();
            communityData.put("name", community);
            communityData.put("memberCount", memberCount);
            communityData.put("description", generateCommunityDescription(community));
            
            // Mark if this is the user's own community
            boolean isOwnCommunity = currentUser.getCommunity() != null && 
                                   currentUser.getCommunity().equalsIgnoreCase(community);
            communityData.put("isOwnCommunity", isOwnCommunity);
            
            communities.add(communityData);
        }
        
        // Sort by: own community first, then by member count (descending)
        communities.sort((a, b) -> {
            boolean aIsOwn = (Boolean) a.get("isOwnCommunity");
            boolean bIsOwn = (Boolean) b.get("isOwnCommunity");
            
            if (aIsOwn && !bIsOwn) return -1;
            if (!aIsOwn && bIsOwn) return 1;
            
            return Long.compare((Long) b.get("memberCount"), (Long) a.get("memberCount"));
        });
        
        return communities;
    }

    public List<UserDTO> getCommunityMembersByName(String communityName) {
        if (communityName == null || communityName.trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        List<User> communityUsers = userRepo.findByCommunityIgnoreCase(communityName.trim());
        
        return communityUsers.stream()
                .map(userMapper::toDTO)
                .collect(Collectors.toList());
    }
    
    private String generateCommunityDescription(String community) {
        // Generate appropriate descriptions based on community name patterns
        String lowerCommunity = community.toLowerCase();
        
        if (lowerCommunity.contains("university") || lowerCommunity.contains("college") || 
            lowerCommunity.contains("institute") || lowerCommunity.contains("school")) {
            return "Students, faculty, and alumni from " + community;
        } else if (lowerCommunity.contains("inc") || lowerCommunity.contains("corp") || 
                   lowerCommunity.contains("ltd") || lowerCommunity.contains("llc") ||
                   lowerCommunity.contains("company") || lowerCommunity.contains("technologies")) {
            return "Current and former employees of " + community;
        } else if (lowerCommunity.contains("city") || lowerCommunity.contains("town") || 
                   lowerCommunity.contains("area") || lowerCommunity.contains("region")) {
            return "People living in " + community;
        } else {
            return "Members of the " + community + " community";
        }
    }

}
