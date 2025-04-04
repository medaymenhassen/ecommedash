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
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 400, unique = true, name = "order_id")
    private String orderId; // Convention Java : camelCase

    @Column(nullable = false)
    private Boolean orderStatus = false; // Initialisation avec une valeur par défaut

    @Column(length = 400, name = "paid_status")
    private String paidStatus;

    @Column(nullable = false)
    @NotNull(message = "totalAmt is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "total amt must be greater than zero")
    private BigDecimal totalAmt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime created;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Constructeur sans arguments
    public Order() {
    }

    // Constructeur avec paramètres
    public Order(String orderId, Boolean orderStatus, String paidStatus,
                 @NotNull(message = "Price is required") @DecimalMin(value = "0.0", inclusive = false, message = "total amt must be greater than zero") BigDecimal totalAmt,
                 LocalDateTime created, User user) {
        this.orderId = orderId;
        this.orderStatus = orderStatus;
        this.paidStatus = paidStatus;
        this.totalAmt = totalAmt;
        this.created = created;
        this.user = user;
    }

    // Getters et setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public Boolean getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(Boolean orderStatus) {
        this.orderStatus = orderStatus;
    }

    public String getPaidStatus() {
        return paidStatus;
    }

    public void setPaidStatus(String paidStatus) {
        this.paidStatus = paidStatus;
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
