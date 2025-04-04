package com.cognitiex.school.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cognitiex.school.models.ShopAddresses;

public interface ShopAddressRepository extends JpaRepository<ShopAddresses, Long> {
    
    // Méthode pour récupérer les adresses de magasin par ID utilisateur
    List<ShopAddresses> findByUserId(Long userId);
}