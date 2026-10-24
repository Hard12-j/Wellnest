# analytics-service (port 8084)

Env vars: ANALYTICS_DB_URL, ANALYTICS_DB_USER, ANALYTICS_DB_PASSWORD, KAFKA_BOOTSTRAP (default localhost:9092)
All calls need header `X-User-Id` (the gateway sets it; add it manually in Postman).

Analytics never calls tracker over REST. It consumes events from Kafka topic `tracker.events`
(key = userId) and keeps its own tables.

## Event envelope (published by tracker-service)
```json
{ "eventId": "uuid", "eventType": "WorkoutLogged", "userId": 1,
  "timestamp": "2026-10-23T12:00:00.123Z", "action": "CREATED",
  "data": { "id": 5, "date": "2026-10-23", "...": "..." } }
```
| eventType | data fields used |
|---|---|
| WorkoutLogged | id, date, durationMin, caloriesBurned |
| MealLogged | id, date, calories |
| WaterLogged | id, date, amountMl |
| SleepLogged | id, date, hours |

action is CREATED / UPDATED / DELETED.

## Profile event (published by profile-service on topic `profile.events`)
Same envelope, eventType `ProfileUpdated`, data: fitnessGoal, weightKg, targetWeightKg, heightCm, age.
startWeightKg is set on the first event and reset whenever the goal or target weight changes.

## Tables
- tracker_entries: one row per tracker row, unique (entry_type, source_id)
- daily_summaries: one row per user per day, rebuilt from tracker_entries
- user_goal_snapshots: one row per user (goal, start/current/target weight)
- processed_events: handled event ids (duplicates are ignored)

## Endpoints
| Endpoint | Notes |
|---|---|
| GET /api/analytics/weekly-trends?from=&to= | one point per day, zero-filled; default last 7 days; max 90 days |
| GET /api/analytics/calories-balance?from=&to= | consumed vs burned per day plus totals |

| GET /api/analytics/goal-progress | weight progress %, remaining kg, logging streak; needs ProfileUpdated events |

Coming next: insights, admin stats.
