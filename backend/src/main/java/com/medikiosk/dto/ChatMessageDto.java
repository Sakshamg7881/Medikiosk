package com.medikiosk.dto;

public class ChatMessageDto {
    private String role; // "assistant" or "user"
    private String text;
    private String timestamp;
    private String section; // "GENERAL", "AYUSH", "PRAKRITI"

    public ChatMessageDto() {}

    public ChatMessageDto(String role, String text, String timestamp, String section) {
        this.role = role;
        this.text = text;
        this.timestamp = timestamp;
        this.section = section;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }
}
