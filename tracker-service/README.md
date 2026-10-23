# tracker-service (port 8083)

Env vars: TRACKER_DB_URL, TRACKER_DB_USER, TRACKER_DB_PASSWORD
All calls need header `X-User-Id` (gateway sets it; add manually in Postman).
Dates are `yyyy-MM-dd`, not in the future. List endpoints take `from`, `to` (default: last 30 days), `page`, `size`.

| Resource | Endpoints |
|---|---|
| /api/tracker/workouts | POST, GET (list), GET /{id}, PUT /{id}, DELETE /{id} |
| /api/tracker/meals | same, plus `mealType` filter on list |
| /api/tracker/hydration | same |
| /api/tracker/sleep | same, one log per day (409 on duplicate) |
| /api/tracker/daily?date= | all of a day's logs + totals (calories in/out, water) |

Every write logs a WorkoutLogged / MealLogged / WaterLogged / SleepLogged event with action CREATED/UPDATED/DELETED.
