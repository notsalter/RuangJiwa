package com.example.ruangjiwa.ui.journal;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.JournalEntry;
import com.example.ruangjiwa.databinding.FragmentJournalBinding;
import com.google.android.material.chip.Chip;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.Query;
import com.google.firebase.firestore.QueryDocumentSnapshot;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class JournalFragment extends Fragment implements JournalAdapter.JournalItemListener {

    private FragmentJournalBinding binding;
    private JournalAdapter journalAdapter;
    private FirebaseFirestore db;
    private FirebaseAuth mAuth;
    private String userId;
    private List<JournalEntry> allEntries = new ArrayList<>();

    // Current filter state
    private boolean showFavoritesOnly = false;
    private String currentMoodFilter = null;

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        binding = FragmentJournalBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Initialize Firebase
        mAuth = FirebaseAuth.getInstance();
        db = FirebaseFirestore.getInstance();

        FirebaseUser currentUser = mAuth.getCurrentUser();
        if (currentUser != null) {
            userId = currentUser.getUid();
            setupUI();
            loadJournalEntries();
        } else {
            // Handle user not logged in
            showErrorAndNavigateToLogin("Please log in to view your journal");
        }
    }

    private void setupUI() {
        // Set up RecyclerView
        journalAdapter = new JournalAdapter(this);
        binding.rvJournalEntries.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.rvJournalEntries.setAdapter(journalAdapter);

        // Set up filter chips
        binding.chipAll.setOnCheckedChangeListener((buttonView, isChecked) -> {
            if (isChecked) {
                showFavoritesOnly = false;
                currentMoodFilter = null;
                filterEntries();
            }
        });

        binding.chipFavorites.setOnCheckedChangeListener((buttonView, isChecked) -> {
            if (isChecked) {
                showFavoritesOnly = true;
                currentMoodFilter = null;
                filterEntries();
            }
        });

        binding.chipByMood.setOnCheckedChangeListener((buttonView, isChecked) -> {
            if (isChecked) {
                showMoodFilterDialog();
            }
        });

        // Set up FAB to add new entry
        binding.fabAddEntry.setOnClickListener(v -> navigateToCreateEntry());

        // Set up empty state button
        binding.btnCreateFirstEntry.setOnClickListener(v -> navigateToCreateEntry());
    }

    private void loadJournalEntries() {
        // Show loading state if needed

        // Query Firestore for entries
        db.collection("users").document(userId).collection("journal_entries")
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        allEntries.clear();
                        for (QueryDocumentSnapshot document : task.getResult()) {
                            JournalEntry entry = document.toObject(JournalEntry.class);
                            allEntries.add(entry);
                        }

                        // Apply any current filters
                        filterEntries();

                        // Update UI based on whether we have entries
                        updateEmptyState();
                    } else {
                        Toast.makeText(requireContext(), "Error loading entries", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void filterEntries() {
        List<JournalEntry> filteredList = new ArrayList<>();

        for (JournalEntry entry : allEntries) {
            // Apply favorites filter
            if (showFavoritesOnly && !entry.isFavorite()) {
                continue;
            }

            // Apply mood filter
            if (currentMoodFilter != null && !entry.getMood().equals(currentMoodFilter)) {
                continue;
            }

            // Entry passed all filters
            filteredList.add(entry);
        }

        // Update the adapter with filtered list
        journalAdapter.updateData(filteredList);

        // Update empty state
        updateEmptyState();
    }

    private void updateEmptyState() {
        // Add null check for binding to prevent NullPointerException
        if (binding == null) {
            return;
        }

        if (journalAdapter.getItemCount() == 0) {
            binding.rvJournalEntries.setVisibility(View.GONE);
            binding.emptyStateLayout.setVisibility(View.VISIBLE);
        } else {
            binding.rvJournalEntries.setVisibility(View.VISIBLE);
            binding.emptyStateLayout.setVisibility(View.GONE);
        }
    }

    private void showMoodFilterDialog() {
        String[] moodOptions = {"Happy", "Neutral", "Sad", "Anxious", "Clear Filter"};

        AlertDialog.Builder builder = new AlertDialog.Builder(requireContext());
        builder.setTitle("Filter by Mood")
                .setItems(moodOptions, (dialog, which) -> {
                    // Handle mood filter selection
                    if (which < 4) {
                        // Selected a mood filter
                        currentMoodFilter = moodOptions[which].toLowerCase();
                        filterEntries();
                    } else {
                        // Clear filter (which == 4)
                        currentMoodFilter = null;
                        binding.chipAll.setChecked(true);
                    }
                })
                .show();
    }

    private void navigateToCreateEntry() {
        // Use the static factory method to create a new entry fragment
        JournalEntryDetailFragment fragment = JournalEntryDetailFragment.newInstance(true);

        // Replace the current fragment with the detail fragment
        requireActivity().getSupportFragmentManager().beginTransaction()
                .replace(R.id.fragment_container, fragment)
                .addToBackStack(null)
                .commit();
    }

    private void showErrorAndNavigateToLogin(String message) {
        Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show();
        // In a real app, navigate to login screen
    }

    // JournalAdapter.JournalItemListener interface implementations
    @Override
    public void onEntryClick(JournalEntry entry) {
        // In a real app, navigate to view the full entry
        Toast.makeText(requireContext(), "Viewing: " + entry.getTitle(), Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onFavoriteToggle(JournalEntry entry, boolean isFavorite) {
        // Update favorite status in Firestore
        db.collection("users").document(userId)
                .collection("journal_entries").document(entry.getId())
                .update("favorite", isFavorite)
                .addOnSuccessListener(aVoid -> {
                    // Update successful
                    String message = isFavorite ? "Added to favorites" : "Removed from favorites";
                    Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show();
                })
                .addOnFailureListener(e -> {
                    // Update failed
                    Toast.makeText(requireContext(), "Failed to update favorite status", Toast.LENGTH_SHORT).show();
                });
    }

    @Override
    public void onDeleteClick(JournalEntry entry) {
        // Show confirmation dialog
        new AlertDialog.Builder(requireContext())
                .setTitle("Delete Journal Entry")
                .setMessage("Are you sure you want to delete this entry?")
                .setPositiveButton("Delete", (dialog, which) -> {
                    // Delete from Firestore
                    db.collection("users").document(userId)
                            .collection("journal_entries").document(entry.getId())
                            .delete()
                            .addOnSuccessListener(aVoid -> {
                                Toast.makeText(requireContext(), "Entry deleted", Toast.LENGTH_SHORT).show();
                                // Remove from our local list and update UI
                                allEntries.remove(entry);
                                filterEntries();
                            })
                            .addOnFailureListener(e -> {
                                Toast.makeText(requireContext(), "Failed to delete entry", Toast.LENGTH_SHORT).show();
                            });
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
