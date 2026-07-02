#!/bin/bash
# Startup script for DailyJournal Backend

# Create necessary directories
mkdir -p profile-photos

# Start the Spring Boot application
java -jar target/journal-backend-0.0.1-SNAPSHOT.jar
