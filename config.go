package main

import (
    "fmt"
    "log"
    "os"

    "github.com/joho/godotenv"
)

type AppConfig struct {
    ServerPort         string
    DatabaseConnString string
}

func LoadConfig() (*AppConfig, error) {
    err := godotenv.Load()
    if err != nil {
        log.Println("No .env file found")
    }

    config := AppConfig{
        ServerPort:         getEnv("SERVER_PORT", "8080"),
        DatabaseConnString: getEnv("DB_CONN_STRING", "user:password@tcp(localhost:3306)/dbname"),
    }

    return &config, nil
}

func getEnv(key, defaultValue string) string {
    if value, exists := os.LookupEnv(key); exists {
        return value
    }
    return defaultValue
}

func main() {
    config, err := LoadConfig()
    if err != nil {
        log.Fatalf("Error loading config: %v", err)
    }

    fmt.Printf("Server will start at port: %s\n", config.ServerPort)
    fmt.Printf("Database connected with connection string: %s\n", config.DatabaseConnString)
}