package com.example.ruangjiwa.ui.profile;

import android.os.Bundle;
import android.view.MenuItem;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.example.ruangjiwa.databinding.ActivityChangePasswordBinding;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.EmailAuthProvider;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

public class ChangePasswordActivity extends AppCompatActivity {

    private ActivityChangePasswordBinding binding;
    private FirebaseAuth mAuth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityChangePasswordBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Set up toolbar
        setSupportActionBar(binding.toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setDisplayShowHomeEnabled(true);
        }

        // Initialize Firebase Auth
        mAuth = FirebaseAuth.getInstance();

        // Set up change password button
        binding.changePasswordButton.setOnClickListener(view -> validateAndChangePassword());
    }

    private void validateAndChangePassword() {
        String currentPassword = binding.currentPasswordEditText.getText().toString().trim();
        String newPassword = binding.newPasswordEditText.getText().toString().trim();
        String confirmPassword = binding.confirmPasswordEditText.getText().toString().trim();

        // Clear previous errors
        binding.currentPasswordInputLayout.setError(null);
        binding.newPasswordInputLayout.setError(null);
        binding.confirmPasswordInputLayout.setError(null);

        // Validate inputs
        if (currentPassword.isEmpty()) {
            binding.currentPasswordInputLayout.setError("Current password is required");
            return;
        }

        if (newPassword.isEmpty()) {
            binding.newPasswordInputLayout.setError("New password is required");
            return;
        }

        if (newPassword.length() < 6) {
            binding.newPasswordInputLayout.setError("Password must be at least 6 characters");
            return;
        }

        if (!newPassword.equals(confirmPassword)) {
            binding.confirmPasswordInputLayout.setError("Passwords don't match");
            return;
        }

        // Show progress
        binding.progressBar.setVisibility(View.VISIBLE);
        binding.changePasswordButton.setEnabled(false);

        // Get current user
        FirebaseUser user = mAuth.getCurrentUser();
        if (user != null) {
            // Re-authenticate user before changing password
            AuthCredential credential = EmailAuthProvider.getCredential(user.getEmail(), currentPassword);

            user.reauthenticate(credential)
                    .addOnCompleteListener(reAuthTask -> {
                        if (reAuthTask.isSuccessful()) {
                            // User re-authenticated successfully, now update the password
                            updatePassword(user, newPassword);
                        } else {
                            // If re-authentication fails
                            binding.progressBar.setVisibility(View.GONE);
                            binding.changePasswordButton.setEnabled(true);
                            binding.currentPasswordInputLayout.setError("Current password is incorrect");
                        }
                    });
        } else {
            binding.progressBar.setVisibility(View.GONE);
            binding.changePasswordButton.setEnabled(true);
            showToast("User not authenticated");
        }
    }

    private void updatePassword(FirebaseUser user, String newPassword) {
        user.updatePassword(newPassword)
                .addOnCompleteListener(task -> {
                    binding.progressBar.setVisibility(View.GONE);
                    binding.changePasswordButton.setEnabled(true);
                    if (task.isSuccessful()) {
                        showToast("Password updated successfully");
                        finish();
                    } else {
                        showToast("Failed to update password: " + task.getException().getMessage());
                    }
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
        Toast.makeText(ChangePasswordActivity.this, message, Toast.LENGTH_SHORT).show();
    }
}
