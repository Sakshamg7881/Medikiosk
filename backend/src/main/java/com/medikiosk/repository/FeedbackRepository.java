package com.medikiosk.repository;

import com.medikiosk.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByCaseId(Long caseId);
    List<Feedback> findByDoctorId(Long doctorId);
    List<Feedback> findByPatientId(Long patientId);
}
