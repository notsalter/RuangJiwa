package com.example.ruangjiwa.data;

import java.util.Date;

/**
 * Model class representing a consultation appointment with a psychologist
 */
public class ConsultationAppointment {
    private String id;
    private String psychologistId;
    private String psychologistName;
    private Date appointmentTime;
    private int durationMinutes;
    private String type; // "video" or "chat"

    public ConsultationAppointment(String id, String psychologistId, String psychologistName,
                                  Date appointmentTime, int durationMinutes, String type) {
        this.id = id;
        this.psychologistId = psychologistId;
        this.psychologistName = psychologistName;
        this.appointmentTime = appointmentTime;
        this.durationMinutes = durationMinutes;
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public String getPsychologistId() {
        return psychologistId;
    }

    public String getPsychologistName() {
        return psychologistName;
    }

    public Date getAppointmentTime() {
        return appointmentTime;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public String getType() {
        return type;
    }
}
