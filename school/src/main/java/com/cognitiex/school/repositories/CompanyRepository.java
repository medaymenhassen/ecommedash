package com.cognitiex.school.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cognitiex.school.models.Company;


@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByName(String name);
    Optional<Company> findByAccessToken(String token);
    /*
    @Query("SELECT c FROM Company c JOIN c.usersWithAccess u WHERE u.id = :userId")
    List<Company> findByUsersWithAccessId(@Param("userId") Long userId);*/
}
