package com.example.ruangjiwa.ui.home;

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
import com.example.ruangjiwa.data.model.Consultation;
import com.example.ruangjiwa.data.model.Recommendation;
import com.example.ruangjiwa.databinding.FragmentHomeBinding;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class HomeFragment extends Fragment {

    private FragmentHomeBinding binding;
    private ConsultationAdapter consultationAdapter;
    private RecommendationAdapter recommendationAdapter;
    private FirebaseAuth mAuth;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        try {
            binding = FragmentHomeBinding.inflate(inflater, container, false);
            return binding.getRoot();
        } catch (Exception e) {
            e.printStackTrace();
            // Fallback to a simple layout if binding fails
            return inflater.inflate(R.layout.fragment_home_simple, container, false);
        }
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        try {
            // Setup basic greeting safely - only if the views exist
            if (binding != null) {
                mAuth = FirebaseAuth.getInstance();
                setupBasicUI();
                setupConsultationSchedule();
                setupRecommendations();
                setupMoodCard();
                setupQuickAccess();
            }
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(requireContext(), "Terjadi kesalahan saat memuat halaman", Toast.LENGTH_SHORT).show();
        }
    }

    private void setupBasicUI() {
        // Setup greeting based on time of day
        Calendar calendar = Calendar.getInstance();
        int hourOfDay = calendar.get(Calendar.HOUR_OF_DAY);

        String greeting;
        if (hourOfDay < 12) {
            greeting = "Selamat pagi,";
        } else if (hourOfDay < 15) {
            greeting = "Selamat siang,";
        } else if (hourOfDay < 18) {
            greeting = "Selamat sore,";
        } else {
            greeting = "Selamat malam,";
        }

        binding.tvGreeting.setText(greeting);

        // Set current date
        SimpleDateFormat sdf = new SimpleDateFormat("dd MMMM yyyy", new Locale("id", "ID"));
        String currentDate = sdf.format(new Date());
        // There's no tvDate in the layout, so comment this out or add it to the layout
        // binding.tvDate.setText(currentDate);

        // Set user name
        FirebaseUser currentUser = mAuth.getCurrentUser();
        if (currentUser != null) {
            String displayName = currentUser.getDisplayName();
            if (displayName != null && !displayName.isEmpty()) {
                binding.tvUsername.setText(displayName); // Changed from tvUserName to tvUsername
            } else {
                binding.tvUsername.setText("Pengguna"); // Changed from tvUserName to tvUsername
            }
        }
    }

    private void setupConsultationSchedule() {
        try {
            // Example of scheduled consultation data
            List<Consultation> consultations = new ArrayList<>();

            // Add example consultation (in a real app, this would come from a database)
            Calendar consultationTime = Calendar.getInstance();
            consultationTime.add(Calendar.DAY_OF_MONTH, 1); // Tomorrow
            consultationTime.set(Calendar.HOUR_OF_DAY, 14);
            consultationTime.set(Calendar.MINUTE, 0);

            Consultation nextConsultation = new Consultation(
                    "1",
                    "Dr. Ratna Dewi, M.Psi",
                    "Psikolog Klinis",
                    "https://example.com/images/psychologist1.jpg",
                    consultationTime.getTime(),
                    60, // Duration in minutes
                    "Confirmed"
            );

            consultations.add(nextConsultation);

            // Check if views exist before using them
            if (consultations.isEmpty() || binding.getRoot().findViewById(R.id.cardUpcomingConsultation) == null) {
                return;
            }

            // For demonstration purposes, we'll use findViewById as a fallback
            // instead of binding.cardUpcomingConsultation which might not exist yet
            View cardUpcomingConsultation = binding.getRoot().findViewById(R.id.cardUpcomingConsultation);
            View tvNoConsultation = binding.getRoot().findViewById(R.id.tvNoConsultation);

            if (cardUpcomingConsultation != null && tvNoConsultation != null) {
                cardUpcomingConsultation.setVisibility(View.VISIBLE);
                tvNoConsultation.setVisibility(View.GONE);

                // Setup the consultation card with data
                Consultation next = consultations.get(0);

                // Try to find each view safely
                View tvPsychologistName = binding.getRoot().findViewById(R.id.tvPsychologistName);
                View tvPsychologistSpecialty = binding.getRoot().findViewById(R.id.tvPsychologistSpecialty);
                View tvConsultationDateTime = binding.getRoot().findViewById(R.id.tvConsultationDateTime);
                View btnVideoCall = binding.getRoot().findViewById(R.id.btnVideoCall);
                View btnChat = binding.getRoot().findViewById(R.id.btnChat);

                if (tvPsychologistName != null && tvPsychologistName instanceof android.widget.TextView) {
                    ((android.widget.TextView) tvPsychologistName).setText(next.getPsychologistName());
                }

                if (tvPsychologistSpecialty != null && tvPsychologistSpecialty instanceof android.widget.TextView) {
                    ((android.widget.TextView) tvPsychologistSpecialty).setText(next.getPsychologistSpecialty());
                }

                if (tvConsultationDateTime != null && tvConsultationDateTime instanceof android.widget.TextView) {
                    // Format and set date
                    SimpleDateFormat dateFormat = new SimpleDateFormat("EEEE, dd MMMM yyyy • HH:mm", new Locale("id", "ID"));
                    String formattedDate = dateFormat.format(next.getDateTime());
                    ((android.widget.TextView) tvConsultationDateTime).setText(formattedDate);
                }

                // Set click listeners if views exist
                if (btnVideoCall != null) {
                    btnVideoCall.setOnClickListener(v -> startVideoCall(next.getId()));
                }

                if (btnChat != null) {
                    btnChat.setOnClickListener(v -> startChat(next.getId()));
                }
            } else if (cardUpcomingConsultation != null && tvNoConsultation != null) {
                cardUpcomingConsultation.setVisibility(View.GONE);
                tvNoConsultation.setVisibility(View.VISIBLE);
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Silently handle missing views
        }
    }

    private void setupRecommendations() {
        try {
            // Create sample recommendations
            List<Recommendation> recommendations = new ArrayList<>();

            recommendations.add(new Recommendation(
                    "1",
                    "Meditasi untuk Menenangkan Pikiran",
                    Recommendation.Type.AUDIO,
                    "10 menit • Relaksasi",
                    "https://example.com/images/meditation.jpg"
            ));

            recommendations.add(new Recommendation(
                    "2",
                    "Refleksi Diri: Mengatasi Kesedihan",
                    Recommendation.Type.JOURNAL,
                    "5 menit • Reflektif",
                    "https://example.com/images/journal.jpg"
            ));

            recommendations.add(new Recommendation(
                    "3",
                    "Dr. Budi Santoso, M.Psi",
                    Recommendation.Type.PSYCHOLOGIST,
                    "Spesialis Depresi & Kecemasan",
                    "https://example.com/images/psychologist2.jpg"
            ));

            // Check if RecyclerView exists
            View recyclerView = binding.getRoot().findViewById(R.id.rvRecommendations);
            if (recyclerView != null && recyclerView instanceof androidx.recyclerview.widget.RecyclerView) {
                // Set up RecyclerView
                recommendationAdapter = new RecommendationAdapter(recommendations);
                ((androidx.recyclerview.widget.RecyclerView) recyclerView).setAdapter(recommendationAdapter);
                ((androidx.recyclerview.widget.RecyclerView) recyclerView).setLayoutManager(
                        new LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false));
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Silently handle missing views
        }
    }

    private void setupMoodCard() {
        try {
            // Find mood-related views
            View tvMoodDate = binding.getRoot().findViewById(R.id.tvMoodDate);
            View layoutHappy = binding.getRoot().findViewById(R.id.layoutHappy);
            View layoutNeutral = binding.getRoot().findViewById(R.id.layoutNeutral);
            View layoutSad = binding.getRoot().findViewById(R.id.layoutSad);
            View layoutAnxious = binding.getRoot().findViewById(R.id.layoutAnxious);
            View btnSaveMood = binding.getRoot().findViewById(R.id.btnSaveMood);

            // Set current date on mood card if view exists
            if (tvMoodDate != null && tvMoodDate instanceof android.widget.TextView) {
                SimpleDateFormat sdf = new SimpleDateFormat("dd MMMM yyyy", new Locale("id", "ID"));
                String currentDate = sdf.format(new Date());
                ((android.widget.TextView) tvMoodDate).setText(currentDate);
            }

            // Set click listeners for mood selection if views exist
            if (layoutHappy != null) {
                layoutHappy.setOnClickListener(v -> selectMood("happy"));
            }

            if (layoutNeutral != null) {
                layoutNeutral.setOnClickListener(v -> selectMood("neutral"));
            }

            if (layoutSad != null) {
                layoutSad.setOnClickListener(v -> selectMood("sad"));
            }

            if (layoutAnxious != null) {
                layoutAnxious.setOnClickListener(v -> selectMood("anxious"));
            }

            // Set save button click listener if view exists
            if (btnSaveMood != null) {
                btnSaveMood.setOnClickListener(v -> saveMood());
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Silently handle missing views
        }
    }

    private void selectMood(String mood) {
        try {
            // Find mood-related views
            View layoutHappy = binding.getRoot().findViewById(R.id.layoutHappy);
            View layoutNeutral = binding.getRoot().findViewById(R.id.layoutNeutral);
            View layoutSad = binding.getRoot().findViewById(R.id.layoutSad);
            View layoutAnxious = binding.getRoot().findViewById(R.id.layoutAnxious);

            if (layoutHappy == null || layoutNeutral == null || layoutSad == null || layoutAnxious == null) {
                return;
            }

            // Reset all mood selections
            layoutHappy.setSelected(false);
            layoutNeutral.setSelected(false);
            layoutSad.setSelected(false);
            layoutAnxious.setSelected(false);

            // Highlight the selected mood
            if (mood == null) {
                return;
            }

            switch (mood) {
                case "happy":
                    layoutHappy.setSelected(true);
                    break;
                case "neutral":
                    layoutNeutral.setSelected(true);
                    break;
                case "sad":
                    layoutSad.setSelected(true);
                    break;
                case "anxious":
                    layoutAnxious.setSelected(true);
                    break;
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Silently handle missing views
        }
    }

    private void saveMood() {
        try {
            // Find mood-related views
            View layoutHappy = binding.getRoot().findViewById(R.id.layoutHappy);
            View layoutNeutral = binding.getRoot().findViewById(R.id.layoutNeutral);
            View layoutSad = binding.getRoot().findViewById(R.id.layoutSad);
            View layoutAnxious = binding.getRoot().findViewById(R.id.layoutAnxious);
            View sliderIntensity = binding.getRoot().findViewById(R.id.sliderIntensity);
            View etMoodNotes = binding.getRoot().findViewById(R.id.etMoodNotes);

            if (layoutHappy == null || layoutNeutral == null || layoutSad == null || layoutAnxious == null ||
                    sliderIntensity == null || etMoodNotes == null) {
                Toast.makeText(requireContext(), "Terjadi kesalahan saat menyimpan mood", Toast.LENGTH_SHORT).show();
                return;
            }

            // Get selected mood
            String selectedMood = "unknown";
            if (layoutHappy.isSelected()) {
                selectedMood = "happy";
            } else if (layoutNeutral.isSelected()) {
                selectedMood = "neutral";
            } else if (layoutSad.isSelected()) {
                selectedMood = "sad";
            } else if (layoutAnxious.isSelected()) {
                selectedMood = "anxious";
            }

            // Get mood intensity
            int intensity = 5; // Default value
            if (sliderIntensity instanceof android.widget.SeekBar) {
                intensity = ((android.widget.SeekBar) sliderIntensity).getProgress();
            }

            // Get notes
            String notes = "";
            if (etMoodNotes instanceof android.widget.EditText) {
                notes = ((android.widget.EditText) etMoodNotes).getText().toString();
            }

            // In a real app, you would save this data to a database
            // For now, just show a success message
            Toast.makeText(requireContext(), "Mood berhasil disimpan", Toast.LENGTH_SHORT).show();

            // Reset the form
            selectMood(null);
            if (sliderIntensity instanceof android.widget.SeekBar) {
                ((android.widget.SeekBar) sliderIntensity).setProgress(5);
            }
            if (etMoodNotes instanceof android.widget.EditText) {
                ((android.widget.EditText) etMoodNotes).setText("");
            }
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(requireContext(), "Terjadi kesalahan saat menyimpan mood", Toast.LENGTH_SHORT).show();
        }
    }

    private void startVideoCall(String consultationId) {
        // Would launch a video call activity in a real app
        Toast.makeText(requireContext(), "Memulai video call...", Toast.LENGTH_SHORT).show();
    }

    private void startChat(String consultationId) {
        // Would launch a chat activity in a real app
        Toast.makeText(requireContext(), "Memulai chat...", Toast.LENGTH_SHORT).show();
    }

    private void navigateToConsultation() {
        // Signal to MainActivity to switch to the Consultation tab
        if (getActivity() != null) {
            getActivity().findViewById(R.id.navigation_consultation).performClick();
        }
    }

    private void navigateToJournal() {
        // Signal to MainActivity to switch to the Journal tab
        if (getActivity() != null) {
            getActivity().findViewById(R.id.navigation_journal).performClick();
        }
    }

    private void navigateToMood() {
        // Signal to MainActivity to switch to the Mood tab
        if (getActivity() != null) {
            getActivity().findViewById(R.id.navigation_mood).performClick();
        }
    }

    private void openSelfTalkAudio() {
        // Would launch the self-talk audio player in a real app
        Toast.makeText(requireContext(), "Membuka audio self-talk...", Toast.LENGTH_SHORT).show();
    }

    private void setupQuickAccess() {
        try {
            // Find quick access related views if they exist
            View quickConsultation = binding.getRoot().findViewById(R.id.quickConsultation);
            View quickJournal = binding.getRoot().findViewById(R.id.quickJournal);
            View quickMood = binding.getRoot().findViewById(R.id.quickMood);
            View quickSelfTalk = binding.getRoot().findViewById(R.id.quickSelfTalk);

            // Set click listeners for quick access buttons if views exist
            if (quickConsultation != null) {
                quickConsultation.setOnClickListener(v -> navigateToConsultation());
            }

            if (quickJournal != null) {
                quickJournal.setOnClickListener(v -> navigateToJournal());
            }

            if (quickMood != null) {
                quickMood.setOnClickListener(v -> navigateToMood());
            }

            if (quickSelfTalk != null) {
                quickSelfTalk.setOnClickListener(v -> openSelfTalkAudio());
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Silently handle missing views
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
