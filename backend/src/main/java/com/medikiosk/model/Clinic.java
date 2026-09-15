package com.medikiosk.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "clinics")
public class Clinic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    private String type;
    private String adminName;

    @Column(unique = true)
    private String phone;

    private String email;
    private String address;
    private String city;
    private String gstin;
    private String licenseNo;
    private String ayushSpecialization;
    private String plan;
    private String subscriptionPlan;
    private String subscriptionStatus;
    private String subscriptionStartDate;
    private String subscriptionEndDate;

    // MVP Demo Authentication password
    private String password;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Clinic() {}

    public Clinic(String name, String type, String adminName, String phone, String email, 
                  String address, String city, String gstin, String licenseNo, 
                  String ayushSpecialization, String plan) {
        this.name = name;
        this.type = type;
        this.adminName = adminName;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.city = city;
        this.gstin = gstin;
        this.licenseNo = licenseNo;
        this.ayushSpecialization = ayushSpecialization;
        this.plan = plan;
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
        if (this.type == null) {
            this.type = "Private AYUSH Clinic";
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    // Alias for clinicName
    public String getClinicName() {
        return name;
    }

    public void setClinicName(String clinicName) {
        if (clinicName != null && !clinicName.isBlank()) {
            this.name = clinicName;
        }
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getAdminName() {
        return adminName;
    }

    public void setAdminName(String adminName) {
        this.adminName = adminName;
    }

    // Alias for ownerName
    public String getOwnerName() {
        return adminName;
    }

    public void setOwnerName(String ownerName) {
        if (ownerName != null && !ownerName.isBlank()) {
            this.adminName = ownerName;
        }
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getGstin() {
        return gstin;
    }

    public void setGstin(String gstin) {
        this.gstin = gstin;
    }

    public String getLicenseNo() {
        return licenseNo;
    }

    public void setLicenseNo(String licenseNo) {
        this.licenseNo = licenseNo;
    }

    public String getAyushSpecialization() {
        return ayushSpecialization;
    }

    public void setAyushSpecialization(String ayushSpecialization) {
        this.ayushSpecialization = ayushSpecialization;
    }

    public String getPlan() {
        return plan != null ? plan : subscriptionPlan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
        if (this.subscriptionPlan == null) {
            this.subscriptionPlan = plan;
        }
    }

    public String getSubscriptionPlan() {
        return subscriptionPlan != null ? subscriptionPlan : plan;
    }

    public void setSubscriptionPlan(String subscriptionPlan) {
        this.subscriptionPlan = subscriptionPlan;
        if (this.plan == null) {
            this.plan = subscriptionPlan;
        }
    }

    public String getSubscriptionStatus() {
        return subscriptionStatus;
    }

    public void setSubscriptionStatus(String subscriptionStatus) {
        this.subscriptionStatus = subscriptionStatus;
    }

    public String getSubscriptionStartDate() {
        return subscriptionStartDate;
    }

    public void setSubscriptionStartDate(String subscriptionStartDate) {
        this.subscriptionStartDate = subscriptionStartDate;
    }

    public String getSubscriptionEndDate() {
        return subscriptionEndDate;
    }

    public void setSubscriptionEndDate(String subscriptionEndDate) {
        this.subscriptionEndDate = subscriptionEndDate;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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
