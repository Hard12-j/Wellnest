package com.wellnest.profile.web;

import com.wellnest.profile.dto.BmiResponse;
import com.wellnest.profile.dto.ProfileRequest;
import com.wellnest.profile.dto.ProfileResponse;
import com.wellnest.profile.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * The gateway validates the JWT and forwards X-User-Id. This servi
 */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService service;

    public ProfileController(ProfileService service) { this.service = service; }

    @GetMapping("/me")
    public ProfileResponse get(@RequestHeader("X-User-Id") Long userId) {
        return ProfileResponse.from(service.getOrCreate(userId));
    }

    @PutMapping("/me")
    public ProfileResponse update(@RequestHeader("X-User-Id") Long userId,
                                  @Valid @RequestBody ProfileRequest request) {
        return ProfileResponse.from(service.update(userId, request));
    }

    @GetMapping("/bmi")
    public BmiResponse bmi(@RequestHeader("X-User-Id") Long userId) {
        return service.bmi(userId);
    }

    @PutMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> uploadAvatar(@RequestHeader("X-User-Id") Long userId,
                                             @RequestParam("file") MultipartFile file) throws IOException {
        service.saveAvatar(userId, file);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/avatar")
    public ResponseEntity<byte[]> avatar(@RequestHeader("X-User-Id") Long userId) throws IOException {
        var a = service.loadAvatar(userId);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(a.contentType())).body(a.bytes());
    }
}
