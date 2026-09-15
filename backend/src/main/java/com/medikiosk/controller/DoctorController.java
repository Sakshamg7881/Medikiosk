package com.medikiosk.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medikiosk.dto.DoctorCaseItemDto;
import com.medikiosk.model.Appointment;
import com.medikiosk.model.Case;
import com.medikiosk.model.Clinic;
import com.medikiosk.model.Doctor;
import com.medikiosk.model.Patient;
import com.medikiosk.repository.AppointmentRepository;
import com.medikiosk.repository.CaseRepository;
import com.medikiosk.repository.ClinicRepository;
import com.medikiosk.repository.DoctorRepository;
import com.medikiosk.repository.PatientRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private static final Logger logger = LoggerFactory.getLogger(DoctorController.class);

    private final DoctorRepository doctorRepository;
    private final ClinicRepository clinicRepository;
    private final CaseRepository caseRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final ObjectMapper objectMapper;

    public DoctorController(DoctorRepository doctorRepository,
                            ClinicRepository clinicRepository,
                            CaseRepository caseRepository,
                            AppointmentRepository appointmentRepository,
                            PatientRepository patientRepository,
                            ObjectMapper objectMapper) {
        this.doctorRepository = doctorRepository;
        this.clinicRepository = clinicRepository;
        this.caseRepository = caseRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.objectMapper = objectMapper;
    }

    private String cleanPhone(String phone) {
        if (phone == null) return "";
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.length() > 10) {
            return digits.substring(digits.length() - 10);
        }
        return digits;
    }

    /**
     * POST /api/doctors/login
     * Doctor login with phone + password.
     */
    @PostMapping("/login")
    public ResponseEntity<?> loginDoctor(@RequestBody Map<String, String> credentials) {
        String phone = cleanPhone(credentials.get("phone"));
        String password = credentials.get("password");

        if (phone.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please enter your doctor phone number."));
        }
        if (password == null || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please enter your password."));
        }

        Optional<Doctor> doctorOpt = doctorRepository.findByPhone(phone);
        if (doctorOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No doctor account found with this phone number. Please contact your clinic administrator."));
        }

        Doctor doctor = doctorOpt.get();
        if (!password.equals(doctor.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Incorrect password. Please try again."));
        }

        if (Boolean.FALSE.equals(doctor.getActive())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "This doctor account has been deactivated by the clinic administrator."));
        }

        // Fetch clinic details for context
        String clinicName = "MediCare Clinic";
        if (doctor.getClinicId() != null) {
            clinicName = clinicRepository.findById(doctor.getClinicId())
                    .map(Clinic::getName)
                    .orElse("MediCare Clinic");
        }

        Map<String, Object> session = new LinkedHashMap<>();
        session.put("id", doctor.getId());
        session.put("doctorId", doctor.getId());
        session.put("name", doctor.getName());
        session.put("doctorName", doctor.getName());
        session.put("phone", doctor.getPhone());
        session.put("qualification", doctor.getQualification());
        session.put("speciality", doctor.getSpeciality());
        session.put("clinicId", doctor.getClinicId());
        session.put("clinicName", clinicName);
        session.put("experience", doctor.getExperience());
        session.put("consultationFee", doctor.getConsultationFee());
        session.put("active", doctor.getActive());
        session.put("isDemoAuth", true);

        logger.info("Doctor #{} ({}) logged in successfully under Clinic #{}", doctor.getId(), doctor.getName(), doctor.getClinicId());
        return ResponseEntity.ok(session);
    }

    /**
     * GET /api/doctors/{doctorId}
     */
    @GetMapping("/{doctorId}")
    public ResponseEntity<?> getDoctorProfile(@PathVariable Long doctorId) {
        return doctorRepository.findById(doctorId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));
    }

    /**
     * PUT /api/doctors/{doctorId}
     */
    @PutMapping("/{doctorId}")
    public ResponseEntity<?> updateDoctorProfile(@PathVariable Long doctorId, @RequestBody Map<String, String> payload) {
        Optional<Doctor> docOpt = doctorRepository.findById(doctorId);
        if (docOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Doctor not found with ID: " + doctorId));
        }

        Doctor doc = docOpt.get();
        if (payload.containsKey("name") && !payload.get("name").isBlank()) doc.setName(payload.get("name").trim());
        if (payload.containsKey("qualification")) doc.setQualification(payload.get("qualification").trim());
        if (payload.containsKey("speciality")) doc.setSpeciality(payload.get("speciality").trim());
        if (payload.containsKey("experience")) doc.setExperience(payload.get("experience").trim());
        if (payload.containsKey("consultationFee")) doc.setConsultationFee(payload.get("consultationFee").trim());
        if (payload.containsKey("availability")) doc.setAvailability(payload.get("availability").trim());

        Doctor updated = doctorRepository.save(doc);
        return ResponseEntity.ok(updated);
    }

    /**
     * GET /api/doctors/{doctorId}/cases
     * Cases assigned to this doctor, or cases belonging to the doctor's clinic queue.
     */
    @GetMapping("/{doctorId}/cases")
    public ResponseEntity<List<DoctorCaseItemDto>> getDoctorCases(@PathVariable Long doctorId) {
        Optional<Doctor> docOpt = doctorRepository.findById(doctorId);
        if (docOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.emptyList());
        }

        Doctor doc = docOpt.get();
        Long clinicId = doc.getClinicId();

        List<Case> cases;
        if (clinicId != null) {
            cases = caseRepository.findByClinicIdOrderByIdDesc(clinicId);
        } else {
            cases = caseRepository.findByDoctorIdOrderByIdDesc(doctorId);
        }

        List<DoctorCaseItemDto> dtoList = new ArrayList<>();
        Map<Long, Patient> patientCache = new HashMap<>();

        for (Case c : cases) {
            Patient p = null;
            if (c.getPatientId() != null) {
                p = patientCache.computeIfAbsent(c.getPatientId(), id -> patientRepository.findById(id).orElse(null));
            }

            List<String> redFlagTerms = parseStringList(c.getRedFlagDetails());
            boolean redFlagDetected = Boolean.TRUE.equals(c.getRedFlagDetected()) || !redFlagTerms.isEmpty();

            int docCount = parseListMaps(c.getDocuments()).size();

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
     * GET /api/doctors/{doctorId}/appointments
     * Appointments assigned to this doctor.
     */
    @GetMapping("/{doctorId}/appointments")
    public ResponseEntity<List<Appointment>> getDoctorAppointments(@PathVariable Long doctorId) {
        List<Appointment> appts = appointmentRepository.findByDoctorIdOrderByIdDesc(doctorId);
        return ResponseEntity.ok(appts);
    }

    /**
     * PATCH /api/doctors/{doctorId}/status
     * Toggle active / inactive status.
     */
    @PatchMapping("/{doctorId}/status")
    public ResponseEntity<?> toggleDoctorStatus(@PathVariable Long doctorId, @RequestBody Map<String, Object> payload) {
        Optional<Doctor> docOpt = doctorRepository.findById(doctorId);
        if (docOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Doctor not found with ID: " + doctorId));
        }

        Doctor doc = docOpt.get();
        if (payload.containsKey("active")) {
            doc.setActive(Boolean.valueOf(payload.get("active").toString()));
        } else {
            doc.setActive(!Boolean.TRUE.equals(doc.getActive()));
        }

        Doctor updated = doctorRepository.save(doc);
        return ResponseEntity.ok(updated);
    }

    private List<Map<String, Object>> parseListMaps(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
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
