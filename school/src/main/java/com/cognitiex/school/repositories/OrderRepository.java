package com.cognitiex.school.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cognitiex.school.models.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {
    // Ajoute des méthodes personnalisées si nécessaire
}