package com.medikiosk.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medikiosk.dto.CaseSummaryResponse;
import com.medikiosk.dto.DocumentUploadResponse;
import com.medikiosk.model.Case;
import com.medikiosk.model.Patient;
import com.medikiosk.repository.CaseRepository;
import com.medikiosk.repository.PatientRepository;
import com.medikiosk.service.DocumentExtractionService;
import com.medikiosk.service.OcrService;
import com.medikiosk.service.RedFlagService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/cases")
public class CaseDocumentController {

    private static final Logger logger = LoggerFactory.getLogger(CaseDocumentController.class);
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final CaseRepository caseRepository;
    private final PatientRepository patientRepository;
    private final OcrService ocrService;
    private final DocumentExtractionService documentExtractionService;
    private final RedFlagService redFlagService;
    private final ObjectMapper objectMapper;

    public CaseDocumentController(CaseRepository caseRepository,
                                  PatientRepository patientRepository,
                                  OcrService ocrService,
                                  DocumentExtractionService documentExtractionService,
                                  RedFlagService redFlagService,
                                  ObjectMapper objectMapper) {
        this.caseRepository = caseRepository;
        this.patientRepository = patientRepository;
        this.ocrService = ocrService;
        this.documentExtractionService = documentExtractionService;
        this.redFlagService = redFlagService;
        this.objectMapper = objectMapper;
    }

    @PostMapping(value = "/{caseId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadDocument(@PathVariable Long caseId,
                                            @RequestParam("file") MultipartFile file,
                                            @RequestParam(value = "documentType", defaultValue = "OTHER") String documentType) {
        // 1. Validate Case
        Optional<Case> caseOpt = caseRepository.findById(caseId);
        if (caseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Case not found with ID: " + caseId));
        }
        Case c = caseOpt.get();

        // 2. Validate File
        if (file == null || file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Uploaded file cannot be empty."));
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "File size exceeds the 10MB maximum limit."));
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        String lowerName = originalName.toLowerCase(Locale.ROOT);

        boolean isPdf = contentType.contains("pdf") || lowerName.endsWith(".pdf");
        boolean isImage = contentType.contains("image") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".png");

        if (!isPdf && !isImage) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Unsupported file type. Only PDF, JPG, and PNG documents are supported."));
        }

        try {
            byte[] fileBytes = file.getBytes();

            // 3. Save file locally
            saveFileLocally(caseId, originalName, fileBytes);

            // 4. OCR / Text Extraction
            OcrService.OcrResult ocrResult = ocrService.extractText(fileBytes, originalName, contentType);

            // 5. Structure Document via Gemini
            Map<String, Object> structuredData = documentExtractionService.structureDocument(
                    ocrResult.getExtractedText(),
                    documentType,
                    originalName,
                    fileBytes,
                    contentType
            );

            // 6. Red-Flag Detection
            RedFlagService.RedFlagResult redFlagResult = redFlagService.checkRedFlags(
                    c.getChiefComplaint(),
                    c.getHpi(),
                    c.getAssociatedSymptoms(),
                    ocrResult.getExtractedText(),
                    structuredData.toString()
            );

            // Update Case Red-Flag Status if detected
            if (redFlagResult.isDetected()) {
                c.setRedFlagDetected(true);
                List<String> currentFlags = parseStringList(c.getRedFlagDetails());
                for (String term : redFlagResult.getMatchedTerms()) {
                    if (!currentFlags.contains(term)) {
                        currentFlags.add(term);
                    }
                }
                c.setRedFlagDetails(objectMapper.writeValueAsString(currentFlags));
            }

            // 7. Append document metadata to Case
            String docId = "doc-" + UUID.randomUUID().toString().substring(0, 8);
            String textPreview = ocrResult.getExtractedText();
            if (textPreview.length() > 200) {
                textPreview = textPreview.substring(0, 200) + "...";
            }

            Map<String, Object> docMeta = new LinkedHashMap<>();
            docMeta.put("documentId", docId);
            docMeta.put("fileName", originalName);
            docMeta.put("documentType", documentType.toUpperCase(Locale.ROOT));
            docMeta.put("fileSize", file.getSize());
            docMeta.put("contentType", contentType);
            docMeta.put("uploadedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            docMeta.put("ocrStatus", ocrResult.getStatus());
            docMeta.put("extractedVia", ocrResult.getExtractedVia());
            docMeta.put("extractedTextPreview", textPreview);
            docMeta.put("structuredData", structuredData);
            docMeta.put("redFlags", redFlagResult.getMatchedTerms());

            List<Map<String, Object>> existingDocs = parseListMaps(c.getDocuments());
            existingDocs.add(docMeta);
            c.setDocuments(objectMapper.writeValueAsString(existingDocs));

            // Persist latest structured extraction
            c.setOcrExtractedData(objectMapper.writeValueAsString(structuredData));

            // Update AI summary to synthesize document review
            updateCaseSummaryWithDocument(c, originalName, documentType, structuredData);

            if (!"REVIEWED".equalsIgnoreCase(c.getStatus()) && !"COMPLETED".equalsIgnoreCase(c.getStatus())) {
                c.setStatus("READY_FOR_REVIEW");
            }

            caseRepository.save(c);

            return ResponseEntity.ok(new DocumentUploadResponse(
                    docId,
                    originalName,
                    documentType.toUpperCase(Locale.ROOT),
                    file.getSize(),
                    contentType,
                    ocrResult.getStatus(),
                    textPreview,
                    structuredData,
                    redFlagResult.getMatchedTerms(),
                    c.getId()
            ));

        } catch (IOException e) {
            logger.error("Failed to read uploaded file: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process document upload: " + e.getMessage()));
        }
    }

    @GetMapping("/{caseId}/documents/{fileName:.+}")
