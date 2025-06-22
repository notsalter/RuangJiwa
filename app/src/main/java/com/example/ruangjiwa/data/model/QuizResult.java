package com.example.ruangjiwa.data.model;

/**
 * Model class representing quiz results
 */
public class QuizResult {
    public enum ResultCategory {
        LOW("Rendah", "Hasil Anda menunjukkan tingkat tekanan yang minimal. Terus praktikkan perawatan diri."),
        MODERATE("Sedang", "Hasil Anda menunjukkan tingkat tekanan yang sedang. Pertimbangkan beberapa strategi perawatan diri."),
        HIGH("Tinggi", "Hasil Anda menunjukkan tingkat tekanan yang signifikan. Pertimbangkan untuk mencari bantuan profesional.");

        private final String displayName;
        private final String description;

        ResultCategory(String displayName, String description) {
            this.displayName = displayName;
            this.description = description;
        }

        public String getDisplayName() {
            return displayName;
        }

        public String getDescription() {
            return description;
        }
    }

    private int totalScore;
    private ResultCategory category;

    public QuizResult(int totalScore) {
        this.totalScore = totalScore;
        this.category = calculateCategory(totalScore);
    }

    private ResultCategory calculateCategory(int score) {
        // Determine category based on total score
        // Assuming the quiz has 5-7 questions with max 3 points each
        // The max score would be around 15-21 points
        if (score < 7) {
            return ResultCategory.LOW;
        } else if (score < 14) {
            return ResultCategory.MODERATE;
        } else {
            return ResultCategory.HIGH;
        }
    }

    public int getTotalScore() {
        return totalScore;
    }

    public ResultCategory getCategory() {
        return category;
    }
}
