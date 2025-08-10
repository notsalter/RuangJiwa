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

import com.example.ruangjiwa.data.SampleDataProvider;
import com.example.ruangjiwa.data.model.Psychologist;
import com.example.ruangjiwa.databinding.FragmentConsultationBinding;

import java.util.ArrayList;
import java.util.List;

public class ConsultationFragment extends Fragment {

    private FragmentConsultationBinding binding;
    private PsychologistAdapter psychologistAdapter;
    private List<Psychologist> allPsychologists = new ArrayList<>();

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentConsultationBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        setupViews();
        setupRecyclerView();
        loadPsychologists();
    }

    private void setupRecyclerView() {
        psychologistAdapter = new PsychologistAdapter(psychologist -> {
            Toast.makeText(getContext(), "Selected: " + psychologist.getName(), Toast.LENGTH_SHORT).show();
            // TODO: Navigate to booking screen
        });
        
        binding.psychologistsRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        binding.psychologistsRecyclerView.setAdapter(psychologistAdapter);
    }

    private void setupViews() {
        // Setup search
        binding.searchView.setOnQueryTextListener(new androidx.appcompat.widget.SearchView.OnQueryTextListener() {
            @Override
            public boolean onQueryTextSubmit(String query) {
                filterPsychologists(query);
                return true;
            }

            @Override
            public boolean onQueryTextChange(String newText) {
                if (newText.isEmpty()) {
                    loadPsychologists();
                }
                return true;
            }
        });

        // Setup filter buttons
        binding.filterAll.setOnClickListener(v -> filterBySpecialty("all"));
        binding.filterAnxiety.setOnClickListener(v -> filterBySpecialty("anxiety"));
        binding.filterDepression.setOnClickListener(v -> filterBySpecialty("depression"));
        binding.filterRelationship.setOnClickListener(v -> filterBySpecialty("relationship"));        // Setup RecyclerView
        binding.psychologistsRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
    }    private void loadPsychologists() {
        allPsychologists = SampleDataProvider.getSamplePsychologists();
        psychologistAdapter.setPsychologists(allPsychologists);
    }    private void filterPsychologists(String query) {
        List<Psychologist> filtered = new ArrayList<>();
        for (Psychologist psychologist : allPsychologists) {
            if (psychologist.getName().toLowerCase().contains(query.toLowerCase()) ||
                psychologist.getSpecialty().toLowerCase().contains(query.toLowerCase())) {
                filtered.add(psychologist);
            }
        }
        psychologistAdapter.setPsychologists(filtered);
    }    private void filterBySpecialty(String specialty) {
        List<Psychologist> filtered = new ArrayList<>();
        if (specialty.equals("all")) {
            filtered = allPsychologists;
        } else {
            for (Psychologist psychologist : allPsychologists) {
                if (psychologist.getSpecialty().toLowerCase().contains(specialty.toLowerCase())) {
                    filtered.add(psychologist);
                }
            }
        }
        psychologistAdapter.setPsychologists(filtered);
        
        // Update filter button states
        resetFilterButtons();
        switch (specialty) {
            case "anxiety":
                binding.filterAnxiety.setSelected(true);
                break;
            case "depression":
                binding.filterDepression.setSelected(true);
                break;
            case "relationship":
                binding.filterRelationship.setSelected(true);
                break;
            default:
                binding.filterAll.setSelected(true);
                break;
        }
    }

    private void resetFilterButtons() {
        binding.filterAll.setSelected(false);
        binding.filterAnxiety.setSelected(false);
        binding.filterDepression.setSelected(false);
        binding.filterRelationship.setSelected(false);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
