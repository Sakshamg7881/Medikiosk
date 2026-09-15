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
import com.medikiosk.service.RedFlagService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/clinics")
public class ClinicController {

    private static final Logger logger = LoggerFactory.getLogger(ClinicController.class);

    private final ClinicRepository clinicRepository;
    private final DoctorRepository doctorRepository;
    private final CaseRepository caseRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final RedFlagService redFlagService;
    private final ObjectMapper objectMapper;

    public ClinicController(ClinicRepository clinicRepository,
                            DoctorRepository doctorRepository,
                            CaseRepository caseRepository,
                            AppointmentRepository appointmentRepository,
                            PatientRepository patientRepository,
                            RedFlagService redFlagService,
                            ObjectMapper objectMapper) {
        this.clinicRepository = clinicRepository;
        this.doctorRepository = doctorRepository;
        this.caseRepository = caseRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.redFlagService = redFlagService;
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
     * POST /api/clinics
     * Register a new clinic. Phone number is unique login ID.
     */
    @PostMapping
    public ResponseEntity<?> registerClinic(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        if (name == null || name.isBlank()) {
            name = payload.get("clinicName");
        }
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Clinic name is required."));
        }

        String rawPhone = payload.get("phone");
        String phone = cleanPhone(rawPhone);
        if (phone.length() != 10) {
            return ResponseEntity.badRequest().body(Map.of("error", "A valid 10-digit phone number is required."));
        }

        String password = payload.get("password");
        if (password == null || password.trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters."));
        }

        String confirmPassword = payload.get("confirmPassword");
        if (confirmPassword != null && !confirmPassword.equals(password)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Passwords do not match."));
        }

        if (clinicRepository.existsByPhone(phone)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "A clinic is already registered with this phone number."));
        }

        Clinic clinic = new Clinic();
        clinic.setName(name.trim());
        clinic.setPhone(phone);
        clinic.setPassword(password);

        String adminName = payload.get("adminName");
        if (adminName == null || adminName.isBlank()) {
            adminName = payload.get("ownerName");
        }
        clinic.setAdminName(adminName != null ? adminName.trim() : "Clinic Administrator");

        clinic.setEmail(payload.get("email") != null ? payload.get("email").trim() : "");
        clinic.setAddress(payload.get("address") != null ? payload.get("address").trim() : "");
        clinic.setCity(payload.get("city") != null ? payload.get("city").trim() : "");
        clinic.setAyushSpecialization(payload.get("ayushSpecialization") != null 
                ? payload.get("ayushSpecialization").trim() : "Ayurveda");
        clinic.setType("Private AYUSH Clinic");

        String subPlan = payload.get("subscriptionPlan");
        if (subPlan == null || subPlan.isBlank()) {
            subPlan = payload.get("plan");
        }
        if (subPlan == null || subPlan.isBlank()) {
            subPlan = "Professional";
        }
        clinic.setSubscriptionPlan(subPlan);
        clinic.setPlan(subPlan);

        String subStatus = payload.getOrDefault("subscriptionStatus", "Active (Demo)");
        clinic.setSubscriptionStatus(subStatus);

        String subStart = payload.getOrDefault("subscriptionStartDate", java.time.LocalDate.now().toString());
        clinic.setSubscriptionStartDate(subStart);

        String subEnd = payload.getOrDefault("subscriptionEndDate", java.time.LocalDate.now().plusMonths(1).toString());
        clinic.setSubscriptionEndDate(subEnd);

        Clinic saved = clinicRepository.save(clinic);
        logger.info("Clinic registered successfully with ID #{} and Phone {}", saved.getId(), saved.getPhone());

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * POST /api/clinics/login
     * Clinic login with Phone Number + Password (Demo Auth).
     */
    @PostMapping("/login")
    public ResponseEntity<?> loginClinic(@RequestBody Map<String, String> credentials) {
        String phone = cleanPhone(credentials.get("phone"));
        String password = credentials.get("password");

        if (phone.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please enter your registered phone number."));
        }
        if (password == null || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please enter your password."));
        }

        Optional<Clinic> clinicOpt = clinicRepository.findByPhone(phone);
        if (clinicOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No clinic found with this phone number. Please register first."));
        }

        Clinic clinic = clinicOpt.get();
        if (!password.equals(clinic.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Incorrect password. Please try again."));
        }

        Map<String, Object> session = new LinkedHashMap<>();
        session.put("id", clinic.getId());
        session.put("name", clinic.getName());
        session.put("clinicName", clinic.getName());
        session.put("adminName", clinic.getAdminName());
        session.put("phone", clinic.getPhone());
        session.put("email", clinic.getEmail());
        session.put("address", clinic.getAddress());
        session.put("city", clinic.getCity());
        session.put("ayushSpecialization", clinic.getAyushSpecialization());
        session.put("type", clinic.getType());
        session.put("isDemoAuth", true);

        return ResponseEntity.ok(session);
    }

    /**
     * GET /api/clinics/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getClinic(@PathVariable Long id) {
        return clinicRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));
    }

    /**
     * PUT /api/clinics/{id}
     * Update clinic profile.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateClinic(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Optional<Clinic> clinicOpt = clinicRepository.findById(id);
        if (clinicOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Clinic not found with ID: " + id));
        }

        Clinic clinic = clinicOpt.get();
        if (payload.containsKey("name") && !payload.get("name").isBlank()) {
            clinic.setName(payload.get("name").trim());
        } else if (payload.containsKey("clinicName") && !payload.get("clinicName").isBlank()) {
            clinic.setName(payload.get("clinicName").trim());
        }

        if (payload.containsKey("adminName") && !payload.get("adminName").isBlank()) {
            clinic.setAdminName(payload.get("adminName").trim());
        } else if (payload.containsKey("ownerName") && !payload.get("ownerName").isBlank()) {
            clinic.setAdminName(payload.get("ownerName").trim());
        }

        if (payload.containsKey("email")) clinic.setEmail(payload.get("email").trim());
        if (payload.containsKey("address")) clinic.setAddress(payload.get("address").trim());
        if (payload.containsKey("city")) clinic.setCity(payload.get("city").trim());
        if (payload.containsKey("ayushSpecialization")) clinic.setAyushSpecialization(payload.get("ayushSpecialization").trim());

        Clinic updated = clinicRepository.save(clinic);
        return ResponseEntity.ok(updated);
    }

    /**
     * POST /api/clinics/{clinicId}/doctors
     * Add doctor account under this clinic.
     */
    @PostMapping("/{clinicId}/doctors")
    public ResponseEntity<?> addDoctor(@PathVariable Long clinicId, @RequestBody Map<String, String> payload) {
        Optional<Clinic> clinicOpt = clinicRepository.findById(clinicId);
        if (clinicOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Clinic not found with ID: " + clinicId));
        }

        String name = payload.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Doctor name is required."));
        }

        String phone = cleanPhone(payload.get("phone"));
        if (phone.length() != 10) {
            return ResponseEntity.badRequest().body(Map.of("error", "Doctor phone must be a valid 10-digit number."));
        }

        if (doctorRepository.existsByPhone(phone)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "A doctor with this phone number already exists."));
        }

        String password = payload.get("password");
        if (password == null || password.isBlank()) {
            password = "doc123"; // Default initial password
        }

        Doctor doc = new Doctor();
        doc.setClinicId(clinicId);
        doc.setName(name.trim());
        doc.setPhone(phone);
        doc.setPassword(password.trim());
        doc.setQualification(payload.getOrDefault("qualification", "BAMS, MD"));
        
        String spec = payload.get("speciality");
        if (spec == null || spec.isBlank()) spec = payload.get("specialization");
        if (spec == null || spec.isBlank()) spec = "General AYUSH Consultation";
        doc.setSpeciality(spec);

        doc.setRegistrationNumber(payload.getOrDefault("registrationNumber", "AY-" + phone.substring(5)));
        doc.setExperience(payload.getOrDefault("experience", "5+ Years Experience"));
        doc.setConsultationFee(payload.getOrDefault("consultationFee", "500"));
        doc.setAvailability(payload.getOrDefault("availability", "Mon - Sat (10:00 AM - 04:00 PM)"));
        doc.setActive(true);

        Doctor saved = doctorRepository.save(doc);
        logger.info("Doctor account #{} created under Clinic #{}", saved.getId(), clinicId);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * GET /api/clinics/{clinicId}/doctors
     * Get doctors strictly scoped to clinicId.
     */
    @GetMapping("/{clinicId}/doctors")
    public ResponseEntity<List<Doctor>> getClinicDoctors(@PathVariable Long clinicId) {
        List<Doctor> docs = doctorRepository.findByClinicIdOrderByIdDesc(clinicId);
        return ResponseEntity.ok(docs);
    }

    /**
     * GET /api/clinics/{clinicId}/cases
     * Get cases strictly scoped to clinicId.
     */
    @GetMapping("/{clinicId}/cases")
    public ResponseEntity<List<DoctorCaseItemDto>> getClinicCases(@PathVariable Long clinicId) {
        List<Case> cases = caseRepository.findByClinicIdOrderByIdDesc(clinicId);
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
     * GET /api/clinics/{clinicId}/appointments
     * Get appointments strictly scoped to clinicId.
     */
    @GetMapping("/{clinicId}/appointments")
    public ResponseEntity<List<Appointment>> getClinicAppointments(@PathVariable Long clinicId) {
        List<Appointment> appts = appointmentRepository.findByClinicIdOrderByIdDesc(String.valueOf(clinicId));
        // Also check with "c" prefix (e.g. "c1") if clinicId == 1
        if (appts.isEmpty() && clinicId == 1L) {
            appts = appointmentRepository.findByClinicIdOrderByIdDesc("c1");
        }
        return ResponseEntity.ok(appts);
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
