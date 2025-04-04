package com.cognitiex.school.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cognitiex.school.models.Product;
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Product findBySlug(String slug);
    List<Product> findByUserId(Long userId);
}