package com.wellnest.tracker.web;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;

/** Shared date-range + paging rules for every list endpoint. */
public final class Paging {
    private Paging() {}

    public record Range(LocalDate from, LocalDate to) {}

    /** Defaults to the last 30 days. */
    public static Range range(LocalDate from, LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now();
        LocalDate start = from != null ? from : end.minusDays(30);
        if (start.isAfter(end)) throw new IllegalArgumentException("'from' must not be after 'to'");
        return new Range(start, end);
    }

    /** Newest first; size capped at 100. */
    public static Pageable of(int page, int size) {
        if (page < 0) throw new IllegalArgumentException("page must be >= 0");
        if (size < 1) throw new IllegalArgumentException("size must be >= 1");
        return PageRequest.of(page, Math.min(size, 100),
                Sort.by(Sort.Direction.DESC, "logDate").and(Sort.by(Sort.Direction.DESC, "id")));
    }
}
