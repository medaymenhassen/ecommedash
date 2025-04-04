package com.cognitiex.school.services;

import java.util.List;

import com.cognitiex.school.models.CustomerOrder;

public interface CustomerOrderService {

    // Créer une nouvelle commande client
    CustomerOrder createCustomerOrder(CustomerOrder customerOrder);

    // Récupérer une commande client par ID
    CustomerOrder getCustomerOrderById(Long id);

    // Récupérer toutes les commandes d'un utilisateur par son ID
    List<CustomerOrder> getOrdersByUserId(Long userId);

    // Mettre à jour une commande client existante
    CustomerOrder updateCustomerOrder(Long id, CustomerOrder updatedCustomerOrder);

    // Supprimer une commande client par ID
    void deleteCustomerOrder(Long id);
}
