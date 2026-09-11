package com.vivamais.dto;

public class LoginResponse {

    private boolean authenticated;
    private String token;
    private String username;
    private String nome;
    private String cargo;
    private String message;

    public LoginResponse() {
    }

    public LoginResponse(boolean authenticated, String token, String username, String nome, String cargo, String message) {
        this.authenticated = authenticated;
        this.token = token;
        this.username = username;
        this.nome = nome;
        this.cargo = cargo;
        this.message = message;
    }

    public boolean isAuthenticated() {
        return authenticated;
    }

    public void setAuthenticated(boolean authenticated) {
        this.authenticated = authenticated;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCargo() {
        return cargo;
    }

    public void setCargo(String cargo) {
        this.cargo = cargo;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
