package com.medikiosk.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clinic_id")
    private Long clinicId;

    @NotBlank
    @Column(nullable = false)
    private String name;

    private String phone;
    private String contact; // Backward compatibility alias

    private String password;
    private String tempPasswordHash; // Backward compatibility alias

    private String qualification;
    private String speciality;
    private String specialization; // Backward compatibility alias

    private String registrationNumber;
    private String experience;
    private String consultationFee;
    private String availability;
    private Boolean active = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Doctor() {}

    public Doctor(Long clinicId, String name, String specialization, String contact, String tempPasswordHash) {
        this.clinicId = clinicId;
        this.name = name;
        this.specialization = specialization;
        this.speciality = specialization;
        this.contact = contact;
        this.phone = contact;
        this.tempPasswordHash = tempPasswordHash;
        this.password = tempPasswordHash;
        this.active = true;
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
        if (this.active == null) {
            this.active = true;
        }
        if (this.phone == null && this.contact != null) {
            this.phone = this.contact;
        }
        if (this.contact == null && this.phone != null) {
            this.contact = this.phone;
        }
        if (this.speciality == null && this.specialization != null) {
            this.speciality = this.specialization;
        }
        if (this.specialization == null && this.speciality != null) {
            this.specialization = this.speciality;
        }
        if (this.password == null && this.tempPasswordHash != null) {
            this.password = this.tempPasswordHash;
        }
        if (this.tempPasswordHash == null && this.password != null) {
            this.tempPasswordHash = this.password;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getClinicId() {
        return clinicId;
    }

    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone != null ? phone : contact;
    }

    public void setPhone(String phone) {
        this.phone = phone;
        this.contact = phone;
    }

    public String getContact() {
        return contact != null ? contact : phone;
    }

    public void setContact(String contact) {
        this.contact = contact;
        this.phone = contact;
    }

    public String getPassword() {
        return password != null ? password : tempPasswordHash;
    }

    public void setPassword(String password) {
        this.password = password;
        this.tempPasswordHash = password;
    }

    public String getTempPasswordHash() {
        return tempPasswordHash != null ? tempPasswordHash : password;
    }

    public void setTempPasswordHash(String tempPasswordHash) {
        this.tempPasswordHash = tempPasswordHash;
        this.password = tempPasswordHash;
    }

    public String getQualification() {
        return qualification;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public String getSpeciality() {
        return speciality != null ? speciality : specialization;
    }

    public void setSpeciality(String speciality) {
        this.speciality = speciality;
        this.specialization = speciality;
    }

    public String getSpecialization() {
        return specialization != null ? specialization : speciality;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
        this.speciality = specialization;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public String getConsultationFee() {
        return consultationFee;
    }

    public void setConsultationFee(String consultationFee) {
        this.consultationFee = consultationFee;
    }

    public String getAvailability() {
        return availability;
    }

    public void setAvailability(String availability) {
        this.availability = availability;
    }

    public Boolean getActive() {
        return active != null ? active : true;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
