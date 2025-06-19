package com.example.ruangjiwa.ui.home;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.Article;
import com.example.ruangjiwa.data.model.Consultation;
import com.example.ruangjiwa.data.model.Mood;
import com.example.ruangjiwa.data.model.MoodEntry;
import com.example.ruangjiwa.data.model.Recommendation;
import com.example.ruangjiwa.databinding.FragmentHomeBinding;
import com.example.ruangjiwa.ui.mood.MoodTrackerFragment;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.DocumentSnapshot;
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
import java.util.concurrent.TimeUnit;

public class HomeFragment extends Fragment {

    private FragmentHomeBinding binding;
    private ConsultationAdapter consultationAdapter;
    private RecommendationAdapter recommendationAdapter;
    private FirebaseAuth mAuth;
    private FirebaseFirestore db;
    private Mood selectedMood = null;

    // Add these variables to track the selected mood
    private View lastSelectedMoodLayout = null;
    private int defaultBgResource = R.drawable.circle_gray_bg;
    private int selectedBgResource = R.drawable.circle_primary_bg_light;
    private int defaultTextColor = R.color.gray_text;
    private int selectedTextColor = R.color.primary;

    private ArticlesAdapter articlesAdapter;
    private Article featuredArticle;
    private List<Article> recentArticles = new ArrayList<>();

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
            // Initialize Firebase Auth and Firestore
            mAuth = FirebaseAuth.getInstance();
            db = FirebaseFirestore.getInstance();

            // Set greeting message
            setGreetingMessage();

            // Set user profile info
            setUserProfile();

            // Set current date
            setCurrentDate();

            // Setup mood selection
            setupMoodSelection();

            // Setup mental health news section
            setupMentalHealthNewsSection();
            loadMentalHealthArticles();

            // Setup recommendations
            setupRecommendationsRecyclerView();
            loadRecommendations();

            // Check if user has already tracked mood today
            checkTodaysMood();

            // Setup mood chart
            setupMoodChart();
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

