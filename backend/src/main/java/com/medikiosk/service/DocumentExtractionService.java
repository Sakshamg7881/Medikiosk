package com.medikiosk.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DocumentExtractionService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentExtractionService.class);

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    public DocumentExtractionService(GeminiService geminiService, ObjectMapper objectMapper) {
        this.geminiService = geminiService;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> structureDocument(String extractedText,
                                                 String documentType,
                                                 String fileName,
                                                 byte[] fileBytes,
                                                 String contentType) {
        boolean hasText = extractedText != null && !extractedText.isBlank();
        boolean isImage = contentType != null && contentType.toLowerCase(Locale.ROOT).contains("image");

        if (!hasText && (!isImage || fileBytes == null || fileBytes.length == 0)) {
            return getEmptyExtraction(documentType, "No readable text found in document.");
        }

        String prompt = buildExtractionPrompt(extractedText, documentType, fileName);

        try {
            String rawJson;
            if (hasText) {
                // Primary: send extracted text to Gemini
                rawJson = geminiService.generateContent(prompt);
            } else {
                // Secondary fallback: image multimodal vision
                rawJson = geminiService.generateContent(prompt, contentType, fileBytes);
            }

            return parseGeminiResponse(rawJson, documentType);

        } catch (Exception e) {
            logger.warn("Document structuring via Gemini failed: {}", e.getMessage());
            return getEmptyExtraction(documentType, "Automated extraction could not be completed.");
        }
    }

    private String buildExtractionPrompt(String text, String documentType, String fileName) {
        return """
                You are MediKiosk's clinical document transcription assistant in an Indian clinic.
                Analyze the following document and extract factual information.
                
                DOCUMENT METADATA:
                - File Name: %s
                - Declared Document Type: %s
                
                DOCUMENT TEXT CONTENT:
                %s
                
                CRITICAL EXTRACTION & SAFETY RULES:
                1. Extract ONLY information actually present in the document.
                2. NEVER invent, infer, or hallucinate missing information.
                3. Use null or empty arrays [] when information is unavailable.
                4. Preserve exact medicine names, dosages (e.g., 500mg), and frequencies (e.g., 1-0-1, BD) if readable.
                5. NO diagnosis generation. Do NOT invent diagnoses not explicitly written in the document.
                6. NO treatment recommendations or medical advice.
                7. If text is degraded or unclear, note that in "otherInformation".
                8. Return strictly valid JSON matching this schema without code blocks:
                {
                  "documentType": "%s",
                  "patientName": "string or null",
                  "doctorName": "string or null",
                  "date": "string or null",
                  "diagnoses": ["string"],
                  "medicines": ["string"],
                  "labResults": ["string"],
                  "importantFindings": ["string"],
                  "followUpInstructions": ["string"],
                  "otherInformation": ["string"]
                }
                """.formatted(
                fileName != null ? fileName : "Unknown",
                documentType != null ? documentType : "OTHER",
                text != null && !text.isBlank() ? text : "[Image uploaded without embedded text layer]",
                documentType != null ? documentType : "OTHER"
        );
    }

    public Map<String, Object> parseGeminiResponse(String raw, String defaultType) {
        if (raw == null || raw.isBlank()) {
            return getEmptyExtraction(defaultType, null);
        }

        try {
            String cleaned = raw.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            Map<String, Object> map = objectMapper.readValue(cleaned, new TypeReference<Map<String, Object>>() {});
            ensureList(map, "diagnoses");
            ensureList(map, "medicines");
            ensureList(map, "labResults");
            ensureList(map, "importantFindings");
            ensureList(map, "followUpInstructions");
            ensureList(map, "otherInformation");
            return map;

        } catch (Exception e) {
            logger.warn("Failed to parse Gemini extraction JSON: {}", e.getMessage());
            return getEmptyExtraction(defaultType, "Parsing error from AI response.");
        }
    }

    private void ensureList(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (!(val instanceof List)) {
            map.put(key, Collections.emptyList());
        }
    }

    private Map<String, Object> getEmptyExtraction(String documentType, String note) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("documentType", documentType != null ? documentType : "OTHER");
        map.put("patientName", null);
        map.put("doctorName", null);
        map.put("date", null);
        map.put("diagnoses", Collections.emptyList());
        map.put("medicines", Collections.emptyList());
        map.put("labResults", Collections.emptyList());
        map.put("importantFindings", Collections.emptyList());
        map.put("followUpInstructions", Collections.emptyList());
        map.put("otherInformation", note != null ? List.of(note) : Collections.emptyList());
        return map;
    }
}
