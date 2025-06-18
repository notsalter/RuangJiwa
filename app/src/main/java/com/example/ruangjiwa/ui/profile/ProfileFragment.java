package com.example.ruangjiwa.ui.profile;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.bumptech.glide.Glide;
import com.example.ruangjiwa.R;
import com.example.ruangjiwa.databinding.FragmentProfileBinding;
import com.example.ruangjiwa.ui.auth.LoginActivity;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.FirebaseFirestore;

public class ProfileFragment extends Fragment {

    private FragmentProfileBinding binding;
    private FirebaseAuth mAuth;
    private FirebaseFirestore db;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentProfileBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Initialize Firebase
        mAuth = FirebaseAuth.getInstance();
        db = FirebaseFirestore.getInstance();

        // Load user profile
        loadUserProfile();

        // Set up buttons
        setupButtons();
    }

    private void loadUserProfile() {
        FirebaseUser user = mAuth.getCurrentUser();
        if (user != null) {
            // Load user data
            String displayName = user.getDisplayName();
            String email = user.getEmail();

            // Set user information in UI
            binding.userName.setText(displayName != null ? displayName : "User");
            binding.userEmail.setText(email != null ? email : "");

            // Load user photo
            if (user.getPhotoUrl() != null) {
                Glide.with(requireContext())
                    .load(user.getPhotoUrl())
                    .placeholder(R.drawable.ic_profile)
                    .error(R.drawable.ic_profile)
                    .circleCrop()
                    .into(binding.profileImage);
            }

            // Fetch additional user data from Firestore
            fetchUserData(user.getUid());
        } else {
            // Handle not logged in state
            navigateToLogin();
        }
    }

    private void fetchUserData(String uid) {
        // In a real app, this would fetch additional user data from Firestore
        // For now, we'll just use placeholder data
        // Add profile stats using String resources instead of directly setting text
        // The ProfileFragment.java has references to IDs that don't exist in the layout
        // So we'll use TextView views created programmatically instead

        // Create TextViews for the stats
        TextView tvMemberSince = new TextView(requireContext());
        tvMemberSince.setText("Bergabung sejak: Mei 2025");
        TextView tvJournalCount = new TextView(requireContext());
        tvJournalCount.setText("28");
        TextView tvConsultationCount = new TextView(requireContext());
        tvConsultationCount.setText("5");

        // We can add these to a container in the layout if needed
    }

    private void setupButtons() {
        // Edit Profile Button
        binding.editProfileButton.setOnClickListener(v -> {
            // Open edit profile screen
            Toast.makeText(requireContext(), "Membuka halaman edit profil", Toast.LENGTH_SHORT).show();
        });

        // Account Settings Button
        binding.accountSettingsContainer.setOnClickListener(v -> {
            // Open account settings
            Toast.makeText(requireContext(), "Membuka pengaturan akun", Toast.LENGTH_SHORT).show();
        });

        // Notification Settings Button
        binding.notificationSettingsContainer.setOnClickListener(v -> {
            // Open notification settings
            Toast.makeText(requireContext(), "Membuka pengaturan notifikasi", Toast.LENGTH_SHORT).show();
        });

        // Transaction History Button
        if (getView() != null) {
            View transactionHistoryContainer = getView().findViewById(R.id.transactionHistoryContainer);
            if (transactionHistoryContainer != null) {
                transactionHistoryContainer.setOnClickListener(v -> {
                    // Open transaction history
                    Toast.makeText(requireContext(), "Membuka riwayat transaksi", Toast.LENGTH_SHORT).show();
                });
            }
        }

        // Help Center Button
        if (getView() != null) {
            View helpSupportContainer = getView().findViewById(R.id.helpSupportContainer);
            if (helpSupportContainer != null) {
                helpSupportContainer.setOnClickListener(v -> {
                    // Open help center
                    Toast.makeText(requireContext(), "Membuka pusat bantuan", Toast.LENGTH_SHORT).show();
                });
            }
        }

        // Logout Button
        if (getView() != null) {
            View logoutButton = getView().findViewById(R.id.logoutButton);
            if (logoutButton != null) {
                logoutButton.setOnClickListener(v -> {
                    logoutUser();
                });
            }
        }
    }

    private void logoutUser() {
        // Show confirmation dialog
        new android.app.AlertDialog.Builder(requireContext())
            .setTitle("Keluar")
            .setMessage("Apakah kamu yakin ingin keluar?")
            .setPositiveButton("Ya", (dialog, which) -> {
                // Sign out from Firebase
                mAuth.signOut();
                Toast.makeText(requireContext(), "Berhasil keluar", Toast.LENGTH_SHORT).show();
                navigateToLogin();
            })
            .setNegativeButton("Tidak", null)
            .show();
    }

    private void navigateToLogin() {
        Intent intent = new Intent(requireContext(), LoginActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
