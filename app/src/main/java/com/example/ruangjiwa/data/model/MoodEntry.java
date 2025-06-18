package com.example.ruangjiwa.data.model;

import java.util.Date;

/**
 * Model class representing a mood entry for mood tracking
 */
public class MoodEntry {
    private String id;
    private String userId;
    private Mood mood;
    private int intensity; // 1-10 scale
    private String notes;
    private Date date;
    private String[] tags;

    public MoodEntry() {
        // Required empty constructor for Firebase
    }

    public MoodEntry(String id, String userId, Mood mood, int intensity, String notes, Date date, String[] tags) {
        this.id = id;
        this.userId = userId;
        this.mood = mood;
        this.intensity = intensity;
        this.notes = notes;
        this.date = date;
        this.tags = tags;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Mood getMood() {
        return mood;
    }

    public void setMood(Mood mood) {
        this.mood = mood;
    }

    public int getIntensity() {
        return intensity;
    }

    public void setIntensity(int intensity) {
        this.intensity = intensity;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public String[] getTags() {
        return tags;
    }

    public void setTags(String[] tags) {
        this.tags = tags;
    }
}
