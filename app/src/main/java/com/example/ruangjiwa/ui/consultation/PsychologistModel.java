package com.example.ruangjiwa.ui.consultation;

import java.util.List;

public class PsychologistModel {
    private String id;
    private String name;
    private String title;
    private String imageUrl;
    private int experienceYears;
    private double rating;
    private List<String> specializations;
    private String availability;
    private boolean isFavorite;

    public PsychologistModel(String id, String name, String title, String imageUrl,
                             int experienceYears, double rating,
                             List<String> specializations, String availability) {
        this.id = id;
        this.name = name;
        this.title = title;
        this.imageUrl = imageUrl;
        this.experienceYears = experienceYears;
        this.rating = rating;
        this.specializations = specializations;
        this.availability = availability;
        this.isFavorite = false;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getTitle() {
        return title;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public int getExperienceYears() {
        return experienceYears;
    }

    public double getRating() {
        return rating;
    }

    public List<String> getSpecializations() {
        return specializations;
    }

    public String getAvailability() {
        return availability;
    }

    public boolean isFavorite() {
        return isFavorite;
    }

    public void setFavorite(boolean favorite) {
        isFavorite = favorite;
    }

    // Factory method to create sample data
    public static List<PsychologistModel> getSampleData() {
        return List.of(
            new PsychologistModel(
                "1",
                "Dr. Ratna Dewi, M.Psi",
                "Psikolog Klinis",
                "https://example.com/images/ratna.jpg",
                8,
                4.9,
                List.of("Depresi", "Kecemasan", "Relationship"),
                "Tersedia hari ini • 14:00 - 20:00"
            ),
            new PsychologistModel(
                "2",
                "Dr. Budi Santoso, M.Psi",
                "Psikolog Klinis",
                "https://example.com/images/budi.jpg",
                12,
                4.8,
                List.of("Trauma", "Kecemasan", "Stress"),
                "Tersedia besok • 09:00 - 17:00"
            ),
            new PsychologistModel(
                "3",
                "Dr. Maya Kusuma, M.Psi",
                "Psikolog Klinis",
                "https://example.com/images/maya.jpg",
                6,
                4.7,
                List.of("Relationship", "Depresi", "Self-esteem"),
                "Tersedia hari ini • 16:00 - 21:00"
            )
        );
    }
}
