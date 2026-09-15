package com.medikiosk.repository;

import com.medikiosk.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findByClinicId(Long clinicId);
    List<Doctor> findByClinicIdOrderByIdDesc(Long clinicId);
    Optional<Doctor> findByPhone(String phone);
    boolean existsByPhone(String phone);
    Optional<Doctor> findByPhoneAndClinicId(String phone, Long clinicId);
}
