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

    @Override
    public void onResume() {
        super.onResume();
        // Reload user data when coming back to this fragment
        loadUserProfile();
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
                    .placeholder(R.drawable.default_profile)
                    .error(R.drawable.default_profile)
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
        // Fetch user data from Firestore
        db.collection("users").document(uid).get()
            .addOnSuccessListener(documentSnapshot -> {
                if (documentSnapshot.exists()) {
                    // You can extract additional user information here if needed
                    // For example:
                    // String memberSince = documentSnapshot.getString("memberSince");
                    // Long journalCount = documentSnapshot.getLong("journalCount");
                }
            })
            .addOnFailureListener(e -> {
                // Handle failure
            });
    }

    private void setupButtons() {
        // Edit Profile Button
        binding.editProfileButton.setOnClickListener(v -> {
            Intent intent = new Intent(requireContext(), EditProfileActivity.class);
            startActivity(intent);
        });

        // Account Settings Button
        binding.accountSettingsContainer.setOnClickListener(v -> {
            // Open account settings - for now, redirect to Edit Profile
            Intent intent = new Intent(requireContext(), EditProfileActivity.class);
            startActivity(intent);
        });

        // Notification Settings Button
        binding.notificationSettingsContainer.setOnClickListener(v -> {
            Toast.makeText(requireContext(), "Notification settings will be available soon", Toast.LENGTH_SHORT).show();
        });

        // Privacy Settings Button
        binding.privacySettingsContainer.setOnClickListener(v -> {
            Toast.makeText(requireContext(), "Privacy settings will be available soon", Toast.LENGTH_SHORT).show();
        });

        // Premium Subscription Button
        binding.subscriptionContainer.setOnClickListener(v -> {
            Toast.makeText(requireContext(), "Subscription features will be available soon", Toast.LENGTH_SHORT).show();
        });

        // Transaction History Button
        binding.transactionHistoryContainer.setOnClickListener(v -> {
            Toast.makeText(requireContext(), "Transaction history will be available soon", Toast.LENGTH_SHORT).show();
        });

        // Help & Support Button
        binding.helpSupportContainer.setOnClickListener(v -> {
            Toast.makeText(requireContext(), "Help & support will be available soon", Toast.LENGTH_SHORT).show();
        });

        // Terms & Conditions Button
        binding.termsConditionsContainer.setOnClickListener(v -> {
            Toast.makeText(requireContext(), "Terms & conditions will be available soon", Toast.LENGTH_SHORT).show();
        });

        // Logout Button
        binding.logoutButton.setOnClickListener(v -> {
            logoutUser();
        });
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
