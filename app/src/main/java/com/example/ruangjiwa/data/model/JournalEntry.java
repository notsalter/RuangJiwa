package com.example.ruangjiwa.data.model;

import java.util.Date;

/**
 * Model class representing a journal entry
 */
public class JournalEntry {
    private String id;
    private String userId;
    private String content;
    private Date date;
    private Mood mood;
    private String[] tags;
    private boolean isPrivate;
    private String title;
    private Date createdAt;

    public JournalEntry() {
        // Required empty constructor for Firebase
        this.createdAt = new Date();
    }

    public JournalEntry(String id, String userId, String content, Date date, Mood mood, String[] tags, boolean isPrivate) {
        this.id = id;
        this.userId = userId;
        this.content = content;
        this.date = date;
        this.mood = mood;
        this.tags = tags;
        this.isPrivate = isPrivate;
        this.createdAt = new Date();
    }

    // Constructor with title
    public JournalEntry(String id, String userId, String title, String content, Date date, Mood mood, String[] tags, boolean isPrivate) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.content = content;
        this.date = date;
        this.mood = mood;
        this.tags = tags;
        this.isPrivate = isPrivate;
        this.createdAt = new Date();
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public Mood getMood() {
        return mood;
    }

    public void setMood(Mood mood) {
        this.mood = mood;
    }

    public String[] getTags() {
        return tags;
    }

    public void setTags(String[] tags) {
        this.tags = tags;
    }

    public boolean isPrivate() {
        return isPrivate;
    }

    public void setPrivate(boolean isPrivate) {
        this.isPrivate = isPrivate;
    }

    public String getTitle() {
        return title != null ? title : "Untitled Entry";
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Date getCreatedAt() {
        return createdAt != null ? createdAt : date;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public String getMoodEmoji() {
        if (mood == null) return "😐";

        switch (mood) {
            case HAPPY: return "😊";
            case SAD: return "😢";
            case ANXIOUS: return "😰";
            case EXCITED: return "😃";
            case NEUTRAL: return "😐";
            default: return "😐";
        }
    }

    public String getPreview() {
        if (content == null || content.isEmpty()) {
            return "No content";
        }

        // Return first 50 characters as preview or the whole content if shorter
        return content.length() > 50 ? content.substring(0, 50) + "..." : content;
    }

    public int getWordCount() {
        if (content == null || content.isEmpty()) {
            return 0;
        }

        // Simple word count by splitting on whitespace
        String[] words = content.trim().split("\\s+");
        return words.length;
    }
}
