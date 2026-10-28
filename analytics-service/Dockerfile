ARG JDK=25
FROM maven:3.9-eclipse-temurin-${JDK} AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q package -DskipTests

FROM eclipse-temurin:${JDK}-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV JAVA_TOOL_OPTIONS="-Xmx300m -XX:+UseSerialGC -XX:TieredStopAtLevel=1"
CMD ["java", "-jar", "app.jar"]