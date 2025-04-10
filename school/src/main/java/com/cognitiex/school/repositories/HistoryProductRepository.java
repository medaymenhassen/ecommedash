package com.cognitiex.school.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.cognitiex.school.models.HistoryProduct;
import com.cognitiex.school.models.Product;

@Repository
public interface HistoryProductRepository extends JpaRepository<HistoryProduct, Long> {

    @Query("SELECT hp FROM HistoryProduct hp WHERE hp.supply.id = :supplyId")
    List<HistoryProduct> findBySupplyId(@Param("supplyId") Long supplyId);
}
