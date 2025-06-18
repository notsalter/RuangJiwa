package com.example.ruangjiwa.ui.home;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView; // Add missing TextView import
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

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
            // Initialize Firebase Auth
            mAuth = FirebaseAuth.getInstance();

            // Set greeting message
            setGreetingMessage();

            // Set user profile info
            setUserProfile();

            // Setup upcoming consultations
            setupConsultationsRecyclerView();
            loadConsultations();

            // Setup recommendations
            setupRecommendationsRecyclerView();
            loadRecommendations();
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(requireContext(), "Error loading home screen", Toast.LENGTH_SHORT).show();
        }
    }

    private void setUserProfile() {
        FirebaseUser currentUser = mAuth.getCurrentUser();
        if (currentUser != null && binding != null) {
            try {
                // Set user's name
                if (binding.tvUsername != null) {
                    binding.tvUsername.setText(currentUser.getDisplayName() != null ?
                            currentUser.getDisplayName() : "User");
                }

                // Try to load user's profile image with error handling
                if (binding.profileImage != null && currentUser.getPhotoUrl() != null) {
                    // Use a default placeholder to prevent the width/height = 0 error
                    binding.profileImage.setImageResource(R.drawable.ic_profile);

                    // Use Glide to safely load the image
                    com.bumptech.glide.Glide.with(requireContext())
                            .load(currentUser.getPhotoUrl())
                            .placeholder(R.drawable.ic_profile)
                            .error(R.drawable.ic_profile)
                            .into(binding.profileImage);
                } else if (binding.profileImage != null) {
                    // Set default profile image
                    binding.profileImage.setImageResource(R.drawable.ic_profile);
                }
            } catch (Exception e) {
                e.printStackTrace();
                // If there's an error, just use the default profile image
                if (binding.profileImage != null) {
                    binding.profileImage.setImageResource(R.drawable.ic_profile);
                }
            }
        }
    }

    private void setGreetingMessage() {
        if (binding == null) return;

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

        if (binding.tvGreeting != null) {
            binding.tvGreeting.setText(greeting);
        }

        // The current date might be displayed elsewhere or not needed
        // Removed the tvDate reference since it doesn't exist in the layout
    }

    private void setupConsultationsRecyclerView() {
        if (binding == null) return;

        try {
            // Create an implementation of the ConsultationListener
            ConsultationAdapter.ConsultationListener consultationListener = new ConsultationAdapter.ConsultationListener() {
                @Override
                public void onVideoCallClick(Consultation consultation) {
                    startVideoCall(consultation.getId());
                }

                @Override
                public void onChatClick(Consultation consultation) {
                    startChat(consultation.getId());
                }
            };

            // Create the adapter with the listener
            consultationAdapter = new ConsultationAdapter(new ArrayList<>(), consultationListener);

            // Set up the RecyclerView if it exists
            // Using constant integer value for ID as the R.id.rvConsultations might not exist
            // Will need to create this ID in the layout or use an existing RecyclerView
            int consultationsRecyclerViewId = getResources().getIdentifier("recycler_consultations", "id", requireContext().getPackageName());
            if (consultationsRecyclerViewId > 0) {
                RecyclerView rvConsultations = binding.getRoot().findViewById(consultationsRecyclerViewId);
                if (rvConsultations != null) {
                    rvConsultations.setAdapter(consultationAdapter);
                    rvConsultations.setLayoutManager(new LinearLayoutManager(requireContext()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void loadConsultations() {
        if (binding == null) return;

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

            if (consultationAdapter != null) {
                consultationAdapter.updateData(consultations);
            }

            // Use dynamic resource lookup to avoid hardcoded resource IDs that don't exist
            int cardId = getResources().getIdentifier("upcomingConsultationCard", "id", requireContext().getPackageName());
            int noConsultationId = getResources().getIdentifier("noConsultationView", "id", requireContext().getPackageName());

            View cardUpcomingConsultation = cardId > 0 ? binding.getRoot().findViewById(cardId) : null;
            View tvNoConsultation = noConsultationId > 0 ? binding.getRoot().findViewById(noConsultationId) : null;

            // Show/hide appropriate views based on consultations
            if (cardUpcomingConsultation != null && tvNoConsultation != null) {
                if (!consultations.isEmpty()) {
                    cardUpcomingConsultation.setVisibility(View.VISIBLE);
                    tvNoConsultation.setVisibility(View.GONE);

                    // Setup the consultation card with data
                    Consultation next = consultations.get(0);

                    // Find views using dynamic resource lookup
                    int psyNameId = getResources().getIdentifier("psychologistName", "id", requireContext().getPackageName());
                    int psySpecialtyId = getResources().getIdentifier("psychologistSpecialty", "id", requireContext().getPackageName());
                    int dateTimeId = getResources().getIdentifier("consultationDateTime", "id", requireContext().getPackageName());
                    int videoCallId = getResources().getIdentifier("videoCallButton", "id", requireContext().getPackageName());
                    int chatId = getResources().getIdentifier("chatButton", "id", requireContext().getPackageName());

                    View psyNameView = psyNameId > 0 ? binding.getRoot().findViewById(psyNameId) : null;
                    View psySpecialtyView = psySpecialtyId > 0 ? binding.getRoot().findViewById(psySpecialtyId) : null;
                    View dateTimeView = dateTimeId > 0 ? binding.getRoot().findViewById(dateTimeId) : null;
                    View videoCallBtn = videoCallId > 0 ? binding.getRoot().findViewById(videoCallId) : null;
                    View chatBtn = chatId > 0 ? binding.getRoot().findViewById(chatId) : null;

                    // Set data on views if they exist
                    if (psyNameView instanceof TextView) {
                        ((TextView) psyNameView).setText(next.getPsychologistName());
                    }

                    if (psySpecialtyView instanceof TextView) {
                        ((TextView) psySpecialtyView).setText(next.getPsychologistSpecialty());
                    }

                    if (dateTimeView instanceof TextView) {
                        // Format and set date
                        SimpleDateFormat dateFormat = new SimpleDateFormat("EEEE, dd MMMM yyyy • HH:mm", new Locale("id", "ID"));
                        String formattedDate = dateFormat.format(next.getDateTime());
                        ((TextView) dateTimeView).setText(formattedDate);
                    }

                    // Set click listeners if views exist
                    if (videoCallBtn != null) {
                        videoCallBtn.setOnClickListener(v -> startVideoCall(next.getId()));
                    }

                    if (chatBtn != null) {
                        chatBtn.setOnClickListener(v -> startChat(next.getId()));
                    }
                } else {
                    cardUpcomingConsultation.setVisibility(View.GONE);
                    tvNoConsultation.setVisibility(View.VISIBLE);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void setupRecommendationsRecyclerView() {
        if (binding == null) return;

        try {
            // Create adapter with empty list
            recommendationAdapter = new RecommendationAdapter(new ArrayList<>());

            // Set item click listener if needed
            recommendationAdapter.setOnItemClickListener(recommendation -> {
                // Handle recommendation click based on type
                Toast.makeText(requireContext(), "Selected: " + recommendation.getTitle(), Toast.LENGTH_SHORT).show();
            });

            // Set up RecyclerView if it exists
            // Using dynamic resource ID lookup since the ID might not exist directly in R.id
            int recommendationsRecyclerViewId = getResources().getIdentifier("recycler_recommendations", "id", requireContext().getPackageName());
            if (recommendationsRecyclerViewId > 0) {
                RecyclerView rvRecommendations = binding.getRoot().findViewById(recommendationsRecyclerViewId);
                if (rvRecommendations != null) {
                    rvRecommendations.setAdapter(recommendationAdapter);
                    rvRecommendations.setLayoutManager(
                            new LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void loadRecommendations() {
        if (binding == null) return;

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

            if (recommendationAdapter != null) {
                recommendationAdapter.updateData(recommendations);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void startVideoCall(String consultationId) {
        // TODO: Implement video call functionality
        Toast.makeText(requireContext(), "Video call will start soon", Toast.LENGTH_SHORT).show();
    }

    private void startChat(String consultationId) {
        // TODO: Implement chat functionality
        Toast.makeText(requireContext(), "Chat will open soon", Toast.LENGTH_SHORT).show();
    }

    private void selectMood(String mood) {
        // TODO: Implement mood selection logic
        Toast.makeText(requireContext(), "You selected: " + mood, Toast.LENGTH_SHORT).show();
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
