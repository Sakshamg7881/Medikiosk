package com.medikiosk.config;

import com.medikiosk.model.Appointment;
import com.medikiosk.model.Case;
import com.medikiosk.model.Clinic;
import com.medikiosk.model.Doctor;
import com.medikiosk.repository.AppointmentRepository;
import com.medikiosk.repository.CaseRepository;
import com.medikiosk.repository.ClinicRepository;
import com.medikiosk.repository.DoctorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final ClinicRepository clinicRepository;
    private final DoctorRepository doctorRepository;
    private final CaseRepository caseRepository;
    private final AppointmentRepository appointmentRepository;
    private final com.medikiosk.repository.PatientRepository patientRepository;

    public DataInitializer(ClinicRepository clinicRepository,
                           DoctorRepository doctorRepository,
                           CaseRepository caseRepository,
                           AppointmentRepository appointmentRepository,
                           com.medikiosk.repository.PatientRepository patientRepository) {
        this.clinicRepository = clinicRepository;
        this.doctorRepository = doctorRepository;
        this.caseRepository = caseRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
    }

    @Override
    public void run(String... args) {
        try {
            seedDemoClinicAndDoctor();
        } catch (Exception e) {
            logger.warn("DataInitializer warning: {}", e.getMessage());
        }
    }

    private void seedDemoClinicAndDoctor() {
        Clinic clinic;
        if (clinicRepository.findByPhone("9876543210").isEmpty()) {
            clinic = new Clinic();
            clinic.setName("Aarogyam AYUSH Care");
            clinic.setAdminName("Dr. Ramesh Sharma");
            clinic.setPhone("9876543210");
            clinic.setPassword("clinic123");
            clinic.setEmail("admin@aarogyam.in");
            clinic.setAddress("12 Health Park, Ring Road");
            clinic.setCity("New Delhi");
            clinic.setAyushSpecialization("Ayurveda & Panchakarma");
            clinic.setType("Private AYUSH Clinic");
            clinic = clinicRepository.save(clinic);
            logger.info("Seeded Demo Clinic: ID #{} Phone {}", clinic.getId(), clinic.getPhone());
        } else {
            clinic = clinicRepository.findByPhone("9876543210").get();
        }

        Doctor doctor;
        if (doctorRepository.findByPhone("9876500001").isEmpty()) {
            doctor = new Doctor();
            doctor.setClinicId(clinic.getId());
            doctor.setName("Dr. Ananya Iyer");
            doctor.setPhone("9876500001");
            doctor.setPassword("doc123");
            doctor.setQualification("BAMS, MD (Ayurveda)");
            doctor.setSpeciality("Kayachikitsa (Internal Medicine)");
            doctor.setRegistrationNumber("AY-ND-4491");
            doctor.setExperience("8 Years Experience");
            doctor.setConsultationFee("500");
            doctor.setAvailability("Mon - Sat (10:00 AM - 04:00 PM)");
            doctor.setActive(true);
            doctor = doctorRepository.save(doctor);
            logger.info("Seeded Demo Doctor: ID #{} Phone {}", doctor.getId(), doctor.getPhone());
        } else {
            doctor = doctorRepository.findByPhone("9876500001").get();
        }

        // If no cases exist in database, seed initial demo clinical cases
        if (caseRepository.count() == 0) {
            com.medikiosk.model.Patient p1 = new com.medikiosk.model.Patient("Ramesh Gupta", 52, "Male", "9812345678", "hi");
            p1 = patientRepository.save(p1);

            Case c1 = new Case();
            c1.setPatientId(p1.getId());
            c1.setClinicId(clinic.getId());
            c1.setDoctorId(doctor.getId());
            c1.setChiefComplaint("Persistent knee joint stiffness and morning swelling");
            c1.setHpi("Onset 4 weeks ago, aggravated in cold weather. Difficulty climbing stairs.");
            c1.setAssociatedSymptoms("Mild fatigue, mild constipation");
            c1.setAyushData("{\"agni\":\"Tikshnagni\",\"nidra\":\"Disturbed\",\"mala\":\"Vibandha (Constipation)\"}");
            c1.setPrakritiResult("{\"dominantTendency\":\"Vata-Kapha\",\"scores\":{\"vata\":5,\"pitta\":2,\"kapha\":4}}");
            c1.setAiSummary("52yo Male presenting with 4-week bilateral knee joint stiffness. Clinical indicators suggest Sandhigata Vata (osteoarthritis/Vata accumulation). Digestion shows Tikshnagni with mild constipation.");
            c1.setStatus("READY_FOR_REVIEW");
            c1.setRedFlagDetected(false);
            caseRepository.save(c1);

            com.medikiosk.model.Patient p2 = new com.medikiosk.model.Patient("Sunita Rao", 36, "Female", "9876543210", "en");
            p2 = patientRepository.save(p2);

            Case c2 = new Case();
            c2.setPatientId(p2.getId());
            c2.setClinicId(clinic.getId());
            c2.setDoctorId(doctor.getId());
            c2.setChiefComplaint("Chronic retrosternal burning sensation and acid reflux");
            c2.setHpi("Symptoms worsen after spicy or late-night meals. Recurring for 3 months.");
            c2.setAssociatedSymptoms("Sour belching, nausea");
            c2.setAyushData("{\"agni\":\"Tikshnagni\",\"nidra\":\"Normal\",\"mala\":\"Regular\"}");
            c2.setPrakritiResult("{\"dominantTendency\":\"Pitta-Kapha\",\"scores\":{\"vata\":2,\"pitta\":6,\"kapha\":3}}");
            c2.setAiSummary("36yo Female with 3-month history of postprandial retrosternal burning and sour belching. Features consistent with Amlapitta (acid peptic disorder) with Pitta dominance.");
            c2.setStatus("READY_FOR_REVIEW");
            c2.setRedFlagDetected(false);
            caseRepository.save(c2);

            Appointment appt = new Appointment();
            appt.setCaseId(c1.getId());
            appt.setPatientId(p1.getId());
            appt.setDoctorId(doctor.getId());
            appt.setClinicId(String.valueOf(clinic.getId()));
            appt.setDate("Today");
            appt.setTime("10:30 AM");
            appt.setConsultationType("First Consultation");
            appt.setStatus("CONFIRMED");
            appt.setConsultationToken("TK-01");
            appt.setPatientName(p1.getName());
            appt.setDoctorName(doctor.getName());
            appt.setClinicName(clinic.getName());
            appointmentRepository.save(appt);

            logger.info("Seeded 2 demo cases and 1 appointment for Demo Clinic and Doctor");
        } else {
            // Link existing test cases to demo clinic and doctor if not yet linked
            List<Case> cases = caseRepository.findAll();
            for (Case c : cases) {
                if (c.getClinicId() == null) {
                    c.setClinicId(clinic.getId());
                }
                if (c.getDoctorId() == null) {
                    c.setDoctorId(doctor.getId());
                }
                caseRepository.save(c);
            }

            // Link existing appointments to demo clinic and doctor
            List<Appointment> appointments = appointmentRepository.findAll();
            for (Appointment a : appointments) {
                if (a.getClinicId() == null || "c1".equals(a.getClinicId())) {
                    a.setClinicId(String.valueOf(clinic.getId()));
                }
                if (a.getDoctorId() == null || a.getDoctorId() == 101L) {
                    a.setDoctorId(doctor.getId());
                    a.setDoctorName(doctor.getName());
                }
                appointmentRepository.save(a);
            }
        }
    }
}
