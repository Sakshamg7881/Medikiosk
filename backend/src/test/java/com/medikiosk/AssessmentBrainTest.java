package com.medikiosk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medikiosk.dto.AssessmentMessageRequest;
import com.medikiosk.dto.AssessmentResponse;
import com.medikiosk.dto.AssessmentStartRequest;
import com.medikiosk.model.Case;
import com.medikiosk.model.ClinicalInterviewState;
import com.medikiosk.model.Patient;
import com.medikiosk.repository.CaseRepository;
import com.medikiosk.repository.PatientRepository;
import com.medikiosk.service.AssessmentService;
import com.medikiosk.service.GeminiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("local")
public class AssessmentBrainTest {

    @Autowired
    private AssessmentService assessmentService;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private CaseRepository caseRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GeminiService geminiService;

    private Long testPatientId;

    @BeforeEach
    public void setup() {
        caseRepository.deleteAll();
        patientRepository.deleteAll();

        Patient p = new Patient("Vikram Patel", 48, "Male", "9876501234", "hinglish");
        Patient saved = patientRepository.save(p);
        testPatientId = saved.getId();
    }

    @Test
    public void testMultiFactExtractionInSingleTurn() {
        // Mock Gemini returning multi-fact extraction
        String geminiJson = """
                {
                  "acknowledgement": "Samajh gaya.",
                  "interruptionResponse": "",
                  "nextQuestion": "Kya aapne iske liye koi dawai li hai?",
                  "quickOptions": ["Koi dawai nahi li", "Painkiller li hai"],
                  "extractedFacts": {
                    "chiefComplaint": "Knee pain",
                    "duration": "2 weeks",
                    "location": "Knee",
                    "aggravatingFactors": "Climbing stairs",
                    "severity": "6/10",
                    "pertinentNegatives": ["Swelling absent"]
                  },
                  "isAssessmentComplete": false
                }
                """;
        when(geminiService.generateContent(anyString())).thenReturn(geminiJson);

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        // Single patient message with multiple clinical facts
        AssessmentMessageRequest msgReq = new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish",
                "2 hafte se ghutne mein dard hai, seedhi chadhte time zyada hota hai, swelling nahi hai aur pain around 6 hai."
        );

        AssessmentResponse res = assessmentService.processMessage(msgReq);
        assertNotNull(res);
        assertFalse(res.isCompleted());
        assertTrue(res.getMessage().contains("Kya aapne iske liye koi dawai li hai?"));

