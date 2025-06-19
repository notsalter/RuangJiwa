package com.example.ruangjiwa.ui.journal;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.example.ruangjiwa.R; // Add this import for resource access
import com.example.ruangjiwa.data.model.JournalEntry;
import com.example.ruangjiwa.data.model.Mood;
import com.example.ruangjiwa.databinding.FragmentJournalEntryDetailBinding;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.google.android.material.chip.Chip;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.FirebaseFirestore;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

public class JournalEntryDetailFragment extends BottomSheetDialogFragment {

    private FragmentJournalEntryDetailBinding binding;
    private String entryId;
    private boolean isNewEntry = false;
    private FirebaseFirestore db;
    private JournalEntry entry;
    private FirebaseAuth mAuth;
    private String userId;

    private static final String ARG_ENTRY_ID = "entry_id";
    private static final String ARG_IS_NEW_ENTRY = "isNewEntry";

    public static JournalEntryDetailFragment newInstance(String entryId) {
        JournalEntryDetailFragment fragment = new JournalEntryDetailFragment();
        Bundle args = new Bundle();
        args.putString(ARG_ENTRY_ID, entryId);
        fragment.setArguments(args);
        return fragment;
    }

    public static JournalEntryDetailFragment newInstance(boolean isNewEntry) {
        JournalEntryDetailFragment fragment = new JournalEntryDetailFragment();
        Bundle args = new Bundle();
        args.putBoolean(ARG_IS_NEW_ENTRY, isNewEntry);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            entryId = getArguments().getString(ARG_ENTRY_ID);
            isNewEntry = getArguments().getBoolean(ARG_IS_NEW_ENTRY, false);
        }
        db = FirebaseFirestore.getInstance();
        mAuth = FirebaseAuth.getInstance();
        FirebaseUser currentUser = mAuth.getCurrentUser();
        if (currentUser != null) {
            userId = currentUser.getUid();
        }
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentJournalEntryDetailBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        if (isNewEntry) {
            setupForNewEntry();
        } else {
            // Load existing journal entry
            loadJournalEntry();
        }

