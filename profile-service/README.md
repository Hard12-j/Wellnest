# profile-service (port 8082)

Env vars: PROFILE_DB_URL, PROFILE_DB_USER, PROFILE_DB_PASSWORD, (optional) PROFILE_UPLOAD_DIR

| Method | Path | Notes |
|---|---|---|
| GET | /api/profile/me | Creates an empty profile on first call |
| PUT | /api/profile/me | age, heightCm, weightKg, targetWeightKg, fitnessGoal |
| GET | /api/profile/bmi | 422 until height + weight are set |
| PUT | /api/profile/me/avatar | multipart field `file`, JPG/PNG, max 10MB |
| GET | /api/profile/me/avatar | image bytes, 404 if none |

All calls need header `X-User-Id` (set by the gateway; send it manually in Postman).
fitnessGoal: LOSE_WEIGHT, GAIN_MUSCLE, MAINTAIN_WEIGHT, IMPROVE_ENDURANCE, IMPROVE_FLEXIBILITY, GENERAL_FITNESS
