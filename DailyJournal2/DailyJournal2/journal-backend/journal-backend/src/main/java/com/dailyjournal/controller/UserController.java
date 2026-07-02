package com.dailyjournal.controller;

import com.dailyjournal.dto.UserDTO;
import com.dailyjournal.dto.UserUpdateRequest;
import com.dailyjournal.entity.User;
import com.dailyjournal.mapper.UserMapper;
import com.dailyjournal.repository.UserRepository;
import com.dailyjournal.repository.TeamRepository;
import com.dailyjournal.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.File;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepo;
    private final UserMapper userMapper;
    private final TeamRepository teamRepo;

    // ✅ 1. Get current logged-in user's profile
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userMapper.toDTO(user));
    }

    // ✅ 2. Update user profile (name, email, password)
    @PutMapping("/update")
    public ResponseEntity<String> updateUser(@AuthenticationPrincipal User user,
                                             @RequestBody UserUpdateRequest request) {
        String result = userService.updateUser(user.getId(), request);
        return ResponseEntity.ok(result);
    }

    // ✅ 3. Upload profile picture
    @PostMapping("/upload-photo")
    public ResponseEntity<String> uploadPhoto(@AuthenticationPrincipal User user,
                                              @RequestParam("file") MultipartFile file) {
        if (user == null) {
            throw new RuntimeException("User not authenticated");
        }

        String result = userService.updateProfilePicture(user.getId(), file);
        return ResponseEntity.ok(result);
    }

    // ✅ 4. Admin: Get all users (returns list of UserDTO)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<User> users = userRepo.findAll();
        List<UserDTO> userDTOs = users.stream()
                .map(userMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDTOs);
    }

    // ✅ 5. Admin: Block user login (soft delete)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> blockUser(@PathVariable Long id) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(false);
        userRepo.save(user);
        return ResponseEntity.ok("User has been blocked from logging in.");
    }

    // ✅ 6. Serve profile photo
    @GetMapping("/profile-photo/{filename:.+}")
    public ResponseEntity<Resource> getProfilePhoto(@PathVariable String filename) {
        try {
            // Use the same absolute directory as UserService.updateProfilePicture
            String uploadDir = System.getProperty("user.home") + File.separator + "daily-journal-uploads" + File.separator + "profile-photos" + File.separator;
            Path path = Paths.get(uploadDir).resolve(filename);
            Resource resource = new UrlResource(path.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    // ✅ 7. Admin: Toggle user status (block/unblock)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/toggle-status/{id}")
    public ResponseEntity<String> toggleUserStatus(@PathVariable Long id) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(!user.isEnabled()); // Toggle the enabled status
        userRepo.save(user);
        String status = user.isEnabled() ? "unblocked" : "blocked";
        return ResponseEntity.ok("User has been " + status + ".");
    }
    
    // ✅ 8. Search users by name or email
    @GetMapping("/search")
    public ResponseEntity<List<UserDTO>> searchUsers(@RequestParam String query) {
        List<User> users = userRepo.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query);
        List<UserDTO> userDTOs = users.stream()
                .map(userMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDTOs);
    }
    
    // Get user profile by ID (for team members to view profiles)
    @GetMapping("/{userId}/profile")
    public ResponseEntity<UserDTO> getUserProfile(@PathVariable Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(userMapper.toDTO(user));
    }
    
    // Get user's teams count and team journals stats
    @GetMapping("/{userId}/teams-stats")
    public ResponseEntity<Map<String, Object>> getUserTeamsStats(@PathVariable Long userId) {
        // Verify user exists
        userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get user's teams count
        Long teamsCount = teamRepo.countByMembers_User_Id(userId);
        
        // Get team journals count for each team
        List<Map<String, Object>> teamJournalsStats = teamRepo.findTeamJournalsStatsByUserId(userId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("teamsCount", teamsCount);
        stats.put("teamJournalsStats", teamJournalsStats);
        
        return ResponseEntity.ok(stats);
    }
    
    // Get users from the same community as the current user
    @GetMapping("/community-members")
    public ResponseEntity<List<UserDTO>> getCommunityMembers() {
        try {
            List<UserDTO> communityMembers = userService.getCommunityMembers();
            return ResponseEntity.ok(communityMembers);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/search-communities")
    public ResponseEntity<List<Map<String, Object>>> searchCommunities(@RequestParam(required = false) String query) {
        try {
            List<Map<String, Object>> communities = userService.searchCommunities(query);
            return ResponseEntity.ok(communities);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/community-members/{communityName}")
    public ResponseEntity<List<UserDTO>> getCommunityMembersByName(@PathVariable String communityName) {
        try {
            List<UserDTO> communityMembers = userService.getCommunityMembersByName(communityName);
            return ResponseEntity.ok(communityMembers);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
