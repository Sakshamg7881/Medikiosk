package com.medikiosk.repository;

import com.medikiosk.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findAllByOrderByIdDesc();

    List<Appointment> findByPatientIdOrderByIdDesc(Long patientId);

    List<Appointment> findByDoctorIdOrderByIdDesc(Long doctorId);

    List<Appointment> findByClinicIdOrderByIdDesc(String clinicId);

    List<Appointment> findByClinicId(String clinicId);

    Optional<Appointment> findByCaseId(Long caseId);
}
