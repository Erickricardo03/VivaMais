# =========================================================================
# Stage 1: Build Angular Frontend
# =========================================================================
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# =========================================================================
# Stage 2: Build Spring Boot Backend with Static Frontend Assets
# =========================================================================
FROM maven:3.9-eclipse-temurin-21-alpine AS backend-build
WORKDIR /app/backend

COPY backend/pom.xml ./
COPY backend/src ./src

# Copy compiled Angular assets into Spring Boot's static resources directory
COPY --from=frontend-build /app/frontend/dist/frontend/browser ./src/main/resources/static

RUN mvn clean package -DskipTests -B

# =========================================================================
# Stage 3: Lightweight Production Runtime Image
# =========================================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user and data directory for H2 database
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/data && chown -R appuser:appgroup /app

USER appuser

# Copy the generated Spring Boot fat JAR
COPY --from=backend-build /app/backend/target/*.jar /app/app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar /app/app.jar"]
