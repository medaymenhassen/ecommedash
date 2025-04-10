package com.cognitiex.school.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cognitiex.school.models.Company;
import com.cognitiex.school.models.Product;
import com.cognitiex.school.models.Supply;


@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByName(String name);
    Optional<Company> findByAccessToken(String token);
    /*
    @Query("SELECT c FROM Company c JOIN c.usersWithAccess u WHERE u.id = :userId")
    List<Company> findByUsersWithAccessId(@Param("userId") Long userId);*/

    @Query("SELECT s FROM Supply s JOIN FETCH s.companies c WHERE c.id = :companyId")
	List<Supply> findAllByCompanyIdWithCompanies(@Param("companyId") Long companyId);
    
    @Query("SELECT c FROM Supply s JOIN s.companies c WHERE s.id = :supplyId")
    List<Company> findBySupplyId(@Param("supplyId") Long supplyId);

}
