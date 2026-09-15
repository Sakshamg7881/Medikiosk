package com.medikiosk.repository;

import com.medikiosk.model.Case;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaseRepository extends JpaRepository<Case, Long> {
    List<Case> findByPatientId(Long patientId);
    List<Case> findByPatientIdOrderByIdDesc(Long patientId);
    Optional<Case> findFirstByPatientIdAndStatusNotOrderByIdDesc(Long patientId, String status);
    List<Case> findByClinicId(Long clinicId);
    List<Case> findByClinicIdOrderByIdDesc(Long clinicId);
    List<Case> findByDoctorId(Long doctorId);
    List<Case> findByDoctorIdOrderByIdDesc(Long doctorId);
    List<Case> findByClinicIdAndDoctorIdOrderByIdDesc(Long clinicId, Long doctorId);
    List<Case> findByClinicIdAndStatus(Long clinicId, String status);
    List<Case> findAllByOrderByIdDesc();
}
