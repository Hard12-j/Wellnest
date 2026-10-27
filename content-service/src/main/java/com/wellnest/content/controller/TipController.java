package com.wellnest.content.controller;

import com.wellnest.content.dto.TipResponse;
import com.wellnest.content.service.TipService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/content")
public class TipController {

    private final TipService service;

    public TipController(TipService service) {
        this.service = service;
    }

    @GetMapping("/tip-of-the-day")
    public TipResponse tipOfTheDay() {
        return service.tipOfTheDay();
    }
}
