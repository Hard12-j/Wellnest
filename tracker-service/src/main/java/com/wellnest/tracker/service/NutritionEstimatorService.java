package com.wellnest.tracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wellnest.tracker.dto.NutritionEstimateResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class NutritionEstimatorService {

    private static final Logger log = LoggerFactory.getLogger(NutritionEstimatorService.class);

    @Value("${nutrition.apininjas.api-key:}")
    private String apiNinjasApiKey;

    @Value("${nutrition.gemini.api-key:}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public NutritionEstimatorService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public NutritionEstimateResponse estimate(String query) {
        String cleanQuery = query != null ? query.trim() : "";
        if (cleanQuery.isEmpty()) {
            return new NutritionEstimateResponse("", 0, 0.0, 0.0, 0.0, "NONE", "No food specified");
        }

        // ── 1. Try Gemini AI (100% Free / Full Calories, Protein, Carbs, Fat) ──
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                NutritionEstimateResponse geminiRes = tryGeminiAI(cleanQuery);
                if (geminiRes != null && geminiRes.calories() > 0) {
                    log.info("Estimated via Gemini AI for '{}': {} kcal, {}g protein", cleanQuery, geminiRes.calories(), geminiRes.proteinG());
                    return geminiRes;
                }
            } catch (Exception e) {
                log.warn("Gemini AI estimation failed for '{}': {}", cleanQuery, e.getMessage());
            }
        }

        // ── 2. Try API Ninjas (if API key configured and returns data) ────────
        if (apiNinjasApiKey != null && !apiNinjasApiKey.isBlank()) {
            try {
                NutritionEstimateResponse ninjaRes = tryApiNinjas(cleanQuery);
                if (ninjaRes != null && ninjaRes.calories() > 0) {
                    log.info("Estimated via API Ninjas for '{}': {} kcal", cleanQuery, ninjaRes.calories());
                    return ninjaRes;
                }
            } catch (Exception e) {
                log.warn("API Ninjas estimation failed for '{}': {}", cleanQuery, e.getMessage());
            }
        }

        // ── 3. Built-in Nutrition Catalog Fallback (100% Free / Immediate) ──────
        log.info("Using built-in nutritional estimator for '{}'", cleanQuery);
        return estimateWithBuiltInCatalog(cleanQuery);
    }

    private NutritionEstimateResponse tryApiNinjas(String query) throws Exception {
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);

        // Try API Ninjas endpoint first, fallback to CalorieNinjas if needed
        String url = "https://api.api-ninjas.com/v1/nutrition?query=" + encoded;
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("X-Api-Key", apiNinjasApiKey.trim())
                .timeout(Duration.ofSeconds(6))
                .GET()
                .build();

        HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() == 404 || resp.statusCode() == 401) {
            // Fallback attempt to calorieninjas.com
            req = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.calorieninjas.com/v1/nutrition?query=" + encoded))
                    .header("X-Api-Key", apiNinjasApiKey.trim())
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();
            resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        }

        if (resp.statusCode() != 200) {
            log.warn("API Ninjas returned status {}: {}", resp.statusCode(), resp.body());
            return null;
        }

        JsonNode root = objectMapper.readTree(resp.body());
        // API Ninjas returns array directly: [ {...} ], while CalorieNinjas returned { "items": [ {...} ] }
        JsonNode items = root.isArray() ? root : root.get("items");
        if (items == null || !items.isArray() || items.isEmpty()) {
            return null; // Empty results, let Gemini AI handle it
        }

        double totalCalories = 0;
        double totalProtein = 0;
        double totalCarbs = 0;
        double totalFat = 0;
        List<String> detectedItems = new ArrayList<>();

        for (JsonNode item : items) {
            String name = item.path("name").asText();
            double cals = item.path("calories").asDouble(0);
            double protein = item.path("protein_g").asDouble(0);
            double carbs = item.path("carbohydrates_total_g").asDouble(0);
            double fat = item.path("fat_total_g").asDouble(0);

            totalCalories += cals;
            totalProtein += protein;
            totalCarbs += carbs;
            totalFat += fat;

            detectedItems.add(String.format("%s (%.0f kcal)", capitalize(name), cals));
        }

        if (totalCalories <= 0) return null;

        String breakdown = String.join(", ", detectedItems);
        return new NutritionEstimateResponse(
                capitalize(query),
                (int) Math.round(totalCalories),
                round(totalProtein),
                round(totalCarbs),
                round(totalFat),
                "API_NINJAS",
                breakdown
        );
    }

    private NutritionEstimateResponse tryGeminiAI(String query) throws Exception {
        String prompt = "You are a clinical nutritionist and nutrition database. " +
                "Calculate total calories and macros for this meal or food item: \"" + query + "\". " +
                "Respond ONLY with a JSON object with this exact structure: " +
                "{\"foodName\":\"clean meal name\",\"calories\":integer,\"proteinG\":float,\"carbsG\":float,\"fatG\":float,\"breakdown\":\"short note on ingredients/portions\"}";

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> body = Map.of(
                "contents", List.of(content),
                "generationConfig", Map.of("responseMimeType", "application/json")
        );

        String jsonBody = objectMapper.writeValueAsString(body);
        String[] models = {"gemini-2.5-flash", "gemini-1.5-flash"};
        HttpResponse<String> resp = null;

        for (String model : models) {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key="
                    + geminiApiKey.trim();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(8))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                break;
            } else {
                log.warn("Gemini model {} returned status {}: {}", model, resp.statusCode(), resp.body());
            }
        }

        if (resp == null || resp.statusCode() != 200) {
            return null;
        }

        JsonNode root = objectMapper.readTree(resp.body());
        JsonNode candidates = root.path("candidates");
        if (candidates.isEmpty()) return null;

        String text = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        // Clean any accidental markdown backticks
        String cleanJson = text.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
        JsonNode resultNode = objectMapper.readTree(cleanJson);

        String foodName = resultNode.path("foodName").asText(query);
        int calories = resultNode.path("calories").asInt(0);
        double protein = resultNode.path("proteinG").asDouble(0);
        double carbs = resultNode.path("carbsG").asDouble(0);
        double fat = resultNode.path("fatG").asDouble(0);
        String breakdown = resultNode.path("breakdown").asText("AI nutritional estimation");

        if (calories <= 0) return null;

        return new NutritionEstimateResponse(
                foodName,
                calories,
                round(protein),
                round(carbs),
                round(fat),
                "GEMINI_AI",
                breakdown
        );
    }

    /**
     * Smart built-in fallback containing ~50 common gym, grocery, and Indian foods.
     * Always available even if third-party keys are not provided.
     */
    private NutritionEstimateResponse estimateWithBuiltInCatalog(String query) {
        String lower = query.toLowerCase();

        // Check food database per portion / 100g
        List<FoodRef> catalog = List.of(
                new FoodRef(List.of("egg", "eggs", "boiled egg", "omelette", "omelet"), "Boiled Egg", 78, 6.3, 0.6, 5.3, "piece"),
                new FoodRef(List.of("chicken breast", "chicken", "grilled chicken"), "Chicken Breast (150g)", 245, 46.0, 0.0, 5.4, "serving"),
                new FoodRef(List.of("white rice", "rice", "chawal", "cooked rice", "steamed rice"), "Cooked Rice (1 cup / 150g)", 205, 4.2, 45.0, 0.4, "cup"),
                new FoodRef(List.of("brown rice"), "Brown Rice (1 cup / 195g)", 216, 5.0, 44.8, 1.8, "cup"),
                new FoodRef(List.of("roti", "rotis", "chapati", "chapatis", "phulka"), "Roti / Chapati", 104, 3.1, 20.0, 1.5, "piece"),
                new FoodRef(List.of("paratha", "aloo paratha"), "Paratha", 260, 5.5, 36.0, 11.0, "piece"),
                new FoodRef(List.of("naan", "butter naan"), "Naan", 280, 8.5, 48.0, 6.0, "piece"),
                new FoodRef(List.of("dal", "daal", "yellow dal", "dal tadka", "lentil", "lentils"), "Cooked Dal (1 bowl / 150g)", 150, 9.0, 22.0, 3.0, "bowl"),
                new FoodRef(List.of("paneer", "cottage cheese"), "Paneer (100g)", 265, 18.0, 4.0, 20.0, "100g"),
                new FoodRef(List.of("paneer butter masala", "paneer tikka"), "Paneer Dish (1 bowl)", 340, 14.0, 12.0, 26.0, "bowl"),
                new FoodRef(List.of("milk", "cow milk", "whole milk"), "Milk (1 glass / 250ml)", 150, 8.0, 12.0, 8.0, "glass"),
                new FoodRef(List.of("curd", "dahi", "yogurt", "greek yogurt"), "Curd / Yogurt (1 bowl / 150g)", 100, 6.0, 7.5, 5.0, "bowl"),
                new FoodRef(List.of("oat", "oats", "oatmeal"), "Oatmeal (1 bowl cooked / 50g dry)", 190, 6.5, 32.0, 3.5, "bowl"),
                new FoodRef(List.of("banana", "bananas"), "Banana (1 medium)", 105, 1.3, 27.0, 0.3, "piece"),
                new FoodRef(List.of("apple", "apples"), "Apple (1 medium)", 95, 0.5, 25.0, 0.3, "piece"),
                new FoodRef(List.of("bread", "slice of bread", "white bread", "wheat bread"), "Bread (1 slice)", 75, 2.5, 14.0, 1.0, "slice"),
                new FoodRef(List.of("peanut butter"), "Peanut Butter (2 tbsp / 32g)", 190, 8.0, 7.0, 16.0, "serving"),
                new FoodRef(List.of("salad", "green salad"), "Green Salad (1 bowl)", 60, 2.0, 10.0, 1.5, "bowl"),
                new FoodRef(List.of("fish", "salmon", "tilapia"), "Fish Fillet (150g)", 210, 34.0, 0.0, 8.0, "serving"),
                new FoodRef(List.of("idli", "idlis"), "Idli", 65, 2.0, 12.0, 0.5, "piece"),
                new FoodRef(List.of("dosa", "masala dosa"), "Dosa", 250, 5.0, 38.0, 9.0, "piece"),
                new FoodRef(List.of("biryani", "chicken biryani"), "Chicken Biryani (1 plate)", 480, 26.0, 62.0, 15.0, "plate"),
                new FoodRef(List.of("pizza", "slice of pizza"), "Pizza (1 slice)", 270, 11.0, 32.0, 10.0, "slice"),
                new FoodRef(List.of("coffee", "black coffee"), "Black Coffee", 5, 0.3, 0.0, 0.0, "cup"),
                new FoodRef(List.of("tea", "chai", "milk tea"), "Tea with milk", 85, 2.5, 12.0, 3.0, "cup")
        );

        // Detect quantity (e.g., "2 eggs", "3 rotis", "150g", "200")
        double multiplier = extractMultiplier(lower);

        int totalCalories = 0;
        double totalProtein = 0;
        double totalCarbs = 0;
        double totalFat = 0;
        List<String> matchedNames = new ArrayList<>();

        for (FoodRef food : catalog) {
            for (String alias : food.aliases) {
                if (lower.contains(alias)) {
                    totalCalories += (int) Math.round(food.calories * multiplier);
                    totalProtein += food.proteinG * multiplier;
                    totalCarbs += food.carbsG * multiplier;
                    totalFat += food.fatG * multiplier;
                    matchedNames.add(food.displayName);
                    break;
                }
            }
        }

        if (totalCalories == 0) {
            // Generic fallback estimation if food wasn't in catalog
            totalCalories = (int) Math.round(250 * multiplier);
            totalProtein = round(12.0 * multiplier);
            totalCarbs = round(30.0 * multiplier);
            totalFat = round(8.0 * multiplier);
            matchedNames.add("Meal portion");
        }

        String breakdown = String.join(", ", matchedNames);
        if (multiplier != 1.0) {
            breakdown += String.format(" (x%.1f portion)", multiplier);
        }

        return new NutritionEstimateResponse(
                capitalize(query),
                totalCalories,
                round(totalProtein),
                round(totalCarbs),
                round(totalFat),
                "BUILT_IN_CATALOG",
                breakdown
        );
    }

    private double extractMultiplier(String s) {
        // Match numbers at the start or before words like "rotis", "eggs", "cups"
        Pattern p = Pattern.compile("\\b(\\d+(?:\\.\\d+)?)\\s*(?:g|grams?|kg|ml|cups?|bowls?|pieces?|rotis?|eggs?|slices?|servings?)?\\b");
        Matcher m = p.matcher(s);
        if (m.find()) {
            try {
                double val = Double.parseDouble(m.group(1));
                if (s.contains("g") || s.contains("gram")) {
                    return Math.max(0.1, val / 100.0);
                }
                if (val > 0 && val <= 20) {
                    return val;
                }
            } catch (Exception ignored) {}
        }
        return 1.0;
    }

    private double round(double val) {
        return Math.round(val * 10.0) / 10.0;
    }

    private String capitalize(String str) {
        if (str == null || str.isBlank()) return "";
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    private record FoodRef(
            List<String> aliases,
            String displayName,
            int calories,
            double proteinG,
            double carbsG,
            double fatG,
            String unit
    ) {}
}

