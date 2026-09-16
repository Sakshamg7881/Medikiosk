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

        // Verify all key sections of the structured format
        assertTrue(summary.contains("PATIENT OVERVIEW:"));
        assertTrue(summary.contains("CHIEF COMPLAINT:"));
        assertTrue(summary.contains("HISTORY OF PRESENT ILLNESS (HPI):"));
        assertTrue(summary.contains("ASSOCIATED SYMPTOMS:"));
        assertTrue(summary.contains("MEDICAL HISTORY:"));
        assertTrue(summary.contains("SURGICAL HISTORY:"));
        assertTrue(summary.contains("CURRENT MEDICATIONS:") || summary.contains("CURRENT MEDICINES:"));
        assertTrue(summary.contains("ALLERGIES:"));
        assertTrue(summary.contains("FAMILY HISTORY:"));
        assertTrue(summary.contains("PERSONAL / LIFESTYLE HISTORY:"));
        assertTrue(summary.contains("AYUSH PROFILE:"));
        assertTrue(summary.contains("PREVIOUS REPORTS / INVESTIGATIONS:") || summary.contains("INVESTIGATIONS:"));
        assertTrue(summary.contains("RED FLAGS:"));
        assertTrue(summary.contains("MISSING / NOT REPORTED"));
        assertTrue(summary.contains("CONCISE PRE-CONSULTATION SUMMARY:"));

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

    @Test
    public void testScenario3_HinglishStomachBurningPostprandial() {
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline"));

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        AssessmentResponse res = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish",
                "pet me jalan ho rahi hai khana khane ke baad se"
        ));

        assertNotNull(res);
        Case savedCase = caseRepository.findById(caseId).orElseThrow();
        assertTrue(savedCase.getClinicalState().contains("Stomach burning") || savedCase.getClinicalState().contains("Pet mein jalan") || savedCase.getHpi().contains("burning"));
        assertTrue(savedCase.getClinicalState().contains("Khana") || savedCase.getClinicalState().contains("Postprandial") || savedCase.getClinicalState().contains("meals"));
    }

    @Test
    public void testScenario7_RedFlagSafetyAdvisoryImmediate() {
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline"));

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        AssessmentResponse res = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish",
                "chest pain ke saath saans lene mein bahut dikkat ho rahi hai"
        ));

        assertNotNull(res);
        assertTrue(res.getRedFlagDetected(), "Red flag must be detected immediately");
        assertTrue(res.getMessage().contains("⚠️"), "Message must contain alert icon");
        assertTrue(res.getMessage().contains("turant") || res.getMessage().contains("hospital") || res.getMessage().contains("Emergency"),
                "Advisory must urge immediate medical attention");
    }

    @Test
    public void testScenario8_VolunteeredAyushCaptureAndAntiRepetition() {
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline"));

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        // Turn 1: Patient volunteers Agni and Nidra naturally along with symptom
        AssessmentResponse res1 = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish",
                "pet kharab rehta hai, bhookh bilkul nahi lagti aur neend bhi theek se nahi aati"
        ));

        Case savedCase = caseRepository.findById(caseId).orElseThrow();
        ClinicalInterviewState state = null;
        try {
            state = objectMapper.readValue(savedCase.getClinicalState(), ClinicalInterviewState.class);
        } catch (Exception e) {
            fail("Failed to parse clinical state");
        }

        assertNotNull(state);
        assertTrue(state.hasAgniKnown(), "Agni must be captured as known");
        assertTrue(state.hasNidraKnown(), "Nidra must be captured as known");

        // The AI must NOT ask about appetite or sleep
        String nextMsg = res1.getMessage().toLowerCase();
        assertFalse(nextMsg.contains("bhookh"), "AI must NOT ask about appetite again");
        assertFalse(nextMsg.contains("appetite"), "AI must NOT ask about appetite again");
        assertFalse(nextMsg.contains("neend"), "AI must NOT ask about sleep again");
        assertFalse(nextMsg.contains("sleep"), "AI must NOT ask about sleep again");
    }

    @Test
    public void testScenario9_LongNaturalParagraphParsing() {
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline"));

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        AssessmentResponse res = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish",
                "Mujhe 3 din se tez bukhar hai aur sath me sukhi khansi bhi hai. Maine subah paracetamol li thi par aaram nahi hua. Koi allergy nahi hai aur main desk job karta hoon."
        ));

        assertNotNull(res);
        Case savedCase = caseRepository.findById(caseId).orElseThrow();
        ClinicalInterviewState state = null;
        try {
            state = objectMapper.readValue(savedCase.getClinicalState(), ClinicalInterviewState.class);
        } catch (Exception e) {
            fail("Failed to parse clinical state");
        }

        assertNotNull(state);
        assertTrue(state.getSymptoms().size() >= 2, "Must extract both fever and cough");
        assertTrue(state.getCurrentMedicines().contains("Paracetamol"));
        assertTrue(state.getAllergies().toLowerCase().contains("no known"));
        assertTrue(state.getPersonalLifestyle().toLowerCase().contains("desk job") || state.getPersonalLifestyle().toLowerCase().contains("sedentary"));
    }

    @Test
    public void testScenario10_StrictLanguageLockAgainstLoanwordsAndDevanagariShift() {
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline"));

        // Case 1: Hinglish with English loan words like fever, paracetamol, moderate
        AssessmentResponse startHinglish = assessmentService.startOrResumeAssessment(
                new AssessmentStartRequest(testPatientId, "hinglish")
        );
        AssessmentResponse resHinglish = assessmentService.processMessage(new AssessmentMessageRequest(
                startHinglish.getCaseId(), testPatientId, "hinglish",
                "Mujhe fever hai and maine paracetamol li thi, pain moderate hai"
        ));
        // Language must STAY Hinglish, NOT flip to English
        assertEquals("hinglish", resHinglish.getLanguage());

        // Case 2: Hindi with Devanagari shift
        AssessmentResponse resShift = assessmentService.processMessage(new AssessmentMessageRequest(
                startHinglish.getCaseId(), testPatientId, "hinglish",
                "कृपया मुझे बताएं कि आगे क्या करना चाहिए"
        ));
        // Must adapt to Hindi because of genuine Devanagari text
        assertEquals("hi", resShift.getLanguage());
    }

    @Test
    public void testCandidateQuestionGate_RejectsRepeatedDurationQuestion() {
        // Patient starts with "2 hafte se knee pain hai" -> duration is known ("2 hafte")
        // Gemini mock mistakenly proposes "Ye dard kab se hai?" (DURATION concept)
        String geminiTurn1 = """
                {
                  "acknowledgement": "Ghutne ke dard ke baare mein sunkar dukh hua.",
                  "nextQuestion": "Ye dard kab se hai?",
                  "quickOptions": ["1-2 din", "1 week", "2 hafte ya zyada"],
                  "extractedFacts": {
                    "chiefComplaint": "Knee pain",
                    "duration": "2 hafte",
                    "location": "Knee"
                  },
                  "isAssessmentComplete": false
                }
                """;
        when(geminiService.generateContent(anyString())).thenReturn(geminiTurn1);

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        AssessmentResponse res = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish",
                "Mujhe 2 hafte se knee pain hai"
        ));

        assertNotNull(res);
        assertFalse(res.isCompleted());
        // Crucial check: Candidate "Ye dard kab se hai?" MUST be rejected because duration is already known!
        String aiMessage = res.getMessage().toLowerCase();
        assertFalse(aiMessage.contains("kab se"), "AI must NOT ask 'Ye dard kab se hai?' since duration is already known");
        assertFalse(aiMessage.contains("kitne din"), "AI must NOT ask duration again");
        assertFalse(aiMessage.contains("how long"), "AI must NOT ask duration again");

        // It should have substituted the next missing dimension (e.g., severity or trigger)
        assertTrue(aiMessage.contains("scale") || aiMessage.contains("tez") || aiMessage.contains("shuru") || aiMessage.contains("gardhan") || aiMessage.contains("chalne"),
                "AI should ask for an unanswered dimension like severity or activity trigger");

        Case savedCase = caseRepository.findById(caseId).orElseThrow();
        assertTrue(savedCase.getHpi().contains("Duration: 2 hafte"));
    }

    @Test
    public void testCandidateQuestionGate_RejectsRepeatedSeverityQuestion() {
        // Turn 1: Patient gives duration and severity
        String geminiTurn1 = """
                {
                  "acknowledgement": "Samajh gaya.",
                  "nextQuestion": "Dard kitna tez hai? 1 se 10 ke scale par batayein.",
                  "quickOptions": ["Mild (2-3)", "Moderate (5-6)", "Severe (7-8)"],
                  "extractedFacts": {
                    "chiefComplaint": "Knee pain",
                    "duration": "2 weeks",
                    "severity": "7/10"
                  },
                  "isAssessmentComplete": false
                }
                """;
        // Turn 2: Gemini tries to ask severity AGAIN
        String geminiTurn2 = """
                {
                  "acknowledgement": "Theek hai.",
                  "nextQuestion": "Dard ki teevrata (severity) kitni hai?",
                  "quickOptions": ["Halka", "Tez"],
                  "extractedFacts": {},
                  "isAssessmentComplete": false
                }
                """;
        when(geminiService.generateContent(anyString()))
                .thenReturn(geminiTurn1)
                .thenReturn(geminiTurn2);

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        // Turn 1
        AssessmentResponse res1 = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish",
                "Mujhe 2 weeks se knee pain hai aur dard lagbhag 7/10 hai"
        ));

        // In turn 1, severity was provided, so Gemini's proposed severity question must already be rejected
        assertFalse(res1.getMessage().toLowerCase().contains("scale"), "Turn 1 must not ask severity since patient already gave 7/10");

        // Turn 2
        AssessmentResponse res2 = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish",
                "Chalne mein zyada hota hai"
        ));

        // Gemini proposed "Dard ki teevrata (severity) kitni hai?" which MUST be rejected
        assertFalse(res2.getMessage().toLowerCase().contains("teevrata"), "Turn 2 must reject duplicate severity question");
        assertFalse(res2.getMessage().toLowerCase().contains("severity"), "Turn 2 must reject duplicate severity question");
    }

    @Test
    public void testMultiSymptomIndependentDurationsAndAntiRepetition() {
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline fallback"));

        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        // Patient describes 2 distinct symptoms with different durations
        AssessmentResponse res = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, testPatientId, "hinglish",
                "2 din se bukhar hai aur 5 din se khansi hai"
        ));

        assertNotNull(res);
        Case savedCase = caseRepository.findById(caseId).orElseThrow();
        ClinicalInterviewState state = null;
        try {
            state = objectMapper.readValue(savedCase.getClinicalState(), ClinicalInterviewState.class);
        } catch (Exception e) {
            fail("Failed to parse clinical state");
        }

        assertNotNull(state);
        assertEquals(2, state.getSymptoms().size(), "Both fever and cough must be recorded as separate symptoms");

        // State has durations known
        assertTrue(state.hasDurationKnown(), "Duration must be marked known");

        // Next question should NOT ask about duration
        String aiMessage = res.getMessage().toLowerCase();
        assertFalse(aiMessage.contains("kab se"), "AI must NOT ask duration when patient specified 2 din and 5 din");
        assertFalse(aiMessage.contains("kitne din"), "AI must NOT ask duration");
    }

    @Test
    public void testAyushAgniQuickReplyNormalBalancedNeverLoops() {
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline"));

        Patient p = new Patient("Amit Sharma", 35, "Male", "9876543210", "en");
        Patient saved = patientRepository.save(p);

        AssessmentStartRequest startReq = new AssessmentStartRequest(saved.getId(), "en");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        // Turn 1: Primary complaint & duration
        AssessmentResponse t1 = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, saved.getId(), "en", "I have had stomach pain for 4 days"
        ));
        assertFalse(t1.isCompleted());

        // Turn 2: Location
        assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, saved.getId(), "en", "Upper abdomen"
        ));

        // Turn 3: Severity
        assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, saved.getId(), "en", "Moderate (5-6)"
        ));

        // Turn 4: Trigger
        assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, saved.getId(), "en", "Worse after eating"
        ));

        // Turn 5: Medications / History
        AssessmentResponse t5 = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, saved.getId(), "en", "No medications"
        ));

        // Turn 6: AI asks digestion/appetite (Agni)
        assertTrue(t5.getMessage().toLowerCase().contains("appetite") || t5.getMessage().toLowerCase().contains("digestion"),
                "AI should ask about appetite/digestion: " + t5.getMessage());

        // Patient replies with the EXACT live reproduction string: "Normal balanced"
        AssessmentResponse t6 = assessmentService.processMessage(new AssessmentMessageRequest(
                caseId, saved.getId(), "en", "Normal balanced"
        ));

        // CRUCIAL ASSERTION: The AI must NEVER repeat the digestion/appetite question!
        String t6Question = t6.getMessage().toLowerCase();
        assertFalse(t6Question.contains("how is your daily appetite and digestion"),
                "AI must NOT repeat appetite/digestion question after patient answered 'Normal balanced'");
        assertFalse(t6Question.contains("assess your digestion"),
                "AI must NOT repeat appetite/digestion question after patient answered 'Normal balanced'");

        // Verify that Agni is marked answered and recorded in clinical state
        Case c = caseRepository.findById(caseId).orElseThrow();
        try {
            ClinicalInterviewState state = objectMapper.readValue(c.getClinicalState(), ClinicalInterviewState.class);
            assertTrue(state.hasAgniKnown(), "Agni must be marked known after 'Normal balanced'");
            assertNotNull(state.getAyushAgni(), "Agni value must not be null");
            assertEquals("Normal balanced", state.getAyushAgni());
        } catch (Exception e) {
            fail("Failed to parse state: " + e.getMessage());
        }
    }

    @Test
    public void testCleanCompletionWithUnaskedAyushMarkedNotReported() {
        when(geminiService.generateContent(anyString())).thenThrow(new RuntimeException("Simulated offline"));

        Patient p = new Patient("Sunita Rao", 42, "Female", "9812345678", "en");
        Patient saved = patientRepository.save(p);

        AssessmentStartRequest startReq = new AssessmentStartRequest(saved.getId(), "en");
        AssessmentResponse startRes = assessmentService.startOrResumeAssessment(startReq);
        Long caseId = startRes.getCaseId();

        // 1. Complaint & timeline
        assessmentService.processMessage(new AssessmentMessageRequest(caseId, saved.getId(), "en", "Severe headache for 3 days"));
        // 2. Location
        assessmentService.processMessage(new AssessmentMessageRequest(caseId, saved.getId(), "en", "Forehead"));
        // 3. Severity
        assessmentService.processMessage(new AssessmentMessageRequest(caseId, saved.getId(), "en", "7-8 / Severe"));
        // 4. Triggers
        assessmentService.processMessage(new AssessmentMessageRequest(caseId, saved.getId(), "en", "Bright light or sound"));
        // 5. History / Meds
        assessmentService.processMessage(new AssessmentMessageRequest(caseId, saved.getId(), "en", "Took paracetamol, no past history"));
        // 6. Agni question answered
        assessmentService.processMessage(new AssessmentMessageRequest(caseId, saved.getId(), "en", "Normal balanced"));
        // 7. Sleep question answered
        AssessmentResponse t7 = assessmentService.processMessage(new AssessmentMessageRequest(caseId, saved.getId(), "en", "Sound & restful"));

        // Case should be completed at around 6-7 turns without endless loop!
        assertTrue(t7.isCompleted(), "Case should complete with core history and AYUSH explored");
        Case c = caseRepository.findById(caseId).orElseThrow();
        assertEquals("READY_FOR_REVIEW", c.getStatus());
        assertNotNull(c.getAiSummary());
        assertTrue(c.getAiSummary().contains("PRE-CONSULTATION SUMMARY"));
    }
}


