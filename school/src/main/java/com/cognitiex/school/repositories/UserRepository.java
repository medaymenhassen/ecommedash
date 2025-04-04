package com.cognitiex.school.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cognitiex.school.models.Company;
import com.cognitiex.school.models.User;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
    List<User> findByWorkCompaniesContains(Company company);

}