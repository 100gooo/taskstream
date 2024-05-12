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
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"github.com/joho/godotenv"
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
			log.Fatal("Error loading .env file")
		}
		mongoURI := os.Getenv("MONGO_URI")

		clientOptions := options.Client().ApplyURI(mongoURI)
		var errConnect error
		client, errConnect = mongo.Connect(context.TODO(), clientOptions)
		if errConnect != nil {
			log.Fatal(errConnect)
		}

		errConnect = client.Ping(context.TODO(), nil)
		if errConnect != nil {
			log.Fatal("Failed to connect to mongo:", errConnect)
		}

		fmt.Println("Connected to MongoDB!")
	})
	return client
}

func CreateTask(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var task Task

	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	collection := client.Database("goTasks").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.InsertOne(ctx, task)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(result)
}

func GetTasks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var tasks []Task
	collection := client.Database("goTasks").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	queryParams := r.URL.Query()
	title := queryParams.Get("title")

	var filter bson.M
	if title != "" {
		filter = bson.M{"title": bson.M{"$regex": primitive.Regex{Pattern: title, Options: "i"}}}
	} else {
		filter = bson.M{}
	}

	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)
	for cursor.Next(ctx) {
		var task Task
		if err = cursor.Decode(&task); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		tasks = append(tasks, task)
	}
	json.NewEncoder(w).Encode(tasks)
}

func UpdateTask(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var task Task
	if err = json.NewDecoder(r.Body).Decode(&task); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	collection := client.Database("goTasks").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.D{
			{"$set", bson.D{{"title", task.Title}, {"description", task.Description}, {"done", task.Done}}},
		},
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(result)
}

func DeleteTask(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	collection := client.Database("goTasks").Collection("tasks")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(result)
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