package com.medikiosk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AssessmentMessageRequest {

    @NotNull(message = "Case ID is required")
    private Long caseId;

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private String language; // "en", "hi", "hinglish"

    @NotBlank(message = "Message cannot be blank")
    private String message;

    public AssessmentMessageRequest() {}

    public AssessmentMessageRequest(Long caseId, Long patientId, String language, String message) {
        this.caseId = caseId;
        this.patientId = patientId;
        this.language = language;
        this.message = message;
    }

    public Long getCaseId() {
        return caseId;
    }

    public void setCaseId(Long caseId) {
        this.caseId = caseId;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
