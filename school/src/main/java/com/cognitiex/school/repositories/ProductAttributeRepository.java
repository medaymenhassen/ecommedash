package com.cognitiex.school.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cognitiex.school.models.Product;
import com.cognitiex.school.models.ProductAttribute;

public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, Long>{

    List<ProductAttribute> findByUserId(Long userId);
    List<ProductAttribute> findByProduct(Product product);

}