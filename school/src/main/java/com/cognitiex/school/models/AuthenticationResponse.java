package com.cognitiex.school.models;

public class AuthenticationResponse {
    private String token;
    private String refreshToken;

    public AuthenticationResponse() {
        // Constructeur sans argument requis pour la sérialisation JSON
    }

    public AuthenticationResponse(String token, String refreshToken) {
        this.token = token;
        this.refreshToken = refreshToken;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}