package com.medikiosk.dto;

import java.time.LocalDateTime;
import java.util.List;

public class DoctorCaseItemDto {

    private Long caseId;
    private Long patientId;
    private String patientName;
    private Integer patientAge;
    private String patientGender;
    private String patientPhone;
    private String preferredLanguage;
    private String chiefComplaint;
    private String status;
    private boolean redFlagDetected;
    private List<String> redFlagTerms;
    private int documentCount;
    private LocalDateTime createdAt;
    private LocalDateTime doctorReviewedAt;
    private String doctorNotes;

    public DoctorCaseItemDto() {}

    public DoctorCaseItemDto(Long caseId, Long patientId, String patientName, Integer patientAge,
                             String patientGender, String patientPhone, String preferredLanguage,
                             String chiefComplaint, String status, boolean redFlagDetected,
                             List<String> redFlagTerms, int documentCount, LocalDateTime createdAt,
                             LocalDateTime doctorReviewedAt, String doctorNotes) {
        this.caseId = caseId;
        this.patientId = patientId;
        this.patientName = patientName;
        this.patientAge = patientAge;
        this.patientGender = patientGender;
        this.patientPhone = patientPhone;
        this.preferredLanguage = preferredLanguage;
        this.chiefComplaint = chiefComplaint;
        this.status = status;
        this.redFlagDetected = redFlagDetected;
        this.redFlagTerms = redFlagTerms;
        this.documentCount = documentCount;
        this.createdAt = createdAt;
        this.doctorReviewedAt = doctorReviewedAt;
        this.doctorNotes = doctorNotes;
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

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public Integer getPatientAge() {
        return patientAge;
    }

    public void setPatientAge(Integer patientAge) {
        this.patientAge = patientAge;
    }

    public String getPatientGender() {
        return patientGender;
    }

    public void setPatientGender(String patientGender) {
        this.patientGender = patientGender;
    }

    public String getPatientPhone() {
        return patientPhone;
    }

    public void setPatientPhone(String patientPhone) {
        this.patientPhone = patientPhone;
    }

    public String getPreferredLanguage() {
        return preferredLanguage;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }

    public String getChiefComplaint() {
        return chiefComplaint;
    }

    public void setChiefComplaint(String chiefComplaint) {
        this.chiefComplaint = chiefComplaint;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isRedFlagDetected() {
        return redFlagDetected;
    }

    public void setRedFlagDetected(boolean redFlagDetected) {
        this.redFlagDetected = redFlagDetected;
    }

    public List<String> getRedFlagTerms() {
        return redFlagTerms;
    }

    public void setRedFlagTerms(List<String> redFlagTerms) {
        this.redFlagTerms = redFlagTerms;
    }

    public int getDocumentCount() {
        return documentCount;
    }

    public void setDocumentCount(int documentCount) {
        this.documentCount = documentCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getDoctorReviewedAt() {
        return doctorReviewedAt;
    }

    public void setDoctorReviewedAt(LocalDateTime doctorReviewedAt) {
        this.doctorReviewedAt = doctorReviewedAt;
    }

    public String getDoctorNotes() {
        return doctorNotes;
    }

    public void setDoctorNotes(String doctorNotes) {
        this.doctorNotes = doctorNotes;
    }
}
