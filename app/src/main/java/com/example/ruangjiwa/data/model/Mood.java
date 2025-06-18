package com.example.ruangjiwa.data.model;

/**
 * Enum representing different mood states for journal entries and mood tracking
 */
public enum Mood {
    HAPPY,
    NEUTRAL,
    SAD,
    ANXIOUS,
    EXCITED;

    /**
     * Get the display name for the mood in Indonesian
     */
    public String getDisplayName() {
        switch (this) {
            case HAPPY: return "Senang";
            case NEUTRAL: return "Biasa";
            case SAD: return "Sedih";
            case ANXIOUS: return "Cemas";
            case EXCITED: return "Excited";
            default: return "Unknown";
        }
    }

    /**
     * Get the color resource ID for this mood
     */
    public int getColorResource() {
        switch (this) {
            case HAPPY: return android.R.color.holo_orange_light; // Yellow
            case NEUTRAL: return android.R.color.holo_blue_light; // Light Blue
            case SAD: return android.R.color.holo_red_light; // Red
            case ANXIOUS: return android.R.color.holo_orange_dark; // Orange
            case EXCITED: return android.R.color.holo_green_light; // Green
            default: return android.R.color.darker_gray;
        }
    }

    /**
     * Get the icon resource ID for this mood
     */
    public int getIconResource() {
        switch (this) {
            case HAPPY: return com.example.ruangjiwa.R.drawable.ic_emotion_happy;
            case NEUTRAL: return com.example.ruangjiwa.R.drawable.ic_emotion_neutral;
            case SAD: return com.example.ruangjiwa.R.drawable.ic_emotion_sad;
            case ANXIOUS: return com.example.ruangjiwa.R.drawable.ic_emotion_anxious;
            case EXCITED: return com.example.ruangjiwa.R.drawable.ic_emotion_excited;
            default: return com.example.ruangjiwa.R.drawable.ic_emotion_neutral;
        }
    }
}
