package com.example.ruangjiwa.ui.consultation;

import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RadioButton;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ruangjiwa.R;
import com.example.ruangjiwa.data.model.QuizHistory;
import com.example.ruangjiwa.data.model.QuizOption;
import com.example.ruangjiwa.data.model.QuizQuestion;
import com.example.ruangjiwa.data.model.QuizResult;
import com.example.ruangjiwa.databinding.FragmentQuizBinding;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.Timestamp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.Query;
import com.google.firebase.firestore.QueryDocumentSnapshot;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

/**
 * A fragment that provides a quick mental health quiz to assess the user's current mental well-being.
 * Kuesioner kesehatan mental singkat untuk menilai kondisi kesehatan mental pengguna.
 */
public class ConsultationFragment extends Fragment {

    private FragmentQuizBinding binding;
    private List<QuizQuestion> questions;
    private int currentQuestionIndex = 0;
    private int totalScore = 0;
    private List<Integer> userAnswers = new ArrayList<>();

    // Firebase
    private FirebaseFirestore db;
    private FirebaseAuth mAuth;
    private static final String COLLECTION_QUIZ_HISTORY = "quiz_history";

    // State flags
    private enum QuizState {
        WELCOME,
        QUIZ_IN_PROGRESS,
        RESULTS,
        HISTORY
    }

    private QuizState currentState = QuizState.WELCOME;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentQuizBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        initQuizQuestions();
        setupButtonListeners();

        // Initialize Firebase
        db = FirebaseFirestore.getInstance();
        mAuth = FirebaseAuth.getInstance();

