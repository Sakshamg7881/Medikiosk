package com.medikiosk.dto;

import jakarta.validation.constraints.NotNull;

public class AssessmentStartRequest {

    @NotNull(message = "Patient ID is required")
    private Long patientId;

    private String language; // "en", "hi", "hinglish"

    public AssessmentStartRequest() {}

    public AssessmentStartRequest(Long patientId, String language) {
        this.patientId = patientId;
        this.language = language;
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
}
