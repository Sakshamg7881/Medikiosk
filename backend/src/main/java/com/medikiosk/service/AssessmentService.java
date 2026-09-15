package com.medikiosk.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medikiosk.dto.AssessmentMessageRequest;
import com.medikiosk.dto.AssessmentResponse;
import com.medikiosk.dto.AssessmentStartRequest;
import com.medikiosk.dto.ChatMessageDto;
import com.medikiosk.model.Case;
import com.medikiosk.model.ClinicalInterviewState;
import com.medikiosk.model.Patient;
import com.medikiosk.repository.CaseRepository;
import com.medikiosk.repository.PatientRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AssessmentService {

    private static final Logger logger = LoggerFactory.getLogger(AssessmentService.class);

    private final CaseRepository caseRepository;
    private final PatientRepository patientRepository;
    private final GeminiService geminiService;
    private final PrakritiService prakritiService;
    private final RedFlagService redFlagService;
    private final ObjectMapper objectMapper;

    public AssessmentService(CaseRepository caseRepository,
                             PatientRepository patientRepository,
                             GeminiService geminiService,
                             PrakritiService prakritiService,
                             RedFlagService redFlagService,
                             ObjectMapper objectMapper) {
        this.caseRepository = caseRepository;
        this.patientRepository = patientRepository;
        this.geminiService = geminiService;
        this.prakritiService = prakritiService;
        this.redFlagService = redFlagService;
        this.objectMapper = objectMapper;
    }

    public AssessmentResponse startOrResumeAssessment(AssessmentStartRequest request) {
        if (request.getPatientId() == null) {
            throw new IllegalArgumentException("Patient ID is required");
        }

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with ID: " + request.getPatientId()));

        String language = normalizeLanguage(request.getLanguage() != null ? request.getLanguage() : patient.getPreferredLanguage());

        // Check if patient has an active, incomplete case to resume
        Optional<Case> activeCaseOpt = caseRepository.findFirstByPatientIdAndStatusNotOrderByIdDesc(patient.getId(), "ASSESSMENT_COMPLETED");
        if (activeCaseOpt.isPresent()) {
            Case existingCase = activeCaseOpt.get();
            String st = existingCase.getStatus();
            boolean isFinished = "ASSESSMENT_COMPLETED".equalsIgnoreCase(st) ||
                    "READY_FOR_REVIEW".equalsIgnoreCase(st) ||
                    "REVIEWED".equalsIgnoreCase(st) ||
                    "COMPLETED".equalsIgnoreCase(st);
            if (!isFinished) {
                List<ChatMessageDto> history = parseHistory(existingCase.getConversationHistory());
                if (!history.isEmpty()) {
                    logger.info("Resuming active case #{} for patient #{}", existingCase.getId(), patient.getId());
                    ChatMessageDto lastMsg = history.get(history.size() - 1);
                    ClinicalInterviewState state = parseClinicalState(existingCase.getClinicalState());
                    Map<String, Object> stateMap = toGenericMap(state);

                    AssessmentResponse resumeRes = new AssessmentResponse(
                            existingCase.getId(),
                            "GENERAL",
                            countUserTurns(history) + 1,
                            0, // Dynamic question count (no fixed estimate)
                            lastMsg.getText(),
                            false,
                            getInitialOptions(language),
                            parseGenericMap(existingCase.getPrakritiResult()),
                            parseGenericMap(existingCase.getAyushData()),
                            history,
                            existingCase.getRedFlagDetected(),
                            existingCase.getRedFlagDetails(),
                            "Clinical intake in progress",
                            stateMap
                    );
                    resumeRes.setPatientId(patient.getId());
                    return resumeRes;
                }
            }
        }

        // Create new intake case
        Case newCase = new Case();
        newCase.setPatientId(patient.getId());
        newCase.setClinicId(1L);
        newCase.setStatus("IN_PROGRESS");

        ClinicalInterviewState initState = new ClinicalInterviewState();
        newCase.setClinicalState(serializeJson(initState));

        String welcomeMsg = getInitialGreeting(language);
        List<String> options = getInitialOptions(language);

        ChatMessageDto welcomeChat = new ChatMessageDto("assistant", welcomeMsg, now(), "GENERAL");
        List<ChatMessageDto> history = new ArrayList<>();
        history.add(welcomeChat);

        newCase.setConversationHistory(serializeJson(history));
        Case savedCase = caseRepository.save(newCase);

        AssessmentResponse newRes = new AssessmentResponse(
                savedCase.getId(),
                "GENERAL",
                1,
                0, // Dynamic question count
                welcomeMsg,
                false,
                options,
                null,
                null,
                history,
                false,
                null,
                "Ready for health intake",
                toGenericMap(initState)
        );
        newRes.setPatientId(patient.getId());
        return newRes;
    }

    public AssessmentResponse processMessage(AssessmentMessageRequest request) {
        Case c = caseRepository.findById(request.getCaseId())
                .orElseThrow(() -> new IllegalArgumentException("Case not found with ID: " + request.getCaseId()));

        Long patientId = c.getPatientId();
        if (request.getPatientId() != null && !patientId.equals(request.getPatientId())) {
            logger.warn("Incoming patient ID #{} differs from Case #{} owner patient ID #{}. Harmonizing with Case record.",
                    request.getPatientId(), c.getId(), patientId);
        }

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with ID: " + patientId));

        String reqLang = request.getLanguage();
        String language = normalizeLanguage(reqLang != null && !reqLang.isBlank() ? reqLang : patient.getPreferredLanguage());
        if (reqLang != null && !reqLang.isBlank() && !language.equalsIgnoreCase(patient.getPreferredLanguage())) {
            patient.setPreferredLanguage(language);
            patientRepository.save(patient);
        }

        String userText = request.getMessage() != null ? request.getMessage().trim() : "";

        // 1. Parse existing conversation history and clinical state
        List<ChatMessageDto> history = parseHistory(c.getConversationHistory());
        ClinicalInterviewState state = parseClinicalState(c.getClinicalState());

        // Track last assistant question BEFORE appending the new patient message
        String lastAssistantQuestion = null;
        for (int i = history.size() - 1; i >= 0; i--) {
            ChatMessageDto m = history.get(i);
            if ("assistant".equalsIgnoreCase(m.getRole())) {
                lastAssistantQuestion = m.getText();
                break;
            }
        }

        // Append user turn
        ChatMessageDto userMsg = new ChatMessageDto("user", userText, now(), "GENERAL");
        history.add(userMsg);
        int userTurnCount = countUserTurns(history);

        logger.info("Assessment turn {} for Case #{}: patientId={}, input='{}', language='{}'",
                userTurnCount, c.getId(), patient.getId(), userText, language);

        // 2. Deterministic Safety-Critical Red-Flag Detection on every message
        RedFlagService.RedFlagResult redFlagRes = redFlagService.checkRedFlags(
                userText,
                state.getChiefComplaint(),
                state.getAssociatedSymptoms()
        );

        if (redFlagRes.isDetected()) {
            c.setRedFlagDetected(true);
            String details = "Matched terms: " + String.join(", ", redFlagRes.getMatchedTerms());
            c.setRedFlagDetails(details);
            state.getRedFlags().addAll(redFlagRes.getMatchedTerms());
            logger.warn("Red flag detected in Case #{} on turn {}: {}", c.getId(), userTurnCount, details);
        }

        // 3. Robust Deterministic Multi-Fact & Symptom Extraction FIRST (updates state before question reasoning)
        extractAndMergeFacts(userText, state);

        logger.info("Case #{} state after extraction: ChiefComplaint='{}' | Duration='{}' | Location='{}' | Severity='{}' | Triggers='{}'",
                c.getId(), state.getChiefComplaint(), state.getDuration(), state.getLocation(), state.getSeverity(), state.getAggravatingFactors());

        // 4. Gemini Adaptive Clinical Reasoning & Question Generation (Passed UPDATED clinical state)
        AiTurnResult aiResult = callGeminiAdaptiveIntake(history, patient, language, state, userTurnCount, redFlagRes.isDetected());

        // Merge any additional subtle facts extracted by Gemini
        if (aiResult.extractedFacts != null && !aiResult.extractedFacts.isEmpty()) {
            state.mergeExtractedFacts(aiResult.extractedFacts);
        }

        // 5. Update Case Entity from Clinical State
        if (state.getChiefComplaint() != null && !state.getChiefComplaint().isBlank()) {
            c.setChiefComplaint(state.getChiefComplaint());
        }
        updateCaseHpiAndSymptoms(c, state);

        // 6. Check Completion: either Gemini signaled completion or clinical state is sufficient
        boolean isSufficient = aiResult.isAssessmentComplete || state.isClinicallySufficient(userTurnCount);

        // Update AYUSH map from state if present
        Map<String, Object> ayushMap = parseGenericMap(c.getAyushData());
        if (ayushMap == null) ayushMap = new LinkedHashMap<>();
        if (state.getAyushAgni() != null) ayushMap.put("agni", state.getAyushAgni());
        if (state.getAyushNidra() != null) ayushMap.put("nidra", state.getAyushNidra());
        if (state.getAyushMala() != null) ayushMap.put("mala", state.getAyushMala());
        if (!ayushMap.isEmpty()) {
            c.setAyushData(serializeJson(ayushMap));
        }

        if (isSufficient && userTurnCount >= 2) {
            // COMPLETE INTAKE!
            Map<String, Object> prakritiResult = prakritiService.calculatePrakriti(ayushMap, language);
            c.setPrakritiResult(serializeJson(prakritiResult));

            // Generate full 14-Section Pre-Consultation Summary
            String summary = generate14SectionSummary(c, patient, state, ayushMap, prakritiResult);
            c.setAiSummary(summary);
            c.setStatus("READY_FOR_REVIEW");

            String completionMessage = getCompletionMessage(language);
            ChatMessageDto compMsg = new ChatMessageDto("assistant", completionMessage, now(), "COMPLETED");
            history.add(compMsg);

            c.setConversationHistory(serializeJson(history));
            c.setClinicalState(serializeJson(state));
            caseRepository.save(c);

            AssessmentResponse completedRes = new AssessmentResponse(
                    c.getId(),
                    "COMPLETED",
                    userTurnCount,
                    0,
                    completionMessage,
                    true,
                    Collections.emptyList(),
                    prakritiResult,
                    ayushMap,
                    history,
                    c.getRedFlagDetected(),
                    c.getRedFlagDetails(),
                    "Case assessment completed successfully",
                    toGenericMap(state)
            );
            completedRes.setPatientId(patient.getId());
            return completedRes;
        } else {
            // CONTINUE ADAPTIVE INTERVIEW
            // Question Deduplication Safety Guard: Prevent identical repetition
            if (lastAssistantQuestion != null && (isSubstantiallyIdentical(aiResult.nextQuestion, lastAssistantQuestion)
                    || isSubstantiallyIdentical(buildAssistantMessage(aiResult, language, false), lastAssistantQuestion))) {
                logger.warn("Substantially identical question detected ('{}' vs previous '{}'). Deduplicating to next clinical dimension.",
                        aiResult.nextQuestion, lastAssistantQuestion);
                deduplicateQuestion(aiResult, state, language, lastAssistantQuestion);
            }

            String assistantText = buildAssistantMessage(aiResult, language, redFlagRes.isDetected());
            logger.info("Case #{} assistant response: '{}' | Language='{}'", c.getId(), assistantText, language);

            ChatMessageDto assistantMsg = new ChatMessageDto("assistant", assistantText, now(), "GENERAL");
            history.add(assistantMsg);

            c.setConversationHistory(serializeJson(history));
            c.setClinicalState(serializeJson(state));
            caseRepository.save(c);

            AssessmentResponse ongoingRes = new AssessmentResponse(
                    c.getId(),
                    "GENERAL",
                    userTurnCount + 1,
                    0,
                    assistantText,
                    false,
                    aiResult.quickOptions != null ? aiResult.quickOptions : Collections.emptyList(),
                    null,
                    ayushMap,
                    history,
                    c.getRedFlagDetected(),
                    c.getRedFlagDetails(),
                    "Clinical interview in progress",
                    toGenericMap(state)
            );
            ongoingRes.setPatientId(patient.getId());
            return ongoingRes;
        }
    }

    public AssessmentResponse getAssessment(Long caseId) {
        Case c = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found with ID: " + caseId));
        List<ChatMessageDto> history = parseHistory(c.getConversationHistory());
        ChatMessageDto last = !history.isEmpty() ? history.get(history.size() - 1) : null;

        Map<String, Object> prakriti = parseGenericMap(c.getPrakritiResult());
        Map<String, Object> ayush = parseGenericMap(c.getAyushData());
        ClinicalInterviewState state = parseClinicalState(c.getClinicalState());

        String st = c.getStatus();
        boolean isCompleted = "ASSESSMENT_COMPLETED".equalsIgnoreCase(st) ||
                "READY_FOR_REVIEW".equalsIgnoreCase(st) ||
                "REVIEWED".equalsIgnoreCase(st) ||
                "COMPLETED".equalsIgnoreCase(st);

        AssessmentResponse getRes = new AssessmentResponse(
                c.getId(),
                isCompleted ? "COMPLETED" : "GENERAL",
                countUserTurns(history),
                0,
                last != null ? last.getText() : "",
                isCompleted,
                Collections.emptyList(),
                prakriti,
                ayush,
                history,
                c.getRedFlagDetected(),
                c.getRedFlagDetails(),
                isCompleted ? "Intake Completed" : "In Progress",
                toGenericMap(state)
        );
        getRes.setPatientId(c.getPatientId());
        return getRes;
    }

    private AiTurnResult callGeminiAdaptiveIntake(List<ChatMessageDto> history,
                                                 Patient patient,
                                                 String language,
                                                 ClinicalInterviewState state,
                                                 int turnCount,
                                                 boolean redFlagActive) {
        try {
            String prompt = buildGeminiAdaptivePrompt(history, patient, language, state, turnCount, redFlagActive);
            String rawJson = geminiService.generateContent(prompt);
            AiTurnResult parsed = parseAiTurnResult(rawJson, language, state);
            if (parsed != null) {
                return parsed;
            }
        } catch (Exception e) {
            logger.warn("Gemini adaptive call failed on turn {}: {}. Activating deterministic clinical fallback.", turnCount, e.getMessage());
        }

        return getDeterministicFallbackTurn(language, state, turnCount);
    }

    private String buildGeminiAdaptivePrompt(List<ChatMessageDto> history,
                                             Patient patient,
                                             String language,
                                             ClinicalInterviewState state,
                                             int turnCount,
                                             boolean redFlagActive) {
        StringBuilder transcript = new StringBuilder();
        // Include last 8 messages for rich conversational context
        int startIdx = Math.max(0, history.size() - 8);
        for (int i = startIdx; i < history.size(); i++) {
            ChatMessageDto msg = history.get(i);
            transcript.append(msg.getRole().toUpperCase(Locale.ROOT))
                    .append(": ")
                    .append(msg.getText())
                    .append("\n");
        }

        String langInstruction = switch (language) {
            case "hi" -> "HINDI (Devanagari script only). Speak naturally as an Indian healthcare assistant.";
            case "hinglish" -> "HINGLISH (Everyday Indian conversational Roman Hindi in Latin alphabet, e.g., 'Samajh gaya. Kya bukhar ke sath thand ya gale mein dard bhi ho raha hai?').";
            default -> "ENGLISH. Natural, warm, professional healthcare intake.";
        };

        return """
                You are MediKiosk, an expert, adaptive clinical pre-consultation intake assistant sitting face-to-face with a patient on a clinic tablet in India.
                
                ==================================================
                MANDATORY RESPONSE LANGUAGE DIRECTIVE
                ==================================================
                You MUST answer in the requested response language.
                Requested language: %s
                Target style: %s
                
                If language = en:
                respond only in natural English.
                
                If language = hi:
                respond only in natural Hindi using Devanagari.
                
                If language = hinglish:
                respond in natural conversational Roman Hindi/Hinglish.
                
                Do not switch to English merely because the patient's message contains English medical terms (like 'fever', 'cough', 'knee pain', 'diabetes', 'metformin').
                Medical terms may remain understandable/common terms where natural.
                Do not output language explanations.
                ==================================================
                
                PATIENT DEMOGRAPHICS:
                - Name: %s
                - Age: %s
                - Gender: %s
                - Requested Response Language: %s
                
                KNOWN CLINICAL FACTS ALREADY GATHERED (DO NOT RE-ASK ANY OF THESE):
                %s
                
                RECENT DIALOGUE TRANSCRIPT:
                %s
                
                CORE CLINICAL INTERVIEWING RULES:
                1. You are an INTAKE ASSISTANT, NOT A DOCTOR. NEVER diagnose, NEVER prescribe drugs, NEVER claim certainty.
                2. ACTIVE LISTENING & EXTRACTION:
                   - The patient's latest message may contain multiple facts (e.g. onset, duration for multiple symptoms, triggers, medications, lifestyle, pertinent negatives).
                   - Extract ALL facts mentioned into `extractedFacts`.
                   - If patient explicitly says a symptom is absent (e.g., 'swelling nahi hai', 'no fever'), record it in `pertinentNegatives`.
                   - If patient contradicts or corrects an earlier statement (e.g., 'Actually 2 weeks se hai' after saying '3 din'), update the fact with the newest value.
                3. CONVERSATIONAL MANNER:
                   - Use a brief, natural acknowledgement if appropriate ('Got it.', 'Okay.', 'Samajh gaya.', 'Achha.', 'That helps.').
                   - DO NOT use repetitive robotic phrases like 'Thank you for sharing that' or 'Thank you for your response'.
                   - Speak strictly in %s.
                4. TOPIC JUMPING / UNRELATED QUESTIONS:
                   - If patient suddenly asks something unrelated (e.g. 'Waise kya main chai pee sakta hoon?'), answer briefly and safely:
                     (e.g., 'Usually chai ki suitability aapki condition aur health history par depend karti hai. Main aapki current complaint complete kar leta hoon, phir doctor se discuss kar sakte hain.').
                   - If their interruption contains clinical facts (e.g. 'Waise mujhe diabetes bhi hai'), capture it into medical history!
                   - Then seamlessly return to the interview.
                5. CLINICAL NEXT BEST QUESTION:
                   - CRITICAL: Look at 'KNOWN CLINICAL FACTS ALREADY GATHERED' above. The latest patient message has ALREADY been merged into those facts.
                   - Never ask a question whose requested information is already sufficiently known from the current ClinicalInterviewState or the patient's latest message.
                   - Your next question MUST be based on the state AFTER the latest patient message has been merged.
                   - If the previous assistant question was not answered because the patient provided a different but clinically relevant fact, acknowledge that fact and continue intelligently rather than blindly repeating the previous question.
                   - If the patient answered only one part of a multi-part question (e.g. they provided severity 'Moderate (5-6)'), DO NOT repeat the entire question again! Acknowledge the severity and ask only about the remaining missing detail (e.g. location or triggers).
                   - NEVER ask an identical or substantially similar question to the previous assistant turn.
                   - NEVER ask a question about an attribute that is already known:
                     * If duration/timeline is documented for the patient's symptoms (e.g. fever for 2 days, cold for 5 days, knee pain for 2 weeks, or headache for 3 days), DO NOT ask "How long have you had this?" or any question asking about duration.
                     * If severity is documented, DO NOT ask for severity or pain scale.
                     * If triggers or location are documented, DO NOT ask about them.
                   - Ask ONLY the single highest-value MISSING clinical question that is relevant to their current presentation.
                     * For fever/cold/cough: ask about chills, sore throat, or chest congestion.
                     * For headache: ask about specific location (forehead vs one-sided vs diffuse) or triggers (light, sound, stress, lack of sleep).
                     * For joint/body pain: ask about swelling, morning stiffness, or daily impact.
                   - Ask STRICTLY ONE clear, concise question in %s. Never combine two questions.
                6. CONTEXT-AWARE QUICK REPLIES:
                   - You must provide 3-4 concise quick reply options in `quickOptions` strictly tailored to your `nextQuestion` in the target language.
                   - If asking about location: provide location options (e.g., Forehead, One side, All over, Radiates to neck / Poora sir, Ek taraf, etc.).
                   - If asking about severity: provide severity scale options (e.g., Mild (2-3), Moderate (5-6), Severe (7-8), Intense (9-10)).
                   - If asking about associated symptoms: provide symptom options (e.g., Chills/shivering, Sore throat, Body ache, None).
                   - If asking about triggers: provide activity/trigger options (e.g., Bright light/sound, Stress/screen time, Climbing stairs, Constant).
                   - If asking about medicines: provide medication options (e.g., No medicine, Painkiller/fever meds, BP/Diabetes meds).
                   - NEVER output severity options if the question is about location, symptoms, duration, or medicines!
                7. DYNAMIC COMPLETION:
                   - If chief complaint, timeline/duration, key characteristics/severity/triggers, and relevant medical history/medicines are reasonably clear, set `isAssessmentComplete`: true.
                   - Do not prolong the interview unnecessarily.
                
                RESPOND ONLY WITH VALID JSON (no markdown code blocks, no preamble):
                {
                  "acknowledgement": "brief acknowledgement if appropriate, or empty",
                  "interruptionResponse": "brief safe answer if patient asked unrelated question, or empty",
                  "nextQuestion": "strictly 1 adaptive question in target language",
                  "quickOptions": ["Option 1", "Option 2", "Option 3"],
                  "extractedFacts": {
                    "chiefComplaint": "...",
                    "duration": "...",
                    "location": "...",
                    "character": "...",
                    "severity": "...",
                    "timing": "...",
                    "aggravatingFactors": "...",
                    "relievingFactors": "...",
                    "associatedSymptoms": "...",
                    "pertinentNegatives": ["..."],
                    "pastMedicalHistory": "...",
                    "pastSurgicalHistory": "...",
                    "currentMedicines": "...",
                    "allergies": "...",
                    "familyHistory": "...",
                    "personalLifestyle": "...",
                    "ayushAgni": "...",
                    "ayushNidra": "...",
                    "ayushMala": "..."
                  },
                  "isAssessmentComplete": false
                }
                """.formatted(
                language,
                langInstruction,
                patient.getName() != null ? patient.getName() : "Patient",
                patient.getAge() != null ? String.valueOf(patient.getAge()) : "Unknown",
                patient.getGender() != null ? patient.getGender() : "Unknown",
                language,
                state.toPromptSummary(),
                transcript.toString(),
                langInstruction,
                langInstruction
        );
    }

    private AiTurnResult parseAiTurnResult(String raw, String language, ClinicalInterviewState state) {
        if (raw == null || raw.isBlank()) return null;

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

            JsonNode node = objectMapper.readTree(cleaned);

            AiTurnResult res = new AiTurnResult();
            res.acknowledgement = node.path("acknowledgement").asText("");
            res.interruptionResponse = node.path("interruptionResponse").asText("");
            res.nextQuestion = node.path("nextQuestion").asText("");
            res.isAssessmentComplete = node.path("isAssessmentComplete").asBoolean(false);

            JsonNode optNode = node.path("quickOptions");
            if (optNode.isArray()) {
                for (JsonNode o : optNode) {
                    if (!o.asText().isBlank()) {
                        res.quickOptions.add(o.asText().trim());
                    }
                }
            }

            JsonNode factsNode = node.path("extractedFacts");
            if (factsNode.isObject()) {
                Map<String, Object> facts = objectMapper.convertValue(factsNode, new TypeReference<Map<String, Object>>() {});
                res.extractedFacts = facts;
            }

            if (!res.nextQuestion.isBlank()) {
                return res;
            }
        } catch (Exception e) {
            logger.warn("Failed to parse Gemini adaptive JSON response: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Deterministic regex safety and fact extraction executed BEFORE next question generation.
     * Extracts multi-symptoms, durations, severity, triggers, history, and corrections.
     */
    private void extractAndMergeFacts(String text, ClinicalInterviewState state) {
        if (text == null || text.isBlank()) return;
        String lower = text.toLowerCase(Locale.ROOT);

        // A. Corrections: e.g. "Actually 2 weeks se hai", "actually 3 days", "asal me 2 hafte"
        Pattern corrPat = Pattern.compile("(actually|asal\\s*mein?|sach\\s*mein?|pehle\\s*galat\\s*bola)\\s*.*?(\\d+|two|three|four|five|do|teen|char|panch|ek|दो|तीन|चार|पांच)\\s*(hafte|hafta|din|mahine|mahina|saal|days?|weeks?|months?|years?|दिन|हफ्ते)", Pattern.CASE_INSENSITIVE);
        Matcher corrMat = corrPat.matcher(lower);
        if (corrMat.find()) {
            String newDur = normalizeDurationString(corrMat.group(2), corrMat.group(3));
            state.setDuration(newDur);
            state.getProvenance().put("duration", "PATIENT_CORRECTED");
        }

        // B. Multi-symptom clauses (e.g. "2 din se fever ho rha or 5 din se jukham", "2 din se fever hai aur 5 din se cough hai",
        // "I've had fever for two days and cough for five days", "मुझे दो दिन से बुखार है और पांच दिन से खांसी है")
        String[] clauses = lower.split("[,;]|\\b(?:aur|or|and|तथा|और|lekin|but|bhi|plus)\\b");
        boolean extractedMultiSymptom = false;

        for (String clause : clauses) {
            String c = clause.trim();
            if (c.isEmpty()) continue;

            // Detect duration in this clause
            String clauseDuration = null;
            Pattern durPattern = Pattern.compile("(\\d+|ek|do|teen|char|panch|chhe|saat|aath|nau|das|one|two|three|four|five|six|seven|eight|nine|ten|दो|तीन|चार|पांच)\\s*(din|hafte|hafta|mahine|mahina|saal|days?|weeks?|months?|years?|दिन|हफ्ते|महीने)");
            Matcher durM = durPattern.matcher(c);
            if (durM.find()) {
                clauseDuration = normalizeDurationString(durM.group(1), durM.group(2));
            }

            // Detect symptom keyword in this clause
            if (c.contains("fever") || c.contains("bukhar") || c.contains("बुखार") || c.contains("tap") || c.contains("ताप") || c.contains("फीवर")) {
                state.addOrUpdateSymptom("Fever (Bukhar)", clauseDuration, null, null, null);
                extractedMultiSymptom = true;
            }
            if (c.contains("cold") || c.contains("jukham") || c.contains("zukam") || c.contains("zukham") || c.contains("sardi") || c.contains("जुकाम") || c.contains("सर्दी") || c.contains("runny nose")) {
                state.addOrUpdateSymptom("Cold / Runny Nose (Jukham)", clauseDuration, null, null, null);
                extractedMultiSymptom = true;
            }
            if (c.contains("cough") || c.contains("khansi") || c.contains("khaansi") || c.contains("खांसी")) {
                state.addOrUpdateSymptom("Cough (Khansi)", clauseDuration, null, null, null);
                extractedMultiSymptom = true;
            }
            if (c.contains("knee") || c.contains("ghutne") || c.contains("ghutna") || c.contains("घुटने")) {
                state.addOrUpdateSymptom("Knee pain (Ghutne mein dard)", clauseDuration, null, "Knee", null);
                extractedMultiSymptom = true;
            }
            if (c.contains("head") || c.contains("sir") || c.contains("sar") || c.contains("sirdard") || c.contains("sardard") || c.contains("matha") || c.contains("mathe") || c.contains("forehead") || c.contains("सिरदर्द") || c.contains("सरदर्द") || c.contains("सिर") || c.contains("सर") || c.contains("माथा")) {
                state.addOrUpdateSymptom("Headache (Sir dard)", clauseDuration, null, "Head", null);
                extractedMultiSymptom = true;
            }
        }

        // Also check reverse / full sentence patterns if clauses didn't catch multiple
        if (!extractedMultiSymptom) {
            Pattern fvPat = Pattern.compile("(fever|bukhar|बुखार)\\s*(for|se|since|hai)?\\s*(\\d+|ek|do|teen|one|two|three|दो|तीन)\\s*(din|hafte|days?|weeks?|दिन)", Pattern.CASE_INSENSITIVE);
            Matcher fvM = fvPat.matcher(lower);
            if (fvM.find()) {
                state.addOrUpdateSymptom("Fever (Bukhar)", normalizeDurationString(fvM.group(3), fvM.group(4)), null, null, null);
            }
            Pattern cldPat = Pattern.compile("(cold|jukham|zukam|cough|khansi|जुकाम|खांसी)\\s*(for|se|since|hai)?\\s*(\\d+|ek|do|teen|char|panch|five|do|पांच)\\s*(din|hafte|days?|weeks?|दिन)", Pattern.CASE_INSENSITIVE);
            Matcher cldM = cldPat.matcher(lower);
            if (cldM.find()) {
                state.addOrUpdateSymptom(cldM.group(1).contains("cough") || cldM.group(1).contains("khansi") ? "Cough (Khansi)" : "Cold / Jukham", normalizeDurationString(cldM.group(3), cldM.group(4)), null, null, null);
            }
            Pattern hdPat = Pattern.compile("(headache|sirdard|sardard|sar\\s*dard|sir\\s*dard|सिरदर्द|सरदर्द)\\s*(for|se|since|hai)?\\s*(\\d+|ek|do|teen|char|panch|one|two|three|दो|तीन)\\s*(din|hafte|days?|weeks?|दिन)", Pattern.CASE_INSENSITIVE);
            Matcher hdM = hdPat.matcher(lower);
            if (hdM.find()) {
                state.addOrUpdateSymptom("Headache (Sir dard)", normalizeDurationString(hdM.group(3), hdM.group(4)), null, "Head", null);
            }
        }

        // C. Synthesize composite duration if symptoms were captured
        if (!state.getSymptoms().isEmpty()) {
            List<String> durTokens = new ArrayList<>();
            for (ClinicalInterviewState.SymptomItem s : state.getSymptoms()) {
                if (s.getDuration() != null) {
                    durTokens.add(s.getName() + " (" + s.getDuration() + ")");
                }
            }
            if (!durTokens.isEmpty() && (state.getDuration() == null || state.getDuration().isBlank())) {
                state.setDuration(String.join(", ", durTokens));
                state.getProvenance().put("duration", "PATIENT_REPORTED");
            }
        }

        // D. General duration detection if not yet captured
        if (state.getDuration() == null || state.getDuration().isBlank()) {
            Pattern durPat = Pattern.compile("(\\d+|ek|do|teen|char|panch|one|two|three|four|five|दो|तीन|चार|पांच)\\s*(hafte|hafta|din|mahine|mahina|saal|days?|weeks?|months?|years?|दिन|हफ्ते)");
            Matcher durMat = durPat.matcher(lower);
            if (durMat.find()) {
                state.setDuration(normalizeDurationString(durMat.group(1), durMat.group(2)));
                state.getProvenance().put("duration", "PATIENT_REPORTED");
            }
        }

        // E. Chief complaint detection
        if (state.getChiefComplaint() == null || state.getChiefComplaint().isBlank()) {
            if (!state.getSymptoms().isEmpty()) {
                List<String> sNames = new ArrayList<>();
                for (ClinicalInterviewState.SymptomItem s : state.getSymptoms()) {
                    sNames.add(s.getName());
                }
                state.setChiefComplaint(String.join(" and ", sNames));
                state.getProvenance().put("chiefComplaint", "PATIENT_REPORTED");
            } else if (lower.contains("dard") || lower.contains("pain") || lower.contains("takleef") || lower.contains("दर्द")) {
                if (lower.contains("ghutne") || lower.contains("knee") || lower.contains("घुटने")) {
                    state.setChiefComplaint("Knee pain / Ghutne mein dard");
                } else if (lower.contains("chest") || lower.contains("seene") || lower.contains("chhati")) {
                    state.setChiefComplaint("Chest discomfort / Seene mein dard");
                } else if (lower.contains("head") || lower.contains("sir") || lower.contains("sar") || lower.contains("sirdard") || lower.contains("sardard") || lower.contains("matha") || lower.contains("सिरदर्द") || lower.contains("सरदर्द")) {
                    state.setChiefComplaint("Headache / Sir dard");
                } else {
                    state.setChiefComplaint(text.length() > 60 ? text.substring(0, 57) + "..." : text);
                }
                state.getProvenance().put("chiefComplaint", "PATIENT_REPORTED");
            }
        }

        // F. Severity scale detection (supports quick-replies e.g. "Moderate (5-6)", "Mild (2-3)", "Severe (7-8)", and typed e.g. "5-6", "6/10", "pain 6")
        if (state.getSeverity() == null || state.getSeverity().isBlank()) {
            String detectedSev = null;
            if (lower.contains("mild") || lower.contains("halka") || lower.contains("हल्का") || lower.contains("2-3")) {
                detectedSev = "2-3 / Mild";
            } else if (lower.contains("moderate") || lower.contains("medium") || lower.contains("madhyam") || lower.contains("मध्यम") || lower.contains("5-6")) {
                detectedSev = "5-6 / Moderate";
            } else if (lower.contains("intense") || lower.contains("asahneey") || lower.contains("असहनीय") || lower.contains("9-10")) {
                detectedSev = "9-10 / Severe (Intense)";
            } else if (lower.contains("severe") || lower.contains("tez") || lower.contains("काफी तेज") || lower.contains("7-8")) {
                detectedSev = "7-8 / Severe";
            } else {
                Pattern sevPat = Pattern.compile("(?:pain|dard|severity|scale|level|around|is|hai)?\\s*([1-9]|10)(?:\\s*(?:/\\s*10|out of 10|mein se|me se))?");
                Matcher sevMat = sevPat.matcher(lower);
                if (sevMat.find() && (lower.contains("/10") || lower.contains("pain") || lower.contains("dard") || lower.contains("severity") || lower.contains("scale") || lower.matches(".*\\b([1-9]|10)\\b.*"))) {
                    detectedSev = sevMat.group(1) + "/10";
                }
            }

            if (detectedSev != null) {
                state.setSeverity(detectedSev);
                state.getProvenance().put("severity", "PATIENT_REPORTED");
                for (ClinicalInterviewState.SymptomItem s : state.getSymptoms()) {
                    if (s.getSeverity() == null || s.getSeverity().isBlank()) {
                        s.setSeverity(detectedSev);
                    }
                }
            }
        }

        // G. Location detection
        if (state.getLocation() == null || state.getLocation().isBlank()) {
            String detectedLoc = null;
            if (lower.contains("forehead") || lower.contains("matha") || lower.contains("mathe") || lower.contains("माथा") || lower.contains("माथे")) {
                detectedLoc = "Forehead";
            } else if (lower.contains("one side") || lower.contains("ek taraf") || lower.contains("ek side") || lower.contains("एक तरफ")) {
                detectedLoc = "Unilateral / One side";
            } else if (lower.contains("all over") || lower.contains("poore sar") || lower.contains("pura sir") || lower.contains("पूरे सिर")) {
                detectedLoc = "Whole head / Bilateral";
            } else if (lower.contains("neck") || lower.contains("gardan") || lower.contains("gardhan") || lower.contains("गर्दन")) {
                detectedLoc = "Head & Neck";
            } else if (lower.contains("knee") || lower.contains("ghutne") || lower.contains("ghutna") || lower.contains("घुटने")) {
                if (lower.contains("right") || lower.contains("dayan") || lower.contains("दाएं")) {
                    detectedLoc = "Right knee";
                } else if (lower.contains("left") || lower.contains("bayan") || lower.contains("बाएं")) {
                    detectedLoc = "Left knee";
                } else {
                    detectedLoc = "Knee";
                }
            } else if (lower.contains("chest") || lower.contains("seene") || lower.contains("chhati") || lower.contains("छाती") || lower.contains("सीने")) {
                detectedLoc = "Chest";
            } else if (lower.contains("head") || lower.contains("sir") || lower.contains("sar") || lower.contains("सिरदर्द") || lower.contains("सरदर्द") || lower.contains("sirdard") || lower.contains("sardard")) {
                detectedLoc = "Head";
            }

            if (detectedLoc != null) {
                state.setLocation(detectedLoc);
                state.getProvenance().put("location", "PATIENT_REPORTED");
                for (ClinicalInterviewState.SymptomItem s : state.getSymptoms()) {
                    if (s.getLocation() == null || s.getLocation().isBlank()) {
                        s.setLocation(detectedLoc);
                    }
                }
            }
        }

        // H. Aggravating factors / Triggers (stairs, walking, light, sound, stress, sleep, etc.)
        if (state.getAggravatingFactors() == null || state.getAggravatingFactors().isBlank()) {
            String detectedTrig = null;
            if (lower.contains("light") || lower.contains("sound") || lower.contains("roshni") || lower.contains("aawaz") || lower.contains("रोशनी") || lower.contains("आवाज")) {
                detectedTrig = "Bright light or loud sounds";
            } else if (lower.contains("stress") || lower.contains("neend") || lower.contains("sleep") || lower.contains("तनाव")) {
                detectedTrig = "Stress or lack of sleep";
            } else if (lower.contains("stairs") || lower.contains("seedhi") || lower.contains("sidhi") || lower.contains("सीढ़ी")) {
                detectedTrig = "Climbing stairs";
            } else if (lower.contains("walk") || lower.contains("chalne") || lower.contains("चलने")) {
                detectedTrig = "Walking / exertion";
            } else if (lower.contains("night") || lower.contains("raat") || lower.contains("रात")) {
                detectedTrig = "Worse at night / resting";
            } else if (lower.contains("constant") || lower.contains("lagatar") || lower.contains("लगातार")) {
                detectedTrig = "Constant pain, no specific trigger";
            }

            if (detectedTrig != null) {
                state.setAggravatingFactors(detectedTrig);
                state.getProvenance().put("aggravatingFactors", "PATIENT_REPORTED");
                for (ClinicalInterviewState.SymptomItem s : state.getSymptoms()) {
                    if (s.getTrigger() == null || s.getTrigger().isBlank()) {
                        s.setTrigger(detectedTrig);
                    }
                }
            }
        }

        // I. Relieving factors
        if (state.getRelievingFactors() == null || state.getRelievingFactors().isBlank()) {
            if (lower.contains("rest") || lower.contains("aaram") || lower.contains("baithne") || lower.contains("sitting") || lower.contains("आराम")) {
                state.setRelievingFactors("Rest / Sitting");
                state.getProvenance().put("relievingFactors", "PATIENT_REPORTED");
            }
        }

        // J. Pertinent Negatives
        if (lower.contains("swelling nahi") || lower.contains("sujan nahi") || lower.contains("no swelling") || lower.contains("सूजन नहीं")) {
            if (!state.getPertinentNegatives().contains("Swelling absent")) {
                state.getPertinentNegatives().add("Swelling absent");
            }
        }
        if (lower.contains("bukhar nahi") || lower.contains("no fever") || lower.contains("बुखार नहीं")) {
            if (!state.getPertinentNegatives().contains("Fever absent")) {
                state.getPertinentNegatives().add("Fever absent");
            }
        }

        // K. Medical History
        if (lower.contains("diabetes") || lower.contains("sugar") || lower.contains("मधुमेह")) {
            state.setPastMedicalHistory("Type 2 Diabetes Mellitus");
            state.getProvenance().put("pastMedicalHistory", "PATIENT_REPORTED");
        }
        if (lower.contains("hypertension") || lower.contains("bp") || lower.contains("blood pressure") || lower.contains("रक्तचाप")) {
            String curr = state.getPastMedicalHistory() != null ? state.getPastMedicalHistory() + ", Hypertension" : "Hypertension";
            state.setPastMedicalHistory(curr);
            state.getProvenance().put("pastMedicalHistory", "PATIENT_REPORTED");
        }

        // L. Current Medicines
        if (lower.contains("metformin")) {
            state.setCurrentMedicines("Metformin");
            state.getProvenance().put("currentMedicines", "PATIENT_REPORTED");
        } else if (lower.contains("paracetamol") || lower.contains("painkiller")) {
            state.setCurrentMedicines("Paracetamol / Pain relief");
            state.getProvenance().put("currentMedicines", "PATIENT_REPORTED");
        }

        // M. AYUSH Dimensions
        if (state.getAyushAgni() == null || state.getAyushAgni().isBlank()) {
            if (lower.contains("digestion") || lower.contains("pachan") || lower.contains("bhookh") || lower.contains("gas") || lower.contains("appetite") || lower.contains("पाचन") || lower.contains("भूख")) {
                state.setAyushAgni(text);
                state.getProvenance().put("ayushAgni", "PATIENT_REPORTED");
            }
        }
        if (state.getAyushNidra() == null || state.getAyushNidra().isBlank()) {
            if (lower.contains("sleep") || lower.contains("neend") || lower.contains("नींद")) {
                state.setAyushNidra(text);
                state.getProvenance().put("ayushNidra", "PATIENT_REPORTED");
            }
        }
        if (state.getAyushMala() == null || state.getAyushMala().isBlank()) {
            if (lower.contains("bowel") || lower.contains("pet saaf") || lower.contains("kabz") || lower.contains("constipation") || lower.contains("मल")) {
                state.setAyushMala(text);
                state.getProvenance().put("ayushMala", "PATIENT_REPORTED");
            }
        }
    }

    private String normalizeDurationString(String numStr, String unitStr) {
        String num = switch (numStr.toLowerCase(Locale.ROOT)) {
            case "ek", "one" -> "1";
            case "do", "two", "दो" -> "2";
            case "teen", "three", "तीन" -> "3";
            case "char", "four", "चार" -> "4";
            case "panch", "five", "पांच" -> "5";
            case "chhe", "six" -> "6";
            case "saat", "seven" -> "7";
            default -> numStr;
        };
        String unit = unitStr.toLowerCase(Locale.ROOT);
        if (unit.startsWith("din") || unit.startsWith("day") || unit.startsWith("दिन")) {
            return num + " days";
        } else if (unit.startsWith("haft") || unit.startsWith("week") || unit.startsWith("हफ्त")) {
            return num + " weeks";
        } else if (unit.startsWith("mahin") || unit.startsWith("month") || unit.startsWith("महीन")) {
            return num + " months";
        } else if (unit.startsWith("saal") || unit.startsWith("year")) {
            return num + " years";
        }
        return num + " " + unitStr;
    }

    private boolean hasFebrileOrRespiratorySymptom(ClinicalInterviewState state) {
        String cc = state.getChiefComplaint() != null ? state.getChiefComplaint().toLowerCase(Locale.ROOT) : "";
        if (cc.contains("fever") || cc.contains("bukhar") || cc.contains("cold") || cc.contains("jukham") || cc.contains("cough") || cc.contains("khansi") || cc.contains("बुखार") || cc.contains("जुकाम") || cc.contains("खांसी")) {
            return true;
        }
        for (ClinicalInterviewState.SymptomItem s : state.getSymptoms()) {
            String n = s.getName().toLowerCase(Locale.ROOT);
            if (n.contains("fever") || n.contains("bukhar") || n.contains("cold") || n.contains("jukham") || n.contains("cough") || n.contains("khansi") || n.contains("बुखार") || n.contains("जुकाम") || n.contains("खांसी")) {
                return true;
            }
        }
        return false;
    }

    private void updateCaseHpiAndSymptoms(Case c, ClinicalInterviewState state) {
        StringBuilder hpiSb = new StringBuilder();
        if (state.getDuration() != null) hpiSb.append("Onset/Duration: ").append(state.getDuration());
        if (state.getLocation() != null) {
            if (hpiSb.length() > 0) hpiSb.append(" | ");
            hpiSb.append("Location: ").append(state.getLocation());
        }
        if (state.getSeverity() != null) {
            if (hpiSb.length() > 0) hpiSb.append(" | ");
            hpiSb.append("Severity: ").append(state.getSeverity());
        }
        if (state.getAggravatingFactors() != null) {
            if (hpiSb.length() > 0) hpiSb.append(" | ");
            hpiSb.append("Aggravating: ").append(state.getAggravatingFactors());
        }
        if (state.getRelievingFactors() != null) {
            if (hpiSb.length() > 0) hpiSb.append(" | ");
            hpiSb.append("Relieving: ").append(state.getRelievingFactors());
        }
        if (!state.getPertinentNegatives().isEmpty()) {
            if (hpiSb.length() > 0) hpiSb.append(" | ");
            hpiSb.append("Pertinent Negatives: ").append(String.join(", ", state.getPertinentNegatives()));
        }
        if (hpiSb.length() > 0) {
            c.setHpi(hpiSb.toString());
        }
        if (state.getAssociatedSymptoms() != null) {
            c.setAssociatedSymptoms(state.getAssociatedSymptoms());
        }
    }

    /**
     * Build the assistant text message combining acknowledgement, interruption answer, and question
     */
    private String buildAssistantMessage(AiTurnResult ai, String lang, boolean redFlag) {
        StringBuilder sb = new StringBuilder();

        // 1. Red flag safety advisory if detected
        if (redFlag) {
            if ("hi".equalsIgnoreCase(lang)) {
                sb.append("⚠️ कृपया ध्यान दें: आपने जो लक्षण बताए हैं, उनके लिए यदि तकलीफ अधिक हो तो तुरंत आपातकालीन चिकित्सकीय सहायता लें।\n\n");
            } else if ("hinglish".equalsIgnoreCase(lang)) {
                sb.append("⚠️ Kripya dhyan dein: Aapne jo lakshan bataye hain, agar takleef badh rahi ho toh kripya turant emergency medical assistance lein.\n\n");
            } else {
                sb.append("⚠️ Important Safety Notice: Because of the symptoms you mentioned, please seek prompt medical attention if they worsen or are severe.\n\n");
            }
        }

        // 2. Interruption response if patient asked random question
        if (ai.interruptionResponse != null && !ai.interruptionResponse.isBlank()) {
            sb.append(ai.interruptionResponse.trim()).append(" ");
        }

        // 3. Short natural acknowledgement if present and not already having interruption response
        if ((ai.interruptionResponse == null || ai.interruptionResponse.isBlank()) &&
                ai.acknowledgement != null && !ai.acknowledgement.isBlank()) {
            sb.append(ai.acknowledgement.trim()).append(" ");
        }

        // 4. Main next question
        if (ai.nextQuestion != null && !ai.nextQuestion.isBlank()) {
            sb.append(ai.nextQuestion.trim());
        }

        return sb.toString().trim();
    }

    /**
     * Deterministic fallback when Gemini is unreachable or returned unparseable output
     */
    private AiTurnResult getDeterministicFallbackTurn(String language, ClinicalInterviewState state, int turnCount) {
        AiTurnResult res = new AiTurnResult();
        boolean isHi = "hi".equalsIgnoreCase(language);
        boolean isHinglish = "hinglish".equalsIgnoreCase(language);

        // Dynamic sufficiency check: If enough clinical dimensions are captured, complete!
        if (state.isClinicallySufficient(turnCount)) {
            res.isAssessmentComplete = true;
            res.nextQuestion = getCompletionMessage(language);
            return res;
        }

        // 1. Duration question: ONLY ask if duration is NOT already known
        if (!state.hasDurationKnown()) {
            if (isHi) {
                res.nextQuestion = "समझ गया। यह परेशानी आपको कब से हो रही है?";
                res.quickOptions = List.of("1-2 दिनों से", "लगभग 1-2 हफ्ते से", "1 महीने से अधिक", "आज ही शुरू हुआ");
            } else if (isHinglish) {
                res.nextQuestion = "Samajh gaya. Yeh pareshani aapko kab se ho rahi hai?";
                res.quickOptions = List.of("1-2 din se", "Lagbhag 1-2 hafte se", "1 mahine se zyada", "Aaj hi shuru hua");
            } else {
                res.nextQuestion = "Got it. How long have you been experiencing this issue?";
                res.quickOptions = List.of("1-2 days", "About 1-2 weeks", "Over a month", "Just started today");
            }
            return res;
        }

        // 2. If patient has Fever / Cold / Cough / Respiratory complaint
        boolean isFebrileOrResp = hasFebrileOrRespiratorySymptom(state);
        if (isFebrileOrResp && (state.getAssociatedSymptoms() == null || state.getAssociatedSymptoms().isBlank())) {
            if (isHi) {
                res.nextQuestion = "समझ गया। क्या बुखार के साथ ठंड, कंपकंपी या गले में दर्द/खराश भी महसूस हो रही है?";
                res.quickOptions = List.of("ठंड / कंपकंपी लगती है", "गले में दर्द / खराश है", "शरीर में दर्द / कमजोरी", "केवल बुखार और जुकाम है");
            } else if (isHinglish) {
                res.nextQuestion = "Samajh gaya. Kya bukhar ke sath thand, kapkapi ya gale mein dard/kharash bhi ho rahi hai?";
                res.quickOptions = List.of("Thand / Kapkapi lagti hai", "Gale mein dard hai", "Body ache / Kamzori hai", "Sirf bukhar aur sardi hai");
            } else {
                res.nextQuestion = "Understood. Are you experiencing chills, shivering, or a sore throat along with the fever?";
                res.quickOptions = List.of("Chills / shivering", "Sore throat", "Body ache / fatigue", "Only fever & cold");
            }
            return res;
        }

        boolean isHeadache = isHeadacheComplaint(state);

        // 3. Location question: ONLY ask if location is NOT yet known
        if (!state.hasLocationKnown()) {
            if (isHi) {
                res.nextQuestion = isHeadache
                        ? "यह सिरदर्द विशेष रूप से किस जगह पर है - माथे पर, सिर के एक तरफ या पूरे सिर में?"
                        : "तकलीफ शरीर के किस हिस्से में सबसे ज्यादा महसूस हो रही है?";
                res.quickOptions = isHeadache
                        ? List.of("माथे पर (Forehead)", "सिर के एक तरफ (One side)", "पूरे सिर में (All over)", "गर्दन तक जाता है")
                        : List.of("दाहिनी तरफ (Right)", "बाईं तरफ (Left)", "दोनों तरफ (Both)", "पूरे हिस्से में");
            } else if (isHinglish) {
                res.nextQuestion = isHeadache
                        ? "Yeh headache exactly kahan ho raha hai - forehead par, ek taraf ya poore sar mein?"
                        : "Yeh takleef shareer ke kis hisse mein sabse zyada ho rahi hai?";
                res.quickOptions = isHeadache
                        ? List.of("Forehead par", "Ek taraf (One side)", "Poore sar mein", "Gardhan tak jaata hai")
                        : List.of("Right side mein", "Left side mein", "Dono taraf", "Poore hisse mein");
            } else {
                res.nextQuestion = isHeadache
                        ? "Where exactly is the headache located - on the forehead, one side, or all over?"
                        : "Where exactly is this discomfort located?";
                res.quickOptions = isHeadache
                        ? List.of("Forehead", "One side of head", "All over head", "Radiates to neck")
                        : List.of("Right side", "Left side", "Both sides", "Whole area");
            }
            return res;
        }

        // 4. Severity question: ONLY ask if severity is NOT yet known
        if (!state.hasSeverityKnown()) {
            if (isHi) {
                res.nextQuestion = "0 से 10 के पैमाने पर दर्द या तकलीफ की तीव्रता कितनी है?";
                res.quickOptions = List.of("हल्का दर्द (2-3)", "मध्यम दर्द (5-6)", "काफी तेज दर्द (7-8)", "असहनीय (9-10)");
            } else if (isHinglish) {
                res.nextQuestion = "0 se 10 ke scale par dard ya takleef kitni tez hai?";
                res.quickOptions = List.of("Halka dard (2-3)", "Moderate (5-6)", "Kafi tez (7-8)", "Asahneey (9-10)");
            } else {
                res.nextQuestion = "On a scale of 0 to 10, how severe is the discomfort?";
                res.quickOptions = List.of("Mild (2-3)", "Moderate (5-6)", "Severe (7-8)", "Intense (9-10)");
            }
            return res;
        }

        // 5. Aggravating / Relieving factors missing
        if (!state.hasTriggerKnown() && state.getRelievingFactors() == null) {
            if (isHi) {
                res.nextQuestion = isHeadache
                        ? "क्या तेज रोशनी, आवाज, तनाव या नींद की कमी से सिरदर्द बढ़ जाता है?"
                        : "क्या किसी विशेष गतिविधि, चलने-फिरने या काम से यह तकलीफ बढ़ जाती है?";
                res.quickOptions = isHeadache
                        ? List.of("तेज रोशनी या आवाज से", "तनाव या स्क्रीन टाइम से", "नींद पूरी न होने से", "लगातार एक जैसा रहता है")
                        : List.of("सीढ़ी चढ़ने पर अधिक", "चलने-फिरने पर अधिक", "रात में आराम करते समय", "लगातार एक जैसा रहता है");
            } else if (isHinglish) {
                res.nextQuestion = isHeadache
                        ? "Kya tez light, aawaz, stress ya neend ki kami se headache badh jata hai?"
                        : "Kya kisi specific kaam ya chalne-firne se yeh dard badh jata hai?";
                res.quickOptions = isHeadache
                        ? List.of("Tez light ya sound se", "Stress ya screen time se", "Neend ki kami se", "Lagatar ek jaisa")
                        : List.of("Seedhi chadhte time", "Chalne-firne par", "Raat ko sote waqt", "Lagatar ek jaisa");
            } else {
                res.nextQuestion = isHeadache
                        ? "Does bright light, loud sound, stress, or lack of sleep worsen the headache?"
                        : "Does any specific movement, walking, or activity make the discomfort worse or better?";
                res.quickOptions = isHeadache
                        ? List.of("Bright light or sound", "Stress or screen time", "Lack of sleep", "Constant, no change")
                        : List.of("Worse with stairs", "Worse walking", "Worse at night", "Constant pain");
            }
            return res;
        }

        // 6. Current medicines or medical history missing
        if (state.getCurrentMedicines() == null && state.getPastMedicalHistory() == null) {
            if (isHi) {
                res.nextQuestion = "क्या आप इसके लिए कोई दवा ले रहे हैं या आपको पहले से कोई बीमारी (जैसे बीपी, शुगर) है?";
                res.quickOptions = List.of("कोई दवा नहीं ले रहे", "दर्द / बुखार की दवा ली है", "डायबिटीज / बीपी की दवा चल रही है", "अन्य दवाएं");
            } else if (isHinglish) {
                res.nextQuestion = "Kya aap iske liye koi medicine le rahe hain ya pehle se koi bimari (jaise BP, Diabetes) hai?";
                res.quickOptions = List.of("Koi medicine nahi", "Dawai li hai", "Diabetes / BP ki medicine", "Other medicines");
            } else {
                res.nextQuestion = "Are you taking any medications for this, or do you have any ongoing health conditions (like BP, diabetes)?";
                res.quickOptions = List.of("No medications", "Taken medicine", "BP / Diabetes meds", "Other prescription");
            }
            return res;
        }

        // 7. AYUSH Agni (digestion)
        if (state.getAyushAgni() == null) {
            if (isHi) {
                res.nextQuestion = "डॉक्टर के लिए आपकी दिनचर्या समझने हेतु: आपको भूख और पाचन कैसा रहता है?";
                res.quickOptions = List.of("भूख में उतार-चढ़ाव / गैस", "तेज भूख / एसिडिटी", "धीमा पाचन / भारीपन", "सामान्य और संतुलित");
            } else if (isHinglish) {
                res.nextQuestion = "Doctor ke liye aapki daily routine samajhne ke liye: Aapki bhookh aur digestion kaisa rehta hai?";
                res.quickOptions = List.of("Gas / Bloating rehti hai", "Tez bhookh / Acidity", "Dheema pachan / Bhari lagna", "Normal aur theek");
            } else {
                res.nextQuestion = "To help the doctor assess your digestion: How is your daily appetite and digestion?";
                res.quickOptions = List.of("Variable / Gas & bloating", "Strong / Acidity", "Slow / Heaviness", "Normal balanced");
            }
            return res;
        }

        // 8. AYUSH Nidra (sleep)
        if (state.getAyushNidra() == null) {
            if (isHi) {
                res.nextQuestion = "आपकी नींद कैसी रहती है - गहरी, बीच-बीच में टूटने वाली या कम आती है?";
                res.quickOptions = List.of("गहरी और शांत नींद", "बीच-बीच में टूटती है", "नींद आने में कठिनाई", "कम नींद आती है");
            } else if (isHinglish) {
                res.nextQuestion = "Aapki sleep kaisi rehti hai - gehri, disturb hoti hai ya kam aati hai?";
                res.quickOptions = List.of("Gehri aur achhi neend", "Baar-baar toot ti hai", "Neend mushkil se aati hai", "Kam aati hai");
            } else {
                res.nextQuestion = "How is your sleep - sound, easily disturbed, or do you struggle to fall asleep?";
                res.quickOptions = List.of("Sound & restful", "Disturbed / waking up", "Trouble falling asleep", "Less sleep");
            }
            return res;
        }

        // 9. Otherwise complete!
        res.isAssessmentComplete = true;
        res.nextQuestion = getCompletionMessage(language);
        return res;
    }

    private boolean isHeadacheComplaint(ClinicalInterviewState state) {
        if (state == null) return false;
        String cc = state.getChiefComplaint() != null ? state.getChiefComplaint().toLowerCase(Locale.ROOT) : "";
        if (cc.contains("head") || cc.contains("sir") || cc.contains("sar") || cc.contains("matha") || cc.contains("माथ") || cc.contains("सिर") || cc.contains("सर")) {
            return true;
        }
        for (ClinicalInterviewState.SymptomItem s : state.getSymptoms()) {
            String sn = s.getName() != null ? s.getName().toLowerCase(Locale.ROOT) : "";
            if (sn.contains("head") || sn.contains("sir") || sn.contains("sar") || sn.contains("matha") || sn.contains("माथ") || sn.contains("सिर") || sn.contains("सर")) {
                return true;
            }
        }
        return false;
    }

    private boolean isSubstantiallyIdentical(String q1, String q2) {
        if (q1 == null || q2 == null) return false;
        String s1 = q1.replaceAll("[^a-zA-Z0-9\\u0900-\\u097F]", "").toLowerCase(Locale.ROOT);
        String s2 = q2.replaceAll("[^a-zA-Z0-9\\u0900-\\u097F]", "").toLowerCase(Locale.ROOT);
        if (s1.equals(s2)) return true;
        int minLen = Math.min(s1.length(), s2.length());
        int maxLen = Math.max(s1.length(), s2.length());
        if (minLen > 15 && (s1.contains(s2) || s2.contains(s1)) && ((double) minLen / maxLen) > 0.8) {
            return true;
        }
        return false;
    }

    private void deduplicateQuestion(AiTurnResult res, ClinicalInterviewState state, String language, String lastAssistantQuestion) {
        boolean isHi = "hi".equalsIgnoreCase(language);
        boolean isHinglish = "hinglish".equalsIgnoreCase(language);
        boolean isHeadache = isHeadacheComplaint(state);

        // Sequence through missing dimensions
        if (!state.hasLocationKnown()) {
            res.nextQuestion = isHi
                    ? (isHeadache ? "यह सिरदर्द विशेष रूप से किस जगह पर है - माथे पर, सिर के एक तरफ या पूरे सिर में?" : "तकलीफ शरीर के किस हिस्से में सबसे ज्यादा महसूस हो रही है?")
                    : (isHinglish ? (isHeadache ? "Yeh headache exactly kahan ho raha hai - forehead par, ek taraf ya poore sar mein?" : "Yeh takleef shareer ke kis hisse mein sabse zyada ho rahi hai?")
                    : (isHeadache ? "Where exactly is the headache located - on the forehead, one side, or all over?" : "Where exactly is this discomfort located?"));
            res.quickOptions = isHi
                    ? (isHeadache ? List.of("माथे पर (Forehead)", "सिर के एक तरफ (One side)", "पूरे सिर में (All over)", "गर्दन तक जाता है") : List.of("दाहिनी तरफ", "बाईं तरफ", "दोनों तरफ", "पूरे हिस्से में"))
                    : (isHinglish ? (isHeadache ? List.of("Forehead par", "Ek taraf (One side)", "Poore sar mein", "Gardhan tak jaata hai") : List.of("Right side mein", "Left side mein", "Dono taraf", "Poore hisse mein"))
                    : (isHeadache ? List.of("Forehead", "One side of head", "All over head", "Radiates to neck") : List.of("Right side", "Left side", "Both sides", "Whole area")));
            if (!isSubstantiallyIdentical(res.nextQuestion, lastAssistantQuestion)) return;
        }

        if (!state.hasSeverityKnown()) {
            res.nextQuestion = isHi
                    ? "0 से 10 के पैमाने पर दर्द या तकलीफ की तीव्रता कितनी है?"
                    : (isHinglish ? "0 se 10 ke scale par dard ya takleef kitni tez hai?"
                    : "On a scale of 0 to 10, how severe is the discomfort?");
            res.quickOptions = isHi
                    ? List.of("हल्का दर्द (2-3)", "मध्यम दर्द (5-6)", "काफी तेज दर्द (7-8)", "असहनीय (9-10)")
                    : (isHinglish ? List.of("Halka dard (2-3)", "Moderate (5-6)", "Kafi tez (7-8)", "Asahneey (9-10)")
                    : List.of("Mild (2-3)", "Moderate (5-6)", "Severe (7-8)", "Intense (9-10)"));
            if (!isSubstantiallyIdentical(res.nextQuestion, lastAssistantQuestion)) return;
        }

        if (!state.hasTriggerKnown() && state.getRelievingFactors() == null) {
            res.nextQuestion = isHi
                    ? (isHeadache ? "क्या तेज रोशनी, आवाज, तनाव या नींद की कमी से सिरदर्द बढ़ जाता है?" : "क्या किसी विशेष गतिविधि या चलने-फिरने से तकलीफ बढ़ती है?")
                    : (isHinglish ? (isHeadache ? "Kya tez light, aawaz, stress ya neend ki kami se headache badh jata hai?" : "Kya kisi specific movement ya walk karne se dard badh jata hai?")
                    : (isHeadache ? "Does bright light, loud sound, stress, or lack of sleep worsen the headache?" : "Does any specific movement, activity, or walking worsen the discomfort?"));
            res.quickOptions = isHi
                    ? (isHeadache ? List.of("तेज रोशनी या आवाज से", "तनाव या स्क्रीन टाइम से", "नींद पूरी न होने से", "लगातार एक जैसा रहता है") : List.of("चलने-फिरने पर अधिक", "सीढ़ी चढ़ने पर", "रात को सोते समय", "लगातार एक जैसा"))
                    : (isHinglish ? (isHeadache ? List.of("Tez light ya sound se", "Stress ya screen time se", "Neend ki kami se", "Lagatar ek jaisa") : List.of("Chalne-firne par", "Seedhi chadhte waqt", "Raat ko sote waqt", "Lagatar ek jaisa"))
                    : (isHeadache ? List.of("Bright light or sound", "Stress or screen time", "Lack of sleep", "Constant pain") : List.of("Walking / movement", "Stairs", "At night", "Constant pain")));
            if (!isSubstantiallyIdentical(res.nextQuestion, lastAssistantQuestion)) return;
        }

        if (state.getCurrentMedicines() == null && state.getPastMedicalHistory() == null) {
            res.nextQuestion = isHi
                    ? "क्या आप इसके लिए कोई दवा ले रहे हैं या पहले से कोई बीमारी (जैसे बीपी, शुगर) है?"
                    : (isHinglish ? "Kya aap iske liye koi medicine le rahe hain ya pehle se koi bimari (jaise BP, Diabetes) hai?"
                    : "Are you taking any medications for this, or do you have any ongoing health conditions (like BP, diabetes)?");
            res.quickOptions = isHi
                    ? List.of("कोई दवा नहीं ले रहे", "दर्द की दवा ली है", "बीपी / शुगर की दवा चल रही है", "अन्य दवाएं")
                    : (isHinglish ? List.of("Koi medicine nahi", "Painkiller li hai", "Diabetes / BP ki medicine", "Other medicines")
                    : List.of("No medications", "Taken pain relief", "BP / Diabetes meds", "Other prescription"));
            if (!isSubstantiallyIdentical(res.nextQuestion, lastAssistantQuestion)) return;
        }

        if (state.getAyushAgni() == null) {
            res.nextQuestion = isHi
                    ? "डॉक्टर के लिए आपकी दिनचर्या समझने हेतु: आपको भूख और पाचन कैसा रहता है?"
                    : (isHinglish ? "Doctor ke liye aapki routine samajhne ke liye: Aapki bhookh aur digestion kaisa rehta hai?"
                    : "To help the doctor assess your digestion: How is your daily appetite and digestion?");
            res.quickOptions = isHi
                    ? List.of("भूख में उतार-चढ़ाव / गैस", "तेज भूख / एसिडिटी", "धीमा पाचन / भारीपन", "सामान्य और संतुलित")
                    : (isHinglish ? List.of("Gas / Bloating rehti hai", "Tez bhookh / Acidity", "Dheema pachan / Bhari lagna", "Normal aur theek")
                    : List.of("Variable / Gas & bloating", "Strong / Acidity", "Slow / Heaviness", "Normal balanced"));
            if (!isSubstantiallyIdentical(res.nextQuestion, lastAssistantQuestion)) return;
        }

        if (state.getAyushNidra() == null) {
            res.nextQuestion = isHi
                    ? "आपकी नींद कैसी रहती है - गहरी, बीच-बीच में टूटने वाली या कम आती है?"
                    : (isHinglish ? "Aapki sleep kaisi rehti hai - gehri, disturb hoti hai ya kam aati hai?"
                    : "How is your sleep - sound, easily disturbed, or do you struggle to fall asleep?");
            res.quickOptions = isHi
                    ? List.of("गहरी और शांत नींद", "बीच-बीच में टूटती है", "नींद आने में कठिनाई", "कम नींद आती है")
                    : (isHinglish ? List.of("Gehri aur achhi neend", "Baar-baar toot ti hai", "Neend mushkil se aati hai", "Kam aati hai")
                    : List.of("Sound & restful", "Disturbed / waking up", "Trouble falling asleep", "Less sleep"));
            if (!isSubstantiallyIdentical(res.nextQuestion, lastAssistantQuestion)) return;
        }

        // Complete intake
        res.isAssessmentComplete = true;
        res.nextQuestion = getCompletionMessage(language);
        res.quickOptions = Collections.emptyList();
    }

    /**
     * Generate Comprehensive 14-Section Pre-Consultation Summary
     */
    private String generate14SectionSummary(Case c, Patient patient, ClinicalInterviewState state,
                                            Map<String, Object> ayush, Map<String, Object> prakriti) {
        String dominant = (prakriti != null && prakriti.get("dominantTendency") != null)
                ? prakriti.get("dominantTendency").toString()
                : "Undetermined";

        StringBuilder sb = new StringBuilder();
        sb.append("==================================================\n");
        sb.append("STRUCTURED PRE-CONSULTATION CLINICAL SUMMARY\n");
        sb.append("MediKiosk AI Intake Preparation for Attending Physician\n");
        sb.append("==================================================\n\n");

        sb.append("PATIENT DEMOGRAPHICS:\n");
        sb.append("Name: ").append(valOr(patient.getName(), "Patient")).append(" | ");
        sb.append("Age: ").append(patient.getAge() != null ? patient.getAge() + " yrs" : "Not reported").append(" | ");
        sb.append("Gender: ").append(valOr(patient.getGender(), "Not reported")).append(" | ");
        sb.append("Phone: ").append(valOr(patient.getPhone(), "Recorded")).append("\n\n");

        // 1. Chief Complaint
        sb.append("1. CHIEF COMPLAINT:\n");
        sb.append(valOr(state.getChiefComplaint(), valOr(c.getChiefComplaint(), "Not reported"))).append("\n\n");

        // 2. History of Present Illness (HPI)
        sb.append("2. HISTORY OF PRESENT ILLNESS (HPI):\n");
        sb.append("- Onset/Duration: ").append(valOr(state.getDuration(), "Not reported")).append("\n");
        sb.append("- Location: ").append(valOr(state.getLocation(), "Not reported")).append("\n");
        sb.append("- Severity: ").append(valOr(state.getSeverity(), "Not reported")).append("\n");
        sb.append("- Character/Nature: ").append(valOr(state.getCharacter(), "Not reported")).append("\n");
        sb.append("- Timing/Pattern: ").append(valOr(state.getTiming(), "Not reported")).append("\n");
        sb.append("- Aggravating Factors: ").append(valOr(state.getAggravatingFactors(), "Not reported")).append("\n");
        sb.append("- Relieving Factors: ").append(valOr(state.getRelievingFactors(), "Not reported")).append("\n");
        if (!state.getPertinentNegatives().isEmpty()) {
            sb.append("- Pertinent Negatives: ").append(String.join(", ", state.getPertinentNegatives())).append("\n");
        } else {
            sb.append("- Pertinent Negatives: None reported\n");
        }
        sb.append("\n");

        // 3. Associated Symptoms
        sb.append("3. ASSOCIATED SYMPTOMS:\n");
        sb.append(valOr(state.getAssociatedSymptoms(), "Not reported")).append("\n\n");

        // 4. Relevant Medical History
        sb.append("4. RELEVANT MEDICAL HISTORY:\n");
        sb.append(valOr(state.getPastMedicalHistory(), "Not reported")).append("\n\n");

        // 5. Surgical History
        sb.append("5. SURGICAL HISTORY:\n");
        sb.append(valOr(state.getPastSurgicalHistory(), "Not reported")).append("\n\n");

        // 6. Current Medicines
        sb.append("6. CURRENT MEDICINES:\n");
        sb.append(valOr(state.getCurrentMedicines(), "Not reported")).append("\n\n");

        // 7. Allergies
        sb.append("7. ALLERGIES:\n");
        sb.append(valOr(state.getAllergies(), "Not reported")).append("\n\n");

        // 8. Family History
        sb.append("8. FAMILY HISTORY:\n");
        sb.append(valOr(state.getFamilyHistory(), "Not reported")).append("\n\n");

        // 9. Personal/Lifestyle History
        sb.append("9. PERSONAL / LIFESTYLE HISTORY:\n");
        sb.append(valOr(state.getPersonalLifestyle(), "Not reported")).append("\n\n");

        // 10. AYUSH Profile
        sb.append("10. AYUSH PROFILE:\n");
        sb.append("- Agni (Metabolism/Digestion): ").append(valOr(ayush.get("agni"), valOr(state.getAyushAgni(), "Not reported"))).append("\n");
        sb.append("- Nidra (Sleep Pattern): ").append(valOr(ayush.get("nidra"), valOr(state.getAyushNidra(), "Not reported"))).append("\n");
        sb.append("- Mala (Elimination): ").append(valOr(ayush.get("mala"), valOr(state.getAyushMala(), "Not reported"))).append("\n");
        sb.append("- Rule-Based Prakriti Tendency: ").append(dominant).append("\n\n");

        // 11. Previous Documents / Investigations
        sb.append("11. PREVIOUS DOCUMENTS / INVESTIGATIONS:\n");
        if (c.getDocuments() != null && !c.getDocuments().isBlank() && !c.getDocuments().equals("[]")) {
            sb.append("Attached patient records registered in system.\n\n");
        } else {
            sb.append("No prior documents attached yet (pending upload step).\n\n");
        }

        // 12. Red Flags
        sb.append("12. RED FLAGS:\n");
        if (c.getRedFlagDetected() != null && c.getRedFlagDetected()) {
            sb.append("⚠️ RED FLAG PRESENT: ").append(valOr(c.getRedFlagDetails(), "Urgent symptoms detected during interview.")).append("\n\n");
        } else {
            sb.append("No acute red flag criteria triggered during kiosk intake.\n\n");
        }

        // 13. Missing / Not Reported Information
        sb.append("13. MISSING / NOT REPORTED INFORMATION:\n");
        List<String> missing = new ArrayList<>();
        if (state.getPastSurgicalHistory() == null) missing.add("Surgical History: Not reported");
        if (state.getAllergies() == null) missing.add("Drug/Food Allergies: Not reported");
        if (state.getFamilyHistory() == null) missing.add("Family History: Not reported");
        if (state.getPersonalLifestyle() == null) missing.add("Personal Lifestyle/Habits: Not reported");
        if (state.getCharacter() == null) missing.add("Symptom Character/Quality: Not reported");
        sb.append(String.join("\n", missing)).append("\n\n");

        // 14. Concise Pre-Consultation Summary
        sb.append("14. CONCISE PRE-CONSULTATION SUMMARY:\n");
        sb.append(String.format(
                "Patient %s, %s presenting with %s for %s. Discomfort severity rated at %s, aggravated by %s. " +
                        "Past medical history notable for %s; current medications: %s. " +
                        "Preliminary AYUSH tendency indicates %s. Prepared for physician clinical review.",
                patient.getName(),
                patient.getAge() != null ? patient.getAge() + "y" : "",
                valOr(state.getChiefComplaint(), "reported complaint"),
                valOr(state.getDuration(), "unspecified duration"),
                valOr(state.getSeverity(), "unspecified severity"),
                valOr(state.getAggravatingFactors(), "unspecified triggers"),
                valOr(state.getPastMedicalHistory(), "none reported"),
                valOr(state.getCurrentMedicines(), "none reported"),
                dominant
        )).append("\n");

        return sb.toString();
    }

    private String valOr(Object val, String fallback) {
        if (val == null || val.toString().trim().isEmpty() || val.toString().equalsIgnoreCase("null")) {
            return fallback;
        }
        return val.toString().trim();
    }

    private String getInitialGreeting(String lang) {
        if ("hi".equalsIgnoreCase(lang)) {
            return "नमस्ते। आज आप किस स्वास्थ्य समस्या के बारे में बताना चाहते हैं?";
        } else if ("hinglish".equalsIgnoreCase(lang)) {
            return "Namaste. Aaj aapko kis health problem ke baare mein batana hai?";
        } else {
            return "Hello. What health concern brings you in today?";
        }
    }

    private List<String> getInitialOptions(String lang) {
        if ("hi".equalsIgnoreCase(lang)) {
            return List.of("सिरदर्द या भारीपन", "बुखार या सर्दी-जुकाम", "पेट में दर्द या गैस", "जोड़ों या घुटने में दर्द", "अन्य तकलीफ");
        } else if ("hinglish".equalsIgnoreCase(lang)) {
            return List.of("Sar dard ya heaviness", "Bukhar ya cold/cough", "Pet me dard ya gas", "Ghutne ya jodon me dard", "Koi aur pareshani");
        } else {
            return List.of("Headache or heaviness", "Fever or cold/cough", "Stomach pain or acidity", "Knee or joint pain", "Other concern");
        }
    }

    private String getCompletionMessage(String lang) {
        if ("hi".equalsIgnoreCase(lang)) {
            return "धन्यवाद! आपकी स्वास्थ्य जानकारी और आयुष प्रोफ़ाइल तैयार कर ली गई है। कृपया नीचे सारांश देखें और दस्तावेज़ पृष्ठ पर आगे बढ़ें।";
        } else if ("hinglish".equalsIgnoreCase(lang)) {
            return "Dhanyavaad! Aapka clinical intake aur AYUSH profile ready ho gaya hai. Kripya neeche summary dekhein aur documents page par aage badhein.";
        } else {
            return "Thank you! Your intake assessment and preliminary AYUSH profile have been prepared for your doctor. Please review your profile below and proceed to documents.";
        }
    }

    private int countUserTurns(List<ChatMessageDto> history) {
        int count = 0;
        for (ChatMessageDto m : history) {
            if ("user".equalsIgnoreCase(m.getRole())) {
                count++;
            }
        }
        return count;
    }

    private String normalizeLanguage(String lang) {
        if (lang == null || lang.isBlank()) return "en";
        String l = lang.trim().toLowerCase(Locale.ROOT);
        if (l.contains("hin") || l.equals("hi")) {
            return l.contains("hing") ? "hinglish" : "hi";
        }
        return "en";
    }

    private String now() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private List<ChatMessageDto> parseHistory(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<ChatMessageDto>>() {});
        } catch (Exception e) {
            logger.error("Failed to parse conversation history JSON: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private ClinicalInterviewState parseClinicalState(String json) {
        if (json == null || json.isBlank()) return new ClinicalInterviewState();
        try {
            return objectMapper.readValue(json, ClinicalInterviewState.class);
        } catch (Exception e) {
            logger.warn("Failed to parse ClinicalInterviewState JSON, initializing fresh state: {}", e.getMessage());
            return new ClinicalInterviewState();
        }
    }

    private Map<String, Object> toGenericMap(Object obj) {
        if (obj == null) return Collections.emptyMap();
        try {
            return objectMapper.convertValue(obj, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private Map<String, Object> parseGenericMap(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return null;
        }
    }

    private String serializeJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            logger.error("Serialization failure: {}", e.getMessage());
            return "";
        }
    }

    private static class AiTurnResult {
        String acknowledgement = "";
        String interruptionResponse = "";
        String nextQuestion = "";
        List<String> quickOptions = new ArrayList<>();
        Map<String, Object> extractedFacts = new HashMap<>();
        boolean isAssessmentComplete = false;
    }
}
