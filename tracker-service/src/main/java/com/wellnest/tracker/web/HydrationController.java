package com.wellnest.tracker.web;

import com.wellnest.tracker.dto.*;
import com.wellnest.tracker.service.HydrationService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/tracker/hydration")
public class HydrationController {

    private final HydrationService service;

    public HydrationController(HydrationService service) { this.service = service; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HydrationResponse create(@RequestHeader("X-User-Id") Long userId, @Valid @RequestBody HydrationRequest r) {
        return HydrationResponse.from(service.create(userId, r));
    }

    @GetMapping
    public PageResponse<HydrationResponse> list(@RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        var range = Paging.range(from, to);
        return PageResponse.of(service.list(userId, range.from(), range.to(), Paging.of(page, size)), HydrationResponse::from);
    }

    @GetMapping("/{id}")
    public HydrationResponse get(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return HydrationResponse.from(service.get(userId, id));
    }

    @PutMapping("/{id}")
    public HydrationResponse update(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
                                    @Valid @RequestBody HydrationRequest r) {
        return HydrationResponse.from(service.update(userId, id, r));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        service.delete(userId, id);
    }
}