public ResponseEntity<byte[]> getDocument(
        @PathVariable Long caseId,
        @PathVariable String fileName) {

    try {
        File dir = new File("uploads/cases/" + caseId);

        if (!dir.exists() || !dir.isDirectory()) {
            return ResponseEntity.notFound().build();
        }

        String safeName = fileName.replaceAll("[^a-zA-Z0-9._-]", "_");

        File[] matchingFiles = dir.listFiles((d, name) ->
                name.endsWith("_" + safeName)
        );

        if (matchingFiles == null || matchingFiles.length == 0) {
            return ResponseEntity.notFound().build();
        }

        File target = matchingFiles[matchingFiles.length - 1];
        byte[] fileBytes = Files.readAllBytes(target.toPath());

        String contentType = Files.probeContentType(target.toPath());

        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + safeName + "\"")
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .body(fileBytes);

    } catch (IOException e) {
        logger.error("Failed to read uploaded document: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}

    @GetMapping("/{caseId}/summary")
    public ResponseEntity<?> getCaseSummary(@PathVariable Long caseId) {
        Optional<Case> caseOpt = caseRepository.findById(caseId);
        if (caseOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Case not found with ID: " + caseId));
        }
        Case c = caseOpt.get();

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

        // Re-evaluate Red Flags across all data
        List<String> redFlagTerms = parseStringList(c.getRedFlagDetails());
        boolean hasRedFlags = c.getRedFlagDetected() || !redFlagTerms.isEmpty();
        String warning = hasRedFlags
                ? "Some symptoms mentioned may need urgent medical attention. Please seek appropriate medical care promptly."
                : null;

        if (!"REVIEWED".equalsIgnoreCase(c.getStatus()) && !"COMPLETED".equalsIgnoreCase(c.getStatus())) {
            if ("ASSESSMENT_COMPLETED".equalsIgnoreCase(c.getStatus()) || c.getStatus() == null) {
                c.setStatus("READY_FOR_REVIEW");
                caseRepository.save(c);
            }
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
                c.getStatus()
        );

        response.setDoctorNotes(c.getDoctorNotes());
        response.setDoctorReviewedSummary(c.getDoctorReviewedSummary());
        response.setDoctorReviewedAt(c.getDoctorReviewedAt());
        response.setDoctorId(c.getDoctorId());
        response.setCreatedAt(c.getCreatedAt());

        return ResponseEntity.ok(response);
    }

    private void saveFileLocally(Long caseId, String originalName, byte[] bytes) {
        try {
            File dir = new File("uploads/cases/" + caseId);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            String safeName = System.currentTimeMillis() + "_" + originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
            File target = new File(dir, safeName);
            try (FileOutputStream fos = new FileOutputStream(target)) {
                fos.write(bytes);
            }
        } catch (Exception e) {
            logger.warn("Could not write file to local disk (proceeding in-memory): {}", e.getMessage());
        }
    }

    private void updateCaseSummaryWithDocument(Case c, String fileName, String docType, Map<String, Object> structured) {
        String existingSummary = c.getAiSummary() != null ? c.getAiSummary() : "";
        StringBuilder docNote = new StringBuilder();
        docNote.append("\n\nDOCUMENT REVIEWED: ").append(fileName).append(" (").append(docType).append(")");

        Object meds = structured.get("medicines");
        if (meds instanceof List && !((List<?>) meds).isEmpty()) {
            docNote.append("\n- Medicines Found: ").append(meds);
        }
        Object findings = structured.get("importantFindings");
        if (findings instanceof List && !((List<?>) findings).isEmpty()) {
            docNote.append("\n- Key Findings: ").append(findings);
        }
        Object labs = structured.get("labResults");
        if (labs instanceof List && !((List<?>) labs).isEmpty()) {
            docNote.append("\n- Lab Values: ").append(labs);
        }

        c.setAiSummary(existingSummary + docNote.toString());
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
