package com.example.ruangjiwa.data;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

/**
 * Utility class that provides sample data for the app
 */
public class SampleDataProvider {

    /**
     * Get a list of sample psychologists
     */
    public static List<PsychologistModel> getSamplePsychologists() {
        List<PsychologistModel> psychologists = new ArrayList<>();

        psychologists.add(new PsychologistModel(
            "1",
            "Dr. Ratna Dewi, M.Psi",
            "Psikolog Klinis",
            "default_psychologist",
            8,
            4.9,
            Arrays.asList("Depresi", "Kecemasan", "Relationship"),
            "Tersedia hari ini • 14:00 - 20:00"
        ));

        psychologists.add(new PsychologistModel(
            "2",
            "Dr. Budi Santoso, M.Psi",
            "Psikolog Klinis",
            "default_psychologist",
            12,
            4.8,
            Arrays.asList("Trauma", "Kecemasan", "Stress"),
            "Tersedia besok • 09:00 - 17:00"
        ));

        psychologists.add(new PsychologistModel(
            "3",
            "Dr. Maya Kusuma, M.Psi",
            "Psikolog Klinis",
            "default_psychologist",
            6,
            4.7,
            Arrays.asList("Relationship", "Depresi", "Self-esteem"),
            "Tersedia hari ini • 16:00 - 21:00"
        ));

        psychologists.add(new PsychologistModel(
            "4",
            "Dr. Arya Wijaya, M.Psi",
            "Psikolog Klinis",
            "default_psychologist",
            10,
            4.6,
            Arrays.asList("Trauma", "PTSD", "Anxiety"),
            "Tersedia besok • 10:00 - 18:00"
        ));

        return psychologists;
    }

    /**
     * Get the scheduled consultation appointment
     */
    public static ConsultationAppointment getScheduledConsultation() {
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.DAY_OF_MONTH, 1); // Tomorrow
        calendar.set(Calendar.HOUR_OF_DAY, 14);
        calendar.set(Calendar.MINUTE, 0);

        return new ConsultationAppointment(
            "1",
            "1", // Psychologist ID
            "Dr. Ratna Dewi, M.Psi",
            calendar.getTime(),
            60, // Duration in minutes
            "video" // Type: "video" or "chat"
        );
    }

    /**
     * Get sample journal prompts
     */
    public static List<String> getJournalPrompts() {
        List<String> prompts = new ArrayList<>();

        prompts.add("Apa 3 hal yang membuatmu bersyukur hari ini? Ceritakan mengapa hal tersebut berarti bagimu.");
        prompts.add("Bagaimana perasaanmu hari ini? Apa yang mempengaruhi mood-mu?");
        prompts.add("Apa tantangan terbesar yang kamu hadapi minggu ini dan bagaimana kamu mengatasinya?");
        prompts.add("Tuliskan 3 kekuatan dirimu dan bagaimana kamu menggunakannya hari ini.");
        prompts.add("Jika kamu bisa mengatakan sesuatu pada dirimu di masa lalu, apa yang akan kamu katakan?");

        return prompts;
    }

    /**
     * Get sample recommendations for the home screen
     */
    public static List<RecommendationItem> getSampleRecommendations() {
        List<RecommendationItem> recommendations = new ArrayList<>();

        recommendations.add(new RecommendationItem(
            "1",
            "Meditasi untuk Menenangkan Pikiran",
            "10 menit • Relaksasi",
            "audio",
            "placeholder_meditation"
        ));

        recommendations.add(new RecommendationItem(
            "2",
            "Refleksi Diri: Mengatasi Kesedihan",
            "5 menit • Reflektif",
            "journal",
            "placeholder_journal"
        ));

        recommendations.add(new RecommendationItem(
            "3",
            "Dr. Budi Santoso, M.Psi",
            "Spesialis Depresi & Kecemasan",
            "psychologist",
            "default_psychologist"
        ));

        return recommendations;
    }

    /**
     * Generate sample mood data for the chart
     */
    public static List<MoodDataPoint> getSampleMoodData() {
        List<MoodDataPoint> dataPoints = new ArrayList<>();

        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.DAY_OF_MONTH, -6); // 7 days ago

        // Generate data for the past 7 days
        for (int i = 0; i < 7; i++) {
            // Random value between 4 and 9
            int moodValue = 4 + (int)(Math.random() * 6);

            dataPoints.add(new MoodDataPoint(
                calendar.getTime(),
                moodValue
            ));

            calendar.add(Calendar.DAY_OF_MONTH, 1);
        }

        return dataPoints;
    }

    /**
     * Simple class to represent a mood data point for charts
     */
    public static class MoodDataPoint {
        private Date date;
        private int value;

        public MoodDataPoint(Date date, int value) {
            this.date = date;
            this.value = value;
        }

        public Date getDate() {
            return date;
        }

        public int getValue() {
            return value;
        }
    }
}
