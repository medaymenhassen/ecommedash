package com.cognitiex.school.services;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cognitiex.school.models.Company;
import com.cognitiex.school.models.HistoryProduct;
import com.cognitiex.school.models.Product;
import com.cognitiex.school.models.ShopAddresses;
import com.cognitiex.school.models.Supply;
import com.cognitiex.school.models.User;
import com.cognitiex.school.repositories.CompanyRepository;
import com.cognitiex.school.repositories.HistoryProductRepository;
import com.cognitiex.school.repositories.ProductRepository;
import com.cognitiex.school.repositories.SupplyRepository;

import jakarta.transaction.Transactional;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CompanyService companyService;

    @Autowired
    private SupplyRepository supplyRepository;

    /**
     * Récupère tous les produits.
     */
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    /**
     * Récupère un produit par son ID.
     */
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    /**
     * Sauvegarde un produit.
     */
    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    /**
     * Supprime un produit par son ID.
     */
    public boolean deleteProduct(Long id) {
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<Product> getProductsBySupplyId(Long supplyId) {
        return productRepository.findBySupplyId(supplyId);
    }
    public List<Company> getSupplysByIdsList(List<Long> supplyIds) {
        return companyService.getCompanyByIdList(supplyIds);  // Appel non statique de la méthode
    }
    
    /**
     * Récupère les produits par l'ID de l'utilisateur.
     */
    public List<Product> getProductsByUserId(Long userId) {
        return productRepository.findByUserId(userId);
    }

    /**
     * Récupère tous les produits par une liste d'IDs.
     */
    public List<Product> findAllByIdList(List<Long> productIds) {
        return productRepository.findAllById(productIds);
    }
    public Product updateProduct(Long id, String title, String description, String sku, Boolean lifo, Integer qte,
                                  BigDecimal price, String categorie, String marque, LocalDate debut,
                                  LocalDate datePeremption, LocalDate dateFabrication, String lotNumber,
                                  String codeBarre, Integer stockMinimum, Long supplyId,
                                  BigDecimal costManufacturing, BigDecimal costCommercialization,
                                  String imageUrl) {

        // Vérification si le produit existe
        Optional<Product> optionalProduct = productRepository.findById(id);
        if (optionalProduct.isEmpty()) {
            throw new RuntimeException("Produit introuvable avec l'ID : " + id);
        }

        // Récupération du produit existant
        Product product = optionalProduct.get();

        // Mise à jour des champs
        product.setTitle(title);
        product.setDescription(description);
        product.setSku(sku);
        product.setLifo(lifo);
        product.setQte(qte);
        product.setPrice(price);
        product.setCategorie(categorie);
        product.setMarque(marque);
        product.setDebut(debut);
        product.setDatePeremption(datePeremption);
        product.setDateFabrication(dateFabrication);
        product.setLotNumber(lotNumber);
        product.setCodeBarre(codeBarre);
        product.setStockMinimum(stockMinimum);
        product.setCostManufacturing(costManufacturing);
        product.setCostCommercialization(costCommercialization);
        product.setImageUrl(imageUrl);

        // Mise à jour du fournisseur si spécifié
        if (supplyId != null) {
            Optional<Supply> optionalSupply = supplyRepository.findById(supplyId);
            if (optionalSupply.isPresent()) {
                product.setSupply(optionalSupply.get());
            } else {
                throw new RuntimeException("Fournisseur introuvable avec l'ID : " + supplyId);
            }
        }

        // Sauvegarde du produit mis à jour
        return productRepository.save(product);
    }

    /**
     * Crée un nouveau produit.
     */
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    @Autowired
    private HistoryProductRepository historyProductRepository;


    @Transactional
    public void updateProductQuantity(Long userId, String title, int quantityToUpdate, 
                                     boolean lifo, Long specificProductId, Long supplyId) {
        Supply supply = supplyRepository.findById(supplyId) // Récupération du supply
            .orElseThrow(() -> new RuntimeException("Supply introuvable"));

        if (quantityToUpdate > 0) { // Cas d'approvisionnement
            Product product = productRepository.findByIdAndUserId(specificProductId, userId)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));
            applyDirectQuantityUpdate(product, quantityToUpdate, supply);
        } else { // Cas de vente
            List<Product> products = productRepository.findByUserIdAndTitle(userId, title); // Correction méthode
            
            if (lifo) {
                processLifo(products, supply); // Passage du supply
            } else {
                processFifo(products, supply); // Passage du supply
            }
            
            applyQuantityUpdateForSale(products, quantityToUpdate, supply);
        }
    }

    private void applyDirectQuantityUpdate(Product product, int quantity, Supply supply) {
        product.setQte(product.getQte() + quantity);
        HistoryProduct history = createHistory(
            product,
            "Approvisionnement de " + quantity + " unités (Supply #" + supply.getId() + ")",
            LocalDate.now(),
            quantity,
            supply
        );
        historyProductRepository.save(history);
    }

    // Toutes les méthodes modifiées pour recevoir le supply
    private void processFifo(List<Product> products, Supply supply) {
        LocalDate now = LocalDate.now();
        List<HistoryProduct> historyList = new ArrayList<>();

        products.forEach(p -> {
            if (p.getDatePeremption() != null && p.getDatePeremption().isBefore(now)) {
                int expiredQty = p.getQte();
                BigDecimal loss = p.getCostManufacturing().add(p.getCostCommercialization());
                String msg = "Produit #" + p.getId() + " expiré - Pertes: " + loss + "€ (Supply #" + supply.getId() + ")";
                historyList.add(createHistory(p, msg, now, expiredQty, supply));
                p.setQte(0);
            }
        });

        products.removeIf(p -> p.getQte() <= 0);
        products.sort(Comparator.comparing(Product::getDatePeremption));
        historyProductRepository.saveAll(historyList);
    }

    private void processLifo(List<Product> products, Supply supply) {
        LocalDate now = LocalDate.now();
        List<HistoryProduct> historyList = new ArrayList<>();

        products.sort(Comparator.comparing(Product::getDateFabrication).reversed());

        products.forEach(p -> {
            if (p.getDatePeremption() != null && p.getDatePeremption().isBefore(now)) {
                int expiredQty = p.getQte();
                BigDecimal loss = p.getCostManufacturing().add(p.getCostCommercialization());
                String msg = "Produit #" + p.getId() + " expiré - Pertes: " + loss + "€ (Supply #" + supply.getId() + ")";
                historyList.add(createHistory(p, msg, now, expiredQty, supply));
                p.setQte(0);
            }
        });

        historyProductRepository.saveAll(historyList);
        products.removeIf(p -> p.getQte() <= 0);
    }

    private void applyQuantityUpdateForSale(List<Product> products, int quantityToUpdate, Supply supply) {
        int remaining = Math.abs(quantityToUpdate);
        List<HistoryProduct> salesHistory = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (Product p : products) {
            if (remaining <= 0) break;

            int available = p.getQte();
            int processedQuantity = Math.min(available, remaining);

            if (processedQuantity > 0) {
                String msg = "Vente de " + processedQuantity + " unités (Produit #" + p.getId() + ", Supply #" + supply.getId() + ")";
                salesHistory.add(createHistory(p, msg, now, -processedQuantity, supply));
                p.setQte(available - processedQuantity);
                remaining -= processedQuantity;
            }
        }

        historyProductRepository.saveAll(salesHistory);
    }

    private HistoryProduct createHistory(Product p, String msg, LocalDate now, int quantity, Supply supply) {
        HistoryProduct history = new HistoryProduct();
        history.setProduct(p);
        history.setMessage(msg);
        history.setDateEvent(now);
        history.setQuantity(quantity);
        history.setSupply(supply); // Set the supply information
        return history;
    }

}
