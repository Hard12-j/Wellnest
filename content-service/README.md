# content-service (port 8086)

Blogs/posts, likes, comments and tip of the day for WellNest (the "blog-service").

## Run
Set env vars (Neon database `ContentService`):

    DB_URL=jdbc:postgresql://<neon-host>/ContentService?sslmode=require
    DB_USERNAME=...
    DB_PASSWORD=...

    mvn spring-boot:run

Tables are created automatically (`ddl-auto=update`). Seven starter tips are seeded on first run; add more by inserting rows into the `tip` table.

## Auth model
The api-gateway validates the JWT and forwards `X-User-Id` and `X-User-Role`. This service trusts them. Roles are USER and TRAINER; `X-User-Role` is only needed to create a blog.
For Postman, send them yourself, e.g. `X-User-Id: 5`, `X-User-Role: TRAINER`.

## Endpoints (all under /api/content)
| Method | Path | Who | Notes |
|---|---|---|---|
| GET | /blogs | anyone | page, size, category, contentType (ARTICLE/POST), q (title search) |
| GET | /blogs/mine | logged in | own blogs incl. drafts |
| GET | /blogs/{id} | anyone | drafts only for the author |
| POST | /blogs | TRAINER | multipart (`blog` JSON part + optional `image`) or plain JSON |
| PUT | /blogs/{id} | author only | same body as POST |
| DELETE | /blogs/{id} | author only | also removes likes and comments |
| POST | /blogs/{id}/like | logged in | toggle; returns {liked, likesCount} |
| GET | /blogs/{id}/comments | anyone | paginated, oldest first |
| POST | /blogs/{id}/comments | logged in | {commentText, userName} |
| DELETE | /comments/{commentId} | comment writer or the blog's trainer | |
| GET | /tip-of-the-day | anyone | rotates daily |
| GET | /uploads/blogs/{file} | anyone | uploaded images |

## Sample create (JSON)
    POST /api/content/blogs
    X-User-Id: 5
    X-User-Role: TRAINER
    {"title":"5 mobility drills","category":"Fitness","content":"...","authorName":"Asha K","contentType":"ARTICLE","status":"PUBLISHED"}

## Gateway route
    /api/content/** -> http://localhost:8086
