package com.cognitiex.school.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.cognitiex.school.models.Product;
import com.cognitiex.school.models.Supply;
import com.cognitiex.school.models.User;
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    List<Product> findByUserId(Long userId);
    List<Product> findBySupplyId(Long supplyId);
    List<Product> findByUserIdAndTitle(Long userId, String title);
    Optional<Product> findByIdAndUserId(Long productId, Long userId);

}