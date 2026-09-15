package com.medikiosk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medikiosk.service.DocumentExtractionService;
import com.medikiosk.service.GeminiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class DocumentExtractionServiceTest {

    private GeminiService geminiService;
    private DocumentExtractionService extractionService;

    @BeforeEach
    public void setup() {
        geminiService = mock(GeminiService.class);
        extractionService = new DocumentExtractionService(geminiService, new ObjectMapper());
    }

    @Test
    public void testSuccessfulJsonStructuring() {
        String mockAiResponse = """
                ```json
                {
                  "documentType": "PRESCRIPTION",
                  "patientName": "Ramesh Kumar",
                  "doctorName": "Dr. Sharma",
                  "date": "10-09-2026",
                  "diagnoses": ["Hypertension"],
                  "medicines": ["Amlodipine 5mg OD", "Telmisartan 40mg OD"],
                  "labResults": ["BP: 140/90"],
                  "importantFindings": ["No pedal edema"],
                  "followUpInstructions": ["Review after 2 weeks"],
                  "otherInformation": []
                }
                ```
                """;

        when(geminiService.generateContent(anyString())).thenReturn(mockAiResponse);

        Map<String, Object> result = extractionService.structureDocument(
                "Rx: Amlodipine 5mg. Telmisartan 40mg. BP 140/90.",
                "PRESCRIPTION",
                "rx.pdf",
                null,
                "application/pdf"
        );

        assertNotNull(result);
        assertEquals("PRESCRIPTION", result.get("documentType"));
        assertEquals("Ramesh Kumar", result.get("patientName"));

        @SuppressWarnings("unchecked")
        List<String> meds = (List<String>) result.get("medicines");
        assertEquals(2, meds.size());
        assertTrue(meds.contains("Amlodipine 5mg OD"));

        @SuppressWarnings("unchecked")
        List<String> diagnoses = (List<String>) result.get("diagnoses");
        assertEquals(1, diagnoses.size());
        assertEquals("Hypertension", diagnoses.get(0));
    }

    @Test
    public void testResilienceOnMalformedOrEmptyGeminiResponse() {
        when(geminiService.generateContent(anyString())).thenReturn("Not valid JSON at all");

        Map<String, Object> result = extractionService.structureDocument(
                "Some raw text",
                "LAB_REPORT",
                "report.pdf",
                null,
                "application/pdf"
        );

        assertNotNull(result);
        assertEquals("LAB_REPORT", result.get("documentType"));
        assertNull(result.get("patientName"));
        assertTrue(((List<?>) result.get("medicines")).isEmpty());
    }
}
