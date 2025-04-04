package com.cognitiex.school.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cognitiex.school.models.CustomerOrder;

public interface CustomerOrderRepositiory extends JpaRepository<CustomerOrder, Long> {
    
    // Méthode pour récupérer les adresses de magasin par ID utilisateur
    List<CustomerOrder> findByUserId(Long userId);
}