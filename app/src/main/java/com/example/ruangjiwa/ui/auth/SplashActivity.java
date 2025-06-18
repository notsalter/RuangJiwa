package com.example.ruangjiwa.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.ruangjiwa.R;
import com.example.ruangjiwa.MainActivity;
import com.google.firebase.auth.FirebaseAuth;

public class SplashActivity extends AppCompatActivity {

    private static final String TAG = "SplashActivity";
    private static final int SPLASH_TIMEOUT = 2000; // 2 seconds
    private FirebaseAuth auth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        // Hide action bar
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }

        try {
            // Initialize Firebase Auth
            auth = FirebaseAuth.getInstance();

            // Delayed navigation
            new Handler().postDelayed(this::checkUserStatus, SPLASH_TIMEOUT);

        } catch (Exception e) {
            Log.e(TAG, "Error initializing Firebase: " + e.getMessage());
            Toast.makeText(this, "Failed to initialize app: " + e.getMessage(), Toast.LENGTH_LONG).show();
            e.printStackTrace();

            // Fallback to login screen if Firebase fails
            new Handler().postDelayed(() -> {
                startActivity(new Intent(SplashActivity.this, LoginActivity.class));
                finish();
            }, 1000);
        }
    }

    private void checkUserStatus() {
        try {
            // Check if user is already logged in
            if (auth.getCurrentUser() != null) {
                // User is already logged in, navigate to main activity
                Log.d(TAG, "User already logged in, going to MainActivity");
                startActivity(new Intent(SplashActivity.this, MainActivity.class));
            } else {
                // User is not logged in, navigate to login activity
                Log.d(TAG, "No logged in user, going to LoginActivity");
                startActivity(new Intent(SplashActivity.this, LoginActivity.class));
            }
            finish();
        } catch (Exception e) {
            Log.e(TAG, "Error checking user status: " + e.getMessage());
            Toast.makeText(this, "Error: " + e.getMessage(), Toast.LENGTH_SHORT).show();

            // Fallback to login screen
            startActivity(new Intent(SplashActivity.this, LoginActivity.class));
            finish();
        }
    }
}
