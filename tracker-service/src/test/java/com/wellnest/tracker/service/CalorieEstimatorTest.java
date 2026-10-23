package com.wellnest.tracker.service;

import com.wellnest.tracker.model.Intensity;
import com.wellnest.tracker.model.WorkoutType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CalorieEstimatorTest {

    private final CalorieEstimator estimator = new CalorieEstimator(70);

    @Test
    void runningThirtyMinutesModerate() {
        // 9.8 MET x 70 kg x 0.5 h = 343.0
        assertEquals(343.0, estimator.estimate(WorkoutType.RUNNING, Intensity.MODERATE, 30));
    }

    @Test
    void highIntensityBurnsMoreThanLow() {
        assertTrue(estimator.estimate(WorkoutType.CYCLING, Intensity.HIGH, 45)
                > estimator.estimate(WorkoutType.CYCLING, Intensity.LOW, 45));
    }
}
