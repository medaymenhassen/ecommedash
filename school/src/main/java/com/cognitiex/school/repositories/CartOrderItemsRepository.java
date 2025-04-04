package com.cognitiex.school.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cognitiex.school.models.CartOrderItems;

public interface CartOrderItemsRepository extends JpaRepository<CartOrderItems, Long> {
    // Ajoute des méthodes personnalisées si nécessaire
}