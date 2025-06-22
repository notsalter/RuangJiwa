package com.example.ruangjiwa.data.model;

/**
 * Model class representing a quiz answer option
 */
public class QuizOption {
    private String text;
    private int pointValue;

    public QuizOption(String text, int pointValue) {
        this.text = text;
        this.pointValue = pointValue;
    }

    public String getText() {
        return text;
    }

    public int getPointValue() {
        return pointValue;
    }
}
