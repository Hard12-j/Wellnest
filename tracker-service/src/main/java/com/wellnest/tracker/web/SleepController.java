package com.wellnest.tracker.web;

import com.wellnest.tracker.dto.*;
import com.wellnest.tracker.service.SleepService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/tracker/sleep")
public class SleepController {

    private final SleepService service;

    public SleepController(SleepService service) { this.service = service; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SleepResponse create(@RequestHeader("X-User-Id") Long userId, @Valid @RequestBody SleepRequest r) {
        return SleepResponse.from(service.create(userId, r));
    }

    @GetMapping
    public PageResponse<SleepResponse> list(@RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        var range = Paging.range(from, to);
        return PageResponse.of(service.list(userId, range.from(), range.to(), Paging.of(page, size)), SleepResponse::from);
    }

    @GetMapping("/{id}")
    public SleepResponse get(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return SleepResponse.from(service.get(userId, id));
    }

    @PutMapping("/{id}")
    public SleepResponse update(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
                                @Valid @RequestBody SleepRequest r) {
        return SleepResponse.from(service.update(userId, id, r));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        service.delete(userId, id);
    }
}