        // Setup action buttons
        setupActionButtons();
    }

    private void setupForNewEntry() {
        // Set up UI for creating a new entry
        binding.tvTitle.setText("Buat Catatan Baru");

        // Show the EditText for input and hide the TextView
        binding.etContent.setVisibility(View.VISIBLE);
        binding.tvContent.setVisibility(View.GONE);

        // Hide the existing mood layout and date display
        binding.layoutMood.setVisibility(View.GONE);
        binding.tvDate.setVisibility(View.GONE);

        // Show the mood selector
        binding.moodSelectorContainer.setVisibility(View.VISIBLE);

        // Setup mood selection functionality
        setupMoodSelection();

        // Change button functions
        binding.btnEdit.setText("Simpan");
        binding.btnEdit.setOnClickListener(v -> saveNewEntry());
        binding.btnDelete.setVisibility(View.GONE);
    }

    private Mood selectedMood = Mood.HAPPY; // Default mood

    private void setupMoodSelection() {
        // Set up click listeners for each mood option
        binding.moodHappy.setOnClickListener(v -> selectMood(Mood.HAPPY, binding.moodHappy, R.drawable.ic_emotion_happy));
        binding.moodNeutral.setOnClickListener(v -> selectMood(Mood.NEUTRAL, binding.moodNeutral, R.drawable.ic_emotion_neutral));
        binding.moodSad.setOnClickListener(v -> selectMood(Mood.SAD, binding.moodSad, R.drawable.ic_emotion_sad));
        binding.moodAnxious.setOnClickListener(v -> selectMood(Mood.ANXIOUS, binding.moodAnxious, R.drawable.ic_emotion_anxious));

        // Set initial selected mood
        selectMood(Mood.HAPPY, binding.moodHappy, R.drawable.ic_emotion_happy);
    }

    private void selectMood(Mood mood, View selectedView, int iconRes) {
        // Reset background of all mood options
        binding.moodHappy.setBackgroundResource(android.R.color.transparent);
        binding.moodNeutral.setBackgroundResource(android.R.color.transparent);
        binding.moodSad.setBackgroundResource(android.R.color.transparent);
        binding.moodAnxious.setBackgroundResource(android.R.color.transparent);

        // Set background for selected mood
        selectedView.setBackgroundResource(R.drawable.bg_mood_selected);

        // Store the selected mood
        this.selectedMood = mood;
    }

    private void saveNewEntry() {
        // Get text from the EditText field
        String content = binding.etContent.getText().toString().trim();
        // Get title from user input or use a default
        String title = "Catatan Baru"; // You might want to add a title field in your layout

        if (content.isEmpty()) {
            Toast.makeText(requireContext(), "Konten tidak boleh kosong", Toast.LENGTH_SHORT).show();
            return;
        }

        // Create a new entry with selected mood
        String newEntryId = UUID.randomUUID().toString();
        JournalEntry newEntry = new JournalEntry(
            newEntryId,
            title,
            content,
            new Date(),  // Current date and time
            selectedMood,  // Use the selected mood from the UI
            new ArrayList<>(),  // Empty ArrayList for tags
            false  // Not private by default
        );

        // Save to Firestore
        if (userId != null) {
            Map<String, Object> entryMap = new HashMap<>();
            entryMap.put("id", newEntry.getId());
            entryMap.put("title", newEntry.getTitle());
            entryMap.put("content", newEntry.getContent());
            entryMap.put("createdAt", newEntry.getCreatedAt());
            entryMap.put("mood", newEntry.getMood().name());
            entryMap.put("tags", new ArrayList<>()); // Empty ArrayList for Firestore compatibility
            entryMap.put("private", false);
            entryMap.put("favorite", false);

            db.collection("users").document(userId)
                .collection("journal_entries").document(newEntryId)
                .set(entryMap)
                .addOnSuccessListener(aVoid -> {
                    Toast.makeText(requireContext(), "Catatan berhasil disimpan", Toast.LENGTH_SHORT).show();
                    dismiss();

                    // Navigate back to journal list
                    if (getParentFragmentManager() != null) {
                        getParentFragmentManager().popBackStack();
                    }
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(requireContext(), "Gagal menyimpan catatan: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
        } else {
            Toast.makeText(requireContext(), "Anda perlu login terlebih dahulu", Toast.LENGTH_SHORT).show();
        }
    }

    private void setupActionButtons() {
        if (!isNewEntry) {
            binding.btnEdit.setOnClickListener(v -> editEntry());
            binding.btnDelete.setOnClickListener(v -> deleteEntry());
        }
        binding.btnClose.setOnClickListener(v -> dismiss());
    }

    private void loadJournalEntry() {
        // In a real app, this would fetch from Firebase
        if (entryId == null) {
            Toast.makeText(requireContext(), "Catatan tidak ditemukan", Toast.LENGTH_SHORT).show();
            dismiss();
            return;
        }

        // Try to load from Firestore if we have userId
        if (userId != null) {
            db.collection("users").document(userId)
                .collection("journal_entries").document(entryId)
                .get()
                .addOnSuccessListener(document -> {
                    if (document.exists()) {
                        // Convert to JournalEntry object
                        entry = document.toObject(JournalEntry.class);
                        displayEntryDetails();
                    } else {
                        Toast.makeText(requireContext(), "Catatan tidak ditemukan", Toast.LENGTH_SHORT).show();
                        dismiss();
                    }
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(requireContext(), "Error loading entry: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    dismiss();
                });
        } else {
            // Fall back to mock data for demo purposes
            loadMockEntry();
        }
    }

    private void loadMockEntry() {
        // This is just for demo/testing, real app should use Firestore
        if ("1".equals(entryId)) {
            // Create a sample entry with ArrayList instead of String array
            ArrayList<String> tags = new ArrayList<>();
            tags.add("Prestasi");
            tags.add("Bersyukur");

            entry = new JournalEntry(
                "1",
                "Hari yang Produktif",
                "Hari ini adalah hari yang luar biasa! Presentasi projekku mendapat apresiasi yang sangat baik dari tim. Aku merasa sangat bersyukur atas dukungan rekan-rekan kerja yang selalu membantu. Pengalaman ini mengajarkan bahwa kolaborasi dan komunikasi adalah kunci untuk hasil yang baik.\n\nAku juga senang karena akhirnya bisa menyelesaikan bagian tersulit dari proyek ini tepat waktu. Rasanya seperti beban berat terangkat dari pundak. Sekarang aku bisa fokus pada tahap berikutnya dengan lebih tenang.",
                java.util.Calendar.getInstance().getTime(),
                Mood.HAPPY,
                tags,
                false
            );
            displayEntryDetails();
        } else {
            Toast.makeText(requireContext(), "Catatan tidak ditemukan", Toast.LENGTH_SHORT).show();
            dismiss();
        }
    }

    private void displayEntryDetails() {
        if (entry == null) {
            Toast.makeText(requireContext(), "Error: Entry is null", Toast.LENGTH_SHORT).show();
            dismiss();
            return;
        }

        // Display journal entry details
        binding.tvTitle.setText(entry.getTitle());
        binding.tvContent.setText(entry.getContent());

        // Format and display date
        SimpleDateFormat dateFormat = new SimpleDateFormat("dd MMMM yyyy, HH:mm", new Locale("id", "ID"));
        binding.tvDate.setText(dateFormat.format(entry.getCreatedAt()));

        // Set mood icon and text
        if (entry.getMood() != null) {
            binding.ivMoodIcon.setImageResource(entry.getMood().getIconResource());
            binding.ivMoodIcon.setColorFilter(requireContext().getColor(entry.getMood().getColorResource()));
            binding.tvMood.setText(entry.getMood().getDisplayName());
        }

        // Display tags if any
        binding.chipGroupTags.removeAllViews();
        for (String tag : entry.getTags()) {
            Chip chip = new Chip(requireContext());
            chip.setText(tag);
            chip.setClickable(false);
            binding.chipGroupTags.addView(chip);
        }

        // Show privacy indicator if entry is private
        if (entry.isPrivate()) {
            binding.ivPrivate.setVisibility(View.VISIBLE);
        } else {
            binding.ivPrivate.setVisibility(View.GONE);
        }
    }

    private void editEntry() {
        // Implement edit functionality
        // For now, just show a toast
        Toast.makeText(requireContext(), "Edit functionality not implemented yet", Toast.LENGTH_SHORT).show();
    }

    private void deleteEntry() {
        // Implement delete functionality
        // For now, just show a toast
        Toast.makeText(requireContext(), "Delete functionality not implemented yet", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
