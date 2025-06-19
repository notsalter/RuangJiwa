package com.example.ruangjiwa.ui.mood;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.Mood;
import com.example.ruangjiwa.data.model.MoodEntry;
import com.example.ruangjiwa.databinding.FragmentMoodBinding;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class MoodFragment extends Fragment {

    private FragmentMoodBinding binding;
    private MoodHistoryAdapter moodHistoryAdapter;
    private FirebaseFirestore db;
    private FirebaseAuth auth;
    private List<MoodEntry> moodEntries;
    private ChartManager chartManager;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentMoodBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        try {
            // Initialize Firebase (safely)
            db = FirebaseFirestore.getInstance();
            auth = FirebaseAuth.getInstance();
        } catch (Exception e) {
            // Log error but continue - we'll use mock data instead
            e.printStackTrace();
            Toast.makeText(requireContext(),
                    "Firebase initialization failed. Using demo mode.",
                    Toast.LENGTH_SHORT).show();
        }

        // Initialize mood history first (doesn't depend on chart)
        setupMoodHistory();

        try {
            // Initialize chart manager (place in try/catch to prevent crashes)
            if (binding != null && binding.moodChart != null) {
                chartManager = new ChartManager(binding.moodChart);

                // Only proceed with chart-dependent setup if chart was initialized successfully
                if (chartManager.isInitialized()) {
                    // Initialize calendar view
                    setupCalendarView();

                    // Set up mood insights
                    setupMoodInsights();

                    // Load mood data (with mock data)
                    loadMoodData();

                    // Set up mood statistics
                    setupMoodStats();

                    // Set up time period selection
                    setupTimePeriodSelection();

                    // Set up calendar button
                    binding.btnCalendar.setOnClickListener(v -> toggleCalendarView());
                } else {
                    // Chart initialization failed, show a message and hide chart-related UI
                    Toast.makeText(requireContext(),
                            "Chart initialization failed. Some features may be limited.",
                            Toast.LENGTH_SHORT).show();

                    if (binding.moodChart != null) {
                        binding.moodChart.setVisibility(View.GONE);
                    }

                    // Still set up non-chart UI elements
                    setupMoodInsights();
                    setupMoodStats();
                    loadMoodData(); // Still load data for the history list
                }
            } else {
                Toast.makeText(requireContext(),
                        "Chart view not found. Some features may be limited.",
                        Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(requireContext(),
                    "Error setting up mood tracking. Some features may be limited.",
                    Toast.LENGTH_SHORT).show();

            // Hide chart UI if there was an error
            if (binding != null && binding.moodChart != null) {
                binding.moodChart.setVisibility(View.GONE);
            }

            // Still set up non-chart UI elements
            setupMoodInsights();
            setupMoodStats();
            loadMoodData(); // Still load data for the history list
        }
    }

    private void setupMoodHistory() {
        moodEntries = new ArrayList<>();
        moodHistoryAdapter = new MoodHistoryAdapter(moodEntries);
        binding.rvMoodHistory.setAdapter(moodHistoryAdapter);
        binding.rvMoodHistory.setLayoutManager(new LinearLayoutManager(requireContext()));
    }

    private void setupCalendarView() {
        // Initially hide calendar
        binding.calendarMood.setVisibility(View.GONE);

        // Set up calendar click listener
        binding.calendarMood.setOnDateChangeListener((view, year, month, dayOfMonth) -> {
            Calendar selectedDate = Calendar.getInstance();
            selectedDate.set(year, month, dayOfMonth);
            loadMoodForDate(selectedDate.getTime());
        });
    }

    private void setupMoodInsights() {
        // This would typically be generated from mood data analysis
        // For demo purposes, using static content

        // Best Time Insight
        binding.tvBestTimeInsight.setText(
                "Mood-mu cenderung lebih baik di pagi hari antara pukul 7-10 pagi");

        // Dominant Mood
        binding.tvDominantMoodInsight.setText(
                "Minggu ini kamu lebih sering merasa senang dan bersemangat");

        // Improvement Insight
        binding.tvImprovementInsight.setText(
                "Ada peningkatan mood sebesar 15% dibanding minggu lalu");
    }

    private void loadMoodData() {
        // Clear existing entries
        moodEntries.clear();

        // Ensure we have an authenticated user
        if (auth.getCurrentUser() == null) {
            Toast.makeText(requireContext(), "Anda perlu login terlebih dahulu", Toast.LENGTH_SHORT).show();
            return;
        }

        String userId = auth.getCurrentUser().getUid();

        // Setup date range for the last 30 days
        Calendar endCalendar = Calendar.getInstance();
        Calendar startCalendar = Calendar.getInstance();
        startCalendar.add(Calendar.DAY_OF_MONTH, -29); // From 29 days ago (for a 30-day period)

        // Reset time to start of day for start date and end of day for end date
        startCalendar.set(Calendar.HOUR_OF_DAY, 0);
        startCalendar.set(Calendar.MINUTE, 0);
        startCalendar.set(Calendar.SECOND, 0);

        endCalendar.set(Calendar.HOUR_OF_DAY, 23);
        endCalendar.set(Calendar.MINUTE, 59);
        endCalendar.set(Calendar.SECOND, 59);

        Date startDate = startCalendar.getTime();
        Date endDate = endCalendar.getTime();

        // Show loading indicator
        if (binding.progressBar != null) {
            binding.progressBar.setVisibility(View.VISIBLE);
        }

        // Query Firestore for mood entries in the date range
        db.collection("users").document(userId)
                .collection("mood_entries")
                .whereGreaterThanOrEqualTo("timestamp", startDate)
                .whereLessThanOrEqualTo("timestamp", endDate)
                .orderBy("timestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    if (!queryDocumentSnapshots.isEmpty()) {
                        for (com.google.firebase.firestore.QueryDocumentSnapshot document : queryDocumentSnapshots) {
                            try {
                                // Extract mood data from document
                                String moodStr = document.getString("mood");
                                Mood mood = Mood.valueOf(moodStr);
                                String note = document.getString("note");
                                Date timestamp = document.getDate("timestamp");

                                // Create MoodEntry object and add to list
                                MoodEntry entry = new MoodEntry(
                                        document.getId(),
                                        userId,
                                        mood,
                                        getMoodIntensity(mood), // Convert mood to intensity
                                        note != null ? note : "",
                                        timestamp,
                                        new String[]{}  // Tags not implemented yet
                                );

                                moodEntries.add(entry);
                            } catch (Exception e) {
                                // Skip entries with parsing errors
                                e.printStackTrace();
                            }
                        }

                        // Update mood history RecyclerView
                        moodHistoryAdapter.notifyDataSetChanged();

                        // Update mood insights based on real data
                        updateMoodInsights();

                        // Update mood statistics based on real data
                        updateMoodStats();

                        // Update chart with real mood data
                        updateMoodChart();

                    } else {
                        // No mood entries found
                        Toast.makeText(requireContext(), "Belum ada data mood", Toast.LENGTH_SHORT).show();
                    }

                    // Hide loading indicator
                    if (binding.progressBar != null) {
                        binding.progressBar.setVisibility(View.GONE);
                    }
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(requireContext(), "Gagal memuat data: " + e.getMessage(), Toast.LENGTH_SHORT).show();

                    // Hide loading indicator
                    if (binding.progressBar != null) {
                        binding.progressBar.setVisibility(View.GONE);
                    }
                });
    }

    // Helper method to convert mood to intensity value (1-10)
    private int getMoodIntensity(Mood mood) {
        switch (mood) {
            case EXCITED: return 10;
            case HAPPY: return 8;
            case NEUTRAL: return 5;
            case SAD: return 3;
            case ANXIOUS: return 2;
            default: return 5;
        }
    }

    /**
     * Setup mood statistics UI and components
     */
    private void setupMoodStats() {
        // Initialize statistics with default values
        binding.tvAverageMood.setText("0.0");
        binding.tvEntryCount.setText("0");
        binding.tvStreak.setText("0");

        // If we have mood entries already, update the stats
        if (moodEntries != null && !moodEntries.isEmpty()) {
            updateMoodStats();
        }
    }

    /**
     * Calculate and update mood statistics based on real data
     */
    private void updateMoodStats() {
        if (moodEntries == null || moodEntries.isEmpty()) {
            // No entries, use defaults or show zeros
            binding.tvAverageMood.setText("0.0");
            binding.tvEntryCount.setText("0");
            binding.tvStreak.setText("0");
            return;
        }

        // Set mood entry count
        binding.tvEntryCount.setText(String.valueOf(moodEntries.size()));

        // Calculate average mood intensity
        int totalIntensity = 0;
        for (MoodEntry entry : moodEntries) {
            totalIntensity += entry.getIntensity();
        }
        double averageMood = (double) totalIntensity / moodEntries.size();
        binding.tvAverageMood.setText(String.format(Locale.getDefault(), "%.1f", averageMood));

        // Calculate streak (consecutive days with mood entries)
        int streak = calculateStreak();
        binding.tvStreak.setText(String.valueOf(streak));
    }

    /**
     * Calculate the current streak of consecutive days with mood entries
     */
    private int calculateStreak() {
        if (moodEntries == null || moodEntries.isEmpty()) {
            return 0;
        }

        // Sort entries by date (most recent first)
        List<MoodEntry> sortedEntries = new ArrayList<>(moodEntries);
        sortedEntries.sort((e1, e2) -> e2.getDate().compareTo(e1.getDate()));

        // Start counting from today
        Calendar today = Calendar.getInstance();
        today.set(Calendar.HOUR_OF_DAY, 0);
        today.set(Calendar.MINUTE, 0);
        today.set(Calendar.SECOND, 0);
        today.set(Calendar.MILLISECOND, 0);

        // Check if we have an entry for today
        boolean hasEntryForToday = false;
        for (MoodEntry entry : sortedEntries) {
            Calendar entryCal = Calendar.getInstance();
            entryCal.setTime(entry.getDate());
            entryCal.set(Calendar.HOUR_OF_DAY, 0);
            entryCal.set(Calendar.MINUTE, 0);
            entryCal.set(Calendar.SECOND, 0);
            entryCal.set(Calendar.MILLISECOND, 0);

            if (entryCal.equals(today)) {
                hasEntryForToday = true;
                break;
            }
        }

        int streak = hasEntryForToday ? 1 : 0;

        if (streak > 0) {
            // Start checking consecutive previous days
            Calendar checkDate = today;

            while (true) {
                // Move to the previous day
                checkDate = (Calendar) checkDate.clone();
                checkDate.add(Calendar.DAY_OF_MONTH, -1);

                boolean hasEntryForDate = false;
                for (MoodEntry entry : sortedEntries) {
                    Calendar entryCal = Calendar.getInstance();
                    entryCal.setTime(entry.getDate());
                    entryCal.set(Calendar.HOUR_OF_DAY, 0);
                    entryCal.set(Calendar.MINUTE, 0);
                    entryCal.set(Calendar.SECOND, 0);
                    entryCal.set(Calendar.MILLISECOND, 0);

                    if (entryCal.equals(checkDate)) {
                        hasEntryForDate = true;
                        break;
                    }
                }

                if (hasEntryForDate) {
                    streak++;
                } else {
                    break;
                }
            }
        }

        return streak;
    }

    private void setupTimePeriodSelection() {
        binding.chipWeek.setOnClickListener(v -> {
            binding.chipWeek.setChecked(true);
            binding.chipMonth.setChecked(false);
            updateMoodChart();
        });

        binding.chipMonth.setOnClickListener(v -> {
            binding.chipMonth.setChecked(true);
            binding.chipWeek.setChecked(false);
            updateMoodChart();
        });
    }

    private void toggleCalendarView() {
        if (binding.calendarMood.getVisibility() == View.VISIBLE) {
            binding.calendarMood.setVisibility(View.GONE);
        } else {
            binding.calendarMood.setVisibility(View.VISIBLE);
        }
    }

    private void loadMoodForDate(Date date) {
        // In a real app, this would query for a specific date's mood
        // For demo purposes, just showing a toast
        SimpleDateFormat sdf = new SimpleDateFormat("dd MMMM yyyy", new Locale("id", "ID"));
        String formattedDate = sdf.format(date);
        Toast.makeText(requireContext(), "Memuat mood untuk " + formattedDate, Toast.LENGTH_SHORT).show();
    }

    private void updateMoodChart() {
        try {
            // Create data points for the chart
            List<MoodDataPoint> dataPoints = new ArrayList<>();

            // If viewing weekly data
            if (binding.chipWeek.isChecked()) {
                // Generate date labels for past week
                Calendar cal = Calendar.getInstance();
                cal.add(Calendar.DAY_OF_MONTH, -6); // Start from 6 days ago
                SimpleDateFormat sdf = new SimpleDateFormat("dd MMM", new Locale("id", "ID"));

                for (int i = 0; i < 7; i++) {
                    String dateLabel = sdf.format(cal.getTime());

                    // Find mood intensity for this date from real data
                    int moodIntensity = findAverageMoodIntensityForDate(cal.getTime());

                    // Only add a data point if we actually have mood data for this date
                    dataPoints.add(new MoodDataPoint(dateLabel, moodIntensity));
                    cal.add(Calendar.DAY_OF_MONTH, 1);
                }
            } else {
                // Monthly view (30 days)
                Calendar cal = Calendar.getInstance();
                cal.add(Calendar.DAY_OF_MONTH, -29); // Start from 29 days ago
                SimpleDateFormat sdf = new SimpleDateFormat("dd MMM", new Locale("id", "ID"));

                // First, prepare the labels for all 30 days
                List<String> allDateLabels = new ArrayList<>();
                for (int i = 0; i < 30; i++) {
                    allDateLabels.add(sdf.format(cal.getTime()));
                    cal.add(Calendar.DAY_OF_MONTH, 1);
                }

                // Reset calendar
                cal = Calendar.getInstance();
                cal.add(Calendar.DAY_OF_MONTH, -29); // Start from 29 days ago

                // Only display 6-8 labels on x-axis for better readability
                int step = 5;  // Show every 5th day

                for (int i = 0; i < 30; i++) {
                    String dateLabel = sdf.format(cal.getTime());

                    // Find mood intensity for this date from real data
                    int moodIntensity = findAverageMoodIntensityForDate(cal.getTime());

                    // Always add data point for all days
                    dataPoints.add(new MoodDataPoint(
                            // Only show label for every 5th day to avoid crowding
                            (i % step == 0) ? dateLabel : "",
                            moodIntensity
                    ));

                    cal.add(Calendar.DAY_OF_MONTH, 1);
                }
            }

            // Explicitly check that chart exists before updating
            if (binding != null && binding.moodChart != null && chartManager != null) {
                // Make sure we have at least one data point
                if (dataPoints.isEmpty()) {
                    // If no mood data, add an empty placeholder
                    Calendar cal = Calendar.getInstance();
                    SimpleDateFormat sdf = new SimpleDateFormat("dd MMM", new Locale("id", "ID"));
                    dataPoints.add(new MoodDataPoint(sdf.format(cal.getTime()), 0));
                }

                chartManager.updateChart(dataPoints);
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Prevent the app from crashing by showing an error message
            if (getContext() != null) {
                Toast.makeText(getContext(),
                        "Unable to display mood chart: " + e.getMessage(),
                        Toast.LENGTH_SHORT).show();
            }
        }
    }

    /**
     * Calculate the average mood intensity for a specific date
     */
    private int findAverageMoodIntensityForDate(Date date) {
        if (moodEntries == null || moodEntries.isEmpty()) {
            return 0; // No data, return 0 (which means no data point)
        }

        // Compare just the date part (ignoring time)
        Calendar dateCal = Calendar.getInstance();
        dateCal.setTime(date);
        dateCal.set(Calendar.HOUR_OF_DAY, 0);
        dateCal.set(Calendar.MINUTE, 0);
        dateCal.set(Calendar.SECOND, 0);
        dateCal.set(Calendar.MILLISECOND, 0);

        List<MoodEntry> entriesForDate = new ArrayList<>();

        // Find all entries for this date
        for (MoodEntry entry : moodEntries) {
            Calendar entryCal = Calendar.getInstance();
            entryCal.setTime(entry.getDate());
            entryCal.set(Calendar.HOUR_OF_DAY, 0);
            entryCal.set(Calendar.MINUTE, 0);
            entryCal.set(Calendar.SECOND, 0);
            entryCal.set(Calendar.MILLISECOND, 0);

            if (dateCal.getTimeInMillis() == entryCal.getTimeInMillis()) {
                entriesForDate.add(entry);
            }
        }

        // Calculate average mood intensity for this date
        if (!entriesForDate.isEmpty()) {
            int totalIntensity = 0;
            for (MoodEntry entry : entriesForDate) {
                totalIntensity += entry.getIntensity();
            }
            return totalIntensity / entriesForDate.size();
        }

        // No entries for this date
        return 0;
    }

    /**
     * Update mood insights based on actual mood data from Firestore
     */
    private void updateMoodInsights() {
        if (moodEntries == null || moodEntries.isEmpty()) {
            // No data to analyze, keep default insights
            return;
        }

        try {
            // 1. Find best time insight (morning, afternoon, evening)
            Map<String, Integer> timeOfDayCount = new HashMap<>();
            Map<String, Integer> timeOfDayTotal = new HashMap<>();

            for (MoodEntry entry : moodEntries) {
                if (entry.getDate() != null) {
                    Calendar cal = Calendar.getInstance();
                    cal.setTime(entry.getDate());
                    int hour = cal.get(Calendar.HOUR_OF_DAY);

                    String timeOfDay;
                    if (hour >= 5 && hour < 12) {
                        timeOfDay = "pagi";
                    } else if (hour >= 12 && hour < 17) {
                        timeOfDay = "siang";
                    } else if (hour >= 17 && hour < 21) {
                        timeOfDay = "sore";
                    } else {
                        timeOfDay = "malam";
                    }

                    timeOfDayCount.put(timeOfDay, timeOfDayCount.getOrDefault(timeOfDay, 0) + 1);
                    timeOfDayTotal.put(timeOfDay, timeOfDayTotal.getOrDefault(timeOfDay, 0) + entry.getIntensity());
                }
            }

            // Find best time of day for mood
            String bestTimeOfDay = null;
            float bestAverage = 0;

            for (String timeOfDay : timeOfDayCount.keySet()) {
                int count = timeOfDayCount.get(timeOfDay);
                int total = timeOfDayTotal.get(timeOfDay);
                float average = (float) total / count;

                if (average > bestAverage) {
                    bestAverage = average;
                    bestTimeOfDay = timeOfDay;
                }
            }

            if (bestTimeOfDay != null) {
                binding.tvBestTimeInsight.setText(
                        "Mood-mu cenderung lebih baik di waktu " + bestTimeOfDay);
            }

            // 2. Find dominant mood
            Map<Mood, Integer> moodCounts = new HashMap<>();
            for (MoodEntry entry : moodEntries) {
                moodCounts.put(entry.getMood(), moodCounts.getOrDefault(entry.getMood(), 0) + 1);
            }

            Mood dominantMood = null;
            int highestCount = 0;

            for (Map.Entry<Mood, Integer> entry : moodCounts.entrySet()) {
                if (entry.getValue() > highestCount) {
                    highestCount = entry.getValue();
                    dominantMood = entry.getKey();
                }
            }

            if (dominantMood != null) {
                String moodName;
                switch (dominantMood) {
                    case EXCITED: moodName = "sangat senang"; break;
                    case HAPPY: moodName = "senang"; break;
                    case NEUTRAL: moodName = "biasa"; break;
                    case SAD: moodName = "sedih"; break;
                    case ANXIOUS: moodName = "cemas"; break;
                    default: moodName = "bervariasi";
                }

                binding.tvDominantMoodInsight.setText(
                        "Minggu ini kamu lebih sering merasa " + moodName);
            }

            // 3. Calculate improvement insight (compare recent week with previous week)
            if (moodEntries.size() >= 7) {
                List<MoodEntry> recentWeek = new ArrayList<>();
                List<MoodEntry> previousWeek = new ArrayList<>();

                Calendar oneWeekAgo = Calendar.getInstance();
                oneWeekAgo.add(Calendar.DAY_OF_MONTH, -7);

                Calendar twoWeeksAgo = Calendar.getInstance();
                twoWeeksAgo.add(Calendar.DAY_OF_MONTH, -14);

                for (MoodEntry entry : moodEntries) {
                    Date entryDate = entry.getDate();
                    if (entryDate.after(oneWeekAgo.getTime())) {
                        recentWeek.add(entry);
                    } else if (entryDate.after(twoWeeksAgo.getTime()) && entryDate.before(oneWeekAgo.getTime())) {
                        previousWeek.add(entry);
                    }
                }

                if (!recentWeek.isEmpty() && !previousWeek.isEmpty()) {
                    // Calculate averages
                    float recentAvg = calculateAverageMoodIntensity(recentWeek);
                    float previousAvg = calculateAverageMoodIntensity(previousWeek);

                    // Calculate percentage change
                    float change = ((recentAvg - previousAvg) / previousAvg) * 100;

                    if (Math.abs(change) > 5) {  // Only show significant changes
                        String changeStr = String.format(Locale.getDefault(), "%.0f%%", Math.abs(change));
                        String direction = change > 0 ? "peningkatan" : "penurunan";

                        binding.tvImprovementInsight.setText(
                                "Ada " + direction + " mood sebesar " + changeStr + " dibanding minggu lalu");
                    } else {
                        binding.tvImprovementInsight.setText(
                                "Mood-mu relatif stabil dibandingkan minggu lalu");
                    }
                }
            }

        } catch (Exception e) {
            // If there's any error in analysis, log it but don't crash the app
            e.printStackTrace();
        }
    }

    private float calculateAverageMoodIntensity(List<MoodEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            return 0f;
        }

        int total = 0;
        for (MoodEntry entry : entries) {
            total += entry.getIntensity();
        }

        return (float) total / entries.size();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
