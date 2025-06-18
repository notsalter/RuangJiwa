package com.example.ruangjiwa.ui.journal;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.JournalEntry;
import com.example.ruangjiwa.data.model.Mood;
import com.example.ruangjiwa.databinding.FragmentJournalBinding;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class JournalFragment extends Fragment implements DateSelectorAdapter.OnDateClickListener, JournalEntryAdapter.OnEntryClickListener {

    private FragmentJournalBinding binding;
    private JournalEntryAdapter journalAdapter;
    private DateSelectorAdapter dateAdapter;
    private FirebaseFirestore db;
    private FirebaseAuth auth;
    private List<JournalEntry> entries;
    private Date selectedDate;
    private boolean isPrivateMode = false;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentJournalBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Initialize Firebase
        db = FirebaseFirestore.getInstance();
        auth = FirebaseAuth.getInstance();

        // Initialize date selection
        setupDateSelection();

        // Initialize journal entries list
        entries = new ArrayList<>();
        journalAdapter = new JournalEntryAdapter(entries, this);
        binding.rvPreviousEntries.setAdapter(journalAdapter);
        binding.rvPreviousEntries.setLayoutManager(new LinearLayoutManager(requireContext()));

        // Set up daily prompt
        setupDailyPrompt();

        // Set up journal editor
        setupJournalEditor();

        // Set up mood selection
        setupMoodSelection();

        // Set up privacy toggle
        setupPrivacyToggle();

        // Load journal entries
        loadJournalEntries();
    }

    private void setupDateSelection() {
        // Generate dates for last week and next week
        List<Date> dates = new ArrayList<>();
        Calendar calendar = Calendar.getInstance();

        // Start from 6 days ago
        calendar.add(Calendar.DAY_OF_MONTH, -6);

        // Add 14 days (one week before and after today)
        for (int i = 0; i < 14; i++) {
            dates.add(calendar.getTime());
            calendar.add(Calendar.DAY_OF_MONTH, 1);
        }

        // Initialize adapter and RecyclerView
        dateAdapter = new DateSelectorAdapter(dates, this);
        binding.rvDateSelector.setAdapter(dateAdapter);
        binding.rvDateSelector.setLayoutManager(
            new LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false));

        // Select today's date by default (index 6)
        selectedDate = new Date(); // Today
        dateAdapter.setSelectedPosition(6);
        updateDateDisplay();
    }

    private void setupDailyPrompt() {
        // In a real app, this would be fetched from a database of prompts
        // For now, we'll use a fixed prompt
        String prompt = "Apa 3 hal yang membuatmu bersyukur hari ini? Ceritakan mengapa hal tersebut berarti bagimu.";
        binding.tvPrompt.setText(prompt);
    }

    private void setupJournalEditor() {
        // Set up character counter
        binding.etJournalContent.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}

            @Override
            public void afterTextChanged(Editable s) {
                updateCharacterCount(s.length());
            }
        });

        // Initialize character count
        updateCharacterCount(0);

        // Set up save button
        binding.btnSave.setOnClickListener(v -> saveJournalEntry());
    }

    private void updateCharacterCount(int length) {
        binding.tvCharCount.setText(String.format("%d/500 karakter", length));

        // Optionally disable save button if empty or too long
        binding.btnSave.setEnabled(length > 0 && length <= 500);
    }

    private void setupMoodSelection() {
        // Set click listeners for mood selection
        binding.layoutHappy.setOnClickListener(v -> selectMood(Mood.HAPPY));
        binding.layoutNeutral.setOnClickListener(v -> selectMood(Mood.NEUTRAL));
        binding.layoutSad.setOnClickListener(v -> selectMood(Mood.SAD));
        binding.layoutAnxious.setOnClickListener(v -> selectMood(Mood.ANXIOUS));
        binding.layoutExcited.setOnClickListener(v -> selectMood(Mood.EXCITED));

        // Select happy by default
        selectMood(Mood.HAPPY);
    }

    private void selectMood(Mood mood) {
        // Reset all mood selections
        binding.layoutHappy.setSelected(false);
        binding.layoutNeutral.setSelected(false);
        binding.layoutSad.setSelected(false);
        binding.layoutAnxious.setSelected(false);
        binding.layoutExcited.setSelected(false);

        // Select the chosen mood
        switch (mood) {
            case HAPPY:
                binding.layoutHappy.setSelected(true);
                break;
            case NEUTRAL:
                binding.layoutNeutral.setSelected(true);
                break;
            case SAD:
                binding.layoutSad.setSelected(true);
                break;
            case ANXIOUS:
                binding.layoutAnxious.setSelected(true);
                break;
            case EXCITED:
                binding.layoutExcited.setSelected(true);
                break;
        }
    }

    private void setupPrivacyToggle() {
        binding.btnPrivacyToggle.setOnClickListener(v -> togglePrivacyMode());
    }

    private void togglePrivacyMode() {
        isPrivateMode = !isPrivateMode;

        // Update UI
        if (isPrivateMode) {
            binding.btnPrivacyToggle.setImageResource(R.drawable.ic_lock);
            binding.btnPrivacyToggle.setColorFilter(requireContext().getColor(R.color.primary));
        } else {
            binding.btnPrivacyToggle.setImageResource(R.drawable.ic_lock_open);
            binding.btnPrivacyToggle.setColorFilter(requireContext().getColor(R.color.gray_600));
        }
    }

    private void loadJournalEntries() {
        // In a real app, this would fetch entries from Firestore
        // For now, we'll use sample data
        entries.clear();

        // Sample entries
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_MONTH, -1); // Yesterday

        entries.add(new JournalEntry(
            "1",
            auth.getCurrentUser() != null ? auth.getCurrentUser().getUid() : "user1",
            "Hari ini adalah hari yang luar biasa! Presentasi projekku mendapat apresiasi yang sangat baik dari tim. Aku merasa sangat bersyukur atas dukungan rekan-rekan kerja yang selalu membantu...",
            cal.getTime(),
            Mood.HAPPY,
            new String[]{"Prestasi", "Bersyukur"},
            false
        ));

        cal.add(Calendar.DAY_OF_MONTH, -1); // 2 days ago

        entries.add(new JournalEntry(
            "2",
            auth.getCurrentUser() != null ? auth.getCurrentUser().getUid() : "user1",
            "Hari yang cukup normal. Menghabiskan waktu dengan rutinitas biasa di kantor. Mungkin aku perlu mencoba hal-hal baru untuk membuat hari-hariku lebih berwarna...",
            cal.getTime(),
            Mood.NEUTRAL,
            new String[]{"Refleksi", "Rutinitas"},
            false
        ));

        cal.add(Calendar.DAY_OF_MONTH, -1); // 3 days ago

        entries.add(new JournalEntry(
            "3",
            auth.getCurrentUser() != null ? auth.getCurrentUser().getUid() : "user1",
            "Hari ini aku merasa sedikit down karena beberapa masalah di kantor. Tapi aku mencoba untuk tetap positif dan mencari solusi terbaik. Besok pasti akan lebih baik...",
            cal.getTime(),
            Mood.SAD,
            new String[]{"Tantangan", "Optimis"},
            true
        ));

        // Update adapter
        journalAdapter.notifyDataSetChanged();
    }

    private void saveJournalEntry() {
        String content = binding.etJournalContent.getText().toString().trim();

        if (content.isEmpty()) {
            Toast.makeText(requireContext(), "Catatan tidak boleh kosong", Toast.LENGTH_SHORT).show();
            return;
        }

        // Determine selected mood
        Mood selectedMood = Mood.HAPPY; // Default
        if (binding.layoutHappy.isSelected()) {
            selectedMood = Mood.HAPPY;
        } else if (binding.layoutNeutral.isSelected()) {
            selectedMood = Mood.NEUTRAL;
        } else if (binding.layoutSad.isSelected()) {
            selectedMood = Mood.SAD;
        } else if (binding.layoutAnxious.isSelected()) {
            selectedMood = Mood.ANXIOUS;
        } else if (binding.layoutExcited.isSelected()) {
            selectedMood = Mood.EXCITED;
        }

        // In a real app, this would save to Firestore
        // For now, we'll just show a success message and reset the form

        Toast.makeText(requireContext(), "Catatan jurnal berhasil disimpan", Toast.LENGTH_SHORT).show();

        // Reset form
        binding.etJournalContent.setText("");
        selectMood(Mood.HAPPY);

        // Refresh entries list
        loadJournalEntries();
    }

    private void updateDateDisplay() {
        // Update UI to show the selected date
        SimpleDateFormat fullDateFormat = new SimpleDateFormat("EEEE, dd MMMM yyyy", new Locale("id", "ID"));
        String formattedDate = fullDateFormat.format(selectedDate);
        binding.tvSelectedDate.setText(formattedDate);
    }

    @Override
    public void onDateClick(Date date, int position) {
        selectedDate = date;
        dateAdapter.setSelectedPosition(position);
        updateDateDisplay();

        // In a real app, this would load entries for the selected date
        // For now, we'll just refresh the current list
        loadJournalEntries();
    }

    @Override
    public void onEntryClick(JournalEntry entry) {
        // Open the entry detail view
        JournalEntryDetailFragment detailFragment =
            JournalEntryDetailFragment.newInstance(entry.getId());
        detailFragment.show(getChildFragmentManager(), "EntryDetail");
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
