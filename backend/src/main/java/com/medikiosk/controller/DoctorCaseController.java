package com.medikiosk.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medikiosk.dto.CaseSummaryResponse;
import com.medikiosk.dto.DoctorCaseItemDto;
import com.medikiosk.dto.DoctorReviewRequest;
import com.medikiosk.model.Case;
import com.medikiosk.model.Patient;
import com.medikiosk.repository.CaseRepository;
import com.medikiosk.repository.PatientRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/doctor/cases")
public class DoctorCaseController {

    private static final Logger logger = LoggerFactory.getLogger(DoctorCaseController.class);

    private final CaseRepository caseRepository;
    private final PatientRepository patientRepository;
    private final com.medikiosk.service.RedFlagService redFlagService;
    private final ObjectMapper objectMapper;

    public DoctorCaseController(CaseRepository caseRepository,
                                PatientRepository patientRepository,
                                com.medikiosk.service.RedFlagService redFlagService,
                                ObjectMapper objectMapper) {
        this.caseRepository = caseRepository;
        this.patientRepository = patientRepository;
        this.redFlagService = redFlagService;
        this.objectMapper = objectMapper;
    }

    /**
     * List all cases for the doctor queue (latest first).
     */
    @GetMapping
    public ResponseEntity<List<DoctorCaseItemDto>> getDoctorQueue() {
        List<Case> cases = caseRepository.findAllByOrderByIdDesc();
        List<DoctorCaseItemDto> dtoList = new ArrayList<>();

        // Cache patients to avoid redundant queries
        Map<Long, Patient> patientCache = new HashMap<>();

        for (Case c : cases) {
            Patient p = null;
            if (c.getPatientId() != null) {
                p = patientCache.computeIfAbsent(c.getPatientId(), id -> patientRepository.findById(id).orElse(null));
            }

            List<String> redFlagTerms = parseStringList(c.getRedFlagDetails());
            boolean redFlagDetected = c.getRedFlagDetected() || !redFlagTerms.isEmpty();
            if (!redFlagDetected && redFlagService != null) {
                com.medikiosk.service.RedFlagService.RedFlagResult rf = redFlagService.checkRedFlags(
                        c.getChiefComplaint(),
                        c.getHpi(),
                        c.getAssociatedSymptoms(),
                        c.getConversationHistory()
                );
                if (rf.isDetected()) {
                    redFlagDetected = true;
                    redFlagTerms = rf.getMatchedTerms();
                    c.setRedFlagDetected(true);
                    try {
                        c.setRedFlagDetails(objectMapper.writeValueAsString(redFlagTerms));
                        caseRepository.save(c);
                    } catch (Exception ignored) {}
                }
            }

            List<Map<String, Object>> docs = parseListMaps(c.getDocuments());
            int docCount = docs.size();

            // Status normalization
            String status = c.getStatus();
            if (status == null || status.isBlank()) {
                status = c.getAiSummary() != null ? "READY_FOR_REVIEW" : "CREATED";
            } else if ("ASSESSMENT_COMPLETED".equalsIgnoreCase(status)) {
                status = "READY_FOR_REVIEW";
            }

            DoctorCaseItemDto dto = new DoctorCaseItemDto(
                    c.getId(),
                    p != null ? p.getId() : c.getPatientId(),
                    p != null ? p.getName() : "Anonymous Patient",
                    p != null ? p.getAge() : null,
                    p != null ? p.getGender() : null,
                    p != null ? p.getPhone() : null,
                    p != null ? p.getPreferredLanguage() : "en",
                    c.getChiefComplaint() != null ? c.getChiefComplaint() : "General Consultation",
                    status,
                    redFlagDetected,
                    redFlagTerms,
                    docCount,
                    c.getCreatedAt(),
                    c.getDoctorReviewedAt(),
                    c.getDoctorNotes()
            );

            dtoList.add(dto);
        }

        return ResponseEntity.ok(dtoList);
    }

    /**
     * Get detailed clinical case view for review.
     */
    @GetMapping("/{caseId}")
    public ResponseEntity<?> getDoctorCaseDetail(@PathVariable Long caseId) {
        Optional<Case> caseOpt = caseRepository.findById(caseId);
        if (caseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Case not found with ID: " + caseId));
        }

        Case c = caseOpt.get();
        CaseSummaryResponse response = buildCaseSummaryResponse(c);
        return ResponseEntity.ok(response);
    }

