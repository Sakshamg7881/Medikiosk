package com.medikiosk.controller;

import com.medikiosk.exception.GeminiException;
import com.medikiosk.service.GeminiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private static final Logger logger = LoggerFactory.getLogger(AiController.class);

    private final GeminiService geminiService;

    public AiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testConnection() {
        Map<String, Object> response = new LinkedHashMap<>();
        try {
            String aiMessage = geminiService.generateContent("Reply with exactly: MediKiosk AI connection successful.");
            response.put("success", true);
            response.put("message", aiMessage);
            return ResponseEntity.ok(response);
        } catch (GeminiException e) {
            logger.warn("Gemini connection test failed: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            HttpStatus status = HttpStatus.resolve(e.getStatusCode());
            return ResponseEntity.status(status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            logger.error("Unexpected error in /api/ai/test: {}", e.getMessage());
            response.put("success", false);
            response.put("message", "An unexpected error occurred while communicating with MediKiosk AI service.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
