package com.wellnest.tracker.web;

import com.wellnest.tracker.dto.*;
import com.wellnest.tracker.model.MealType;
import com.wellnest.tracker.service.MealService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/tracker/meals")
public class MealController {

    private final MealService service;

    public MealController(MealService service) { this.service = service; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MealResponse create(@RequestHeader("X-User-Id") Long userId, @Valid @RequestBody MealRequest r) {
        return MealResponse.from(service.create(userId, r));
    }

    @GetMapping
    public PageResponse<MealResponse> list(@RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) MealType mealType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        var range = Paging.range(from, to);
        return PageResponse.of(service.list(userId, mealType, range.from(), range.to(), Paging.of(page, size)), MealResponse::from);
    }

    @GetMapping("/{id}")
    public MealResponse get(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return MealResponse.from(service.get(userId, id));
    }

    @PutMapping("/{id}")
    public MealResponse update(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
                               @Valid @RequestBody MealRequest r) {
        return MealResponse.from(service.update(userId, id, r));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        service.delete(userId, id);
    }
}
