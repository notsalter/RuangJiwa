package com.example.ruangjiwa.ui.journal;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.example.ruangjiwa.data.SampleDataProvider;
import com.example.ruangjiwa.data.model.JournalEntry;
import com.example.ruangjiwa.databinding.FragmentJournalBinding;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.Random;

public class JournalFragment extends Fragment {

    private FragmentJournalBinding binding;
    private JournalAdapter journalAdapter;
    private String selectedMood = "😊";
    private Date currentDate = new Date();
    private SimpleDateFormat dateFormat = new SimpleDateFormat("EEEE, MMMM dd", Locale.getDefault());

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentJournalBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        setupViews();
        setupRecyclerView();
        loadJournalEntries();
        updateDateDisplay();
        
        // Load any existing draft
        loadDraft();
    }

    private void setupRecyclerView() {
        journalAdapter = new JournalAdapter(journalEntry -> {
            Toast.makeText(getContext(), "Opening: " + journalEntry.getTitle(), Toast.LENGTH_SHORT).show();
            // TODO: Navigate to detailed journal view
        });
        
        binding.previousEntries.setLayoutManager(new LinearLayoutManager(getContext()));
        binding.previousEntries.setAdapter(journalAdapter);
    }    private void setupViews() {
        // Setup date navigation
        binding.previousDay.setOnClickListener(v -> navigateDay(-1));
        binding.nextDay.setOnClickListener(v -> navigateDay(1));

        // Setup mood selection
        setupMoodSelection();

        // Setup journal actions
        binding.saveEntry.setOnClickListener(v -> saveJournalEntry());
        binding.generatePrompt.setOnClickListener(v -> generateWritingPrompt());

        // Setup entries list
        binding.previousEntries.setLayoutManager(new LinearLayoutManager(getContext()));
        
        // Setup real-time word count tracking
        setupWordCountTracking();
        
        // Setup auto-save (optional)
        setupAutoSave();
    }
    
    private void setupWordCountTracking() {
        binding.journalContent.addTextChangedListener(new android.text.TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                int wordCount = s.toString().trim().isEmpty() ? 0 : s.toString().trim().split("\\s+").length;
                updateWordCount(wordCount);
            }

            @Override
            public void afterTextChanged(android.text.Editable s) {}
        });
    }
    
    private void updateWordCount(int count) {
        // Update word count display if TextView exists in layout
        // For now, just update the hint or a toast occasionally
        if (count > 0 && count % 50 == 0) {
            Toast.makeText(getContext(), count + " words written", Toast.LENGTH_SHORT).show();
        }
    }
    
    private void setupAutoSave() {
        // Auto-save draft every 30 seconds if there's content
        // This is a simple implementation - in production, use WorkManager
        android.os.Handler autoSaveHandler = new android.os.Handler();
        Runnable autoSaveRunnable = new Runnable() {
            @Override
            public void run() {
                saveDraft();
                autoSaveHandler.postDelayed(this, 30000); // 30 seconds
            }
        };
        autoSaveHandler.postDelayed(autoSaveRunnable, 30000);
    }
    
    private void saveDraft() {
        String content = binding.journalContent.getText().toString().trim();
        if (!content.isEmpty() && content.length() > 10) {
            // Save draft to SharedPreferences
            android.content.SharedPreferences prefs = requireContext()
                .getSharedPreferences("journal_drafts", android.content.Context.MODE_PRIVATE);
            prefs.edit()
                .putString("current_draft", content)
                .putString("draft_mood", selectedMood)
                .putLong("draft_timestamp", System.currentTimeMillis())
                .apply();
        }
    }
    
    private void loadDraft() {
        android.content.SharedPreferences prefs = requireContext()
            .getSharedPreferences("journal_drafts", android.content.Context.MODE_PRIVATE);
        
        String draft = prefs.getString("current_draft", "");
        if (!draft.isEmpty()) {
            new android.app.AlertDialog.Builder(requireContext())
                .setTitle("Draft Found")
                .setMessage("We found an unsaved draft. Would you like to continue writing?")
                .setPositiveButton("Continue", (dialog, which) -> {
                    binding.journalContent.setText(draft);
                    selectedMood = prefs.getString("draft_mood", "😊");
                    selectMood(selectedMood);
                })
                .setNegativeButton("Discard", (dialog, which) -> {
                    // Clear draft
                    prefs.edit().clear().apply();
                })
                .show();
        }
    }

    private void updateDateDisplay() {
        binding.currentDate.setText(dateFormat.format(currentDate));
    }    private void setupMoodSelection() {
        // Reset all mood selections
        resetMoodSelection();
        
        // Set click listeners for mood selection
        binding.journalMoodHappy.setOnClickListener(v -> selectMood("😊"));
        binding.journalMoodNormal.setOnClickListener(v -> selectMood("🙂"));
        binding.journalMoodSad.setOnClickListener(v -> selectMood("😔"));
        binding.journalMoodAnxious.setOnClickListener(v -> selectMood("😰"));
        binding.journalMoodExcited.setOnClickListener(v -> selectMood("😄"));
    }

    private void selectMood(String mood) {
        selectedMood = mood;
        resetMoodSelection();
        
        // Highlight selected mood
        switch (mood) {
            case "😊":
                binding.journalMoodHappy.setSelected(true);
                break;
            case "🙂":
                binding.journalMoodNormal.setSelected(true);
                break;
            case "😔":
                binding.journalMoodSad.setSelected(true);
                break;
            case "😰":
                binding.journalMoodAnxious.setSelected(true);
                break;
            case "😄":
                binding.journalMoodExcited.setSelected(true);
                break;
        }
    }

    private void resetMoodSelection() {
        binding.journalMoodHappy.setSelected(false);
        binding.journalMoodNormal.setSelected(false);
        binding.journalMoodSad.setSelected(false);
        binding.journalMoodAnxious.setSelected(false);
        binding.journalMoodExcited.setSelected(false);
    }    private void navigateDay(int direction) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(currentDate);
        cal.add(Calendar.DAY_OF_MONTH, direction);
        currentDate = cal.getTime();
        updateDateDisplay();
        // TODO: Load entries for the new date
    }    private void saveJournalEntry() {
        String content = binding.journalContent.getText().toString().trim();
        
        // Form validation
        if (!validateJournalEntry(content)) {
            return;
        }
          // Create journal entry
        JournalEntry newEntry = new JournalEntry(
            String.valueOf(System.currentTimeMillis()), // ID as String
            "Journal Entry", // title
            content, // content
            selectedMood, // moodEmoji
            3, // moodLevel (default value)
            currentDate // date
        );
        
        // In a real app, this would save to database
        // For now, just show success message
        Toast.makeText(getContext(), "Journal entry saved successfully!", Toast.LENGTH_SHORT).show();
        
        // Clear form
        clearJournalForm();
        
        // Refresh the entries list
        loadJournalEntries();
    }
    
    private boolean validateJournalEntry(String content) {
        // Check if content is empty
        if (content.isEmpty()) {
            showValidationError("Please write something before saving your journal entry.");
            binding.journalContent.requestFocus();
            return false;
        }
        
        // Check minimum length
        if (content.length() < 10) {
            showValidationError("Your journal entry should be at least 10 characters long.");
            binding.journalContent.requestFocus();
            return false;
        }
        
        // Check maximum length (optional)
        if (content.length() > 5000) {
            showValidationError("Your journal entry is too long. Please keep it under 5000 characters.");
            binding.journalContent.requestFocus();
            return false;
        }
        
        // Check if mood is selected
        if (selectedMood == null || selectedMood.isEmpty()) {
            showValidationError("Please select your mood before saving.");
            return false;
        }
        
        return true;
    }
    
    private void showValidationError(String message) {
        new android.app.AlertDialog.Builder(requireContext())
            .setTitle("Validation Error")
            .setMessage(message)
            .setPositiveButton("OK", null)
            .show();
    }
    
    private void clearJournalForm() {
        binding.journalContent.setText("");
        binding.writingPrompt.setVisibility(View.GONE);
        selectedMood = "😊"; // Reset to default mood
        resetMoodSelection();
        selectMood(selectedMood);
        updateWordCount(0);
    }

    private void generateWritingPrompt() {
        String[] prompts = SampleDataProvider.getJournalPrompts();
        Random random = new Random();
        int randomIndex = random.nextInt(prompts.length);
        binding.writingPrompt.setText(prompts[randomIndex]);
        binding.writingPrompt.setVisibility(View.VISIBLE);
    }

    private void loadJournalEntries() {
        journalAdapter.setJournalEntries(SampleDataProvider.getSampleJournalEntries());
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
