package com.wellnest.tracker.web;

import com.wellnest.tracker.dto.*;
import com.wellnest.tracker.service.WorkoutService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/** Gateway forwards X-User-Id; this service is never public. */
@RestController
@RequestMapping("/api/tracker/workouts")
public class WorkoutController {

    private final WorkoutService service;

    public WorkoutController(WorkoutService service) { this.service = service; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkoutResponse create(@RequestHeader("X-User-Id") Long userId, @Valid @RequestBody WorkoutRequest r) {
        return WorkoutResponse.from(service.create(userId, r));
    }

    @GetMapping
    public PageResponse<WorkoutResponse> list(@RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        var range = Paging.range(from, to);
        return PageResponse.of(service.list(userId, range.from(), range.to(), Paging.of(page, size)), WorkoutResponse::from);
    }

    @GetMapping("/{id}")
    public WorkoutResponse get(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return WorkoutResponse.from(service.get(userId, id));
    }

    @PutMapping("/{id}")
    public WorkoutResponse update(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
                                  @Valid @RequestBody WorkoutRequest r) {
        return WorkoutResponse.from(service.update(userId, id, r));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        service.delete(userId, id);
    }
}
