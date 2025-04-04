package com.cognitiex.school.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.cognitiex.school.models.Supply;

public interface SupplyRepository extends JpaRepository<Supply, Long> {
}