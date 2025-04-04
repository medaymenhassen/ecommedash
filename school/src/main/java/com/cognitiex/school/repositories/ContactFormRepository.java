package com.cognitiex.school.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cognitiex.school.models.ContactFormEntity;

public interface ContactFormRepository extends JpaRepository<ContactFormEntity, Long> {
}