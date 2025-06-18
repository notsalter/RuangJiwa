package com.example.ruangjiwa.ui.consultation;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.example.ruangjiwa.data.model.Psychologist;
import com.example.ruangjiwa.databinding.FragmentConsultationBinding;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;

import java.util.ArrayList;
import java.util.List;

public class ConsultationFragment extends Fragment implements PsychologistAdapter.OnPsychologistClickListener {

    private FragmentConsultationBinding binding;
    private PsychologistAdapter adapter;
    private List<Psychologist> psychologistList;
    private FirebaseFirestore db;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentConsultationBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        try {
            // Initialize Firestore with error handling
            db = FirebaseFirestore.getInstance();

            // Initialize psychologist list and adapter
            psychologistList = new ArrayList<>();
            adapter = new PsychologistAdapter(psychologistList, this);
            binding.rvPsychologists.setAdapter(adapter);
            binding.rvPsychologists.setLayoutManager(new LinearLayoutManager(requireContext()));

            // Set up filters
            setupFilters();

            // Load psychologists
            loadPsychologists();

            // Set up search functionality
            setupSearch();

        } catch (Exception e) {
            e.printStackTrace();
            if (getContext() != null) {
                Toast.makeText(getContext(),
                    "Error initializing consultation. Some features may be limited.",
                    Toast.LENGTH_SHORT).show();
            }
            // Create empty list if initialization failed
            psychologistList = new ArrayList<>();
        }
    }

    private void setupFilters() {
        // Set click listeners for filter buttons
        binding.chipAll.setOnClickListener(v -> filterPsychologists("all"));
        binding.chipDepression.setOnClickListener(v -> filterPsychologists("depression"));
        binding.chipAnxiety.setOnClickListener(v -> filterPsychologists("anxiety"));
        binding.chipRelationship.setOnClickListener(v -> filterPsychologists("relationship"));
        binding.chipTrauma.setOnClickListener(v -> filterPsychologists("trauma"));

        // Initially select "All" filter
        binding.chipAll.setChecked(true);
    }

    private void setupSearch() {
        binding.etSearch.setOnEditorActionListener((v, actionId, event) -> {
            searchPsychologists(binding.etSearch.getText().toString());
            return true;
        });
    }

    private void loadPsychologists() {
        try {
            // Show loading indicator
            if (binding != null && binding.progressBar != null) {
                binding.progressBar.setVisibility(View.VISIBLE);
            }

            // In a real app, this would be fetched from Firestore
            // For now, we'll use sample data
            psychologistList.clear();

            psychologistList.add(new Psychologist(
                    "1",
                    "Dr. Ratna Dewi, M.Psi",
                    "Psikolog Klinis",
                    8, // years of experience
                    4.9, // rating
                    253, // number of reviews
                    new String[]{"Depresi", "Kecemasan", "Relationship"},
                    "https://example.com/images/psychologist1.jpg",
                    true // available today
            ));

            psychologistList.add(new Psychologist(
                    "2",
                    "Dr. Budi Santoso, M.Psi",
                    "Psikolog Klinis",
                    12,
                    4.8,
                    187,
                    new String[]{"Trauma", "Kecemasan", "Stress"},
                    "https://example.com/images/psychologist2.jpg",
                    false // not available today
            ));

            psychologistList.add(new Psychologist(
                    "3",
                    "Dr. Maya Kusuma, M.Psi",
                    "Psikolog Klinis",
                    6,
                    4.7,
                    156,
                    new String[]{"Relationship", "Depresi", "Self-esteem"},
                    "https://example.com/images/psychologist3.jpg",
                    true // available today
            ));

            // Update the adapter and hide loading indicator
            if (adapter != null) {
                adapter.notifyDataSetChanged();
            }

            if (binding != null && binding.progressBar != null) {
                binding.progressBar.setVisibility(View.GONE);
            }

            // Show empty state if no psychologists
            updateEmptyState();

        } catch (Exception e) {
            e.printStackTrace();
            if (getContext() != null) {
                Toast.makeText(getContext(),
                    "Error loading psychologists: " + e.getMessage(),
                    Toast.LENGTH_SHORT).show();
            }

            // Hide loading indicator
            if (binding != null && binding.progressBar != null) {
                binding.progressBar.setVisibility(View.GONE);
            }
        }
    }

    private void updateEmptyState() {
        // Check if we have psychologists to show
        if (binding != null && psychologistList.isEmpty()) {
            // We don't have an emptyState view, so we'll just show a toast
            if (getContext() != null) {
                Toast.makeText(getContext(),
                    "Tidak ada psikolog yang tersedia saat ini",
                    Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void filterPsychologists(String filter) {
        // In a real app, this would filter the list or query Firestore with filters
        // For demo purposes, we're just showing a toast message
        Toast.makeText(requireContext(), "Filter applied: " + filter, Toast.LENGTH_SHORT).show();
    }

    private void searchPsychologists(String query) {
        // In a real app, this would search the list or query Firestore
        // For demo purposes, we're just showing a toast message
        Toast.makeText(requireContext(), "Searching for: " + query, Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onScheduleClick(Psychologist psychologist) {
        // Open appointment scheduling dialog/activity
        PsychologistDetailBottomSheet bottomSheet = PsychologistDetailBottomSheet.newInstance(psychologist.getId());
        bottomSheet.show(getChildFragmentManager(), "PsychologistDetail");
    }

    @Override
    public void onFavoriteClick(Psychologist psychologist) {
        // Toggle favorite status
        psychologist.setFavorite(!psychologist.isFavorite());
        adapter.notifyDataSetChanged();

        // In a real app, you would save this status to the database
        String message = psychologist.isFavorite() ?
                "Ditambahkan ke favorit" : "Dihapus dari favorit";
        Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
        adapter = null;
    }
}
