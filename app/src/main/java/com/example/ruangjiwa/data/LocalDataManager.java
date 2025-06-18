package com.example.ruangjiwa.data;

import android.content.Context;
import android.content.SharedPreferences;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;

/**
 * Simple data manager that uses SharedPreferences for local storage of user data
 */
public class LocalDataManager {
    private static final String PREF_NAME = "ruangjiwa_prefs";
    private static final String KEY_USER_NAME = "user_name";
    private static final String KEY_USER_MOOD_ENTRIES = "user_mood_entries";
    private static final String KEY_USER_JOURNAL_ENTRIES = "user_journal_entries";
    private static final String KEY_FAVORITE_PSYCHOLOGISTS = "favorite_psychologists";

    private final SharedPreferences sharedPreferences;
    private final Gson gson;

    public LocalDataManager(Context context) {
        this.sharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        this.gson = new Gson();

        // Initialize with default user name if not set
        if (!sharedPreferences.contains(KEY_USER_NAME)) {
            setUserName("Anindita Wijaya");
        }
    }

    // User methods
    public String getUserName() {
        return sharedPreferences.getString(KEY_USER_NAME, "Anindita Wijaya");
    }

    public void setUserName(String name) {
        sharedPreferences.edit().putString(KEY_USER_NAME, name).apply();
    }

    // Mood entry methods
    public List<MoodEntry> getMoodEntries() {
        String json = sharedPreferences.getString(KEY_USER_MOOD_ENTRIES, null);
        if (json == null) {
            return new ArrayList<>();
        }
        Type type = new TypeToken<List<MoodEntry>>(){}.getType();
        return gson.fromJson(json, type);
    }

    public void saveMoodEntry(MoodEntry entry) {
        List<MoodEntry> entries = getMoodEntries();
        entries.add(entry);
        String json = gson.toJson(entries);
        sharedPreferences.edit().putString(KEY_USER_MOOD_ENTRIES, json).apply();
    }

    // Journal entry methods
    public List<JournalEntry> getJournalEntries() {
        String json = sharedPreferences.getString(KEY_USER_JOURNAL_ENTRIES, null);
        if (json == null) {
            return new ArrayList<>();
        }
        Type type = new TypeToken<List<JournalEntry>>(){}.getType();
        return gson.fromJson(json, type);
    }

    public void saveJournalEntry(JournalEntry entry) {
        List<JournalEntry> entries = getJournalEntries();
        entries.add(entry);
        String json = gson.toJson(entries);
        sharedPreferences.edit().putString(KEY_USER_JOURNAL_ENTRIES, json).apply();
    }

    // Favorite psychologists methods
    public List<String> getFavoritePsychologists() {
        String json = sharedPreferences.getString(KEY_FAVORITE_PSYCHOLOGISTS, null);
        if (json == null) {
            return new ArrayList<>();
        }
        Type type = new TypeToken<List<String>>(){}.getType();
        return gson.fromJson(json, type);
    }

    public void toggleFavoritePsychologist(String psychologistId) {
        List<String> favorites = getFavoritePsychologists();
        if (favorites.contains(psychologistId)) {
            favorites.remove(psychologistId);
        } else {
            favorites.add(psychologistId);
        }
        String json = gson.toJson(favorites);
        sharedPreferences.edit().putString(KEY_FAVORITE_PSYCHOLOGISTS, json).apply();
    }

    public boolean isPsychologistFavorite(String psychologistId) {
        List<String> favorites = getFavoritePsychologists();
        return favorites.contains(psychologistId);
    }
}
