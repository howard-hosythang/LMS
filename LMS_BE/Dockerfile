# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy all pom.xml files first (cache dependency layer)
COPY pom.xml .
COPY library-shared/pom.xml             library-shared/
COPY library-auth-module/pom.xml        library-auth-module/
COPY library-user-module/pom.xml        library-user-module/
COPY library-catalog-module/pom.xml     library-catalog-module/
COPY library-circulation-module/pom.xml library-circulation-module/
COPY library-recommendation-module/pom.xml library-recommendation-module/
COPY library-bootstrap/pom.xml          library-bootstrap/
RUN mvn dependency:go-offline -B

# Copy source and build
COPY . .
RUN mvn package -DskipTests -pl library-bootstrap -am

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/library-bootstrap/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
