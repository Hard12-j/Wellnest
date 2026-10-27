package com.wellnest.content.config;

import com.wellnest.content.model.Tip;
import com.wellnest.content.repository.TipRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/** Seeds a few tips on first start so /tip-of-the-day works immediately. */
@Component
public class TipSeeder implements CommandLineRunner {

    private final TipRepository tips;

    public TipSeeder(TipRepository tips) {
        this.tips = tips;
    }

    @Override
    public void run(String... args) {
        if (tips.count() > 0) return;
        tips.saveAll(List.of(
                new Tip("Drink a glass of water as soon as you wake up."),
                new Tip("Aim for 7 to 9 hours of sleep and keep a regular bedtime."),
                new Tip("Take a 10-minute walk after meals to help digestion."),
                new Tip("Add a source of protein to every meal."),
                new Tip("Stretch for five minutes before and after workouts."),
                new Tip("Limit screens for 30 minutes before bed."),
                new Tip("Progress beats perfection: a short workout still counts.")));
    }
}
