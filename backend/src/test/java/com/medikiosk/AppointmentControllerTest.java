package com.medikiosk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medikiosk.dto.AppointmentRequest;
import com.medikiosk.model.Appointment;
import com.medikiosk.model.Case;
import com.medikiosk.repository.AppointmentRepository;
import com.medikiosk.repository.CaseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
public class AppointmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private CaseRepository caseRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setUp() {
        appointmentRepository.deleteAll();
    }

    @Test
    public void testCreateAndGetAppointment() throws Exception {
        AppointmentRequest req = new AppointmentRequest();
        req.setCaseId(10L);
        req.setPatientId(5L);
        req.setDoctorId(101L);
        req.setClinicId("c1");
        req.setDate("2026-09-15");
        req.setTime("11:00 AM");
        req.setConsultationType("First Consultation");
        req.setPatientName("Aarav Sharma");
        req.setDoctorName("Dr. Rajesh Vaidya");
        req.setClinicName("Ayush Arogya Kendra");

        String resJson = mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.consultationToken").value("TK-10"))
                .andExpect(jsonPath("$.patientName").value("Aarav Sharma"))
                .andReturn().getResponse().getContentAsString();

        Appointment created = objectMapper.readValue(resJson, Appointment.class);

        // Fetch by ID
        mockMvc.perform(get("/api/appointments/" + created.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(created.getId()))
                .andExpect(jsonPath("$.doctorName").value("Dr. Rajesh Vaidya"));

        // Fetch list
        mockMvc.perform(get("/api/appointments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(created.getId()));
    }

    @Test
    public void testUpdateAppointmentStatusToCompleted() throws Exception {
        Appointment appt = new Appointment();
        appt.setCaseId(20L);
        appt.setPatientId(8L);
        appt.setDoctorId(102L);
        appt.setClinicId("c2");
        appt.setDate("2026-09-16");
        appt.setTime("04:30 PM");
        appt.setConsultationType("Follow-up");
        appt.setStatus("CONFIRMED");
        appt.setPatientName("Pooja Patel");
        appt.setDoctorName("Dr. Sunita Deshmukh");
        appt.setClinicName("Patanjali Chikitsalaya");
        appt = appointmentRepository.save(appt);

        // Update status to COMPLETED
        mockMvc.perform(put("/api/appointments/" + appt.getId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "COMPLETED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(appt.getId()))
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        Appointment updated = appointmentRepository.findById(appt.getId()).orElseThrow();
        assertEquals("COMPLETED", updated.getStatus());
    }

    @Test
    public void testDoctorAndPatientQueries() throws Exception {
        Appointment appt = new Appointment();
        appt.setCaseId(30L);
        appt.setPatientId(99L);
        appt.setDoctorId(501L);
        appt.setStatus("CONFIRMED");
        appointmentRepository.save(appt);

        mockMvc.perform(get("/api/appointments/doctor/501"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].doctorId").value(501));

        mockMvc.perform(get("/api/appointments/patient/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].patientId").value(99));
    }
}
