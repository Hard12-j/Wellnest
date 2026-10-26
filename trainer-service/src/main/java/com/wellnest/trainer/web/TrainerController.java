package com.wellnest.trainer.web;

import com.wellnest.trainer.dto.*;
import com.wellnest.trainer.service.TrainerProfileService;
import com.wellnest.trainer.service.TrainerRequestService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Gateway validates the JWT and forwards X-User-Id and X-UserRole. */
@RestController
@RequestMapping("/api/trainers")
public class TrainerController {

    private final TrainerProfileService profiles;
    private final TrainerRequestService requests;

    public TrainerController(TrainerProfileService profiles, TrainerRequestService requests) {
        this.profiles = profiles;
        this.requests = requests;
    }

    // ----- trainer's own profile -----
    @PutMapping("/me")
    public TrainerProfileResponse saveMine(@RequestHeader("X-User-Id") Long userId,
                                           @RequestHeader("X-UserRole") String role,
                                           @Valid @RequestBody TrainerProfileRequest body) {
        Roles.require(role, "TRAINER");
        return profiles.upsert(userId, body);
    }

    @GetMapping("/me")
    public TrainerProfileResponse getMine(@RequestHeader("X-User-Id") Long userId,
                                          @RequestHeader("X-UserRole") String role) {
        Roles.require(role, "TRAINER");
        return profiles.getMine(userId);
    }

    @GetMapping("/me/clients")
    public List<ClientResponse> clients(@RequestHeader("X-User-Id") Long userId,
                                        @RequestHeader("X-UserRole") String role) {
        Roles.require(role, "TRAINER");
        return requests.clients(userId);
    }

    // ----- discovery (users) -----
    @GetMapping("/search")
    public PageResponse<TrainerProfileResponse> search(@RequestHeader("X-User-Id") Long userId,
                                                       @RequestParam(required = false) String q,
                                                       @RequestParam(required = false) String specialization,
                                                       @RequestParam(required = false) String location,
                                                       @RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "10") int size) {
        return profiles.search(userId, q, specialization, location, page, size);
    }

    @GetMapping("/recommended")
    public List<TrainerProfileResponse> recommended(@RequestHeader("X-User-Id") Long userId) {
        return profiles.recommended(userId);
    }

    @GetMapping("/{trainerId}")
    public TrainerProfileResponse get(@RequestHeader("X-User-Id") Long userId, @PathVariable Long trainerId) {
        return profiles.get(userId, trainerId);
    }

    // ----- booking requests -----
    @PostMapping("/requests")
    public RequestResponse send(@RequestHeader("X-User-Id") Long userId,
                                @RequestHeader("X-UserRole") String role,
                                @Valid @RequestBody SendRequestBody body) {
        Roles.require(role, "USER");
        return requests.send(userId, body.trainerId());
    }

    @GetMapping("/requests/mine")
    public List<RequestResponse> mine(@RequestHeader("X-User-Id") Long userId) {
        return requests.mine(userId);
    }

    @GetMapping("/requests/pending")
    public List<RequestResponse> pending(@RequestHeader("X-User-Id") Long userId,
                                         @RequestHeader("X-UserRole") String role) {
        Roles.require(role, "TRAINER");
        return requests.pendingForTrainer(userId);
    }

    @PutMapping("/requests/{id}/accept")
    public RequestResponse accept(@RequestHeader("X-User-Id") Long userId,
                                  @RequestHeader("X-UserRole") String role, @PathVariable Long id) {
        Roles.require(role, "TRAINER");
        return requests.accept(id, userId);
    }

    @PutMapping("/requests/{id}/reject")
    public RequestResponse reject(@RequestHeader("X-User-Id") Long userId,
                                  @RequestHeader("X-UserRole") String role, @PathVariable Long id) {
        Roles.require(role, "TRAINER");
        return requests.reject(id, userId);
    }
}
