package com.example.ruangjiwa.data;

import java.util.Date;
import java.util.List;

/**
 * Model class representing a journal entry in the app
 */
public class JournalEntry {
    private String id;
    private Date timestamp;
    private String moodType; // Associated mood with this journal entry
    private String content; // The actual journal text
    private String prompt; // The prompt that was used for this entry
    private List<String> tags;
    private boolean isPrivate; // Whether this entry is locked/private

    public JournalEntry(String moodType, String content, String prompt) {
        this.id = java.util.UUID.randomUUID().toString();
        this.timestamp = new Date();
        this.moodType = moodType;
        this.content = content;
        this.prompt = prompt;
        this.isPrivate = false;
    }

    public String getId() {
        return id;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public String getMoodType() {
        return moodType;
    }

    public String getContent() {
        return content;
    }

    public String getPrompt() {
        return prompt;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public boolean isPrivate() {
        return isPrivate;
    }

    public void setPrivate(boolean isPrivate) {
        this.isPrivate = isPrivate;
    }
}
