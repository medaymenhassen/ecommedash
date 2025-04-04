package com.cognitiex.school.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cognitiex.school.models.CartOrderItems;
import com.cognitiex.school.repositories.CartOrderItemsRepository;

@Service
public class CartOrderItemsService {

    @Autowired
    private CartOrderItemsRepository cartOrderItemsRepository;

    // Créer un nouvel élément de commande
    public CartOrderItems createCartOrderItem(CartOrderItems item) {
        return cartOrderItemsRepository.save(item);
    }

    // Autres méthodes si nécessaire
}