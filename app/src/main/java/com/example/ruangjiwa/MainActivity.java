package com.example.ruangjiwa;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.MenuItem;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

import com.example.ruangjiwa.databinding.ActivityMainBinding;
import com.example.ruangjiwa.ui.auth.LoginActivity;
import com.example.ruangjiwa.ui.consultation.ConsultationFragment;
import com.example.ruangjiwa.ui.home.HomeFragment;
import com.example.ruangjiwa.ui.journal.JournalFragment;
import com.example.ruangjiwa.ui.mood.MoodFragment;
import com.example.ruangjiwa.ui.profile.ProfileFragment;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.firebase.auth.FirebaseAuth;

public class MainActivity extends AppCompatActivity implements BottomNavigationView.OnNavigationItemSelectedListener {

    private static final String TAG = "MainActivity";
    private ActivityMainBinding binding;
    private FirebaseAuth mAuth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            // Initialize view binding
            binding = ActivityMainBinding.inflate(getLayoutInflater());
            setContentView(binding.getRoot());

            // Initialize Firebase Auth
            mAuth = FirebaseAuth.getInstance();

            // Check if user is logged in
            if (mAuth.getCurrentUser() == null) {
                Log.e(TAG, "No user logged in, returning to login screen");
                startActivity(new Intent(this, LoginActivity.class));
                finish();
                return;
            }

            // Setup bottom navigation with error handling
            try {
                binding.bottomNavigation.setOnNavigationItemSelectedListener(this);
            } catch (Exception e) {
                Log.e(TAG, "Error setting up navigation listener: " + e.getMessage());
                Toast.makeText(this, "Error setting up navigation", Toast.LENGTH_SHORT).show();
            }

            // Load default fragment (Home)
            if (savedInstanceState == null) {
                loadFragment(new HomeFragment());
                binding.bottomNavigation.setSelectedItemId(R.id.navigation_home);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onCreate: " + e.getMessage());
            Toast.makeText(this, "Error initializing app", Toast.LENGTH_SHORT).show();
            finish();
        }
    }

    @Override
    public boolean onNavigationItemSelected(@NonNull MenuItem item) {
        Fragment fragment = null;
        try {
            int itemId = item.getItemId();

            if (itemId == R.id.navigation_home) {
                fragment = new HomeFragment();
            } else if (itemId == R.id.navigation_consultation) {
                fragment = new ConsultationFragment();
            } else if (itemId == R.id.navigation_journal) {
                fragment = new JournalFragment();
            } else if (itemId == R.id.navigation_mood) {
                fragment = new MoodFragment();
            } else if (itemId == R.id.navigation_profile) {
                fragment = new ProfileFragment();
            }

            return loadFragment(fragment);
        } catch (Exception e) {
            Log.e(TAG, "Error navigating to fragment: " + e.getMessage());
            Toast.makeText(this, "Error navigating to screen", Toast.LENGTH_SHORT).show();
            return false;
        }
    }

    private boolean loadFragment(Fragment fragment) {
        if (fragment != null) {
            try {
                getSupportFragmentManager()
                        .beginTransaction()
                        .replace(R.id.fragment_container, fragment)
                        .commit();
                return true;
            } catch (Exception e) {
                Log.e(TAG, "Error loading fragment: " + e.getMessage());
                Toast.makeText(this, "Error loading screen", Toast.LENGTH_SHORT).show();
            }
        }
        return false;
    }

    // Add option to sign out
    @Override
    public boolean onCreateOptionsMenu(android.view.Menu menu) {
        getMenuInflater().inflate(R.menu.main_menu, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == R.id.action_sign_out) {
            mAuth.signOut();
            Toast.makeText(this, "Signed out successfully", Toast.LENGTH_SHORT).show();
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
