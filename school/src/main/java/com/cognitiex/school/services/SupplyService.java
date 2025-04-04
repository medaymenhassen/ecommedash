package com.cognitiex.school.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cognitiex.school.models.Company;
import com.cognitiex.school.models.CustomerOrder;
import com.cognitiex.school.models.Supply;
import com.cognitiex.school.repositories.CompanyRepository;
import com.cognitiex.school.repositories.CustomerOrderRepositiory;
import com.cognitiex.school.repositories.OrderRepository;
import com.cognitiex.school.repositories.SupplyRepository;

import jakarta.transaction.Transactional;

@Service
public class SupplyService {

    private final SupplyRepository supplyRepository;

    @Autowired
    public SupplyService(SupplyRepository supplyRepository) {
        this.supplyRepository = supplyRepository;
    }

    // Créer un nouveau Supply
    @Transactional
    public Supply createSupply(Supply supply) {
        return supplyRepository.save(supply);
    }

    // Mettre à jour un Supply existant
    @Transactional
    public Supply updateSupply(Long id, Supply supplyDetails) {
        Optional<Supply> existingSupply = supplyRepository.findById(id);
        if (existingSupply.isPresent()) {
            Supply supply = existingSupply.get();
            supply.setName(supplyDetails.getName());
            supply.setEmail(supplyDetails.getEmail());
            supply.setProduct(supplyDetails.getProduct());
            supply.setTotalAmt(supplyDetails.getTotalAmt());
            return supplyRepository.save(supply);
        }
        return null;
    }

    // Supprimer un Supply par ID
    @Transactional
    public boolean deleteSupply(Long id) {
        Optional<Supply> existingSupply = supplyRepository.findById(id);
        if (existingSupply.isPresent()) {
            supplyRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // Récupérer la liste de tous les Supplies
    public List<Supply> getAllSupplies() {
        return supplyRepository.findAll();
    }

    // Récupérer un Supply par ID
    public Supply getSupplyById(Long id) {
        Optional<Supply> supply = supplyRepository.findById(id);
        return supply.orElse(null);
    }
}