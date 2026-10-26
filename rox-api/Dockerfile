# syntax=docker/dockerfile:1.7
# ------------------------------------------------------------------
# Backend image — Spring Boot 3.4 / Java 21 / Maven wrapper.
#
# Build:   docker build -t rox-api .
# Run:     docker run --rm -p 8090:8090 \
#            -e DATABASE_URL=jdbc:postgresql://db:5432/rox_api \
#            -e DATABASE_USER=rox -e DATABASE_PASSWORD=rox \
#            -e JWT_SECRET="$(openssl rand -base64 64)" \
#            -e CORS_ALLOWED_ORIGINS=https://rox.ma \
#            rox-api
#
# Notes:
#   • `SERVER_PORT` defaults to 8090 (see application.yml). Container
#     port is `EXPOSE 8090`.
#   • Flyway migrations run on startup automatically.
#   • DataSeeder is on by default (`ROX_SEED_ENABLED=true`) — flip to
#     `false` once your DB has been curated via the admin.
# ------------------------------------------------------------------

# ---- Build stage -------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Copy POM + sources together, then a single `package` invocation.
# (Skipping the intermediate `dependency:go-offline` step because some
# plugins aren't fully resolvable there and it doubles build time on CI.)
COPY pom.xml ./
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -DskipTests package

# ---- Runtime stage -----------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Non-root.
RUN addgroup -S spring && adduser -S spring -G spring

COPY --from=build --chown=spring:spring /workspace/target/*.jar app.jar

USER spring:spring
EXPOSE 8090
ENV SERVER_PORT=8090

# Container-friendly JVM defaults; override via JAVA_OPTS if needed.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
