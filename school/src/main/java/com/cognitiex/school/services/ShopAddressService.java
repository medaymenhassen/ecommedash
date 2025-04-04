package com.cognitiex.school.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cognitiex.school.models.ShopAddresses;
import com.cognitiex.school.repositories.ShopAddressRepository;

@Service
public class ShopAddressService {
    @Autowired
    private ShopAddressRepository shopAddressRepository;
    // Méthode pour créer ou mettre à jour une adresse de magasin
    public ShopAddresses saveShopAddress(ShopAddresses shopAddress) {
        return shopAddressRepository.save(shopAddress);
    }

    // Méthode pour récupérer une adresse de magasin par ID
    public ShopAddresses getShopAddressById(Long id) {
        Optional<ShopAddresses> optionalShopAddress = shopAddressRepository.findById(id);
        return optionalShopAddress.orElse(null); // Renvoie null si non trouvé
    }

    // Méthode pour récupérer toutes les adresses de magasin d'un utilisateur
    public List<ShopAddresses> getShopAddressesByUserId(Long userId) {
        return shopAddressRepository.findByUserId(userId);
    }

    // Méthode pour supprimer une adresse de magasin
    public boolean deleteShopAddress(Long id) {
        if (shopAddressRepository.existsById(id)) {
            shopAddressRepository.deleteById(id);
            return true;
        }
        return false; // Renvoie false si l'adresse de magasin n'existe pas
    }

}
