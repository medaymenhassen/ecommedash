package com.cognitiex.school.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cognitiex.school.models.Product;
import com.cognitiex.school.models.ProductAttribute;
import com.cognitiex.school.repositories.ProductAttributeRepository;

@Service
public class ProductAttributeService {

    @Autowired
    private ProductAttributeRepository productAttributeRepository;

    // Créer un nouveau ProductAttribute
    public ProductAttribute createProductAttribute(ProductAttribute productAttribute) {
        return productAttributeRepository.save(productAttribute);
    }

    // Récupérer un ProductAttribute par ID
    public Optional<ProductAttribute> getProductAttributeById(Long id) {
        return productAttributeRepository.findById(id);
    }

    // Mettre à jour un ProductAttribute existant
    public ProductAttribute updateProductAttribute(ProductAttribute productAttribute) {
        return productAttributeRepository.save(productAttribute); // Save fait un insert/update
    }

    // Supprimer un ProductAttribute par ID
    public void deleteProductAttributeById(Long id) {
        productAttributeRepository.deleteById(id);
    }

    // Lister tous les attributs
    public List<ProductAttribute> getAllProductAttribute() {
        return productAttributeRepository.findAll();
    }
    
    public List<ProductAttribute> getproductattributeByUserId(Long userId) {
        return productAttributeRepository.findByUserId(userId);
    }
    
    public List<ProductAttribute> getAttributesByProduct(Product product) {
        return productAttributeRepository.findByProduct(product);
    }
}
