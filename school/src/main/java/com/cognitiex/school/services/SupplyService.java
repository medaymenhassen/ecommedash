package com.cognitiex.school.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cognitiex.school.models.Company;
import com.cognitiex.school.models.CustomerOrder;
import com.cognitiex.school.models.Product;
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

    @Transactional
    public Supply updateSupply(Supply supplyDetails) {
        Optional<Supply> existingSupply = supplyRepository.findById(supplyDetails.getId());
        if (existingSupply.isPresent()) {
            Supply supply = existingSupply.get();
            supply.setName(supplyDetails.getName());
            supply.setEmail(supplyDetails.getEmail());
            supply.setTotalAmt(supplyDetails.getTotalAmt());
            List<Product> products = supply.getProduct();
            List<Company> companies = supply.getCompanies();
            return supplyRepository.save(supply);  // Enregistrement de l'entité mise à jour
        }
        return null; // Si l'entité n'existe pas
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

    public List<Supply> getSuppliesByCompanyId(Long companyId) {
        return supplyRepository.findByCompanyId(companyId);
    }
    public Optional<Supply> getSupplyById(Long id) {
        return supplyRepository.findById(id);
    }

    

}