package com.medikiosk;

import com.medikiosk.service.RedFlagService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class RedFlagServiceTest {

    private RedFlagService redFlagService;

    @BeforeEach
    public void setup() {
        redFlagService = new RedFlagService();
    }

    @Test
    public void testPositiveDetectionChestPain() {
        RedFlagService.RedFlagResult res = redFlagService.checkRedFlags(
                "Patient reports severe chest pain and left arm numbness",
                "ECG normal"
        );

        assertTrue(res.isDetected());
        assertTrue(res.getMatchedTerms().contains("chest pain") || res.getMatchedTerms().contains("severe chest pain"));
        assertNotNull(res.getWarningMessage());
        assertTrue(res.getWarningMessage().contains("urgent medical attention"));
    }

    @Test
    public void testPositiveDetectionHindiAndHinglish() {
        RedFlagService.RedFlagResult res1 = redFlagService.checkRedFlags(
                "Seene me dard ho raha hai subah se"
        );
        assertTrue(res1.isDetected());

        RedFlagService.RedFlagResult res2 = redFlagService.checkRedFlags(
                "मरीज को सीने में दर्द और सांस लेने में तकलीफ है"
        );
        assertTrue(res2.isDetected());
        assertTrue(res2.getMatchedTerms().contains("सीने में दर्द") || res2.getMatchedTerms().contains("सांस लेने में तकलीफ"));
    }

    @Test
    public void testPositiveDetectionStrokeAndBleeding() {
        RedFlagService.RedFlagResult res1 = redFlagService.checkRedFlags("Sudden weakness on one side and slurred speech");
        assertTrue(res1.isDetected());

        RedFlagService.RedFlagResult res2 = redFlagService.checkRedFlags("Severe bleeding following laceration");
        assertTrue(res2.isDetected());
    }

    @Test
    public void testNegativeDetectionRoutineSymptoms() {
        RedFlagService.RedFlagResult res = redFlagService.checkRedFlags(
                "Ghutne me dard hai chalte waqt 2 hafte se",
                "Halka bukhar aur khansi",
                "Pet me gas banti hai"
        );

        assertFalse(res.isDetected());
        assertTrue(res.getMatchedTerms().isEmpty());
        assertNull(res.getWarningMessage());
    }
}
