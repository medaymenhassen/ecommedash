package com.cognitiex.school.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cognitiex.school.models.Color;

@Repository
public interface ColorRepository extends JpaRepository<Color, Long> {
    boolean existsByColorCodeAndMission(String colorCode, String mission);

}

