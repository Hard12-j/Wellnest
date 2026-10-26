package com.wellnest.trainer.web;

import com.wellnest.trainer.dto.PlanRequest;
import com.wellnest.trainer.dto.PlanResponse;
import com.wellnest.trainer.service.PlanService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trainers/plans")
public class PlanController {

    private final PlanService plans;

    public PlanController(PlanService plans) { this.plans = plans; }

    @PostMapping
    public PlanResponse assign(@RequestHeader("X-User-Id") Long userId,
                               @RequestHeader("X-UserRole") String role,
                               @Valid @RequestBody PlanRequest body) {
        Roles.require(role, "TRAINER");
        return plans.assign(userId, body);
    }

    /** Plans assigned to the calling user. */
    @GetMapping("/mine")
    public List<PlanResponse> mine(@RequestHeader("X-User-Id") Long userId) {
        return plans.forUser(userId);
    }

    /** Plans the calling trainer has assigned. */
    @GetMapping("/given")
    public List<PlanResponse> given(@RequestHeader("X-User-Id") Long userId,
                                    @RequestHeader("X-UserRole") String role) {
        Roles.require(role, "TRAINER");
        return plans.givenBy(userId);
    }
}
