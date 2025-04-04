package com.cognitiex.school.controller;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.cognitiex.school.config.JwtUtil;
import com.cognitiex.school.models.AuthenticationRequest;
import com.cognitiex.school.models.Category;
import com.cognitiex.school.models.Company;
import com.cognitiex.school.models.CustomerOrder;
import com.cognitiex.school.models.Subscription;
import com.cognitiex.school.models.Supply;
import com.cognitiex.school.models.User;
import com.cognitiex.school.services.AuthService;
import com.cognitiex.school.services.CategoryService;
import com.cognitiex.school.services.CompanyService;
import com.cognitiex.school.services.CustomerOrderService;
import com.cognitiex.school.services.SupplyService;
import com.cognitiex.school.services.UserService;

import jakarta.persistence.EntityNotFoundException;


@RestController
@RequestMapping("/api/customer-orders")
public class CustomerOrderController {
    private final CustomerOrderService customerOrderService = null;
    private final UserService userService;

    @Autowired
    private AuthService authService;

    @Autowired
    public CustomerOrderController(UserService userService) {
        this.userService = userService;
    }
    private final JwtUtil jwtUtil = new JwtUtil();
    @Autowired
    private SupplyService supplyService;
    @Autowired
    private CompanyService companyService;
    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody AuthenticationRequest authenticationRequest) {
        try {
            User existingUser = userService.findByUsername(authenticationRequest.getUsername());
            if (existingUser != null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Nom d'utilisateur déjà existant"));
            }

            User newUser = new User();
            newUser.setUsername(authenticationRequest.getUsername());
            newUser.setPassword(authenticationRequest.getPassword());

            userService.registerUser(newUser, authenticationRequest);  // ✅ Passer authenticationRequest en paramètre

            // Génération des tokens
            String accessToken = jwtUtil.generateAccessToken(newUser.getUsername(), newUser.getId());
            String refreshToken = jwtUtil.generateRefreshToken(newUser.getUsername(), newUser.getId());

            return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Erreur serveur : " + e.getMessage()));
        }
    }

    @PutMapping("/company/update/{companyId}")
    public ResponseEntity<?> updateCompany(
            @PathVariable Long companyId,
            @RequestParam(value = "subscription", required = false) String subscription,
            @RequestParam(value = "subscriptionStartDate", required = false) String subscriptionStartDate,
            @RequestParam(value = "subscriptionEndDate", required = false) String subscriptionEndDate,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "usersWithAccess", required = false) String userIdsString, 
            @RequestHeader("Authorization") String authHeader) {

        try {
            User authenticatedUser = authService.validateTokenAndGetUser(authHeader);
            if (authenticatedUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
            }

            Company company = companyService.getCompanyById(companyId);

            // Mise à jour des valeurs si elles sont présentes
            if (name != null) company.setName(name);
            
            if (subscription != null) {
                try {
                    company.setSubscription(Subscription.valueOf(subscription));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Type d'abonnement invalide"));
                }
            }
            
            if (subscriptionStartDate != null) company.setSubscriptionStartDate(subscriptionStartDate);
            
            if (subscriptionEndDate != null) company.setSubscriptionEndDate(subscriptionEndDate);

            // Gestion des utilisateurs associés
            List<Long> userIds = new ArrayList<>();
            
            if (userIdsString != null && !userIdsString.isEmpty()) {
                userIds = Arrays.stream(userIdsString.split(","))
                                .map(String::trim)
                                .map(Long::parseLong)
                                .collect(Collectors.toList());
                
                List<User> usersWithAccess = userService.findAllByIds(userIds);

                for (User user : usersWithAccess) {
                    user.getWorkCompanies().add(company);
                    userService.saveUser(user);
                }
            }

            Company updatedCompany = companyService.updateCompany(company);
            
            return ResponseEntity.ok(updatedCompany);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur serveur : " + e.getMessage()));
        }
    }

    @PostMapping(value = "/company/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createCompany(
            @RequestParam("subscription") String subscription,
            @RequestParam("subscriptionStartDate") String subscriptionStartDate,
            @RequestParam("subscriptionEndDate") String subscriptionEndDate,
            @RequestParam("name") String name,
            @RequestParam(value = "usersWithAccess", required = false) String userIdsString, 
            @RequestHeader("Authorization") String authHeader) {

        try {
            // Validation du token et récupération de l'utilisateur authentifié
            User authenticatedUser = authService.validateTokenAndGetUser(authHeader);
            if (authenticatedUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
            }

            // Récupération des IDs des utilisateurs avec accès
            List<Long> userIds = new ArrayList<>();
            if (userIdsString != null && !userIdsString.isEmpty()) {
                userIds = Arrays.stream(userIdsString.split(","))
                                .map(String::trim)
                                .map(Long::parseLong)
                                .collect(Collectors.toList());
            }

            // Ajouter l'utilisateur authentifié à la liste s'il n'y est pas déjà
            if (!userIds.contains(authenticatedUser.getId())) {
                userIds.add(authenticatedUser.getId());
            }

            List<User> usersWithAccess = userService.findAllByIds(userIds);

            // Création de la nouvelle entreprise
            Company company = new Company();
            company.setName(name);
            company.setSubscriptionStartDate(subscriptionStartDate);
            company.setSubscriptionEndDate(subscriptionEndDate);
            company.setSubscription(Subscription.valueOf(subscription));

            // Associer l'utilisateur authentifié comme propriétaire
            company = companyService.createCompany(company);
            authenticatedUser.setOwner(company); // Lier l'entreprise à l'utilisateur

            // Associer les utilisateurs à l'entreprise via workCompanies
            for (User user : usersWithAccess) {
                user.getWorkCompanies().add(company);
                userService.saveUser(user);
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(company);

        } catch (Exception e) {
            System.err.println("Erreur serveur : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur serveur : " + e.getMessage()));
        }
    }

    @GetMapping("/company/join/{token}")
    public ResponseEntity<?> joinCompany(
        @PathVariable String token,
        @RequestHeader("Authorization") String authHeader) {

        try {
            User user = authService.validateTokenAndGetUser(authHeader);
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Utilisateur non authentifié"));
            }

            Company company = companyService.getCompanyByAccessToken(token);

            // Ajouter l'utilisateur à l'entreprise via workCompanies
            user.getWorkCompanies().add(company);
            
            userService.saveUser(user);

            return ResponseEntity.ok(Map.of(
                "message", "Vous êtes maintenant employé de " + company.getName(),
                "company", company.getName()
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Erreur serveur : " + e.getMessage()));
        }
    }

    @PostMapping("/company/generate-invite/{companyId}")
    public ResponseEntity<?> generateAccessLink(
            @PathVariable Long companyId,
            @RequestHeader("Authorization") String authHeader) {

        try {
            // Validation du token utilisateur
            User user = authService.validateTokenAndGetUser(authHeader);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Utilisateur non authentifié"));
            }
            
            // Log pour vérifier les données utilisateur
            System.out.println("User ID: " + user.getId());
            System.out.println("Owner ID: " + (user.getOwner() != null ? user.getOwner().getId() : "null"));
            
            // Vérification que l'utilisateur est bien le propriétaire
            if (user.getOwner() == null || !user.getOwner().getId().equals(companyId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Vous n'êtes pas le propriétaire de cette entreprise"));
            }

            // Génération du lien d'invitation
            String token = companyService.generateAccessToken(companyId);
            
            // Log pour vérifier le token généré
            System.out.println("Generated Token: " + token);

            if (token == null) {
                throw new RuntimeException("Échec de la génération du token");
            }

            String inviteLink = "http://localhost:4200/join/" + token;

            // Récupération de la date d'expiration
            LocalDateTime expiryDate = companyService.getTokenExpiry(companyId);
            
            // Log pour vérifier la date d'expiration
            System.out.println("Token Expiry Date: " + expiryDate);

            return ResponseEntity.ok(Map.of(
                "url", inviteLink,
                "expires_at", expiryDate
            ));

        } catch (NullPointerException e) {
            e.printStackTrace(); // Ajoutez un log pour capturer les détails de l'exception
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Erreur de serveur : NullPointerException, vérifiez les données du token ou de l'utilisateur"));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Erreur de serveur : " + e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Erreur serveur inattendue : " + e.getMessage()));
        }
    }

    @DeleteMapping("/company/delete/{companyId}")
    public ResponseEntity<?> deleteCompany(
        @PathVariable Long companyId,
        @RequestHeader("Authorization") String authHeader) {

        try {
            // Récupération de l'utilisateur authentifié
            User authenticatedUser = authService.validateTokenAndGetUser(authHeader);
            
            // Vérification des autorisations
            if (authenticatedUser == null || authenticatedUser.getOwner() == null || 
                !authenticatedUser.getOwner().getId().equals(companyId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Vous n'êtes pas autorisé à supprimer cette entreprise"));
            }

            // Récupération de l'entreprise depuis la base de données
            Company company = companyService.getCompanyById(companyId);

            // Dissocier tous les employés de l'entreprise
            List<User> employees = userService.getUsersByCompany(company);
            
            for (User employee : employees) {
                employee.getWorkCompanies().remove(company);
                userService.saveUser(employee);
            }
            
            // Supprimer l'association propriétaire
            authenticatedUser.setOwner(null);
            userService.saveUser(authenticatedUser);

            // Supprimer l'entreprise
            companyService.deleteCompany(companyId);

            return ResponseEntity.ok(Map.of("message", "Entreprise supprimée avec succès"));

        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Entreprise non trouvée"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Erreur serveur : " + e.getMessage()));
        }
    }

    @GetMapping("/company/list")
    public ResponseEntity<?> getCompaniesByUser(@RequestHeader("Authorization") String authHeader) {
        try {
            // Validation du token et récupération de l'utilisateur authentifié
            User user = authService.validateTokenAndGetUser(authHeader);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Utilisateur non authentifié"));
            }

            // Récupérer les entreprises associées à l'utilisateur
            List<Company> companies = new ArrayList<>();

/*            // Ajouter l'entreprise dont l'utilisateur est propriétaire (si elle existe)
            if (user.getOwner() != null) {
                companies.add(user.getOwner());
            }
*/
            // Ajouter toutes les entreprises où l'utilisateur travaille (relation Many-to-Many)
            if (user.getWorkCompanies() != null && !user.getWorkCompanies().isEmpty()) {
                companies.addAll(user.getWorkCompanies());
            }

            return ResponseEntity.ok(companies);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur serveur : " + e.getMessage()));
        }
    }

    /*
    @GetMapping("/company/list")
    public ResponseEntity<?> listUserCompanies(@RequestHeader("Authorization") String authHeader) {
        try {
            User user = authService.validateTokenAndGetUser(authHeader);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur non authentifié"));
            }

            List<Company> companies = companyService.getUserCompanies(user.getId());
            return ResponseEntity.ok(companies);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Erreur serveur : " + e.getMessage()));
        }
    }*/
    
    // Créer un nouveau Supply
    @PostMapping("/supply")
    public ResponseEntity<Supply> createSupply(@RequestBody Supply supply) {
        Supply createdSupply = supplyService.createSupply(supply);
        return new ResponseEntity<>(createdSupply, HttpStatus.CREATED);
    }

    // Mettre à jour un Supply
    @PutMapping("/supply/{id}")
    public ResponseEntity<Supply> updateSupply(@PathVariable Long id, @RequestBody Supply supplyDetails) {
        Supply updatedSupply = supplyService.updateSupply(id, supplyDetails);
        if (updatedSupply != null) {
            return new ResponseEntity<>(updatedSupply, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // Supprimer un Supply
    @DeleteMapping("/supply/{id}")
    public ResponseEntity<Void> deleteSupply(@PathVariable Long id) {
        boolean isDeleted = supplyService.deleteSupply(id);
        if (isDeleted) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // Récupérer la liste de tous les Supplies
    @GetMapping("/supply")
    public ResponseEntity<List<Supply>> getAllSupplies() {
        List<Supply> supplies = supplyService.getAllSupplies();
        return new ResponseEntity<>(supplies, HttpStatus.OK);
    }

    // Récupérer un Supply par ID
    @GetMapping("/supply/{id}")
    public ResponseEntity<Supply> getSupplyById(@PathVariable Long id) {
        Supply supply = supplyService.getSupplyById(id);
        if (supply != null) {
            return new ResponseEntity<>(supply, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }


}
