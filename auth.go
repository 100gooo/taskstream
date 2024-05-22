package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func init() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}
}

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

type Credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type Claims struct {
	Username string `json:"username"`
	jwt.StandardClaims
}

var demoUsers = map[string]string{
	"user1": "$2a$14$N0NfIHljLED/fT8b.O2FVuIx.JoJWp9TmlH1heUOBsIf6pC13X.a6",
}

func main() {
	http.HandleFunc("/signin", signIn)
	http.HandleFunc("/welcome", welcome)
	http.HandleFunc("/refresh", refreshToken)

	log.Fatal(http.ListenAndServe(":8080", nil))
}

func signIn(w http.ResponseWriter, r *http.Request) {
	var userCredentials Credentials
	err := json.NewDecoder(r.Body).Decode(&userCredentials)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	storedPasswordHash, ok := demoUsers[userCredentials.Username]

	if !ok || !verifyPassword(userCredentials.Password, storedPasswordHash) {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	expirationTime := time.Now().Add(5 * time.Minute)
	claims := &Claims{
		Username: userCredentials.Username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:    "token",
		Value:   tokenString,
		Expires: expirationTime,
	})
}

func welcome(w http.ResponseWriter, r *http.Request) {
	tokenString := extractToken(r)

	userClaims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, userClaims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	w.Write([]byte(fmt.Sprintf("Welcome %s!", userClaims.Username)))
}

func refreshToken(w http.ResponseWriter, r *http.Request) {
	tokenString := extractToken(r)

	userClaims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, userClaims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		if err == jwt.ErrSignatureInvalid {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if time.Unix(userClaims.ExpiresAt, 0).Sub(time.Now()) > 30*time.Second {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	expirationTime := time.Now().Add(5 * time.Minute)
	userClaims.ExpiresAt = expirationTime.Unix()
	newToken := jwt.NewWithClaims(jwt.SigningMethodHS256, userClaims)
	tokenString, err = newToken.SignedString(jwtSecret)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:    "token",
		Value:   tokenString,
		Expires: expirationTime,
	})
}

func verifyPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func extractToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) == 2 {
		return tokenParts[1]
	}
	return ""
}