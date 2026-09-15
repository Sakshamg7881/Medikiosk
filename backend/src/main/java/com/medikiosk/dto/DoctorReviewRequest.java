package com.medikiosk.dto;

public class DoctorReviewRequest {

    private String doctorNotes;
    private String doctorReviewedSummary;
    private Long doctorId;

    public DoctorReviewRequest() {}

    public DoctorReviewRequest(String doctorNotes, String doctorReviewedSummary, Long doctorId) {
        this.doctorNotes = doctorNotes;
        this.doctorReviewedSummary = doctorReviewedSummary;
        this.doctorId = doctorId;
    }

    public String getDoctorNotes() {
        return doctorNotes;
    }

    public void setDoctorNotes(String doctorNotes) {
        this.doctorNotes = doctorNotes;
    }

    public String getDoctorReviewedSummary() {
        return doctorReviewedSummary;
    }

    public void setDoctorReviewedSummary(String doctorReviewedSummary) {
        this.doctorReviewedSummary = doctorReviewedSummary;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }
}
