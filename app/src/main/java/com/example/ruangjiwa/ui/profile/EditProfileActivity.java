package com.example.ruangjiwa.ui.profile;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.MenuItem;
import android.view.View;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.bumptech.glide.Glide;
import com.example.ruangjiwa.R;
import com.example.ruangjiwa.databinding.ActivityEditProfileBinding;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.UserProfileChangeRequest;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class EditProfileActivity extends AppCompatActivity {

    private ActivityEditProfileBinding binding;
    private FirebaseAuth mAuth;
    private FirebaseFirestore db;
    private FirebaseStorage storage;
    private Uri selectedImageUri;
    private boolean isImageChanged = false;

    // Activity result launcher for selecting images
    private final ActivityResultLauncher<Intent> pickImageLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    selectedImageUri = result.getData().getData();
                    if (selectedImageUri != null) {
                        Glide.with(this)
                                .load(selectedImageUri)
                                .circleCrop()
                                .into(binding.profileImage);
                        isImageChanged = true;
                    }
                }
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityEditProfileBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Set up toolbar
        setSupportActionBar(binding.toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setDisplayShowHomeEnabled(true);
        }

        // Initialize Firebase
        mAuth = FirebaseAuth.getInstance();
        db = FirebaseFirestore.getInstance();
        storage = FirebaseStorage.getInstance();

        // Load current user data
        loadUserProfile();

        // Set up click listeners
        setupClickListeners();
    }

    private void loadUserProfile() {
        FirebaseUser user = mAuth.getCurrentUser();
        if (user != null) {
            // Set current values
            binding.nameEditText.setText(user.getDisplayName());
            binding.emailEditText.setText(user.getEmail());

            // Load user photo if it exists
            if (user.getPhotoUrl() != null) {
                Glide.with(this)
                        .load(user.getPhotoUrl())
                        .placeholder(R.drawable.default_profile)
                        .error(R.drawable.default_profile)
                        .circleCrop()
                        .into(binding.profileImage);
            }

            // Fetch additional user data from Firestore if needed
            // db.collection("users").document(user.getUid()).get()...
        }
    }

    private void setupClickListeners() {
        // Change profile photo button
        binding.changePhotoButton.setOnClickListener(view -> {
            Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
            pickImageLauncher.launch(intent);
        });

        // Change password button
        binding.changePasswordContainer.setOnClickListener(view -> {
            Intent intent = new Intent(EditProfileActivity.this, ChangePasswordActivity.class);
            startActivity(intent);
        });

        // Save changes button
        binding.saveButton.setOnClickListener(view -> saveProfileChanges());
    }

    private void saveProfileChanges() {
        String name = binding.nameEditText.getText().toString().trim();
        String email = binding.emailEditText.getText().toString().trim();

        // Validate inputs
        if (name.isEmpty()) {
            binding.nameInputLayout.setError("Name cannot be empty");
            return;
        }

        if (email.isEmpty()) {
            binding.emailInputLayout.setError("Email cannot be empty");
            return;
        }

        // Show progress bar
        binding.progressBar.setVisibility(View.VISIBLE);
        binding.saveButton.setEnabled(false);

        FirebaseUser user = mAuth.getCurrentUser();
        if (user == null) {
            showToast("User not authenticated");
            binding.progressBar.setVisibility(View.GONE);
            binding.saveButton.setEnabled(true);
            return;
        }

        // Update the profile in multiple steps
        updateUserProfile(user, name, email);
    }

    private void updateUserProfile(FirebaseUser user, String name, String email) {
        // Step 1: If email is changed, update it first
        if (!email.equals(user.getEmail())) {
            updateEmail(user, email, () -> {
                // After email update, continue with name and photo updates
                if (isImageChanged && selectedImageUri != null) {
                    uploadProfileImage(user, name);
                } else {
                    updateNameOnly(user, name);
                }
            });
        } else if (isImageChanged && selectedImageUri != null) {
            // Step 2: If only image is changed, update it along with name
            uploadProfileImage(user, name);
        } else {
            // Step 3: If only name is changed, update it
            updateNameOnly(user, name);
        }
    }

    private void updateEmail(FirebaseUser user, String newEmail, Runnable onSuccess) {
        user.updateEmail(newEmail)
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        showToast("Email updated successfully");
                        onSuccess.run();
                    } else {
                        binding.progressBar.setVisibility(View.GONE);
                        binding.saveButton.setEnabled(true);
                        showToast("Failed to update email: " + task.getException().getMessage());
                    }
                });
    }

    private void uploadProfileImage(FirebaseUser user, String name) {
        // Create a storage reference
        StorageReference storageRef = storage.getReference();
        String imageFileName = "profile_images/" + user.getUid() + "/" + UUID.randomUUID().toString() + ".jpg";
        StorageReference imageRef = storageRef.child(imageFileName);

        // Upload file to Firebase Storage
        imageRef.putFile(selectedImageUri)
                .addOnSuccessListener(taskSnapshot -> {
                    // Get the download URL and update user profile
                    imageRef.getDownloadUrl().addOnSuccessListener(uri -> {
                        updateNameAndPhoto(user, name, uri);
                    }).addOnFailureListener(e -> {
                        binding.progressBar.setVisibility(View.GONE);
                        binding.saveButton.setEnabled(true);
                        showToast("Failed to get image URL: " + e.getMessage());
                    });
                })
                .addOnFailureListener(e -> {
                    binding.progressBar.setVisibility(View.GONE);
                    binding.saveButton.setEnabled(true);
                    showToast("Failed to upload image: " + e.getMessage());
                });
    }

    private void updateNameAndPhoto(FirebaseUser user, String name, Uri photoUri) {
        UserProfileChangeRequest profileUpdates = new UserProfileChangeRequest.Builder()
                .setDisplayName(name)
                .setPhotoUri(photoUri)
                .build();

        user.updateProfile(profileUpdates)
                .addOnCompleteListener(task -> {
                    binding.progressBar.setVisibility(View.GONE);
                    binding.saveButton.setEnabled(true);
                    if (task.isSuccessful()) {
                        // Update Firestore document
                        updateFirestoreDocument(user.getUid(), name, photoUri.toString());
                        showToast("Profile updated successfully");
                        finish();
                    } else {
                        showToast("Failed to update profile: " + task.getException().getMessage());
                    }
                });
    }

    private void updateNameOnly(FirebaseUser user, String name) {
        UserProfileChangeRequest profileUpdates = new UserProfileChangeRequest.Builder()
                .setDisplayName(name)
                .build();

        user.updateProfile(profileUpdates)
                .addOnCompleteListener(task -> {
                    binding.progressBar.setVisibility(View.GONE);
                    binding.saveButton.setEnabled(true);
                    if (task.isSuccessful()) {
                        // Update Firestore document
                        updateFirestoreDocument(user.getUid(), name, null);
                        showToast("Profile updated successfully");
                        finish();
                    } else {
                        showToast("Failed to update profile: " + task.getException().getMessage());
                    }
                });
    }

    private void updateFirestoreDocument(String userId, String name, String photoUrl) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("name", name);
        if (photoUrl != null) {
            updates.put("profileImageUrl", photoUrl);
        }

        db.collection("users").document(userId)
                .update(updates)
                .addOnSuccessListener(aVoid -> {
                    // Firestore update successful
                })
                .addOnFailureListener(e -> {
                    // Log the error but don't show to user since Firebase Auth update was successful
                    e.printStackTrace();
                });
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            onBackPressed();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    private void showToast(String message) {
        Toast.makeText(EditProfileActivity.this, message, Toast.LENGTH_SHORT).show();
    }
}
