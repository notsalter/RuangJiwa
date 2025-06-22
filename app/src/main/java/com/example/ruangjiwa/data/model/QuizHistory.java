package com.example.ruangjiwa.data.model;

import com.google.firebase.Timestamp;

/**
 * Model class representing a historical quiz result
 */
public class QuizHistory {
    private String id;
    private int score;
    private String category;
    private Timestamp timestamp;
    private String userId;

    // Required empty constructor for Firestore
    public QuizHistory() {
    }

    public QuizHistory(String id, int score, String category, Timestamp timestamp, String userId) {
        this.id = id;
        this.score = score;
        this.category = category;
        this.timestamp = timestamp;
        this.userId = userId;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Timestamp getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Timestamp timestamp) {
        this.timestamp = timestamp;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
