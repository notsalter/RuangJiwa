package com.example.ruangjiwa.data.model;

/**
 * Model class representing a recommendation item for the user
 */
public class Recommendation {
    private String id;
    private String title;
    private Type type;
    private String description;
    private String imageUrl;

    public enum Type {
        AUDIO,      // Self-talk audio content
        JOURNAL,    // Journal template
        PSYCHOLOGIST // Recommended psychologist
    }

    public Recommendation() {
        // Required empty constructor for Firebase
    }

    public Recommendation(String id, String title, Type type, String description, String imageUrl) {
        this.id = id;
        this.title = title;
        this.type = type;
        this.description = description;
        this.imageUrl = imageUrl;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
