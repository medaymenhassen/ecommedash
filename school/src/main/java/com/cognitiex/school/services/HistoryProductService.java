package com.cognitiex.school.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cognitiex.school.models.HistoryProduct;
import com.cognitiex.school.repositories.HistoryProductRepository;

@Service
public class HistoryProductService {
	 @Autowired
	 private HistoryProductRepository historyproductRepository;
 
	 public List<HistoryProduct> getBySupplyId(Long supplyId) {
	        return historyproductRepository.findBySupplyId(supplyId);
	    }
}