    private void setCurrentDate() {
        if (binding == null) return;

        try {
            // Get the current date
            Calendar calendar = Calendar.getInstance();
            Date now = calendar.getTime();

            // Format the date as needed (e.g., "dd MMMM yyyy")
            SimpleDateFormat dateFormat = new SimpleDateFormat("dd MMMM yyyy", new Locale("id", "ID"));
            String formattedDate = dateFormat.format(now);

            // Set the formatted date to the TextView using the correct ID from your layout (tvCurrentDate)
            if (binding.tvCurrentDate != null) {
                binding.tvCurrentDate.setText(formattedDate);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
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

    private void setupMoodSelection() {
        if (binding == null) return;

        // Set up click listeners for each mood option
        binding.moodHappy.setOnClickListener(v -> handleMoodSelection("HAPPY", binding.moodHappy, binding.moodHappyBg));
        binding.moodNeutral.setOnClickListener(v -> handleMoodSelection("NEUTRAL", binding.moodNeutral, binding.moodNeutralBg));
        binding.moodSad.setOnClickListener(v -> handleMoodSelection("SAD", binding.moodSad, binding.moodSadBg));
        binding.moodAnxious.setOnClickListener(v -> handleMoodSelection("ANXIOUS", binding.moodAnxious, binding.moodAnxiousBg));

        // Display current date in the mood card
        SimpleDateFormat dateFormat = new SimpleDateFormat("dd MMMM yyyy", new Locale("id", "ID"));
        binding.tvCurrentDate.setText(dateFormat.format(new Date()));
    }

    private void handleMoodSelection(String moodType, View moodLayout, View moodBackground) {
        // Reset all mood backgrounds to default
        resetAllMoodBackgrounds();

        // Highlight the selected mood
        moodBackground.setBackgroundResource(R.drawable.circle_primary_bg_light);

        // Find the TextView in the mood layout and change its color
        // Assuming the TextView is the second child of the LinearLayout
        if (moodLayout instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) moodLayout;
            for (int i = 0; i < group.getChildCount(); i++) {
                View child = group.getChildAt(i);
                if (child instanceof TextView) {
                    ((TextView) child).setTextColor(ContextCompat.getColor(requireContext(), R.color.primary));
                }
            }
        }

        // Save the mood to Firebase
        saveMoodToFirebase(moodType);
    }

    private void resetAllMoodBackgrounds() {
        // Reset all mood backgrounds to gray
        binding.moodHappyBg.setBackgroundResource(R.drawable.circle_gray_bg);
        binding.moodNeutralBg.setBackgroundResource(R.drawable.circle_gray_bg);
        binding.moodSadBg.setBackgroundResource(R.drawable.circle_gray_bg);
        binding.moodAnxiousBg.setBackgroundResource(R.drawable.circle_gray_bg);

        // Reset all text colors to gray
        resetMoodTextColor(binding.moodHappy);
        resetMoodTextColor(binding.moodNeutral);
        resetMoodTextColor(binding.moodSad);
        resetMoodTextColor(binding.moodAnxious);
    }

    private void resetMoodTextColor(View moodLayout) {
        if (moodLayout instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) moodLayout;
            for (int i = 0; i < group.getChildCount(); i++) {
                View child = group.getChildAt(i);
                if (child instanceof TextView) {
                    ((TextView) child).setTextColor(ContextCompat.getColor(requireContext(), R.color.gray_text));
                }
            }
        }
    }

    private void saveMoodToFirebase(String moodType) {
        if (mAuth.getCurrentUser() == null) {
            Toast.makeText(requireContext(), "Anda perlu login terlebih dahulu", Toast.LENGTH_SHORT).show();
            return;
        }

        String userId = mAuth.getCurrentUser().getUid();

        // Get current date to use as document ID (format: YYYY-MM-DD)
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        String today = dateFormat.format(new Date());

        // Create mood data
        Map<String, Object> moodData = new HashMap<>();
        moodData.put("mood", moodType);
        moodData.put("timestamp", new Date());

        // Save to Firestore
        db.collection("users").document(userId)
                .collection("mood_entries").document(today)
                .set(moodData)
                .addOnSuccessListener(aVoid -> {
                    Toast.makeText(requireContext(), "Perasaan hari ini berhasil disimpan", Toast.LENGTH_SHORT).show();
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(requireContext(), "Gagal menyimpan: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
    }

    private void checkTodaysMood() {
        if (mAuth.getCurrentUser() == null || db == null) return;

        String userId = mAuth.getCurrentUser().getUid();

        // Get current date
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        String today = dateFormat.format(new Date());

        // Store a reference to the binding to prevent race conditions
        final FragmentHomeBinding currentBinding = binding;
        if (currentBinding == null) return; // Exit early if binding is already null

        // Check if there's a mood entry for today
        db.collection("users").document(userId)
                .collection("mood_entries").document(today)
                .get()
                .addOnSuccessListener(documentSnapshot -> {
                    if (documentSnapshot.exists()) {
                        // User has already tracked mood today, show the selection
                        String mood = documentSnapshot.getString("mood");
                        if (mood != null) {
                            // Highlight the previously selected mood (safely)
                            highlightSavedMood(mood);
                        }
                    }
                })
                .addOnFailureListener(e -> {
                    // Error occurred, but we can silently fail here
                    // No need to show error to user
                });
    }

    private void highlightSavedMood(String mood) {
        // Check if binding is still valid
        if (binding == null) return;

        try {
            switch (mood) {
                case "HAPPY":
                    handleMoodSelection("HAPPY", binding.moodHappy, binding.moodHappyBg);
                    break;
                case "NEUTRAL":
                    handleMoodSelection("NEUTRAL", binding.moodNeutral, binding.moodNeutralBg);
                    break;
                case "SAD":
                    handleMoodSelection("SAD", binding.moodSad, binding.moodSadBg);
                    break;
                case "ANXIOUS":
                    handleMoodSelection("ANXIOUS", binding.moodAnxious, binding.moodAnxiousBg);
                    break;
            }
        } catch (Exception e) {
            e.printStackTrace();
            // Silently handle any exceptions that might occur
            // This could happen if the view is being destroyed
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

    private void setupMentalHealthNewsSection() {
        if (binding == null) return;

        try {
            // Create adapter for articles with click listener
            articlesAdapter = new ArticlesAdapter(requireContext(), article -> {
                // Handle article click - navigate to article detail page
                // You can implement this later with navigation to article detail
                Toast.makeText(requireContext(), "Article clicked: " + article.getTitle(), Toast.LENGTH_SHORT).show();
            });

            // Set up RecyclerView for recent articles
            binding.recentArticlesRecyclerView.setAdapter(articlesAdapter);
            binding.recentArticlesRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));

            // Set up click listener to open the full article
            binding.featuredArticleCard.setOnClickListener(v -> {
                if (featuredArticle != null) {
                    // Handle featured article click - navigate to article detail page
                    Toast.makeText(requireContext(), "Featured article clicked: " + featuredArticle.getTitle(), Toast.LENGTH_SHORT).show();
                }
            });

            // Set up click listener for "See All" button
            binding.seeAllNews.setOnClickListener(v -> {
                // Navigate to all articles screen
                Toast.makeText(requireContext(), "See all articles", Toast.LENGTH_SHORT).show();
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void loadMentalHealthArticles() {
        if (binding == null || db == null) return;

        try {
            // Load sample articles (in a real app, these would come from Firestore)
            // Clear existing articles
            recentArticles.clear();

            // Create some sample articles with the current date
            List<Article> sampleArticles = createSampleArticles();

            // First article is the featured one
            if (!sampleArticles.isEmpty()) {
                featuredArticle = sampleArticles.get(0);
                updateFeaturedArticleUI(featuredArticle);

                // The rest are shown in the recycler view
                recentArticles.addAll(sampleArticles.subList(1, sampleArticles.size()));
            }

            // Update adapter with the recent articles
            if (articlesAdapter != null) {
                articlesAdapter.updateData(recentArticles);
            }

            // In a real app, you would load from Firestore instead:
            /*
            db.collection("articles")
                    .orderBy("publishedAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
                    .limit(5) // Limit to 5 articles for the preview
                    .get()
                    .addOnSuccessListener(queryDocumentSnapshots -> {
                        List<Article> articles = new ArrayList<>();
                        for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                            Article article = document.toObject(Article.class);
                            articles.add(article);
                        }

                        if (!articles.isEmpty()) {
                            // First article is featured
                            featuredArticle = articles.get(0);
                            updateFeaturedArticleUI(featuredArticle);

                            // Rest are shown in the recycler view
                            recentArticles.clear();
                            recentArticles.addAll(articles.subList(1, articles.size()));
                            articlesAdapter.updateData(recentArticles);
                        }
                    })
                    .addOnFailureListener(e -> {
                        Toast.makeText(requireContext(), "Failed to load articles: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    });
            */
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(requireContext(), "Error loading articles", Toast.LENGTH_SHORT).show();
        }
    }

    private List<Article> createSampleArticles() {
        List<Article> articles = new ArrayList<>();

        // Current date
        Date now = new Date();

        // Add sample articles
        articles.add(new Article(
                "1",
                "Tips Menjaga Kesehatan Mental di Era Digital",
                "Temukan cara efektif untuk mengelola screen time dan menghindari kecemasan digital yang dapat memengaruhi kesehatan mental Anda.",
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel magna rhoncus, dapibus ex eu, porta tortor. Proin volutpat nisi vel lorem pretium, et sodales elit placerat.",
                "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                "SELF-CARE",
                now,
                "Dr. Anita Wijaya",
                5
        ));

        articles.add(new Article(
                "2",
                "Mengatasi Stres dan Kecemasan di Tempat Kerja",
                "Simak tips praktis untuk mengelola stres dan kecemasan yang sering muncul dalam situasi kerja modern.",
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin rhoncus arcu at justo tristique, non commodo elit facilisis.",
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                "STRESS",
                now,
                "Psikolog Budi Santoso",
                4
        ));

        articles.add(new Article(
                "3",
                "Pentingnya Tidur Berkualitas untuk Kesehatan Mental",
                "Pelajari bagaimana pola tidur yang baik dapat meningkatkan kesehatan mental dan produktivitas Anda sehari-hari.",
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eget fermentum magna, at sagittis elit.",
                "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                "WELLNESS",
                now,
                "Dr. Siti Rahmah",
                3
        ));

        articles.add(new Article(
                "4",
                "Teknik Mindfulness untuk Kehidupan Sehari-hari",
                "Temukan cara sederhana untuk mempraktikkan mindfulness dalam rutinitas harian Anda guna mengurangi stres.",
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum vel lacinia magna. Fusce finibus est vel justo imperdiet, a cursus purus lobortis.",
                "https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                "MINDFULNESS",
                now,
                "Maya Putri, M.Psi",
                6
        ));

        articles.add(new Article(
                "5",
                "Membangun Ketahanan Mental di Masa Sulit",
                "Ketahanan mental (resilience) adalah keterampilan yang dapat dilatih. Pelajari cara membangunnya dalam artikel ini.",
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras at hendrerit eros, non finibus lectus. Donec facilisis mi eget metus maximus, ut congue velit sollicitudin.",
                "https://images.unsplash.com/photo-1518398046578-8cca57782e17?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
                "RESILIENCE",
                now,
                "Dr. Ahmad Fauzi",
                5
        ));

        return articles;
    }

    private void updateFeaturedArticleUI(Article article) {
        if (binding == null || article == null) return;

        try {
            // Set article category
            binding.featuredArticleCategory.setText(article.getCategory());

            // Set article title
            binding.featuredArticleTitle.setText(article.getTitle());

            // Set article excerpt
            binding.featuredArticleExcerpt.setText(article.getExcerpt());

            // Format and set the date
            SimpleDateFormat dateFormat = new SimpleDateFormat("dd MMMM yyyy", new Locale("id", "ID"));
            binding.featuredArticleDate.setText(dateFormat.format(article.getPublishedAt()));

            // Load article image with Glide
            if (article.getImageUrl() != null && !article.getImageUrl().isEmpty()) {
                Glide.with(requireContext())
                        .load(article.getImageUrl())
                        .placeholder(R.drawable.default_article_image)
                        .error(R.drawable.default_article_image)
                        .centerCrop()
                        .into(binding.featuredArticleImage);
            } else {
                binding.featuredArticleImage.setImageResource(R.drawable.default_article_image);
            }

            // Set click listener for read more button
            binding.readMore.setOnClickListener(v -> {
                // Handle featured article click - navigate to article detail page
                Toast.makeText(requireContext(), "Read more about: " + article.getTitle(), Toast.LENGTH_SHORT).show();
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void openArticleDetail(Article article) {
        if (article == null) return;

        // TODO: Implement navigation to article detail screen
        Toast.makeText(requireContext(), "Open article: " + article.getTitle(), Toast.LENGTH_SHORT).show();
    }

    private void setupMoodChart() {
        if (binding == null || binding.moodChart == null) return;

        try {
            // Configure chart appearance
            binding.moodChart.getDescription().setEnabled(false);
            binding.moodChart.setDrawGridBackground(false);
            binding.moodChart.setTouchEnabled(true);
            binding.moodChart.setDragEnabled(true);
            binding.moodChart.setScaleEnabled(true);
            binding.moodChart.setPinchZoom(true);
            binding.moodChart.setNoDataText("Tidak ada data mood");
            binding.moodChart.setNoDataTextColor(getResources().getColor(R.color.gray_text));
            binding.moodChart.getLegend().setEnabled(false);

            // Configure X axis (dates)
            binding.moodChart.getXAxis().setPosition(com.github.mikephil.charting.components.XAxis.XAxisPosition.BOTTOM);
            binding.moodChart.getXAxis().setDrawGridLines(false);
            binding.moodChart.getXAxis().setGranularity(1f);
            binding.moodChart.getXAxis().setTextColor(getResources().getColor(R.color.gray_text));

            // Configure Y axis (mood values)
            binding.moodChart.getAxisLeft().setDrawGridLines(true);
            binding.moodChart.getAxisLeft().setGranularity(1f);
            binding.moodChart.getAxisLeft().setAxisMinimum(0f);
            binding.moodChart.getAxisLeft().setAxisMaximum(4f);
            binding.moodChart.getAxisLeft().setTextColor(getResources().getColor(R.color.gray_text));
            binding.moodChart.getAxisRight().setEnabled(false);

            // Set a value formatter for Y axis that maps numeric values to mood names
            binding.moodChart.getAxisLeft().setValueFormatter(new com.github.mikephil.charting.formatter.ValueFormatter() {
                @Override
                public String getFormattedValue(float value) {
                    if (value >= 3.5f) return "Senang";
                    else if (value >= 2.5f) return "Netral";
                    else if (value >= 1.5f) return "Sedih";
                    else if (value >= 0.5f) return "Cemas";
                    else return "";
                }
            });

            // Setup click listener for the chart details
            binding.moodChartDetails.setOnClickListener(v -> {
                navigateToMood();
            });

            // Load real mood data
            loadMoodDataForChart();
        } catch (Exception e) {
            e.printStackTrace();
            // If chart initialization fails, show a placeholder
            if (binding.moodChartPlaceholder != null) {
                binding.moodChartPlaceholder.setVisibility(View.VISIBLE);
                binding.moodChart.setVisibility(View.GONE);
            }
        }
    }

    private void loadMoodDataForChart() {
        if (binding == null || binding.moodChart == null || db == null || mAuth.getCurrentUser() == null) return;

        try {
            String userId = mAuth.getCurrentUser().getUid();

            // Setup date range for the last 7 days
            Calendar endCalendar = Calendar.getInstance();
            Calendar startCalendar = Calendar.getInstance();
            startCalendar.add(Calendar.DAY_OF_MONTH, -6); // From 6 days ago

            // Reset time to start of day for start date and end of day for end date
            startCalendar.set(Calendar.HOUR_OF_DAY, 0);
            startCalendar.set(Calendar.MINUTE, 0);
            startCalendar.set(Calendar.SECOND, 0);

            endCalendar.set(Calendar.HOUR_OF_DAY, 23);
            endCalendar.set(Calendar.MINUTE, 59);
            endCalendar.set(Calendar.SECOND, 59);

            Date startDate = startCalendar.getTime();
            Date endDate = endCalendar.getTime();

            // Create the date labels for the X-axis
            final List<String> dateLabels = new ArrayList<>();
            final SimpleDateFormat labelDateFormat = new SimpleDateFormat("d MMM", new Locale("id", "ID"));

            // Generate 7 days of labels
            Calendar labelCalendar = (Calendar) startCalendar.clone();
            for (int i = 0; i < 7; i++) {
                dateLabels.add(labelDateFormat.format(labelCalendar.getTime()));
                labelCalendar.add(Calendar.DAY_OF_MONTH, 1);
            }

            // Show loading indicator
            binding.moodChart.setNoDataText("Memuat data...");

            // Query Firestore for mood entries
            db.collection("users").document(userId)
                .collection("mood_entries")
                .whereGreaterThanOrEqualTo("timestamp", startDate)
                .whereLessThanOrEqualTo("timestamp", endDate)
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    // Create a map to store mood values by date
                    Map<String, String> moodsByDate = new HashMap<>();

                    // Format for converting Date to day key (yyyy-MM-dd)
                    SimpleDateFormat keyFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());

                    // Process mood entries from Firestore
                    for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                        // Get the mood value
                        String mood = document.getString("mood");
                        Date timestamp = document.getDate("timestamp");

                        if (mood != null && timestamp != null) {
                            String dateKey = keyFormat.format(timestamp);
                            moodsByDate.put(dateKey, mood);
                        }
                    }

                    // Now generate the complete dataset for all 7 days
                    List<Entry> chartEntries = new ArrayList<>();

                    // Generate data points for each day
                    Calendar calendar = (Calendar) startCalendar.clone();
                    for (int i = 0; i < 7; i++) {
                        String dateKey = keyFormat.format(calendar.getTime());

                        // Check if we have a mood entry for this date
                        if (moodsByDate.containsKey(dateKey)) {
                            String moodType = moodsByDate.get(dateKey);
                            float moodValue = mapMoodToValue(moodType);
                            chartEntries.add(new Entry(i, moodValue)); // Use day index as X value
                        }

                        calendar.add(Calendar.DAY_OF_MONTH, 1);
                    }

                    updateMoodChart(chartEntries, dateLabels);
                })
                .addOnFailureListener(e -> {
                    e.printStackTrace();
                    binding.moodChart.setNoDataText("Gagal memuat data mood");
                });
        } catch (Exception e) {
            e.printStackTrace();
            binding.moodChart.setNoDataText("Terjadi kesalahan");
        }
    }

    private float mapMoodToValue(String moodType) {
        // Map mood types to numeric values for the chart
        switch (moodType) {
            case "HAPPY":
                return 4.0f;
            case "NEUTRAL":
                return 3.0f;
            case "SAD":
                return 2.0f;
            case "ANXIOUS":
                return 1.0f;
            default:
                return 0f;
        }
    }

    private void updateMoodChart(List<Entry> chartEntries, List<String> dateLabels) {
        if (binding == null || binding.moodChart == null) return;

        try {
            // Create a data set and configure its appearance
            LineDataSet dataSet = new LineDataSet(chartEntries, "Mood Tracker");
            dataSet.setColor(ContextCompat.getColor(requireContext(), R.color.primary));
            dataSet.setValueTextColor(ContextCompat.getColor(requireContext(), R.color.primary));
            dataSet.setLineWidth(2f);
            dataSet.setCircleColor(ContextCompat.getColor(requireContext(), R.color.primary));
            dataSet.setCircleRadius(4f);
            dataSet.setDrawValues(false);

            // Create a data object with the data set
            LineData lineData = new LineData(dataSet);

            // Set the data to the chart
            binding.moodChart.setData(lineData);

            // Refresh the chart
            binding.moodChart.invalidate();

            // Set up X axis labels
            XAxis xAxis = binding.moodChart.getXAxis();
            xAxis.setValueFormatter(new IndexAxisValueFormatter(dateLabels));
            xAxis.setGranularity(1f);
            xAxis.setGranularityEnabled(true);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private float mapMoodToChartValue(String mood) {
        // Map mood string to a numeric value for the chart (0 to 4 scale)
        switch (mood) {
            case "HAPPY":
                return 4f;
            case "NEUTRAL":
                return 2.5f;
            case "SAD":
                return 1.5f;
            case "ANXIOUS":
                return 0.5f;
            default:
                return 0f;
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
