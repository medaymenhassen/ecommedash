package com.cognitiex.school.models;

import com.cognitiex.school.validation.MissionOrColorCode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
@MissionOrColorCode
public class Color {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 200, nullable = false)
    private String title;

    @Column(name = "colorCode", length = 400, nullable = true)
    private String colorCode; // Utilisation de camelCase

    @Column(length = 400, nullable = true)
    private String mission;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getColorCode() {
        return colorCode; // Utilisation de camelCase
    }

    public void setColorCode(String colorCode) { // Utilisation de camelCase
        this.colorCode = colorCode;
    }

    public String getMission() {
        return mission;
    }

    public void setMission(String mission) {
        this.mission = mission;
    }
}