    /**
     * Submit doctor clinical notes and mark case as reviewed.
     */
    @PutMapping("/{caseId}/review")
    public ResponseEntity<?> reviewCase(@PathVariable Long caseId,
                                        @RequestBody DoctorReviewRequest reviewRequest) {
        Optional<Case> caseOpt = caseRepository.findById(caseId);
        if (caseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Case not found with ID: " + caseId));
        }

        Case c = caseOpt.get();

        if (reviewRequest != null) {
            c.setDoctorNotes(reviewRequest.getDoctorNotes());
            if (reviewRequest.getDoctorReviewedSummary() != null && !reviewRequest.getDoctorReviewedSummary().isBlank()) {
                c.setDoctorReviewedSummary(reviewRequest.getDoctorReviewedSummary());
            } else if (c.getDoctorReviewedSummary() == null || c.getDoctorReviewedSummary().isBlank()) {
                // If not explicitly edited, initialize with AI summary
                c.setDoctorReviewedSummary(c.getAiSummary());
            }

            if (reviewRequest.getDoctorId() != null) {
                c.setDoctorId(reviewRequest.getDoctorId());
            }
        }

        c.setDoctorReviewedAt(LocalDateTime.now());
        c.setStatus("REVIEWED");

        Case savedCase = caseRepository.save(c);
        logger.info("Case #{} marked as REVIEWED by doctor at {}", savedCase.getId(), savedCase.getDoctorReviewedAt());

        CaseSummaryResponse response = buildCaseSummaryResponse(savedCase);
        return ResponseEntity.ok(response);
    }

    private CaseSummaryResponse buildCaseSummaryResponse(Case c) {
        Map<String, Object> patientMap = new LinkedHashMap<>();
        if (c.getPatientId() != null) {
            patientRepository.findById(c.getPatientId()).ifPresent(p -> {
                patientMap.put("id", p.getId());
                patientMap.put("name", p.getName());
                patientMap.put("age", p.getAge());
                patientMap.put("gender", p.getGender());
                patientMap.put("preferredLanguage", p.getPreferredLanguage());
                patientMap.put("phone", p.getPhone());
            });
        }

        Map<String, Object> ayushMap = parseMap(c.getAyushData());
        Map<String, Object> prakritiMap = parseMap(c.getPrakritiResult());
        List<Map<String, Object>> documents = parseListMaps(c.getDocuments());

        List<String> redFlagTerms = parseStringList(c.getRedFlagDetails());
        boolean hasRedFlags = c.getRedFlagDetected() || !redFlagTerms.isEmpty();
        if (!hasRedFlags && redFlagService != null) {
            com.medikiosk.service.RedFlagService.RedFlagResult rf = redFlagService.checkRedFlags(
                    c.getChiefComplaint(),
                    c.getHpi(),
                    c.getAssociatedSymptoms(),
                    c.getConversationHistory()
            );
            if (rf.isDetected()) {
                hasRedFlags = true;
                redFlagTerms = rf.getMatchedTerms();
                c.setRedFlagDetected(true);
                try {
                    c.setRedFlagDetails(objectMapper.writeValueAsString(redFlagTerms));
                    caseRepository.save(c);
                } catch (Exception ignored) {}
            }
        }
        String warning = hasRedFlags
                ? "Some symptoms mentioned may need urgent medical attention. Please seek appropriate medical care promptly."
                : null;

        String status = c.getStatus();
        if (status == null || status.isBlank()) {
            status = c.getAiSummary() != null ? "READY_FOR_REVIEW" : "CREATED";
        } else if ("ASSESSMENT_COMPLETED".equalsIgnoreCase(status)) {
            status = "READY_FOR_REVIEW";
        }

        CaseSummaryResponse response = new CaseSummaryResponse(
                c.getId(),
                patientMap,
                c.getChiefComplaint() != null ? c.getChiefComplaint() : "Intake completed",
                c.getHpi() != null ? c.getHpi() : "Detailed in conversation history",
                c.getAssociatedSymptoms() != null ? c.getAssociatedSymptoms() : "None reported",
                ayushMap,
                prakritiMap,
                documents,
                c.getAiSummary(),
                hasRedFlags,
                warning,
                redFlagTerms,
                status
        );

        response.setDoctorNotes(c.getDoctorNotes());
        // Pre-fill doctorReviewedSummary with aiSummary if not already set
        String reviewedSummary = c.getDoctorReviewedSummary();
        if ((reviewedSummary == null || reviewedSummary.isBlank()) && c.getAiSummary() != null) {
            reviewedSummary = c.getAiSummary();
        }
        response.setDoctorReviewedSummary(reviewedSummary);
        response.setDoctorReviewedAt(c.getDoctorReviewedAt());
        response.setDoctorId(c.getDoctorId());
        response.setCreatedAt(c.getCreatedAt());

        return response;
    }

    private List<Map<String, Object>> parseListMaps(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private Map<String, Object> parseMap(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private List<String> parseStringList(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
