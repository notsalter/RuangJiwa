package com.example.ruangjiwa.data.model;

import java.util.Date;

/**
 * Data model for mental health articles
 */
public class Article {
    private String id;
    private String title;
    private String excerpt;
    private String content;
    private String imageUrl;
    private String category;
    private Date publishedAt;
    private String author;
    private int readTimeMinutes;

    // Empty constructor for Firebase
    public Article() {
    }

    public Article(String id, String title, String excerpt, String content, String imageUrl, String category, Date publishedAt, String author, int readTimeMinutes) {
        this.id = id;
        this.title = title;
        this.excerpt = excerpt;
        this.content = content;
        this.imageUrl = imageUrl;
        this.category = category;
        this.publishedAt = publishedAt;
        this.author = author;
        this.readTimeMinutes = readTimeMinutes;
    }

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getExcerpt() {
        return excerpt;
    }

    public void setExcerpt(String excerpt) {
        this.excerpt = excerpt;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Date getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(Date publishedAt) {
        this.publishedAt = publishedAt;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public int getReadTimeMinutes() {
        return readTimeMinutes;
    }

    public void setReadTimeMinutes(int readTimeMinutes) {
        this.readTimeMinutes = readTimeMinutes;
    }
}
