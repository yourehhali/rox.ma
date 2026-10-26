# ROX Agency — Backend API

Spring Boot 3.4 implementation of the frontend contract in [`api-spec.json`](./api-spec.json)
(OpenAPI 3.1). Java 21, Maven, PostgreSQL + Flyway, JWT bearer auth, springdoc/Swagger UI.

## Stack

| Concern          | Choice                                                     |
|------------------|------------------------------------------------------------|
| Runtime          | Java 21                                                    |
| Framework        | Spring Boot 3.4.1                                          |
| Build            | Maven (`mvn`)                                              |
| Database         | PostgreSQL 16 (dev via `docker-compose.yml`)               |
| Migrations       | Flyway — SQL under `src/main/resources/db/migration/`      |
| Persistence      | Spring Data JPA / Hibernate 6                              |
| Auth             | JWT bearer (HS256) + BCrypt password hashing               |
| Docs             | springdoc-openapi → `/swagger-ui.html`                     |

## Quickstart

1. Start Postgres:
   ```bash
   docker compose up -d db
   ```
2. Configure secrets (or leave defaults for local dev):
   ```bash
   cp .env.example .env
   # generate a real secret:  openssl rand -base64 64
   ```
3. Boot:
   ```bash
   mvn spring-boot:run
   ```
   API on `http://localhost:8090`, Swagger on `http://localhost:8090/swagger-ui.html`.
   Flyway creates the schema and the `DataSeeder` populates 5 services, 2 plans, 6 FAQ
   groups, site info (cities) and the demo admin `admin@rox.ma` / `rox-admin`.

## Environment variables

See `.env.example`. Notably:

- `SPRING_DATASOURCE_URL / USERNAME / PASSWORD` — Postgres connection.
- `JWT_SECRET` — **required in prod** (≥ 32 bytes).
- `JWT_ACCESS_TTL_MIN`, `JWT_REFRESH_TTL_DAYS` — token lifetimes.
- `CORS_ALLOWED_ORIGINS` — comma-separated.

## Auth flow

The API is stateless. There are two independent accounts systems that produce
different token roles:

- **Client** signup/login — `POST /auth/client/signup` · `POST /auth/client/login`.
  Returns `{accessToken, refreshToken, accessExpiresIn, user}`. `Authorization: Bearer <accessToken>`
  is required on every subsequent client call.
- **Admin** login — `POST /auth/admin/login` (no signup — admins are provisioned by
  editing the `admin_account` table, or the seed creates one).

Refresh tokens are persisted in `refresh_token` so `POST /auth/*/logout` can revoke
them by email.

### Role-based route access

`SecurityConfig.filterChain` maps Spring Security rules straight from api-spec:

- Public GETs: `/portfolio*`, `/content/**`, `/swagger-ui/**`, auth entry points.
- Client-only: `/portal`, `POST /orders`, `POST /orders/{id}/requests`, `POST /bookings`.
- Admin-only: order mutations (`PATCH /orders/{id}/{phase|status}`, task toggle, request
  handling), `POST /bookings/{id}/confirm`, `POST /clients/**`, `GET /admin/**`, mutating
  `/portfolio` and `/content/**`.

Both roles share read access to `/orders`, `/messages`, `/bookings` — controllers scope
results by the caller's identity.

## Endpoint coverage

Every path in `api-spec.json` is wired:

```
/auth/client/{signup,login,logout,me}     /orders/{id}/tasks/{taskId}/toggle
/auth/admin/{login,logout,me}             /orders/{id}/requests
/portal                                   /orders/{id}/requests/{requestId}/handle
/orders                                   /messages
/orders/{id}                              /bookings
/orders/{id}/phase                        /bookings/{id}/confirm
/orders/{id}/status                       /clients, /clients/{id}/portal
/portfolio (+ /published, /featured)      /content (+ /services, /plans, /faqs, /info)
/admin/stats                              /admin/traffic?range=6M|12M|YTD
```

Full schemas for every request/response are in `api-spec.json` — this project is
that spec, executable.

## Error envelope

All non-2xx responses return the shape from `api-spec.json#/$defs/Error`:

```json
{ "error": { "code": "not_found", "message": "Commande introuvable.", "details": [] } }
```

Stable codes: `unauthorized`, `forbidden`, `not_found`, `conflict`, `validation_error`,
`rate_limited`, `internal_error`. Produced by `GlobalExceptionHandler`.

## Notes for going to production

- Rotate `JWT_SECRET` and delete the seeded admin (or change its password).
- Add rate limiting on `POST /auth/*` (recommended: Bucket4j or a reverse-proxy rule).
- Set `logging.level.root=INFO`, disable `format_sql`, use `application-prod.yml`.
- Consider switching to RSA (`RS256`) for public verifiability.
- Extend `refresh_token` handling to actually validate on `/auth/*/refresh` (currently
  logout revokes by email; you may want per-jti rotation).

## Tests

Skeleton only: `mvn test`. Add integration tests against H2 in `src/test/java/ma/rox/api/`.
