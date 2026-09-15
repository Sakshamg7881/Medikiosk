package com.medikiosk.repository;

import com.medikiosk.model.Clinic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClinicRepository extends JpaRepository<Clinic, Long> {
    Optional<Clinic> findByName(String name);
    Optional<Clinic> findByPhone(String phone);
    boolean existsByPhone(String phone);
}
