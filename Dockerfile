# Stage 1: Build the JAR using Gradle
FROM gradle:8.5-jdk21 AS builder

WORKDIR /app
COPY . /app

RUN ./gradlew clean build -x test --no-daemon

FROM hyperflex/jre21ansible:latest

COPY --from=builder /app/server/build/libs/*.jar /app.jar

COPY data/ data/
COPY server/scripts/ /scripts

ENTRYPOINT ["java","--add-opens=java.base/java.security=ALL-UNNAMED","--add-opens=java.base/sun.security.util=ALL-UNNAMED","--add-opens=java.base/sun.security.rsa=ALL-UNNAMED","-Dspring.profiles.active=prod","-jar","/app.jar"]