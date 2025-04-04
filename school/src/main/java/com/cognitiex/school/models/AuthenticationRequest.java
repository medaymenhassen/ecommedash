package com.cognitiex.school.models;

public class AuthenticationRequest {

    private String username;
    private String password;

    // Constructeur par défaut
    public AuthenticationRequest() {
    }

    // Constructeur avec paramètres
    public AuthenticationRequest(String username, String password, String companyName, String companyPassword) {
        this.username = username;
        this.password = password;

    }

    // Getters et Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

}
