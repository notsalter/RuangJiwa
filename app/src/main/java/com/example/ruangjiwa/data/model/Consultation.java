package com.example.ruangjiwa.data.model;

import java.util.Date;

/**
 * Model class representing a consultation session with a psychologist
 */
public class Consultation {
    private String id;
    private String psychologistName;
    private String psychologistSpecialty;
    private String psychologistImageUrl;
    private Date dateTime;
    private int durationMinutes;
    private String status; // "Scheduled", "Confirmed", "Completed", "Cancelled"

    public Consultation() {
        // Required empty constructor for Firebase
    }

    public Consultation(String id, String psychologistName, String psychologistSpecialty,
                       String psychologistImageUrl, Date dateTime, int durationMinutes, String status) {
        this.id = id;
        this.psychologistName = psychologistName;
        this.psychologistSpecialty = psychologistSpecialty;
        this.psychologistImageUrl = psychologistImageUrl;
        this.dateTime = dateTime;
        this.durationMinutes = durationMinutes;
        this.status = status;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPsychologistName() {
        return psychologistName;
    }

    public void setPsychologistName(String psychologistName) {
        this.psychologistName = psychologistName;
    }

    public String getPsychologistSpecialty() {
        return psychologistSpecialty;
    }

    public void setPsychologistSpecialty(String psychologistSpecialty) {
        this.psychologistSpecialty = psychologistSpecialty;
    }

    public String getPsychologistImageUrl() {
        return psychologistImageUrl;
    }

    public void setPsychologistImageUrl(String psychologistImageUrl) {
        this.psychologistImageUrl = psychologistImageUrl;
    }

    public Date getDateTime() {
        return dateTime;
    }

    public void setDateTime(Date dateTime) {
        this.dateTime = dateTime;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(int durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
