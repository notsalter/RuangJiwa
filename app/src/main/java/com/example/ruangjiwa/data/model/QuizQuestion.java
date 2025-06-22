package com.example.ruangjiwa.data.model;

import java.util.List;

/**
 * Model class representing a mental health quiz question
 */
public class QuizQuestion {
    private String questionText;
    private List<QuizOption> options;

    public QuizQuestion(String questionText, List<QuizOption> options) {
        this.questionText = questionText;
        this.options = options;
    }

    public String getQuestionText() {
        return questionText;
    }

    public List<QuizOption> getOptions() {
        return options;
    }
}
