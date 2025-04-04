package com.cognitiex.school.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cognitiex.school.models.Length;

public interface LengthRepository extends JpaRepository<Length, Long> {
    // JpaRepository fournit déjà les méthodes de base comme save(), findById(), findAll(), deleteById()
}
