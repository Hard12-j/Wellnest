package com.wellnest.analytics.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Rule-based messages built from the user's daily summaries.
 * asOf = the day the rules were evaluated for (today). An empty list means nothing worth flagging.
 * severity: INFO | WARNING. matchedDays / windowDays let a client show "4 of 7" without parsing the message.
 */
public record InsightsResponse(LocalDate asOf, List<Insight> insights) {
    public record Insight(String code,
                          String severity,
                          String message,
                          int matchedDays,
                          int windowDays) {}
}