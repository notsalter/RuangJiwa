package com.example.ruangjiwa.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.ruangjiwa.R;
import com.example.ruangjiwa.MainActivity;
import com.google.android.material.textfield.TextInputEditText;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthUserCollisionException;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.UserProfileChangeRequest;

public class RegisterActivity extends AppCompatActivity {

    private TextInputEditText nameInput, emailInput, passwordInput, confirmPasswordInput;
    private Button registerButton, loginButton;
    private ProgressBar progressBar;
    private FirebaseAuth auth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        // Hide action bar
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }

        // Initialize Firebase Auth
        auth = FirebaseAuth.getInstance();

        // Initialize UI elements
        nameInput = findViewById(R.id.nameInput);
        emailInput = findViewById(R.id.emailInput);
        passwordInput = findViewById(R.id.passwordInput);
        confirmPasswordInput = findViewById(R.id.confirmPasswordInput);
        registerButton = findViewById(R.id.registerButton);
        loginButton = findViewById(R.id.loginButton);
        progressBar = findViewById(R.id.registerProgressBar);

        // Setup click listeners
        registerButton.setOnClickListener(v -> registerUser());
        loginButton.setOnClickListener(v -> {
            startActivity(new Intent(RegisterActivity.this, LoginActivity.class));
            finish();
        });
    }

    private void registerUser() {
        String name = nameInput.getText().toString().trim();
        String email = emailInput.getText().toString().trim();
        String password = passwordInput.getText().toString().trim();
        String confirmPassword = confirmPasswordInput.getText().toString().trim();

        // Validate inputs
        if (TextUtils.isEmpty(name)) {
            nameInput.setError("Name is required");
            nameInput.requestFocus();
            return;
        }

        if (TextUtils.isEmpty(email)) {
            emailInput.setError("Email is required");
            emailInput.requestFocus();
            return;
        }

        if (TextUtils.isEmpty(password)) {
            passwordInput.setError("Password is required");
            passwordInput.requestFocus();
            return;
        }

        if (password.length() < 6) {
            passwordInput.setError("Password must be at least 6 characters");
            passwordInput.requestFocus();
            return;
        }

        if (TextUtils.isEmpty(confirmPassword)) {
            confirmPasswordInput.setError("Please confirm your password");
            confirmPasswordInput.requestFocus();
            return;
        }

        if (!password.equals(confirmPassword)) {
            confirmPasswordInput.setError("Passwords don't match");
            confirmPasswordInput.requestFocus();
            return;
        }

        // Show progress and disable register button
        progressBar.setVisibility(View.VISIBLE);
        registerButton.setEnabled(false);

        // Create account with Firebase
        auth.createUserWithEmailAndPassword(email, password)
                .addOnCompleteListener(this, task -> {
                    if (task.isSuccessful()) {
                        // Update user profile with display name
                        FirebaseUser user = auth.getCurrentUser();
                        if (user != null) {
                            UserProfileChangeRequest profileUpdates = new UserProfileChangeRequest.Builder()
                                    .setDisplayName(name)
                                    .build();

                            user.updateProfile(profileUpdates)
                                    .addOnCompleteListener(profileTask -> {
                                        progressBar.setVisibility(View.GONE);
                                        registerButton.setEnabled(true);

                                        if (profileTask.isSuccessful()) {
                                            Toast.makeText(RegisterActivity.this,
                                                "Registration successful",
                                                Toast.LENGTH_SHORT).show();
                                            // Go to main activity
                                            startActivity(new Intent(RegisterActivity.this, MainActivity.class));
                                            finish();
                                        } else {
                                            Toast.makeText(RegisterActivity.this,
                                                "Failed to update profile: " + profileTask.getException().getMessage(),
                                                Toast.LENGTH_LONG).show();
                                        }
                                    });
                        }
                    } else {
                        // Registration failed
                        progressBar.setVisibility(View.GONE);
                        registerButton.setEnabled(true);
                        handleRegistrationFailure(task.getException());
                    }
                });
    }

    private void handleRegistrationFailure(Exception exception) {
        if (exception instanceof FirebaseAuthUserCollisionException) {
            // Email already exists
            Toast.makeText(RegisterActivity.this,
                "An account already exists with this email",
                Toast.LENGTH_LONG).show();
            emailInput.setError("Email already in use");
            emailInput.requestFocus();
        } else {
            // Other errors
            Toast.makeText(RegisterActivity.this,
                "Registration failed: " + exception.getMessage(),
                Toast.LENGTH_LONG).show();
        }
    }
}
