package com.medikiosk.controller;

import com.medikiosk.dto.AppointmentRequest;
import com.medikiosk.model.Appointment;
import com.medikiosk.model.Case;
import com.medikiosk.repository.AppointmentRepository;
import com.medikiosk.repository.CaseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentRepository appointmentRepository;
    private final CaseRepository caseRepository;

    public AppointmentController(AppointmentRepository appointmentRepository, CaseRepository caseRepository) {
        this.appointmentRepository = appointmentRepository;
        this.caseRepository = caseRepository;
    }

    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        return ResponseEntity.ok(appointmentRepository.findAllByOrderByIdDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id) {
        return appointmentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Appointment>> getDoctorAppointments(@PathVariable Long doctorId) {
        return ResponseEntity.ok(appointmentRepository.findByDoctorIdOrderByIdDesc(doctorId));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Appointment>> getPatientAppointments(@PathVariable Long patientId) {
        return ResponseEntity.ok(appointmentRepository.findByPatientIdOrderByIdDesc(patientId));
    }

    @PostMapping
    public ResponseEntity<Appointment> createAppointment(@RequestBody AppointmentRequest request) {
        Appointment appointment = new Appointment();
        appointment.setCaseId(request.getCaseId());
        appointment.setPatientId(request.getPatientId());
        appointment.setDoctorId(request.getDoctorId());
        appointment.setClinicId(request.getClinicId() != null ? request.getClinicId() : "c1");
        appointment.setDate(request.getDate() != null ? request.getDate() : "Today");
        appointment.setTime(request.getTime() != null ? request.getTime() : "10:30 AM");
        appointment.setConsultationType(request.getConsultationType() != null ? request.getConsultationType() : "First Consultation");
        appointment.setPatientName(request.getPatientName() != null ? request.getPatientName() : "Patient");
        appointment.setDoctorName(request.getDoctorName() != null ? request.getDoctorName() : "Attending AYUSH Vaidya");
        appointment.setClinicName(request.getClinicName() != null ? request.getClinicName() : "Ayush Arogya Kendra");

        String initialStatus = request.getStatus() != null ? request.getStatus().toUpperCase() : "CONFIRMED";
        appointment.setStatus(initialStatus);

        // Save to generate ID
        Appointment saved = appointmentRepository.save(appointment);

        // Generate clean consultation token
        String token = "TK-" + String.format("%02d", saved.getId());
        if (saved.getCaseId() != null) {
            token = "TK-" + String.format("%02d", saved.getCaseId());
        }
        saved.setConsultationToken(token);
        saved = appointmentRepository.save(saved);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateAppointmentStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
        }

        return appointmentRepository.findById(id).map(appointment -> {
            String normalizedStatus = newStatus.trim().toUpperCase();
            appointment.setStatus(normalizedStatus);
            Appointment updated = appointmentRepository.save(appointment);

            // If marked as COMPLETED, also verify/update associated case if needed
            if ("COMPLETED".equals(normalizedStatus) && appointment.getCaseId() != null) {
                caseRepository.findById(appointment.getCaseId()).ifPresent(c -> {
                    if (!"COMPLETED".equals(c.getStatus()) && !"REVIEWED".equals(c.getStatus())) {
                        c.setStatus("REVIEWED");
                        caseRepository.save(c);
                    }
                });
            }

            return ResponseEntity.ok(updated);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
