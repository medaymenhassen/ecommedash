package com.cognitiex.school.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "cart_order_items")
public class CartOrderItems {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order; // Changer String à Order

    @Column(length = 400, name = "item")
    private String item;

    @Column(nullable = true)
    private String imagePath;

    @Column(nullable = true, name = "attribute") // Renommer attribut à attribute
    private String attribute;

    @Column(nullable = true, name = "quantity") // Renommer qte à quantity
    private Long quantity;

    @Column(nullable = false)
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "price amt must be greater than zero")
    private BigDecimal price;

    @Column(nullable = false)
    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "total amt must be greater than zero")
    private BigDecimal totalAmt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime created;

    // Constructeur par défaut
    public CartOrderItems() {
    }

    // Constructeur avec paramètres
    public CartOrderItems(Order order, String item, String imagePath, String attribute, Long quantity,
                          @NotNull(message = "Price is required") @DecimalMin(value = "0.0", inclusive = false, message = "price amt must be greater than zero") BigDecimal price,
                          @NotNull(message = "Total amount is required") @DecimalMin(value = "0.0", inclusive = false, message = "total amt must be greater than zero") BigDecimal totalAmt,
                          LocalDateTime created) {
        this.order = order;
        this.item = item;
        this.imagePath = imagePath;
        this.attribute = attribute;
        this.quantity = quantity;
        this.price = price;
        this.totalAmt = totalAmt;
        this.created = created;
    }

    // Getters et setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Order getOrder() { // Changer String à Order
        return order;
    }

    public void setOrder(Order order) { // Changer String à Order
        this.order = order;
    }

    public String getItem() {
        return item;
    }

    public void setItem(String item) {
        this.item = item;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public String getAttribute() {
        return attribute;
    }

    public void setAttribute(String attribute) {
        this.attribute = attribute;
    }

    public Long getQuantity() {
        return quantity; // Changer qte à quantity
    }

    public void setQuantity(Long quantity) { // Changer qte à quantity
        this.quantity = quantity;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getTotalAmt() {
        return totalAmt;
    }

    public void setTotalAmt(BigDecimal totalAmt) {
        this.totalAmt = totalAmt;
    }

    public LocalDateTime getCreated() {
        return created;
    }

    public void setCreated(LocalDateTime created) {
        this.created = created;
    }
}

