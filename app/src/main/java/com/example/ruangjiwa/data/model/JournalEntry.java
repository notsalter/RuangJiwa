package com.example.ruangjiwa.data.model;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Model class representing a journal entry in the RuangJiwa app.
 */
public class JournalEntry {
    private String id;
    private String title;
    private String content;
    private Date createdAt; // Using createdAt instead of date to match existing code
    private Mood mood;
    private List<String> tags;  // Changed from String[] to List<String>
    private boolean isPrivate;
    private boolean isFavorite;

    // Empty constructor for Firebase
    public JournalEntry() {
        this.tags = new ArrayList<>();  // Initialize as empty ArrayList
    }

    public JournalEntry(String id, String title, String content, Date createdAt, String moodString) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.createdAt = createdAt;
        this.mood = Mood.HAPPY; // Default mood
        this.tags = new ArrayList<>();  // Initialize as empty ArrayList
        this.isPrivate = false;
        this.isFavorite = false;
    }

    public JournalEntry(String id, String title, String content, Date createdAt, Mood mood, List<String> tags, boolean isPrivate) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.createdAt = createdAt;
        this.mood = mood;
        this.tags = tags != null ? tags : new ArrayList<>();
        this.isPrivate = isPrivate;
        this.isFavorite = false;
    }

    // Getters and setters
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public Date getDate() {
        return createdAt; // Alias for getCreatedAt for compatibility
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public void setDate(Date date) {
        this.createdAt = date; // Alias for setCreatedAt for compatibility
    }

    public Mood getMood() {
        return mood;
    }

    public void setMood(Mood mood) {
        this.mood = mood;
    }

    public void setMoodFromString(String moodString) {
        try {
            this.mood = Mood.valueOf(moodString.toUpperCase());
        } catch (IllegalArgumentException e) {
            this.mood = Mood.HAPPY; // Default mood
        }
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public boolean isPrivate() {
        return isPrivate;
    }

    public void setPrivate(boolean isPrivate) {
        this.isPrivate = isPrivate;
    }

    public boolean isFavorite() {
        return isFavorite;
    }

    public void setFavorite(boolean favorite) {
        isFavorite = favorite;
    }
}
