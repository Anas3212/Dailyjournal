package com.dailyjournal.controller;

import com.dailyjournal.entity.Role;
import com.dailyjournal.entity.User;
import com.dailyjournal.entity.JournalEntry;
import com.dailyjournal.repository.RoleRepository;
import com.dailyjournal.repository.UserRepository;
import com.dailyjournal.repository.JournalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.dailyjournal.dto.JournalResponse;
import com.dailyjournal.mapper.JournalMapper;


import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final JournalRepository journalRepo;
    private final JournalMapper journalMapper; // ✅ Add this line


    // ✅ Promote a user to ADMIN
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/promote/{userId}")
    public ResponseEntity<String> promoteToAdmin(@PathVariable Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role adminRole = roleRepo.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new RuntimeException("Admin role not found"));

        if (!user.getRoles().contains(adminRole)) {
            user.getRoles().add(adminRole);
            userRepo.save(user);
            return ResponseEntity.ok("User promoted to ADMIN");
        } else {
            return ResponseEntity.ok("User already has ADMIN role");
        }
    }

    // ✅ Get all users
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepo.findAll());
    }

    // ✅ Delete a user
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        if (!userRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepo.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/journals/search-users")
    public ResponseEntity<List<JournalResponse>> searchJournalsByUserNameOrEmail(
            @RequestParam(required = false) String query) {

        List<JournalEntry> entries;

        if (query != null && !query.isBlank()) {
            entries = journalRepo.findByUser_NameContainingIgnoreCaseOrUser_EmailContainingIgnoreCase(query, query);
        } else {
            entries = journalRepo.findAll();
        }

        List<JournalResponse> responses = entries.stream()
                .map(journalMapper::toResponse)
                .toList();

        return ResponseEntity.ok(responses);
    }
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/journals/all")
    public ResponseEntity<List<JournalResponse>> getAllJournals() {
        List<JournalEntry> entries = journalRepo.findAll();

        List<JournalResponse> responses = entries.stream()
                .map(journalMapper::toResponse)
                .toList();

        return ResponseEntity.ok(responses);
    }


    // ✅ Delete a journal entry
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/journals/{id}")
    public ResponseEntity<String> deleteJournal(@PathVariable Long id) {
        if (!journalRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        journalRepo.deleteById(id);
        return ResponseEntity.ok("Journal entry deleted successfully");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/journals")
    public ResponseEntity<List<JournalResponse>> filterJournalsForAdmin(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String mood,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        List<JournalEntry> entries = journalRepo.searchAdminJournals(query, mood, tags, date);

        List<JournalResponse> responses = entries.stream()
                .map(journalMapper::toResponse)
                .toList();

        return ResponseEntity.ok(responses);
    }

}
