package com.wellnest.analytics.dto;

import java.time.LocalDate;
import java.util.List;

public record CaloriesBalanceResponse(LocalDate from, LocalDate to, List<BalanceDay> days,
                                      double totalConsumed, double totalBurned, double totalNet) {

    public record BalanceDay(LocalDate date, double consumed, double burned, double net) {}
}
