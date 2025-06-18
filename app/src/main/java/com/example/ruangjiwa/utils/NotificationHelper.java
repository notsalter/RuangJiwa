
package com.example.ruangjiwa.utils;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.example.ruangjiwa.MainActivity;
import com.example.ruangjiwa.R;

import java.util.Calendar;

public class NotificationHelper {
    
    private static final String CHANNEL_ID = "RUANG_JIWA_NOTIFICATIONS";
    private static final String CHANNEL_NAME = "RuangJiwa Reminders";
    private static final String CHANNEL_DESCRIPTION = "Daily reminders for mental health activities";
    private static final String PREFS_NAME = "notification_prefs";
    private static final String KEY_NOTIFICATIONS_ENABLED = "notifications_enabled";
    
    private Context context;
    private NotificationManagerCompat notificationManager;
    
    public NotificationHelper(Context context) {
        this.context = context;
        this.notificationManager = NotificationManagerCompat.from(context);
        createNotificationChannel();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription(CHANNEL_DESCRIPTION);
            
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
    
    public void scheduleJournalReminder() {
        if (!areNotificationsEnabled()) return;
        
        // Check if user hasn't journaled today
        if (!hasJournaledToday()) {
            showNotification(
                "Journal Reminder",
                "Take a moment to reflect on your day. How are you feeling?",
                1001
            );
        }
    }
    
    public void scheduleMoodCheckIn() {
        if (!areNotificationsEnabled()) return;
        
        // Check if user hasn't logged mood today
        if (!hasMoodLoggedToday()) {
            showNotification(
                "Mood Check-in",
                "How is your mood today? Take a moment to record how you're feeling.",
                1002
            );
        }
    }
    
    public void scheduleConsultationReminder(String psychologistName, String time) {
        if (!areNotificationsEnabled()) return;
        
        showNotification(
            "Consultation Reminder",
            "You have a consultation with " + psychologistName + " at " + time,
            1003
        );
    }
    
    public void showWellnessEncouragement() {
        if (!areNotificationsEnabled()) return;
        
        String[] encouragements = {
            "Remember to be kind to yourself today 💙",
            "You're doing great! Every small step counts 🌱",
            "Take a deep breath and remember you're not alone 🤗",
            "Your mental health matters. Thank you for taking care of yourself ✨"
        };
        
        int randomIndex = (int) (Math.random() * encouragements.length);
        
        showNotification(
            "Wellness Reminder",
            encouragements[randomIndex],
            1004
        );
    }
    
    private void showNotification(String title, String content, int notificationId) {
        try {
            Intent intent = new Intent(context, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 
                0, 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
              NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info) // Using system icon temporarily
                .setContentTitle(title)
                .setContentText(content)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(content))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);
            
            notificationManager.notify(notificationId, builder.build());
            
        } catch (SecurityException e) {
            // Handle case where notification permission is not granted
            // In API 33+, POST_NOTIFICATIONS permission is required
        }
    }
    
    private boolean areNotificationsEnabled() {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getBoolean(KEY_NOTIFICATIONS_ENABLED, true);
    }
    
    public void setNotificationsEnabled(boolean enabled) {
        SharedPreferences.Editor editor = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit();
        editor.putBoolean(KEY_NOTIFICATIONS_ENABLED, enabled);
        editor.apply();
    }
    
    private boolean hasJournaledToday() {
        SharedPreferences prefs = context.getSharedPreferences("journal_drafts", Context.MODE_PRIVATE);
        String today = getTodayString();
        return prefs.contains("entry_" + today);
    }
    
    private boolean hasMoodLoggedToday() {
        SharedPreferences prefs = context.getSharedPreferences("mood_data", Context.MODE_PRIVATE);
        String today = getTodayString();
        return prefs.contains("mood_" + today);
    }
    
    private String getTodayString() {
        Calendar cal = Calendar.getInstance();
        return String.format("%04d-%02d-%02d", 
            cal.get(Calendar.YEAR), 
            cal.get(Calendar.MONTH) + 1, 
            cal.get(Calendar.DAY_OF_MONTH));
    }
    
    public void cancelAllNotifications() {
        notificationManager.cancelAll();
    }
    
    public void scheduleAllReminders() {
        // Schedule daily reminders
        scheduleJournalReminder();
        scheduleMoodCheckIn();
        
        // Schedule random wellness encouragement
        if (Math.random() < 0.3) { // 30% chance
            showWellnessEncouragement();
        }
    }
}
