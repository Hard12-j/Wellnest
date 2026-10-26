# trainer-service (port 8085)

Needs: Neon database `TrainerService`, Kafka on localhost:9092.
Set TRAINER_DB_URL / TRAINER_DB_USER / TRAINER_DB_PASSWORD (env vars) or edit application.yml.

Headers (normally added by the gateway): X-User-Id, X-UserRole (USER | TRAINER | ADMIN).

| Who | Method + path |
|---|---|
| Trainer | PUT/GET /api/trainers/me, GET /api/trainers/me/clients |
| Trainer | GET /api/trainers/requests/pending, PUT /api/trainers/requests/{id}/accept or /reject |
| Trainer | POST /api/trainers/plans, GET /api/trainers/plans/given |
| User | GET /api/trainers/search?q=&specialization=&location=&page=&size= |
| User | GET /api/trainers/recommended, GET /api/trainers/{trainerId} |
| User | POST /api/trainers/requests  {"trainerId": 5}, GET /api/trainers/requests/mine |
| User | GET /api/trainers/plans/mine |

Consumes: profile.events (ProfileUpdated). Publishes: trainer.events (TrainerMatched, PlanAssigned).
