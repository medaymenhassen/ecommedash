package com.cognitiex.school.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cognitiex.school.models.Supply;

public interface SupplyRepository extends JpaRepository<Supply, Long> {
	@Query("SELECT s FROM Supply s JOIN s.companies c WHERE c.id = :companyId")
    List<Supply> findByCompanyId(@Param("companyId") Long companyId);
	
}