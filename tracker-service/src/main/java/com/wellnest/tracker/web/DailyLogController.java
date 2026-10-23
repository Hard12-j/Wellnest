package com.wellnest.tracker.web;

import com.wellnest.tracker.dto.DailyLogResponse;
import com.wellnest.tracker.service.DailyLogService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/tracker/daily")
public class DailyLogController {

    private final DailyLogService service;

    public DailyLogController(DailyLogService service) { this.service = service; }

    @GetMapping
    public DailyLogResponse day(@RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return service.forDay(userId, date != null ? date : LocalDate.now());
    }
}
