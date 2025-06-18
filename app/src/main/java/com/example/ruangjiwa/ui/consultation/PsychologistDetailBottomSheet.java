package com.example.ruangjiwa.ui.consultation;

import android.app.Dialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.bumptech.glide.Glide;
import com.bumptech.glide.request.RequestOptions;
import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.Psychologist;
import com.example.ruangjiwa.databinding.BottomSheetPsychologistDetailBinding;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.google.firebase.firestore.FirebaseFirestore;

import java.util.Calendar;

public class PsychologistDetailBottomSheet extends BottomSheetDialogFragment {

    private BottomSheetPsychologistDetailBinding binding;
    private String psychologistId;
    private Psychologist psychologist;
    private FirebaseFirestore db;

    private static final String ARG_PSYCHOLOGIST_ID = "psychologist_id";

    public static PsychologistDetailBottomSheet newInstance(String psychologistId) {
        PsychologistDetailBottomSheet fragment = new PsychologistDetailBottomSheet();
        Bundle args = new Bundle();
        args.putString(ARG_PSYCHOLOGIST_ID, psychologistId);
        fragment.setArguments(args);
        return fragment;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) {
            psychologistId = getArguments().getString(ARG_PSYCHOLOGIST_ID);
        }
        db = FirebaseFirestore.getInstance();
    }

    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        return super.onCreateDialog(savedInstanceState);
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = BottomSheetPsychologistDetailBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Load psychologist data
        loadPsychologistData();

        // Setup date selection
        setupDateSelection();

        // Setup time slots
        setupTimeSlots();

        // Setup confirm button
        binding.btnConfirmAppointment.setOnClickListener(v -> confirmAppointment());
    }

    private void loadPsychologistData() {
        // In a real app, this would fetch data from Firestore
        // For now, using mock data based on ID

        if ("1".equals(psychologistId)) {
            psychologist = new Psychologist(
                "1",
                "Dr. Ratna Dewi, M.Psi",
                "Psikolog Klinis",
                8,
                4.9,
                253,
                new String[]{"Depresi", "Kecemasan", "Relationship"},
                "https://example.com/images/psychologist1.jpg",
                true
            );
        } else if ("2".equals(psychologistId)) {
            psychologist = new Psychologist(
                "2",
                "Dr. Budi Santoso, M.Psi",
                "Psikolog Klinis",
                12,
                4.8,
                187,
                new String[]{"Trauma", "Kecemasan", "Stress"},
                "https://example.com/images/psychologist2.jpg",
                false
            );
        } else if ("3".equals(psychologistId)) {
            psychologist = new Psychologist(
                "3",
                "Dr. Maya Kusuma, M.Psi",
                "Psikolog Klinis",
                6,
                4.7,
                156,
                new String[]{"Relationship", "Depresi", "Self-esteem"},
                "https://example.com/images/psychologist3.jpg",
                true
            );
        } else {
            dismiss();
            return;
        }

        // Populate UI with psychologist data
        binding.tvPsychologistName.setText(psychologist.getName());
        binding.tvPsychologistSpecialty.setText(psychologist.getSpecialty());
        binding.tvExperience.setText(String.format("%d tahun pengalaman", psychologist.getYearsExperience()));
        binding.tvRating.setText(String.format("%.1f", psychologist.getRating()));
        binding.tvReviewCount.setText(String.format("%d ulasan", psychologist.getReviewCount()));

        // Load psychologist image
        Glide.with(requireContext())
                .load(psychologist.getImageUrl())
                .apply(RequestOptions.circleCropTransform())
                .placeholder(R.drawable.ic_profile)
                .error(R.drawable.ic_profile)
                .into(binding.ivPsychologistPhoto);
    }

    private void setupDateSelection() {
        // In a real app, this would populate a calendar view or date picker
        // For simplicity, we'll use text buttons for a few dates
        Calendar calendar = Calendar.getInstance();

        // Today's date is already selected by default
        binding.chipToday.setText("Hari Ini");
        binding.chipToday.setOnClickListener(v -> selectDate(0));

        // Tomorrow
        calendar.add(Calendar.DAY_OF_MONTH, 1);
        binding.chipTomorrow.setText("Besok");
        binding.chipTomorrow.setOnClickListener(v -> selectDate(1));

        // Day after tomorrow
        calendar.add(Calendar.DAY_OF_MONTH, 1);
        binding.chipDayAfterTomorrow.setText("Lusa");
        binding.chipDayAfterTomorrow.setOnClickListener(v -> selectDate(2));

        // Select today by default
        selectDate(0);
    }

    private void selectDate(int daysFromToday) {
        // Update UI to show the selected date
        binding.chipToday.setChecked(daysFromToday == 0);
        binding.chipTomorrow.setChecked(daysFromToday == 1);
        binding.chipDayAfterTomorrow.setChecked(daysFromToday == 2);

        // In a real app, this would update the available time slots based on the selected date
        // For simplicity, we'll just use mock time slots
        setupTimeSlots();
    }

    private void setupTimeSlots() {
        // In a real app, this would fetch available time slots from the server
        // For simplicity, we'll use mock time slots

        // Reset all slots
        binding.chip9am.setEnabled(true);
        binding.chip10am.setEnabled(true);
        binding.chip11am.setEnabled(true);
        binding.chip1pm.setEnabled(true);
        binding.chip2pm.setEnabled(true);
        binding.chip3pm.setEnabled(true);
        binding.chip4pm.setEnabled(true);
        binding.chip5pm.setEnabled(true);

        // Make some slots unavailable (for demo purposes)
        binding.chip9am.setEnabled(false);
        binding.chip11am.setEnabled(false);
        binding.chip1pm.setEnabled(false);

        // Set click listeners
        binding.chip9am.setOnClickListener(v -> selectTimeSlot("09:00"));
        binding.chip10am.setOnClickListener(v -> selectTimeSlot("10:00"));
        binding.chip11am.setOnClickListener(v -> selectTimeSlot("11:00"));
        binding.chip1pm.setOnClickListener(v -> selectTimeSlot("13:00"));
        binding.chip2pm.setOnClickListener(v -> selectTimeSlot("14:00"));
        binding.chip3pm.setOnClickListener(v -> selectTimeSlot("15:00"));
        binding.chip4pm.setOnClickListener(v -> selectTimeSlot("16:00"));
        binding.chip5pm.setOnClickListener(v -> selectTimeSlot("17:00"));
    }

    private void selectTimeSlot(String time) {
        // In a real app, this would store the selected time
        // For simplicity, we'll just enable the confirm button
        binding.btnConfirmAppointment.setEnabled(true);
    }

    private void confirmAppointment() {
        // In a real app, this would create the appointment in the database
        // For simplicity, we'll just show a success message
        Toast.makeText(requireContext(), "Konsultasi berhasil dijadwalkan", Toast.LENGTH_SHORT).show();
        dismiss();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
