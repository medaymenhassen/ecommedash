package com.cognitiex.school.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cognitiex.school.models.CartOrderItems;
import com.cognitiex.school.models.Order;
import com.cognitiex.school.models.ProductAttribute;
import com.cognitiex.school.models.User;
import com.cognitiex.school.repositories.OrderRepository;

import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class OrderService {
	@Autowired
    private OrderRepository orderRepository;
	

    @Autowired
	private ProductAttributeService productAttributeService;
    
    @Autowired
    private CartOrderItemsService cartOrderItemsService;


    // Créer une nouvelle commande
    public Order createOrder(Order order) {
        // Générer un orderId unique
        order.setOrderId(generateUniqueOrderId());
        // Calculer le totalAmt si nécessaire
        return orderRepository.save(order);
    }

    // Méthode pour générer un Order ID unique
    private String generateUniqueOrderId() {
        return "ORD-" + UUID.randomUUID().toString();
     }
    
    public Order getOrderById(Long id) {
        Optional<Order> orderOpt = orderRepository.findById(id);
        return orderOpt.orElse(null);
    }
    
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);
    @Transactional
    public Order createOrderWithItems(User user, List<CartOrderItems> items) {

        Order order = new Order();
        order.setOrderId(generateUniqueOrderId());
        order.setOrderStatus(false);
        order.setPaidStatus("pending");
        BigDecimal totalAmount = items.stream()
                .map(CartOrderItems::getTotalAmt)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setTotalAmt(totalAmount);
        order.setUser(user);
        order.setCreated(LocalDateTime.now());
        order = orderRepository.save(order);
        
        // Traiter chaque item
        for (CartOrderItems item : items) {
            item.setOrder(order);
            item.setCreated(LocalDateTime.now());

            Long attributeId;
            try {
                attributeId = Long.parseLong(item.getAttribute()); // Conversion de String à Long
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("ID d'attribut invalide: " + item.getAttribute());
            }

            Optional<ProductAttribute> optionalAttribute = productAttributeService.getProductAttributeById(attributeId);
            if (!optionalAttribute.isPresent()) {
                throw new IllegalArgumentException("Attribut de produit non trouvé pour l'ID: " + attributeId);
            }

            ProductAttribute attribute = optionalAttribute.get();
            Integer quantity = item.getQuantity().intValue();
            int newStock = attribute.getQte() - quantity;
            if (newStock < -10) {
                throw new IllegalArgumentException("Quantité insuffisante pour l'attribut ID: " + attributeId);
            }
            attribute.setQte(newStock);

            int newSales = attribute.getSales() + quantity;
            attribute.setSales(newSales);

            // Sauvegarder les modifications de l'attribut
            try {
                // Mettez à jour l'attribut du produit
                productAttributeService.updateProductAttribute(attribute);
                CartOrderItems createdItem = cartOrderItemsService.createCartOrderItem(item);
            } catch (Exception e) {
                throw e; // Propager l'exception pour qu'elle soit capturée dans le contrôleur
            }
        }

        return order;
    }

}
