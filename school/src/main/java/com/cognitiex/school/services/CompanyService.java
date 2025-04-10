package com.cognitiex.school.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cognitiex.school.models.Color;
import com.cognitiex.school.models.Company;
import com.cognitiex.school.models.Product;
import com.cognitiex.school.models.Subscription;
import com.cognitiex.school.models.Supply;
import com.cognitiex.school.models.User;
import com.cognitiex.school.repositories.CompanyRepository;
import com.cognitiex.school.repositories.UserRepository;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final Map<String, Long> tokenCompanyMap = new HashMap<>();
    private final Map<String, LocalDateTime> tokenExpiryMap = new HashMap<>();

    public Company addUserToCompany(User user, Company company) {
        // Vérifier si l'utilisateur est déjà associé à cette entreprise
        if (user.getWorkCompanies() != null && user.getWorkCompanies().contains(company)) {
            throw new RuntimeException("L'utilisateur est déjà employé dans cette entreprise.");
        }

        // Ajouter l'entreprise à la collection (gestion du cas où la collection est null)
        if (user.getWorkCompanies() == null) {
            user.setWorkCompanies(new HashSet<>());
        }
        user.getWorkCompanies().add(company);
        
        // Sauvegarder les modifications
        userRepository.save(user);

        return company;
    }
    
    public List<Company> getCompanyByIdList(List<Long> companiesIds) {
        return companyRepository.findAllById(companiesIds);  // Utilisation de la méthode de Spring Data JPA pour récupérer les entreprises
    }


    public List<Supply> getSuppliesByCompanyIdList(Long companyId) {
        return companyRepository.findAllByCompanyIdWithCompanies(companyId);  // Assurez-vous que le repository prend bien en compte l'association.
    }

    

        
    public LocalDateTime getTokenExpiry(Long companyId) {
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new RuntimeException("Company not found"));

        LocalDateTime expiryDate = company.getTokenExpiry();

        if (expiryDate == null || expiryDate.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Le token est expiré ou invalide.");
        }

        return expiryDate;
    }


    public Company getCompanyByAccessToken(String token) {
        return companyRepository.findByAccessToken(token)
            .orElseThrow(() -> new RuntimeException("Token invalide"));
    }
    // Récupérer une entreprise par token
    public Company getCompanyByToken(String token) {
        Long companyId = tokenCompanyMap.get(token);
        return companyId != null ? companyRepository.findById(companyId).orElse(null) : null;
    }

    // Supprimer une entreprise
    public void deleteCompany(Long companyId) {
        companyRepository.deleteById(companyId);
    }

    public CompanyService(CompanyRepository companyRepository, UserRepository userRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    public String generateAccessToken(Long companyId) {
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new RuntimeException("Company not found"));

        // Log pour vérifier si l'entreprise est récupérée correctement
        System.out.println("Company ID: " + company.getId());
        System.out.println("Company Name: " + company.getName());

        String token = UUID.randomUUID().toString();
        company.setAccessToken(token);
        company.setTokenExpiry(LocalDateTime.now().plusHours(1));

        // Sauvegarde et retour du token généré
        Company savedCompany = companyRepository.save(company);

        // Log pour vérifier si la sauvegarde s'est bien passée
        System.out.println("Saved Company Token: " + savedCompany.getAccessToken());
        
        return savedCompany.getAccessToken();
    }

    public Company createCompany(Company company) {
        // Ici, le champ subscription est déjà initialisé à BASIC par défaut
        return companyRepository.save(company);
    }
    
    public Company getCompanyById(Long id) {
        return companyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Entreprise non trouvée"));
    }

    public Company updateCompany(Company company) { // Modification de la signature
        return companyRepository.save(company);
    }


    public Company addUserWithToken(String token, User user) {
        Company company = companyRepository.findByAccessToken(token)
            .orElseThrow(() -> new RuntimeException("Token invalide"));
        
        if(LocalDateTime.now().isAfter(company.getTokenExpiry())) {
            throw new RuntimeException("Token expiré");
        }
        
        return companyRepository.save(company);
    }
    
    public Company validateAccessToken(String token) {
        Company company = companyRepository.findByAccessToken(token)
            .orElseThrow(() -> new RuntimeException("Token invalide"));
        
        if(LocalDateTime.now().isAfter(company.getTokenExpiry())) {
            throw new RuntimeException("Token expiré");
        }
        
        return company;
    }
    

    public List<Company> getCompaniesByUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<Company> companies = new ArrayList<>();
        
        // Ajoute l'entreprise dont il est propriétaire
        if (user.getOwner() != null) {
            companies.add(user.getOwner());
        }
        
        // Ajoute toutes les entreprises où il travaille (Many-to-Many)
        if (user.getWorkCompanies() != null && !user.getWorkCompanies().isEmpty()) {
            companies.addAll(user.getWorkCompanies());
        }

        return companies;
    }


    public List<Company> getCompanysBySupplyId(Long supplyId) {
        return companyRepository.findBySupplyId(supplyId);
    }


}
