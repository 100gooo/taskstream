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

var jwtSecretKey = []byte(os.Getenv("JWT_SECRET"))

type UserCredentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type UserClaims struct {
	Username string `json:"username"`
	jwt.StandardClaims
}

var registeredUsers = map[string]string{
	"user1": "$2a$14$N0NfIHljLED/fT8b.O2FVuIx.JoJWp9TmlH1heUOBsIf6pC13X.a6",
}

func main() {
	http.HandleFunc("/signin", SignInHandler)
	http.HandleFunc("/welcome", WelcomeHandler)
	http.HandleFunc("/refresh", RefreshTokenHandler)

	log.Fatal(http.ListenAndServe(":8080", nil))
}

func SignInHandler(w http.ResponseWriter, r *http.Request) {
	var credentials UserCredentials
	err := json.NewDecoder(r.Body).Decode(&credentials)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	expectedPasswordHash, ok := registeredUsers[credentials.Username]

	if !ok || !ValidatePasswordHash(credentials.Password, expectedPasswordHash) {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	expirationTime := time.Now().Add(5 * time.Minute)
	claims := &UserClaims{
		Username: credentials.Username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString(jwtSecretKey)
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

func WelcomeHandler(w http.ResponseWriter, r *http.Request) {
	tokenString := ExtractBearerToken(r)

	claims := &UserClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecretKey, nil
	})

	if err != nil || !token.Valid {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	w.Write([]byte(fmt.Sprintf("Welcome %s!", claims.Username)))
}

func RefreshTokenHandler(w http.ResponseWriter, r *http.Request) {
	tokenString := ExtractBearerToken(r)

	claims := &UserClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecretKey, nil
	})

	if err != nil {
		if err == jwt.ErrSignatureInvalid {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if time.Unix(claims.ExpiresAt, 0).Sub(time.Now()) > 30*time.Second {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	expirationTime := time.Now().Add(5 * time.Minute)
	claims.ExpiresAt = expirationTime.Unix()
	newToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err = newToken.SignedString(jwtSecretKey)
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

func ValidatePasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func ExtractBearerToken(r *http.Request) string {
	bearerToken := r.Header.Get("Authorization")
	tokenParts := strings.Split(bearerToken, " ")
	if len(tokenParts) == 2 {
		return tokenParts[1]
	}
	return ""
}