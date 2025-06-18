package com.example.ruangjiwa.data;

import java.util.Date;
import java.util.List;

/**
 * Model class representing a mood entry in the app
 */
public class MoodEntry {
    private String id;
    private Date timestamp;
    private String moodType; // "happy", "sad", "neutral", "anxious", "excited"
    private int intensity; // 1-10 scale
    private String note;
    private List<String> tags;

    public MoodEntry(String moodType, int intensity, String note) {
        this.id = java.util.UUID.randomUUID().toString();
        this.timestamp = new Date();
        this.moodType = moodType;
        this.intensity = intensity;
        this.note = note;
    }

    public String getId() {
        return id;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public String getMoodType() {
        return moodType;
    }

    public int getIntensity() {
        return intensity;
    }

    public String getNote() {
        return note;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }
}
