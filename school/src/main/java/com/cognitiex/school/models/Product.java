package com.cognitiex.school.models;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Entity
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Informations de base
    @Column(nullable = false, length = 255)
    private String title;
    
    @Column(length = 2000)
    private String description;
    
    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    // Méthode de gestion du stock : false = FIFO, true = LIFO
    @Column(nullable = false)
    private Boolean lifo = false;

    @Column(nullable = false)
    private Integer qte;
    
    @Column(nullable = false)
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than zero")
    private BigDecimal price;
    
    // Catégorisation
    @Column(length = 100)
    private String categorie;
    
    @Column(length = 100)
    private String marque;

    // Dates pour la gestion générale et/ou périssable
    @Column(nullable = false)
    private LocalDate debut; // Date d'entrée en stock

    // Optionnel : champs pour produits périssables
    @Column
    private LocalDate datePeremption; // Peut rester null si non applicable

    @Column
    private LocalDate dateFabrication; // Optionnel

    @Column(length = 50)
    private String lotNumber; // Numéro de lot pour la traçabilité

    // Champs pour codes de gestion
    @Column(length = 100)
    private String codeBarre;
    
    // Informations sur le stockage
    @Column
    private Integer stockMinimum; // Pour déclencher une alerte en cas de stock faible

    // Relations (clients divers)
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "supply_id")
    private Supply supply;
    
    @Column(nullable = false)
    @NotNull(message = "Manufacturing cost is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Manufacturing cost must be greater than zero")
    private BigDecimal costManufacturing;
    
    @Column(nullable = false)
    @NotNull(message = "Commercialization cost is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Commercialization cost must be greater than zero")
    private BigDecimal costCommercialization;

    
    // URL image pour l'affichage dans le dashboard
    @Column(length = 255)
    private String imageUrl;

    // Constructeurs
    public Product() {
        super();
    }


    public Product(Long id, String title, String description, String sku, Boolean lifo, Integer qte,
			@NotNull(message = "Price is required") @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than zero") BigDecimal price,
			String categorie, String marque, LocalDate debut, LocalDate datePeremption, LocalDate dateFabrication,
			String lotNumber, String codeBarre, Integer stockMinimum, User user, Supply supply,
			@NotNull(message = "Manufacturing cost is required") @DecimalMin(value = "0.0", inclusive = false, message = "Manufacturing cost must be greater than zero") BigDecimal costManufacturing,
			@NotNull(message = "Commercialization cost is required") @DecimalMin(value = "0.0", inclusive = false, message = "Commercialization cost must be greater than zero") BigDecimal costCommercialization,
			String imageUrl) {
		super();
		this.id = id;
		this.title = title;
		this.description = description;
		this.sku = sku;
		this.lifo = lifo;
		this.qte = qte;
		this.price = price;
		this.categorie = categorie;
		this.marque = marque;
		this.debut = debut;
		this.datePeremption = datePeremption;
		this.dateFabrication = dateFabrication;
		this.lotNumber = lotNumber;
		this.codeBarre = codeBarre;
		this.stockMinimum = stockMinimum;
		this.user = user;
		this.supply = supply;
		this.costManufacturing = costManufacturing;
		this.costCommercialization = costCommercialization;
		this.imageUrl = imageUrl;
	}


	// Getters et setters pour chaque attribut

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    // Exemple pour quelques getters/setters :
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public Boolean getLifo() {
        return lifo;
    }

    public void setLifo(Boolean lifo) {
        this.lifo = lifo;
    }

    public Integer getQte() {
        return qte;
    }

    public void setQte(Integer qte) {
        this.qte = qte;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public LocalDate getDebut() {
        return debut;
    }

    public void setDebut(LocalDate debut) {
        this.debut = debut;
    }

    public LocalDate getDatePeremption() {
        return datePeremption;
    }

    public void setDatePeremption(LocalDate datePeremption) {
        this.datePeremption = datePeremption;
    }

    public LocalDate getDateFabrication() {
        return dateFabrication;
    }

    public void setDateFabrication(LocalDate dateFabrication) {
        this.dateFabrication = dateFabrication;
    }

    public String getLotNumber() {
        return lotNumber;
    }

    public void setLotNumber(String lotNumber) {
        this.lotNumber = lotNumber;
    }

    public String getCodeBarre() {
        return codeBarre;
    }

    public void setCodeBarre(String codeBarre) {
        this.codeBarre = codeBarre;
    }

    public Integer getStockMinimum() {
        return stockMinimum;
    }

    public void setStockMinimum(Integer stockMinimum) {
        this.stockMinimum = stockMinimum;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Supply getSupply() {
        return supply;
    }

    public void setSupply(Supply supply) {
        this.supply = supply;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }


	public String getCategorie() {
		return categorie;
	}


	public void setCategorie(String categorie) {
		this.categorie = categorie;
	}


	public String getMarque() {
		return marque;
	}


	public void setMarque(String marque) {
		this.marque = marque;
	}


	public BigDecimal getCostManufacturing() {
		return costManufacturing;
	}


	public void setCostManufacturing(BigDecimal costManufacturing) {
		this.costManufacturing = costManufacturing;
	}


	public BigDecimal getCostCommercialization() {
		return costCommercialization;
	}


	public void setCostCommercialization(BigDecimal costCommercialization) {
		this.costCommercialization = costCommercialization;
	}
    
    
}
