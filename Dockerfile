# Stage 1: Build the JAR using Gradle
FROM gradle:8.5-jdk21 AS builder

WORKDIR /app
COPY . /app

# Use Gradle wrapper if present; fallback to system Gradle
RUN ./gradlew clean build -x test --no-daemon

# Stage 2: Create final image with Ansible and JRE
FROM hyperflex/jre21ansible:latest

# Copy the JAR from the builder stage
COPY --from=builder /app/server/build/libs/*.jar /app.jar

# Copy Ansible files
COPY data/ data/
COPY server/scripts/  /scripts

ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]