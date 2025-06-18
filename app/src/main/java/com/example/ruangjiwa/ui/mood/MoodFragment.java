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
import java.util.List;
import java.util.Locale;

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
            chartManager = new ChartManager(binding.moodChart);

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
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(requireContext(),
                    "Error setting up mood tracking. Please try again later: " + e.getMessage(),
                    Toast.LENGTH_SHORT).show();
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
        // In a real app, this would fetch from Firebase
        // For demo purposes, using mock data

        moodEntries.clear();

        // Create sample mood data for the past week
        Calendar cal = Calendar.getInstance();

        // Today
        moodEntries.add(new MoodEntry(
                "1",
                auth.getCurrentUser() != null ? auth.getCurrentUser().getUid() : "user1",
                Mood.HAPPY,
                8, // intensity 1-10
                "Presentasi projekku berjalan dengan sangat baik! Tim sangat mengapresiasi hasil kerjaku.",
                new Date(),
                new String[]{"Prestasi", "Kerja"}
        ));

        // Yesterday
        cal.add(Calendar.DAY_OF_MONTH, -1);
        moodEntries.add(new MoodEntry(
                "2",
                auth.getCurrentUser() != null ? auth.getCurrentUser().getUid() : "user1",
                Mood.NEUTRAL,
                5,
                "Hari yang biasa saja. Menghabiskan waktu dengan rutinitas normal.",
                cal.getTime(),
                new String[]{"Rutinitas"}
        ));

        // 2 days ago
        cal.add(Calendar.DAY_OF_MONTH, -1);
        moodEntries.add(new MoodEntry(
                "3",
                auth.getCurrentUser() != null ? auth.getCurrentUser().getUid() : "user1",
                Mood.SAD,
                3,
                "Berita buruk dari rumah membuat mood turun hari ini.",
                cal.getTime(),
                new String[]{"Keluarga", "Kesedihan"}
        ));

        // 3-6 days ago
        Mood[] moods = {Mood.NEUTRAL, Mood.HAPPY, Mood.EXCITED, Mood.ANXIOUS};
        int[] intensities = {6, 7, 9, 4};
        for (int i = 0; i < 4; i++) {
            cal.add(Calendar.DAY_OF_MONTH, -1);
            moodEntries.add(new MoodEntry(
                    "mood" + (i + 4),
                    auth.getCurrentUser() != null ? auth.getCurrentUser().getUid() : "user1",
                    moods[i],
                    intensities[i],
                    "",
                    cal.getTime(),
                    new String[]{}
            ));
        }

        // Update mood history
        moodHistoryAdapter.notifyDataSetChanged();

        // Update chart with mood data
        updateMoodChart();
    }

    private void setupMoodStats() {
        // Calculate average mood
        double averageMood = 7.5; // In a real app, this would be calculated
        binding.tvAverageMood.setText(String.format(Locale.getDefault(), "%.1f", averageMood));

        // Set mood entry count
        binding.tvEntryCount.setText(String.valueOf(moodEntries.size()));

        // Set streak count
        int streak = 5; // In a real app, this would be calculated
        binding.tvStreak.setText(String.valueOf(streak));
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

                for (int i = 0; i < 7; i++) {
                    SimpleDateFormat sdf = new SimpleDateFormat("dd MMM", new Locale("id", "ID"));
                    String dateLabel = sdf.format(cal.getTime());

                    // Find mood for this date (if exists)
                    int moodIntensity = findMoodIntensityForDate(cal.getTime());

                    dataPoints.add(new MoodDataPoint(dateLabel, moodIntensity));
                    cal.add(Calendar.DAY_OF_MONTH, 1);
                }
            } else {
                // Monthly view (simplified for demo)
                String[] dates = {"01 Mei", "05 Mei", "10 Mei", "15 Mei", "20 Mei", "25 Mei", "30 Mei"};
                int[] intensities = {6, 8, 7, 4, 5, 7, 8};

                for (int i = 0; i < dates.length; i++) {
                    dataPoints.add(new MoodDataPoint(dates[i], intensities[i]));
                }
            }

            // Safety check - ensure we have data before proceeding
            if (dataPoints.isEmpty()) {
                dataPoints.add(new MoodDataPoint("Today", 5));
            }

            // Explicitly check that chart exists before updating
            if (binding != null && binding.moodChart != null && chartManager != null) {
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

    private int findMoodIntensityForDate(Date date) {
        // Compare just the date part (ignoring time)
        Calendar dateCal = Calendar.getInstance();
        dateCal.setTime(date);
        dateCal.set(Calendar.HOUR_OF_DAY, 0);
        dateCal.set(Calendar.MINUTE, 0);
        dateCal.set(Calendar.SECOND, 0);
        dateCal.set(Calendar.MILLISECOND, 0);

        for (MoodEntry entry : moodEntries) {
            Calendar entryCal = Calendar.getInstance();
            entryCal.setTime(entry.getDate());
            entryCal.set(Calendar.HOUR_OF_DAY, 0);
            entryCal.set(Calendar.MINUTE, 0);
            entryCal.set(Calendar.SECOND, 0);
            entryCal.set(Calendar.MILLISECOND, 0);

            if (dateCal.equals(entryCal)) {
                return entry.getIntensity();
            }
        }

        // Default value if no mood found for the date
        return 5;
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
