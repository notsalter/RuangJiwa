package com.example.ruangjiwa.data.model;

/**
 * Model class representing a mental health professional
 */
public class Psychologist {
    private String id;
    private String name;
    private String specialty;
    private int yearsExperience;
    private double rating;
    private int reviewCount;
    private String[] specializations;
    private String imageUrl;
    private boolean availableToday;
    private boolean isFavorite;

    public Psychologist() {
        // Required empty constructor for Firebase
    }

    public Psychologist(String id, String name, String specialty, int yearsExperience,
                     double rating, int reviewCount, String[] specializations,
                     String imageUrl, boolean availableToday) {
        this.id = id;
        this.name = name;
        this.specialty = specialty;
        this.yearsExperience = yearsExperience;
        this.rating = rating;
        this.reviewCount = reviewCount;
        this.specializations = specializations;
        this.imageUrl = imageUrl;
        this.availableToday = availableToday;
        this.isFavorite = false;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public int getYearsExperience() {
        return yearsExperience;
    }

    public void setYearsExperience(int yearsExperience) {
        this.yearsExperience = yearsExperience;
    }

    public double getRating() {
        return rating;
    }

    public void setRating(double rating) {
        this.rating = rating;
    }

    public int getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(int reviewCount) {
        this.reviewCount = reviewCount;
    }

    public String[] getSpecializations() {
        return specializations;
    }

    public void setSpecializations(String[] specializations) {
        this.specializations = specializations;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public boolean isAvailableToday() {
        return availableToday;
    }

    public void setAvailableToday(boolean availableToday) {
        this.availableToday = availableToday;
    }

    public boolean isFavorite() {
        return isFavorite;
    }

    public void setFavorite(boolean favorite) {
        isFavorite = favorite;
    }
}
