package com.medikiosk.service;

public interface GeminiService {
    String generateContent(String prompt);
    default String generateContent(String prompt, String mimeType, byte[] mediaBytes) {
        return generateContent(prompt);
    }
}
