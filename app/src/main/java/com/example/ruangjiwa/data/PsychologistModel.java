package com.example.ruangjiwa.data;

import java.util.List;

/**
 * Model class representing a psychologist in the app
 */
public class PsychologistModel {
    private String id;
    private String name;
    private String title;
    private String imageResource; // Resource name for the image
    private int experienceYears;
    private double rating;
    private List<String> specializations;
    private String availability;

    public PsychologistModel(String id, String name, String title, String imageResource,
                             int experienceYears, double rating,
                             List<String> specializations, String availability) {
        this.id = id;
        this.name = name;
        this.title = title;
        this.imageResource = imageResource;
        this.experienceYears = experienceYears;
        this.rating = rating;
        this.specializations = specializations;
        this.availability = availability;
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

    public String getImageResource() {
        return imageResource;
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
}