        // Verify state persisted in Case
        Case savedCase = caseRepository.findById(caseId).orElseThrow();
        assertNotNull(savedCase.getClinicalState());
        assertTrue(savedCase.getHpi().contains("Duration: 2 weeks"));
        assertTrue(savedCase.getHpi().contains("Aggravating: Climbing stairs"));
        assertTrue(savedCase.getHpi().contains("Severity: 6/10"));
        assertTrue(savedCase.getHpi().contains("Pertinent Negatives: Swelling absent"));
    }

    @Test
    public void testCorrectionAndContradictionHandling() {
        // Turn 1: initial statement
        String geminiTurn1 = """
                {
                  "acknowledgement": "Samajh gaya.",
                  "nextQuestion": "Dard kaisa mehsoos hota hai?",
                  "quickOptions": ["Chubhan jaisa", "Bhari pan"],
                  "extractedFacts": {
                    "chiefComplaint": "Knee pain",
                    "duration": "3 din"
                  },
                  "isAssessmentComplete": false
                }
                """;
        // Turn 2: patient corrects duration
        String geminiTurn2 = """
                {
                  "acknowledgement": "Theek hai, note kar liya.",
                  "nextQuestion": "Kya chalne me pareshani hoti hai?",
                  "quickOptions": ["Haan, chalne me", "Nahi, aaram se"],
                  "extractedFacts": {
                    "duration": "2 weeks"
                  },
                  "isAssessmentComplete": false
                }
                """;
        when(geminiService.generateContent(anyString()))
                .thenReturn(geminiTurn1)
                .thenReturn(geminiTurn2);

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        // Message 1: "Ye dard 3 din se hai"
        assessmentService.processMessage(new AssessmentMessageRequest(caseId, testPatientId, "hinglish", "Ye dard 3 din se hai"));

        // Message 2: Patient corrects: "Actually 2 weeks se hai"
        assessmentService.processMessage(new AssessmentMessageRequest(caseId, testPatientId, "hinglish", "Actually 2 weeks se hai"));

        Case savedCase = caseRepository.findById(caseId).orElseThrow();
        // The latest correction must override 3 din
        assertTrue(savedCase.getHpi().contains("Duration: 2 weeks"));
    }

    @Test
    public void testTopicInterruptionAndFactRetention() {
        // Patient asks unrelated question: "Waise kya main chai pee sakta hoon? Aur mujhe diabetes bhi hai."
        String geminiInterruption = """
                {
                  "acknowledgement": "",
                  "interruptionResponse": "Chai ki suitability aapki condition par depend karti hai, doctor se consult karenge.",
                  "nextQuestion": "Aapka ghutne ka dard kitna severe hai?",
                  "quickOptions": ["Halka dard", "Tez dard"],
                  "extractedFacts": {
                    "pastMedicalHistory": "Type 2 Diabetes Mellitus"
                  },
                  "isAssessmentComplete": false
                }
                """;
        when(geminiService.generateContent(anyString())).thenReturn(geminiInterruption);

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        AssessmentResponse res = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish", "Waise kya main chai pee sakta hoon? Aur mujhe diabetes bhi hai."
        ));

        // Must answer interruption gracefully and return to clinical question
        assertTrue(res.getMessage().contains("Chai ki suitability"));
        assertTrue(res.getMessage().contains("ghutne ka dard kitna severe hai"));

        Case savedCase = caseRepository.findById(caseId).orElseThrow();
        assertTrue(savedCase.getClinicalState().contains("Diabetes"));
    }

    @Test
    public void testDeterministicRedFlagDetectionDuringIntake() {
        // Patient mentions chest pain
        String geminiTurn = """
                {
                  "acknowledgement": "Samajh gaya.",
                  "nextQuestion": "Kya saans lene me takleef ho rahi hai?",
                  "quickOptions": ["Haan", "Nahi"],
                  "extractedFacts": {
                    "chiefComplaint": "Chest pain"
                  },
                  "isAssessmentComplete": false
                }
                """;
        when(geminiService.generateContent(anyString())).thenReturn(geminiTurn);

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        AssessmentResponse res = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish", "Mujhe seene me dard ho raha hai."
        ));

        assertTrue(res.getRedFlagDetected(), "Red flag must be detected for chest pain");
        assertTrue(res.getMessage().contains("⚠️"), "Message must contain safety alert warning");

        Case savedCase = caseRepository.findById(caseId).orElseThrow();
        assertTrue(savedCase.getRedFlagDetected());
    }

    @Test
    public void testStructured14SectionSummaryGenerationWithNotReported() {
        // Complete interview turn
        String geminiComplete = """
                {
                  "acknowledgement": "Dhanyavaad.",
                  "nextQuestion": "Aapka intake complete ho gaya hai.",
                  "quickOptions": [],
                  "extractedFacts": {
                    "chiefComplaint": "Ghutne mein dard",
                    "duration": "2 weeks",
                    "location": "Right knee",
                    "severity": "6/10",
                    "aggravatingFactors": "Climbing stairs",
                    "pastMedicalHistory": "Type 2 Diabetes Mellitus",
                    "currentMedicines": "Metformin",
                    "ayushAgni": "Normal appetite",
                    "ayushNidra": "Disturbed sleep",
                    "ayushMala": "Regular bowels"
                  },
                  "isAssessmentComplete": true
                }
                """;
        when(geminiService.generateContent(anyString())).thenReturn(geminiComplete);

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        // 2 turns to satisfy minimum turns
        assessmentService.processMessage(new AssessmentMessageRequest(caseId, testPatientId, "hinglish", "Ghutne me dard hai"));
        AssessmentResponse finalRes = assessmentService.processMessage(new AssessmentMessageRequest(caseId, testPatientId, "hinglish", "2 hafte se right knee me"));

        assertTrue(finalRes.isCompleted(), "Case must be completed");
        assertEquals("COMPLETED", finalRes.getSection());

        Case savedCase = caseRepository.findById(caseId).orElseThrow();
        assertEquals("READY_FOR_REVIEW", savedCase.getStatus());
        String summary = savedCase.getAiSummary();
        assertNotNull(summary);

        // Verify all key sections of the 14-section format
        assertTrue(summary.contains("1. CHIEF COMPLAINT:"));
        assertTrue(summary.contains("2. HISTORY OF PRESENT ILLNESS (HPI):"));
        assertTrue(summary.contains("3. ASSOCIATED SYMPTOMS:"));
        assertTrue(summary.contains("4. RELEVANT MEDICAL HISTORY:"));
        assertTrue(summary.contains("5. SURGICAL HISTORY:"));
        assertTrue(summary.contains("6. CURRENT MEDICINES:"));
        assertTrue(summary.contains("7. ALLERGIES:"));
        assertTrue(summary.contains("8. FAMILY HISTORY:"));
        assertTrue(summary.contains("9. PERSONAL / LIFESTYLE HISTORY:"));
        assertTrue(summary.contains("10. AYUSH PROFILE:"));
        assertTrue(summary.contains("11. PREVIOUS DOCUMENTS / INVESTIGATIONS:"));
        assertTrue(summary.contains("12. RED FLAGS:"));
        assertTrue(summary.contains("13. MISSING / NOT REPORTED INFORMATION:"));
        assertTrue(summary.contains("14. CONCISE PRE-CONSULTATION SUMMARY:"));

        // Verify that unasked/missing sections are explicitly marked "Not reported"
        assertTrue(summary.contains("Surgical History:\nNot reported") || summary.contains("Surgical History: Not reported"));
        assertTrue(summary.contains("Allergies:\nNot reported") || summary.contains("Allergies: Not reported"));
    }

    @Test
    public void testMultiSymptomDualDurationExtraction() {
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline for deterministic fallback verification"));

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        // Exact observed user input
        AssessmentMessageRequest msgReq = new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish",
                "2 din se fever ho rha or 5 din se jukham"
        );

        AssessmentResponse res = assessmentService.processMessage(msgReq);
        assertNotNull(res);

        Case savedCase = caseRepository.findById(caseId).orElseThrow();
        ClinicalInterviewState state = null;
        try {
            state = objectMapper.readValue(savedCase.getClinicalState(), ClinicalInterviewState.class);
        } catch (Exception e) {
            fail("Failed to parse clinical state");
        }

        assertNotNull(state);
        assertTrue(state.hasDurationKnown(), "State must recognize that durations are known");
        assertTrue(state.getSymptoms().size() >= 2, "Must capture at least 2 structured symptoms");

        // Verify both symptoms captured with their distinct durations
        boolean foundFever = false;
        boolean foundCold = false;
        for (ClinicalInterviewState.SymptomItem s : state.getSymptoms()) {
            if (s.getName().toLowerCase().contains("fever") || s.getName().toLowerCase().contains("bukhar")) {
                foundFever = true;
                assertEquals("2 days", s.getDuration());
            }
            if (s.getName().toLowerCase().contains("cold") || s.getName().toLowerCase().contains("jukham") || s.getName().toLowerCase().contains("runny")) {
                foundCold = true;
                assertEquals("5 days", s.getDuration());
            }
        }
        assertTrue(foundFever, "Fever with 2 days duration must be extracted");
        assertTrue(foundCold, "Cold/Jukham with 5 days duration must be extracted");

        // Crucial validation: AI must NOT ask duration question again!
        assertFalse(res.getMessage().contains("kab se ho rahi hai"), "Must NOT ask how long when duration is already provided");
        assertFalse(res.getMessage().toLowerCase().contains("how long"), "Must NOT ask how long in English");
        // Must ask clinically relevant respiratory question in Hinglish
        assertTrue(res.getMessage().contains("Samajh gaya") || res.getMessage().contains("bukhar"), "Should ask relevant follow-up question");
    }

    @Test
    public void testEnglishAndHindiMultiFactExtraction() {
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline"));

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "en");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        // English multi-symptom
        AssessmentResponse resEn = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "en",
                "I've had fever for two days and cough for five days."
        ));
        assertFalse(resEn.getMessage().toLowerCase().contains("how long have you been experiencing"), "Must not re-ask duration in English");

        Case savedCase = caseRepository.findById(caseId).orElseThrow();
        assertTrue(savedCase.getClinicalState().contains("Fever"));
        assertTrue(savedCase.getClinicalState().contains("Cough"));

        // Hindi multi-symptom
        Patient pHi = patientRepository.save(new Patient("Sunita Devi", 42, "Female", "9812345678", "hi"));
        AssessmentResponse startHi = assessmentService.startOrResumeAssessment(new AssessmentStartRequest(pHi.getId(), "hi"));
        AssessmentResponse resHi = assessmentService.processMessage(new AssessmentMessageRequest(
                startHi.getCaseId(), pHi.getId(), "hi",
                "मुझे दो दिन से बुखार है और पांच दिन से खांसी है।"
        ));
        assertFalse(resHi.getMessage().contains("कब से हो रही है"), "Must not re-ask duration in Hindi");
        assertTrue(resHi.getMessage().contains("समझ गया") || resHi.getMessage().contains("बुखार"), "Should ask relevant follow-up in Hindi");
    }

    @Test
    public void testSingleTurnKneePainDurationTriggerSeverity() {
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline"));

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        // "2 hafte se knee pain hai, stairs pe badhta hai aur pain 6 hai."
        AssessmentResponse res = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish",
                "2 hafte se knee pain hai, stairs pe badhta hai aur pain 6 hai."
        ));

        Case savedCase = caseRepository.findById(caseId).orElseThrow();
        ClinicalInterviewState state = null;
        try {
            state = objectMapper.readValue(savedCase.getClinicalState(), ClinicalInterviewState.class);
        } catch (Exception e) {
            fail("Failed to parse clinical state");
        }

        assertNotNull(state);
        assertTrue(state.hasDurationKnown(), "Duration must be captured");
        assertTrue(state.hasTriggerKnown(), "Trigger/stairs must be captured");
        assertTrue(state.hasSeverityKnown(), "Severity 6/10 must be captured");

        // Next question must NOT ask for duration, severity, or triggers
        assertFalse(res.getMessage().contains("kab se ho rahi hai"), "Must not re-ask duration");
        assertFalse(res.getMessage().contains("0 se 10"), "Must not re-ask severity");
        assertFalse(res.getMessage().contains("badh jata hai"), "Must not re-ask triggers");
    }

    @Test
    public void testCorrectionOverwritesPreviousValue() {
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline"));

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        // Turn 1
        assessmentService.processMessage(new AssessmentMessageRequest(caseId, testPatientId, "hinglish", "Ye dard 3 din se hai"));
        Case case1 = caseRepository.findById(caseId).orElseThrow();
        assertTrue(case1.getHpi().contains("3 days") || case1.getHpi().contains("3 din"));

        // Turn 2: Correction
        assessmentService.processMessage(new AssessmentMessageRequest(caseId, testPatientId, "hinglish", "Actually 2 weeks se hai"));
        Case case2 = caseRepository.findById(caseId).orElseThrow();
        assertTrue(case2.getHpi().contains("2 weeks"), "Correction must overwrite 3 din with 2 weeks");
    }

    @Test
    public void testLanguageSwitchingMidAssessment() {
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline"));

        // Start in English
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(new AssessmentStartRequest(testPatientId, "en"));
        Long caseId = startRes.getCaseId();

        // Turn 1 in English
        AssessmentResponse resEn = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "en", "I have pain in my right knee."
        ));
        assertTrue(resEn.getMessage().contains("How long") || resEn.getMessage().contains("Got it"), "English response expected");

        // Turn 2: Switch to Hinglish
        AssessmentResponse resHinglish = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish", "2 hafte se hai."
        ));
        assertTrue(resHinglish.getMessage().contains("Takleef") || resHinglish.getMessage().contains("dard") || resHinglish.getMessage().contains("Samajh gaya"),
                "Hinglish response expected after language switch");

        // Turn 3: Switch to Hindi
        AssessmentResponse resHi = assessmentService.processMessage(new AssessmentMessageRequest(
                startHiCaseId(resHinglish, caseId), testPatientId, "hi", "दर्द 6 है।"
        ));
        assertTrue(resHi.getMessage().contains("क्या") || resHi.getMessage().contains("तकलीफ") || resHi.getMessage().contains("दवा"),
                "Hindi response expected after language switch to hi");
    }

    private Long startHiCaseId(AssessmentResponse res, Long defaultCaseId) {
        return res != null && res.getCaseId() != null ? res.getCaseId() : defaultCaseId;
    }

    @Test
    public void testPrompt12HeadacheLoopAndModerateQuickReply() {
        // Simulated offline to test deterministic brain & deduplication
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline"));

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        // Turn 1: "Sar dard ho raha teen din se"
        AssessmentResponse res1 = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish", "Sar dard ho raha teen din se"
        ));
        assertNotNull(res1);
        String q1 = res1.getMessage();

        Case savedCase1 = caseRepository.findById(caseId).orElseThrow();
        ClinicalInterviewState state1 = null;
        try {
            state1 = objectMapper.readValue(savedCase1.getClinicalState(), ClinicalInterviewState.class);
        } catch (Exception e) {
            fail("Failed to parse state 1");
        }

        // Must extract headache and duration
        assertTrue(state1.hasDurationKnown(), "3 days duration must be known");
        assertTrue(state1.getChiefComplaint().toLowerCase().contains("headache") ||
                   state1.getChiefComplaint().toLowerCase().contains("sar dard"), "Headache must be captured");

        // Turn 2: Patient selects quick reply "Moderate (5-6)"
        AssessmentResponse res2 = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish", "Moderate (5-6)"
        ));
        assertNotNull(res2);
        String q2 = res2.getMessage();

        Case savedCase2 = caseRepository.findById(caseId).orElseThrow();
        ClinicalInterviewState state2 = null;
        try {
            state2 = objectMapper.readValue(savedCase2.getClinicalState(), ClinicalInterviewState.class);
        } catch (Exception e) {
            fail("Failed to parse state 2");
        }

        // Severity must now be captured from "Moderate (5-6)"
        assertTrue(state2.hasSeverityKnown(), "Severity must be captured from 'Moderate (5-6)'");
        assertNotNull(state2.getSeverity());

        // CRITICAL: Next question q2 must NOT be identical or substantially identical to q1!
        assertNotEquals(q1.trim(), q2.trim(), "AI must NOT repeat the exact same question after Moderate (5-6) is selected");
        assertFalse(q2.contains("0 se 10") && q1.contains("0 se 10"), "AI must not re-ask severity when already provided");
    }

    @Test
    public void testPrompt12HindiLanguageAuthority() {
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline"));

        Patient pHi = patientRepository.save(new Patient("Suman Sharma", 38, "Female", "9988776655", "hi"));
        AssessmentResponse startHi = assessmentService.startOrResumeAssessment(new AssessmentStartRequest(pHi.getId(), "hi"));
        Long caseId = startHi.getCaseId();

        // Hindi input with Hindi language selected
        AssessmentResponse resHi = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, pHi.getId(), "hi", "मुझे तीन दिन से सिर दर्द है"
        ));

        assertNotNull(resHi);
        String msg = resHi.getMessage();
        // Must be in Devanagari Hindi, not default English
        assertTrue(msg.matches(".*[\\u0900-\\u097F]+.*"), "Response must contain Devanagari Hindi characters");
        assertFalse(msg.toLowerCase().contains("where exactly"), "Response must NOT be in English when UI language is Hindi");
    }

    @Test
    public void testPrompt13AssessmentStartAutoHealingAndLocalizedGreetings() {
        // Test 1: Start with non-existent patient ID throws IllegalArgumentException
        assertThrows(IllegalArgumentException.class, () -> {
            assessmentService.startOrResumeAssessment(new AssessmentStartRequest(999999L, "hinglish"));
        });

        // Test 2: Hinglish Initial Greeting
        Patient pHinglish = patientRepository.save(new Patient("Aarav", 28, "Male", "9876543210", "hinglish"));
        AssessmentResponse hinglishRes = assessmentService.startOrResumeAssessment(
                new AssessmentStartRequest(pHinglish.getId(), "hinglish")
        );
        assertNotNull(hinglishRes);
        assertEquals("Namaste. Aaj aapko kis health problem ke baare mein batana hai?", hinglishRes.getMessage());
        assertNotNull(hinglishRes.getClinicalState());

        // Test 3: Hindi Initial Greeting
        Patient pHi = patientRepository.save(new Patient("सुनीता", 42, "Female", "9812345678", "hi"));
        AssessmentResponse hiRes = assessmentService.startOrResumeAssessment(
                new AssessmentStartRequest(pHi.getId(), "hi")
        );
        assertNotNull(hiRes);
        assertEquals("नमस्ते। आज आप किस स्वास्थ्य समस्या के बारे में बताना चाहते हैं?", hiRes.getMessage());

        // Test 4: English Initial Greeting
        Patient pEn = patientRepository.save(new Patient("David", 50, "Male", "9876500000", "en"));
        AssessmentResponse enRes = assessmentService.startOrResumeAssessment(
                new AssessmentStartRequest(pEn.getId(), "en")
        );
        assertNotNull(enRes);
        assertEquals("Hello. What health concern brings you in today?", enRes.getMessage());
    }
}

