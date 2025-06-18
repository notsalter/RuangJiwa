package com.example.ruangjiwa.ui.mood;

/**
 * Data class representing a single data point in the mood chart
 */
public class MoodDataPoint {
    private String date;
    private int intensity;

    public MoodDataPoint(String date, int intensity) {
        this.date = date;
        this.intensity = intensity;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public int getIntensity() {
        return intensity;
    }

    public void setIntensity(int intensity) {
        this.intensity = intensity;
    }
}
