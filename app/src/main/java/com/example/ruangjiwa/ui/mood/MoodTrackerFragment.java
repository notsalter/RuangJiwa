package com.example.ruangjiwa.ui.mood;

import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.Mood;
import com.example.ruangjiwa.databinding.FragmentMoodTrackerBinding;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.Query;
import com.google.firebase.firestore.QueryDocumentSnapshot;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class MoodTrackerFragment extends Fragment {

    private FragmentMoodTrackerBinding binding;
    private FirebaseFirestore db;
    private FirebaseAuth mAuth;
    private String userId;
    private Mood selectedMood = Mood.HAPPY; // Default mood

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        db = FirebaseFirestore.getInstance();
        mAuth = FirebaseAuth.getInstance();
        FirebaseUser currentUser = mAuth.getCurrentUser();
        if (currentUser != null) {
            userId = currentUser.getUid();
        }
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        binding = FragmentMoodTrackerBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Set up mood selection
        setupMoodSelection();

        // Set save button click listener
        binding.btnSaveMood.setOnClickListener(v -> saveMoodEntry());

        // Setup and configure the mood chart
        setupMoodChart();

        // Load previous mood entries
        loadMoodEntries();
    }

    private void setupMoodSelection() {
        // Set up click listeners for each mood
        binding.moodHappy.setOnClickListener(v -> selectMood(Mood.HAPPY, binding.moodHappy));
        binding.moodNeutral.setOnClickListener(v -> selectMood(Mood.NEUTRAL, binding.moodNeutral));
        binding.moodSad.setOnClickListener(v -> selectMood(Mood.SAD, binding.moodSad));
        binding.moodAnxious.setOnClickListener(v -> selectMood(Mood.ANXIOUS, binding.moodAnxious));
        binding.moodExcited.setOnClickListener(v -> selectMood(Mood.EXCITED, binding.moodExcited));

        // Select default mood
        selectMood(Mood.HAPPY, binding.moodHappy);
    }

    private void selectMood(Mood mood, View selectedView) {
        // Reset background of all mood options
        resetMoodSelectionBackground(binding.moodHappy);
        resetMoodSelectionBackground(binding.moodNeutral);
        resetMoodSelectionBackground(binding.moodSad);
        resetMoodSelectionBackground(binding.moodAnxious);
        resetMoodSelectionBackground(binding.moodExcited);

        // Highlight selected mood
        highlightSelectedMood(selectedView);

        // Store the selected mood
        this.selectedMood = mood;
    }

    private void resetMoodSelectionBackground(View view) {
        GradientDrawable shape = new GradientDrawable();
        shape.setShape(GradientDrawable.RECTANGLE);
        shape.setCornerRadius(16);
        shape.setColor(ContextCompat.getColor(requireContext(), android.R.color.transparent));
        view.setBackground(shape);
    }

    private void highlightSelectedMood(View view) {
        GradientDrawable shape = new GradientDrawable();
        shape.setShape(GradientDrawable.RECTANGLE);
        shape.setCornerRadius(16);
        shape.setColor(ContextCompat.getColor(requireContext(), R.color.gray_200));
        view.setBackground(shape);
    }

    private void saveMoodEntry() {
        if (userId == null) {
            Toast.makeText(requireContext(), "Anda perlu login terlebih dahulu", Toast.LENGTH_SHORT).show();
            return;
        }

        String note = binding.etMoodNote.getText().toString().trim();
        Date currentDate = new Date();

        // Create a mood entry map
        Map<String, Object> moodEntry = new HashMap<>();
        moodEntry.put("mood", selectedMood.name());
        moodEntry.put("note", note);
        moodEntry.put("timestamp", currentDate);

        // Format the date part for document ID (YYYY-MM-DD)
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        String dateStr = dateFormat.format(currentDate);

        // Format time for human-readable display
        SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm", Locale.getDefault());
        String timeStr = timeFormat.format(currentDate);

        // Save to Firestore - using date as document ID and adding time field
        moodEntry.put("time", timeStr);

        db.collection("users").document(userId)
                .collection("mood_entries").document(dateStr + "_" + System.currentTimeMillis())
                .set(moodEntry)
                .addOnSuccessListener(aVoid -> {
                    Toast.makeText(requireContext(), "Mood berhasil disimpan", Toast.LENGTH_SHORT).show();
                    binding.etMoodNote.setText("");  // Clear the note field

                    // Reload mood entries
                    loadMoodEntries();
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(requireContext(), "Gagal menyimpan mood: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
    }

    private void loadMoodEntries() {
        if (userId == null || binding == null) {
            return;
        }

        // Show loading state
        binding.moodChart.setNoDataText("Memuat data...");
        binding.moodChart.invalidate();
        binding.moodChart.setVisibility(View.VISIBLE);

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

        // Query Firestore for mood entries in the date range
        db.collection("users").document(userId)
                .collection("mood_entries")
                .whereGreaterThanOrEqualTo("timestamp", startDate)
                .whereLessThanOrEqualTo("timestamp", endDate)
                .orderBy("timestamp", Query.Direction.ASCENDING)
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    if (!queryDocumentSnapshots.isEmpty()) {
                        // Format for converting Date to day key (yyyy-MM-dd)
                        SimpleDateFormat keyFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
                        SimpleDateFormat displayFormat = new SimpleDateFormat("d MMM", new Locale("id", "ID"));

                        // Group entries by date
                        Map<String, List<String>> entriesByDate = new HashMap<>();
                        Map<String, String> dateDisplayMap = new HashMap<>();

                        // Process all entries and group them by date
                        for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                            Date timestamp = document.getDate("timestamp");
                            String moodStr = document.getString("mood");

                            if (timestamp != null && moodStr != null) {
                                String dateKey = keyFormat.format(timestamp);
                                String displayDate = displayFormat.format(timestamp);
                                dateDisplayMap.put(dateKey, displayDate);

                                if (!entriesByDate.containsKey(dateKey)) {
                                    entriesByDate.put(dateKey, new ArrayList<>());
                                }
                                entriesByDate.get(dateKey).add(moodStr);
                            }
                        }

                        // Generate chart data
                        processAndDisplayMoodData(entriesByDate, dateDisplayMap);

                        // Update UI to show how many entries
                        int totalEntries = queryDocumentSnapshots.size();
                        if (totalEntries > 0) {
                            binding.tvMoodStats.setText(getString(R.string.mood_entries_count, totalEntries));
                            binding.tvMoodStats.setVisibility(View.VISIBLE);
                        }
                    } else {
                        binding.moodChart.setNoDataText("Belum ada data mood");
                        binding.moodChart.invalidate();
                    }
                })
                .addOnFailureListener(e -> {
                    binding.moodChart.setNoDataText("Gagal memuat data");
                    binding.moodChart.invalidate();
                });
    }

    private void processAndDisplayMoodData(Map<String, List<String>> entriesByDate, Map<String, String> dateDisplayMap) {
        // Create entries for the chart
        List<Entry> chartEntries = new ArrayList<>();
        List<String> xAxisLabels = new ArrayList<>();

        // We'll use the 30 day range from today
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.DAY_OF_MONTH, -29); // Start from 29 days ago
        SimpleDateFormat keyFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());

        int index = 0;
        for (int i = 0; i < 30; i++) {
            String dateKey = keyFormat.format(calendar.getTime());
            String displayDate = dateDisplayMap.getOrDefault(dateKey,
                    new SimpleDateFormat("d MMM", new Locale("id", "ID")).format(calendar.getTime()));

            // Add the label for this date
            xAxisLabels.add(displayDate);

            if (entriesByDate.containsKey(dateKey)) {
                // We have mood entries for this date
                List<String> moods = entriesByDate.get(dateKey);
                float avgMoodValue = calculateAverageMoodValue(moods);
                chartEntries.add(new Entry(index, avgMoodValue));
            }


            calendar.add(Calendar.DAY_OF_MONTH, 1);
            index++;
        }

        // Update chart with the generated data
        updateMoodChart(chartEntries, xAxisLabels);
    }

    private float calculateAverageMoodValue(List<String> moods) {
        if (moods == null || moods.isEmpty()) {
            return 0f;
        }

        float total = 0f;
        for (String moodStr : moods) {
            total += getMoodValue(moodStr);
        }
        return total / moods.size();
    }

    private float getMoodValue(String moodStr) {
        try {
            Mood mood = Mood.valueOf(moodStr);
            switch (mood) {
                case EXCITED:
                    return 5f;
                case HAPPY:
                    return 4f;
                case NEUTRAL:
                    return 3f;
                case SAD:
                    return 2f;
                case ANXIOUS:
                    return 1f;
                default:
                    return 0f;
            }
        } catch (IllegalArgumentException e) {
            return 0f; // Default if mood string can't be parsed
        }
    }

    private void updateMoodChart(List<Entry> entries, List<String> xAxisLabels) {
        if (entries.isEmpty()) {
            binding.moodChart.setNoDataText("Tidak ada data mood untuk ditampilkan");
            binding.moodChart.invalidate();
            return;
        }

        // Create a dataset with the entries
        LineDataSet dataSet = new LineDataSet(entries, "Mood");
        dataSet.setColor(ContextCompat.getColor(requireContext(), R.color.primary));
        dataSet.setValueTextColor(ContextCompat.getColor(requireContext(), R.color.primary));
        dataSet.setLineWidth(2f);
        dataSet.setCircleColor(ContextCompat.getColor(requireContext(), R.color.primary));
        dataSet.setCircleRadius(4f);
        dataSet.setDrawValues(false);
        dataSet.setDrawFilled(true);
        dataSet.setFillColor(ContextCompat.getColor(requireContext(), R.color.primary_light));
        dataSet.setMode(LineDataSet.Mode.CUBIC_BEZIER);

        // Create line data object with the dataset
        LineData lineData = new LineData(dataSet);

        // Configure chart
        binding.moodChart.getXAxis().setValueFormatter(new IndexAxisValueFormatter(xAxisLabels));
        binding.moodChart.setData(lineData);
        binding.moodChart.getAxisLeft().setValueFormatter(new ValueFormatter() {
            @Override
            public String getFormattedValue(float value) {
                if (value >= 4.5f) return "Sangat Senang";
                else if (value >= 3.5f) return "Senang";
                else if (value >= 2.5f) return "Netral";
                else if (value >= 1.5f) return "Sedih";
                else if (value >= 0.5f) return "Cemas";
                else return "";
            }
        });

        // Refresh the chart
        binding.moodChart.invalidate();
    }

    private void setupMoodChart() {
        // Configure the mood chart appearance and behavior
        binding.moodChart.getDescription().setEnabled(false);
        binding.moodChart.setDrawGridBackground(false);
        binding.moodChart.setDragEnabled(true);
        binding.moodChart.setScaleEnabled(true);
        binding.moodChart.setPinchZoom(true);

        // Configure XAxis
        XAxis xAxis = binding.moodChart.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setGranularity(1f);
        xAxis.setGranularityEnabled(true);
        xAxis.setLabelRotationAngle(45f);

        // Set no data text
        binding.moodChart.setNoDataText("Memuat data mood...");
    }

    private List<String> getXAxisValues() {
        // Generate real date labels for the past 30 days
        List<String> xAxisValues = new ArrayList<>();
        Calendar calendar = Calendar.getInstance();
        SimpleDateFormat sdf = new SimpleDateFormat("d MMM", new Locale("id", "ID"));

        // Start from 29 days ago
        calendar.add(Calendar.DAY_OF_MONTH, -29);

        // Add values for a 30-day period
        for (int i = 0; i < 30; i++) {
            xAxisValues.add(sdf.format(calendar.getTime()));
            calendar.add(Calendar.DAY_OF_MONTH, 1);
        }

        return xAxisValues;
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
