# URL Shortener

A small URL shortening service built with Spring Boot. Submit a long `https://` URL with an expiry date and get back a short link that redirects to it until it expires.

## Features

- Random 10-character short codes (`[A-Za-z0-9]`) generated with `SecureRandom`
- Per-link expiry dates; expired links return `410 Gone`
- URL validation on creation:
  - must be a well-formed `https://` URL with a host
  - links pointing back to this service are rejected
  - hosts resolving to private, loopback, link-local or other internal addresses are rejected
- Structured JSON validation errors

## Tech stack

- Java 21
- Spring Boot 4 (Web MVC, Data JPA, Validation)
- PostgreSQL 18 (via Docker Compose) with Flyway migrations
- H2 in-memory database for tests
- JUnit 5 / Mockito / MockMvc for tests

## Getting started

### Prerequisites

- JDK 21 (`java -version` to check)
- Docker with Docker Compose (for the PostgreSQL database)

No Maven install needed; the project ships with the Maven wrapper.

### Run the app

Start PostgreSQL, then the app:

```bash
docker compose up -d
./mvnw spring-boot:run
```

The service starts on `http://localhost:8080`. Flyway applies any pending migrations on startup.

To stop the database, run `docker compose down`. Data persists in the `pgdata` volume; `docker compose down -v` wipes it.

### Run the tests

```bash
./mvnw test                                   # all tests
./mvnw test -Dtest=URLServiceTest             # one class
./mvnw test -Dtest=URLServiceTest#findCorrespondingURL_throwsWhenCodeMissing   # one method
```

Tests run against an in-memory H2 database in PostgreSQL mode, so Docker doesn't need to be running.

> Note: `handleNewShortURLCreation_allowsPublicAddresses` performs real DNS lookups and requires network access.

## API

### Create a short URL

`POST /createURL`

```bash
curl -i -X POST http://localhost:8080/createURL \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://example.com/some/long/path", "expiryDate": "2027-01-01T00:00:00"}'
```

| Field         | Type                          | Rules                         |
|---------------|-------------------------------|-------------------------------|
| `originalUrl` | string                        | required, valid `https://` URL |
| `expiryDate`  | ISO-8601 local date-time      | required, must be in the future |

**Responses**

- `201 Created`: body is the short URL (plain string), also set in the `Location` header
  ```
  http://localhost:8080/aB3dE5fG7h
  ```
- `400 Bad Request`: validation failure
  ```json
  {
    "errors": [
      { "field": "originalUrl", "message": "must be a valid https:// URL" }
    ]
  }
  ```

### Follow a short URL

`GET /{shortCode}`

```bash
curl -i http://localhost:8080/aB3dE5fG7h
```

| Status          | Meaning                                         |
|-----------------|-------------------------------------------------|
| `302 Found`     | Redirects to the original URL (`Location` header) |
| `404 Not Found` | No link exists for that code                    |
| `410 Gone`      | The link has expired                            |

## Configuration

Set in `src/main/resources/application.properties`:

| Property                     | Default                                         | Description                                            |
|------------------------------|-------------------------------------------------|--------------------------------------------------------|
| `spring.datasource.url`      | `jdbc:postgresql://localhost:5432/urlshortener` | Database URL; override with the `DB_URL` env var       |
| `spring.datasource.username` | `urlshortener`                                  | Database user; override with `DB_USERNAME`             |
| `spring.datasource.password` | `urlshortener`                                  | Database password; override with `DB_PASSWORD`         |
| `app.base-url`               | `http://localhost:8080/`                        | Prefix used to build returned short URLs               |
| `app.domain`                 | `localhost`                                     | This service's domain; URLs pointing here are rejected |

The defaults match the database defined in `compose.yaml`.

## Database migrations

The schema is managed by Flyway. Migrations live in `src/main/resources/db/migration` and are named `V<version>__<description>.sql` (e.g. `V2__add_click_count.sql`). Hibernate runs with `ddl-auto=validate`, so it checks the entities against the schema but never changes it. Every schema change needs a new migration.

Never edit a migration that has already been applied; add a new one instead.

## Project structure

```
src/main/java/com/github/finncull/urlshortener/
├── controller/         # REST endpoints
├── service/            # Short code generation, URL validation, lookup
├── model/              # URLMapping JPA entity
├── repository/         # Spring Data repository
├── dto/                # Request DTOs with validation
├── exception/          # Domain exceptions
└── exceptionhandler/   # Maps exceptions to HTTP responses
```

## Roadmap

- [x] Persistent database (PostgreSQL + Flyway)
- [ ] Scheduled cleanup of expired links
- [ ] Custom aliases
- [ ] Click analytics
- [ ] Rate limiting on link creation
- [ ] OpenAPI docs
- [ ] CI via GitHub Actions
