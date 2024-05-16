package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "sync"
    "time"

    "github.com/gorilla/mux"
    "github.com/joho/godotenv"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

type Task struct {
    ID          primitive.ObjectID `bson:"_id,omitempty"`
    Title       string             `bson:"title,omitempty"`
    Description string             `bson:"description,omitempty"`
    Done        bool               `bson:"done,omitempty"`
}

var client *mongo.Client
var once sync.Once

func connectToMongo() *mongo.Client {
    once.Do(func() {
        err := godotenv.Load()
        if err != nil {
            log.Fatal("Error loading .env file: ", err)
        }
        mongoURI := os.Getenv("MONGO_URI")

        clientOptions := options.Client().ApplyURI(mongoURI)
        var errConnect error
        client, errConnect = mongo.Connect(context.Background(), clientOptions) // Adjusted for context.Background()
        if errConnect != nil {
            log.Fatal("Error connecting to MongoDB: ", errConnect)
        }

        errPing := client.Ping(context.Background(), nil) // Adjusted for context.Background()
        if errPing != nil {
            log.Fatal("Failed to connect to MongoDB: ", errPing)
        }

        fmt.Println("Connected to MongoDB!")
    })
    return client
}

func main() {
    client = connectToMongo()
    r := mux.NewRouter()

    r.HandleFunc("/api/tasks", CreateTask).Methods("POST")
    r.HandleFunc("/api/tasks", GetTasks).Methods("GET")
    r.HandleFunc("/api/tasks/{id}", UpdateTask).Methods("PUT")
    r.HandleFunc("/api/tasks/{id}", DeleteTask).Methods("DELETE")

    log.Fatal(http.ListenAndServe(":8000", r))
}