        // Show welcome screen initially
        showScreen(QuizState.WELCOME);
    }

    private void setupButtonListeners() {
        // Welcome screen buttons
        binding.btnStartQuiz.setOnClickListener(v -> startQuiz());
        binding.btnViewHistory.setOnClickListener(v -> viewQuizHistory());

        // Results screen buttons
        binding.btnArticles.setOnClickListener(v -> navigateToArticles());
        binding.btnSupport.setOnClickListener(v -> navigateToSupport());
        binding.btnRetake.setOnClickListener(v -> restartQuiz());
    }

    private void initQuizQuestions() {
        // Initialize with simplified PHQ-9 and GAD-7 questions - translated to Indonesian
        questions = new ArrayList<>();

        // Question 1 (PHQ-9 #1)
        questions.add(new QuizQuestion(
                "Dalam 2 minggu terakhir, seberapa sering Anda merasa kurang berminat atau bergairah dalam melakukan apapun?",
                Arrays.asList(
                        new QuizOption("Tidak sama sekali", 0),
                        new QuizOption("Beberapa hari", 1),
                        new QuizOption("Lebih dari setengah hari", 2),
                        new QuizOption("Hampir setiap hari", 3)
                )
        ));

        // Question 2 (PHQ-9 #2)
        questions.add(new QuizQuestion(
                "Dalam 2 minggu terakhir, seberapa sering Anda merasa murung, sedih, atau putus asa?",
                Arrays.asList(
                        new QuizOption("Tidak sama sekali", 0),
                        new QuizOption("Beberapa hari", 1),
                        new QuizOption("Lebih dari setengah hari", 2),
                        new QuizOption("Hampir setiap hari", 3)
                )
        ));

        // Question 3 (GAD-7 #1)
        questions.add(new QuizQuestion(
                "Dalam 2 minggu terakhir, seberapa sering Anda merasa cemas, gugup, atau tegang?",
                Arrays.asList(
                        new QuizOption("Tidak sama sekali", 0),
                        new QuizOption("Beberapa hari", 1),
                        new QuizOption("Lebih dari setengah hari", 2),
                        new QuizOption("Hampir setiap hari", 3)
                )
        ));

        // Question 4 (GAD-7 #2)
        questions.add(new QuizQuestion(
                "Dalam 2 minggu terakhir, seberapa sering Anda tidak mampu berhenti atau mengendalikan rasa khawatir?",
                Arrays.asList(
                        new QuizOption("Tidak sama sekali", 0),
                        new QuizOption("Beberapa hari", 1),
                        new QuizOption("Lebih dari setengah hari", 2),
                        new QuizOption("Hampir setiap hari", 3)
                )
        ));

        // Question 5 (Sleep question)
        questions.add(new QuizQuestion(
                "Dalam 2 minggu terakhir, seberapa sering Anda mengalami kesulitan untuk tidur atau tetap tidur, atau terlalu banyak tidur?",
                Arrays.asList(
                        new QuizOption("Tidak sama sekali", 0),
                        new QuizOption("Beberapa hari", 1),
                        new QuizOption("Lebih dari setengah hari", 2),
                        new QuizOption("Hampir setiap hari", 3)
                )
        ));

        // Question 6 (Energy question)
        questions.add(new QuizQuestion(
                "Dalam 2 minggu terakhir, seberapa sering Anda merasa lelah atau kurang berenergi?",
                Arrays.asList(
                        new QuizOption("Tidak sama sekali", 0),
                        new QuizOption("Beberapa hari", 1),
                        new QuizOption("Lebih dari setengah hari", 2),
                        new QuizOption("Hampir setiap hari", 3)
                )
        ));

        // Question 7 (Self-worth question)
        questions.add(new QuizQuestion(
                "Dalam 2 minggu terakhir, seberapa sering Anda merasa buruk tentang diri sendiri atau merasa bahwa Anda adalah orang yang gagal atau telah mengecewakan diri sendiri atau keluarga Anda?",
                Arrays.asList(
                        new QuizOption("Tidak sama sekali", 0),
                        new QuizOption("Beberapa hari", 1),
                        new QuizOption("Lebih dari setengah hari", 2),
                        new QuizOption("Hampir setiap hari", 3)
                )
        ));

        // Initialize answers list
        for (int i = 0; i < questions.size(); i++) {
            userAnswers.add(-1); // -1 means no answer yet
        }
    }

    private void showScreen(QuizState state) {
        currentState = state;

        // Hide all views first
        binding.cardWelcome.setVisibility(View.GONE);
        binding.tvProgress.setVisibility(View.GONE);
        binding.progressIndicator.setVisibility(View.GONE);
        binding.cardQuestion.setVisibility(View.GONE);
        binding.cardResults.setVisibility(View.GONE);

        // Show appropriate views based on state
        switch (state) {
            case WELCOME:
                binding.cardWelcome.setVisibility(View.VISIBLE);
                break;

            case QUIZ_IN_PROGRESS:
                binding.tvProgress.setVisibility(View.VISIBLE);
                binding.progressIndicator.setVisibility(View.VISIBLE);
                binding.cardQuestion.setVisibility(View.VISIBLE);
                showQuestion(currentQuestionIndex);
                break;

            case RESULTS:
                binding.tvProgress.setVisibility(View.VISIBLE);
                binding.progressIndicator.setVisibility(View.VISIBLE);
                binding.cardResults.setVisibility(View.VISIBLE);
                binding.tvProgress.setText("Hasil");
                binding.progressIndicator.setProgress(100);
                break;

            case HISTORY:
                binding.cardWelcome.setVisibility(View.VISIBLE);
                // In a real app, we would show a history view here
                Toast.makeText(requireContext(), "Fitur riwayat kuesioner akan segera hadir", Toast.LENGTH_SHORT).show();
                currentState = QuizState.WELCOME; // Return to welcome state
                break;
        }
    }

    private void startQuiz() {
        // Reset quiz state
        currentQuestionIndex = 0;
        totalScore = 0;
        for (int i = 0; i < userAnswers.size(); i++) {
            userAnswers.set(i, -1); // Reset all answers
        }

        // Show first question
        showScreen(QuizState.QUIZ_IN_PROGRESS);
    }

    private void viewQuizHistory() {
        FirebaseUser user = mAuth.getCurrentUser();
        if (user != null) {
            // Show loading indicator (could add a progress bar here)
            Toast.makeText(requireContext(), "Mengambil data riwayat...", Toast.LENGTH_SHORT).show();

            // Set up view for history
            setupHistoryView();

            // Query Firestore for user's quiz history, ordered by timestamp (newest first)
            // First try without ordering since the index might not be ready yet
            db.collection(COLLECTION_QUIZ_HISTORY)
                    .whereEqualTo("userId", user.getUid())
                    .get()
                    .addOnSuccessListener(queryDocumentSnapshots -> {
                        List<QuizHistory> historyList = new ArrayList<>();

                        for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                            QuizHistory history = document.toObject(QuizHistory.class);
                            historyList.add(history);
                            // Log some debug info
                            Log.d("QuizHistory", "Found history item: " + history.getCategory() + ", score: " + history.getScore());
                        }

                        // Sort manually in the app by timestamp
                        if (historyList.size() > 1) {
                            historyList.sort((h1, h2) -> {
                                if (h1.getTimestamp() == null || h2.getTimestamp() == null) return 0;
                                return h2.getTimestamp().compareTo(h1.getTimestamp());
                            });
                        }

                        // Display the history items
                        displayHistoryItems(historyList);
                    })
                    .addOnFailureListener(e -> {
                        Log.e("QuizHistory", "Failed to retrieve history: " + e.getMessage());
                        Toast.makeText(requireContext(),
                                "Gagal mengambil riwayat: " + e.getMessage(),
                                Toast.LENGTH_SHORT).show();
                        showScreen(QuizState.WELCOME);
                    });
        } else {
            Toast.makeText(requireContext(), "Anda perlu login untuk melihat riwayat", Toast.LENGTH_SHORT).show();
            showScreen(QuizState.WELCOME);
        }
    }

    private void setupHistoryView() {
        try {
            // Inflate history fragment layout
            View historyView = getLayoutInflater().inflate(R.layout.fragment_history, null);

            // Replace the welcome card content with the history view
            binding.cardWelcome.removeAllViews();
            binding.cardWelcome.addView(historyView);

            // Set up recycler view with empty adapter initially to avoid "No adapter attached" warning
            RecyclerView recyclerView = historyView.findViewById(R.id.rvQuizHistory);
            recyclerView.setLayoutManager(new androidx.recyclerview.widget.LinearLayoutManager(requireContext()));
            recyclerView.setAdapter(new QuizHistoryAdapter(new ArrayList<>()));

            // Set up back button with explicit click listener
            View backButton = historyView.findViewById(R.id.btnBackToQuiz);
            backButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Log.d("QuizHistory", "Back button clicked");
                    // Immediately restore the original welcome screen
                    restoreWelcomeScreen();
                }
            });

            // Show the welcome card (which now contains history content)
            binding.cardWelcome.setVisibility(View.VISIBLE);
        } catch (Exception e) {
            Log.e("QuizHistory", "Error setting up history view: " + e.getMessage(), e);
            Toast.makeText(requireContext(), "Error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            showScreen(QuizState.WELCOME);
        }
    }

    private void restoreWelcomeScreen() {
        try {
            // Re-inflate the original welcome view
            View welcomeView = getLayoutInflater().inflate(R.layout.fragment_quiz, null);

            // Find the welcome card in the newly inflated view
            View welcomeCard = welcomeView.findViewById(R.id.cardWelcome);

            if (binding != null) {
                // Replace current content with welcome card
                binding.cardWelcome.removeAllViews();

                // Add all children of the welcome card to our binding's card
                if (welcomeCard instanceof ViewGroup) {
                    ViewGroup welcomeCardGroup = (ViewGroup) welcomeCard;
                    for (int i = 0; i < welcomeCardGroup.getChildCount(); i++) {
                        View child = welcomeCardGroup.getChildAt(i);
                        // Remove from parent first
                        welcomeCardGroup.removeView(child);
                        // Add to our binding
                        binding.cardWelcome.addView(child);
                    }
                }

                // Restore button listeners
                View startButton = binding.cardWelcome.findViewById(R.id.btnStartQuiz);
                View historyButton = binding.cardWelcome.findViewById(R.id.btnViewHistory);

                if (startButton != null) {
                    startButton.setOnClickListener(v -> startQuiz());
                }

                if (historyButton != null) {
                    historyButton.setOnClickListener(v -> viewQuizHistory());
                }

                // Show welcome screen
                showScreen(QuizState.WELCOME);
            }
        } catch (Exception e) {
            Log.e("QuizHistory", "Error restoring welcome screen: " + e.getMessage(), e);
            // Fallback to simply showing welcome screen
            showScreen(QuizState.WELCOME);
        }
    }

    private void displayHistoryItems(List<QuizHistory> historyList) {
        try {
            // Find views in the history layout
            View historyView = binding.cardWelcome.getChildAt(0);

            if (historyView == null) {
                Log.e("QuizHistory", "History view is null");
                return;
            }

            RecyclerView recyclerView = historyView.findViewById(R.id.rvQuizHistory);
            android.widget.TextView emptyView = historyView.findViewById(R.id.tvEmptyHistory);

            if (recyclerView == null || emptyView == null) {
                Log.e("QuizHistory", "RecyclerView or emptyView is null");
                return;
            }

            Log.d("QuizHistory", "Displaying " + historyList.size() + " history items");

            // Ensure the RecyclerView is fully visible
            ViewGroup.LayoutParams params = recyclerView.getLayoutParams();
            if (params.height == 0) {
                params.height = ViewGroup.LayoutParams.MATCH_PARENT;
                recyclerView.setLayoutParams(params);
            }

            // Force the RecyclerView to be visible
            recyclerView.setVisibility(View.VISIBLE);

            if (historyList == null || historyList.isEmpty()) {
                // Show empty state
                Log.d("QuizHistory", "History list is empty, showing empty state");
                recyclerView.setVisibility(View.GONE);
                emptyView.setVisibility(View.VISIBLE);
            } else {
                // Show history items
                Log.d("QuizHistory", "History list has " + historyList.size() + " items, showing recycler view");

                // First ensure recycler view is properly set up
                if (recyclerView.getLayoutManager() == null) {
                    recyclerView.setLayoutManager(new androidx.recyclerview.widget.LinearLayoutManager(requireContext()));
                }

                // Make sure the empty view is hidden
                emptyView.setVisibility(View.GONE);

                // Set RecyclerView properties
                recyclerView.setHasFixedSize(true);
                recyclerView.setVisibility(View.VISIBLE);
                recyclerView.setItemViewCacheSize(historyList.size());

                // Update adapter or set new one if needed
                QuizHistoryAdapter adapter;
                if (recyclerView.getAdapter() instanceof QuizHistoryAdapter) {
                    adapter = (QuizHistoryAdapter) recyclerView.getAdapter();
                    adapter.updateData(historyList);
                } else {
                    adapter = new QuizHistoryAdapter(historyList);
                    recyclerView.setAdapter(adapter);
                }

                // Force layout measurement and refresh
                recyclerView.post(() -> {
                    Log.d("QuizHistory", "RecyclerView post - adapter count: " + adapter.getItemCount());
                    adapter.notifyDataSetChanged();

                    // Request layout refresh
                    recyclerView.invalidate();
                    recyclerView.requestLayout();
                });

                // Scroll to the beginning of the list
                recyclerView.scrollToPosition(0);
            }
        } catch (Exception e) {
            Log.e("QuizHistory", "Error displaying history items: " + e.getMessage(), e);
            Toast.makeText(requireContext(), "Terjadi kesalahan saat menampilkan riwayat", Toast.LENGTH_SHORT).show();
        }
    }

    private void showQuestion(int index) {
        // Update progress indicator
        binding.progressIndicator.setProgress((index * 100) / questions.size());
        binding.tvProgress.setText("Pertanyaan " + (index + 1) + " dari " + questions.size());

        // Get current question
        QuizQuestion question = questions.get(index);
        binding.tvQuestion.setText(question.getQuestionText());

        // Set up radio buttons for answers
        binding.radioGroupAnswers.removeAllViews();
        List<QuizOption> options = question.getOptions();

        for (int i = 0; i < options.size(); i++) {
            final int optionIndex = i;
            QuizOption option = options.get(i);

            // Inflate radio button from layout
            RadioButton radioButton = (RadioButton) getLayoutInflater()
                    .inflate(R.layout.item_quiz_option, binding.radioGroupAnswers, false);

            radioButton.setText(option.getText());
            radioButton.setChecked(userAnswers.get(currentQuestionIndex) == i);

            // When clicked, move to next question or show results
            radioButton.setOnClickListener(v -> {
                // Save the answer
                userAnswers.set(currentQuestionIndex, optionIndex);
                totalScore += option.getPointValue();

                // Wait a brief moment for visual feedback
                radioButton.postDelayed(() -> {
                    if (currentQuestionIndex < questions.size() - 1) {
                        // Move to next question
                        currentQuestionIndex++;
                        showQuestion(currentQuestionIndex);
                    } else {
                        // Show results
                        showResults();
                    }
                }, 300);
            });

            binding.radioGroupAnswers.addView(radioButton);
        }
    }

    private void showResults() {
        // Calculate and display results
        QuizResult result = new QuizResult(totalScore);

        // Update UI with results
        binding.tvResultCategory.setText(result.getCategory().getDisplayName());
        binding.tvResultDescription.setText(result.getCategory().getDescription());

        // Show results screen
        showScreen(QuizState.RESULTS);

        // In a real app, you would save the result to user history here
        saveQuizResultToHistory(result);
    }

    private void saveQuizResultToHistory(QuizResult result) {
        FirebaseUser user = mAuth.getCurrentUser();
        if (user != null) {
            // Get user ID
            String userId = user.getUid();

            // Create a new quiz history entry
            QuizHistory historyEntry = new QuizHistory();
            historyEntry.setUserId(userId);
            historyEntry.setScore(result.getTotalScore());
            historyEntry.setCategory(result.getCategory().getDisplayName());
            historyEntry.setTimestamp(new Timestamp(new Date()));

            // Save to Firestore
            db.collection(COLLECTION_QUIZ_HISTORY)
                    .add(historyEntry)
                    .addOnSuccessListener(new OnSuccessListener<DocumentReference>() {
                        @Override
                        public void onSuccess(DocumentReference documentReference) {
                            // Update the document ID
                            String docId = documentReference.getId();
                            db.collection(COLLECTION_QUIZ_HISTORY).document(docId)
                                    .update("id", docId);

                            Toast.makeText(requireContext(), "Hasil kuesioner disimpan ke riwayat", Toast.LENGTH_SHORT).show();
                        }
                    })
                    .addOnFailureListener(new OnFailureListener() {
                        @Override
                        public void onFailure(@NonNull Exception e) {
                            Toast.makeText(requireContext(), "Gagal menyimpan hasil kuesioner: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                        }
                    });
        } else {
            Toast.makeText(requireContext(), "Anda perlu login untuk menyimpan hasil kuesioner", Toast.LENGTH_SHORT).show();
        }
    }

    private void navigateToArticles() {
        // Navigate to articles section - in a real app, this would use Navigation component
        Toast.makeText(requireContext(), "Menuju artikel bantuan diri", Toast.LENGTH_SHORT).show();
    }

    private void navigateToSupport() {
        // Navigate to support resources - in a real app, this would use Navigation component
        Toast.makeText(requireContext(), "Menuju sumber daya dukungan", Toast.LENGTH_SHORT).show();
    }

    private void restartQuiz() {
        startQuiz();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
