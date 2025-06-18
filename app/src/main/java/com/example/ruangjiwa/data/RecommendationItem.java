package com.example.ruangjiwa.data;

/**
 * Model class representing a recommendation item shown on the home screen
 */
public class RecommendationItem {
    private String id;
    private String title;
    private String description;
    private String type; // "audio", "journal", "psychologist"
    private String imageResource;

    public RecommendationItem(String id, String title, String description, String type, String imageResource) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.type = type;
        this.imageResource = imageResource;
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getType() {
        return type;
    }

    public String getImageResource() {
        return imageResource;
    }
}
