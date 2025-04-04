package com.cognitiex.school.models;

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

@Entity
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000000000)
    private String title;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(nullable = false)
    private String slug;

    @Column(nullable = false, length = 1000000000)
    private String specs;

    @Column(nullable = false)
    private Boolean status = false;

    @Column(nullable = false)
    private Boolean isFeatured = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime created;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updated;

    @Column(nullable = false)
    private LocalDate debut;

    @Column(nullable = false)
    private LocalDate fin;

    @Column(length = 500)
    private String gltfPath;

    @Column(length = 500)
    private String binPath;

    @Column(length = 500)
    private String texturePath;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @ManyToOne
    @JoinColumn(name = "company_id")
    private Company company;


	public Product() {
		super();
	}

	public Product(String title, Category category, Brand brand, String slug, String specs, Boolean status, Boolean isFeatured, LocalDateTime created, LocalDateTime updated,
			LocalDate debut, LocalDate fin, String gltfPath, String binPath, String texturePath, User user, Company company) {
		super();
		this.title = title;
		this.category = category;
		this.brand = brand;
		this.slug = slug;
		this.specs = specs;
		this.status = status;
		this.isFeatured = isFeatured;
		this.created = created;
		this.updated = updated;
		this.debut = debut;
		this.fin = fin;
		this.gltfPath = gltfPath;
		this.binPath = binPath;
		this.texturePath = texturePath;
		this.user = user;
		this.company = company;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}
	
    // Ajouter getter et setter
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }


	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public Category getCategory() {
		return category;
	}

	public void setCategory(Category category) {
		this.category = category;
	}

	public Brand getBrand() {
		return brand;
	}

	public void setBrand(Brand brand) {
		this.brand = brand;
	}

	public String getSlug() {
		return slug;
	}

	public void setSlug(String slug) {
		this.slug = slug;
	}

	public String getSpecs() {
		return specs;
	}

	public void setSpecs(String specs) {
		this.specs = specs;
	}

	public Boolean getStatus() {
		return status;
	}

	public void setStatus(Boolean status) {
		this.status = status;
	}

	public Boolean getIsFeatured() {
		return isFeatured;
	}

	public void setIsFeatured(Boolean isFeatured) {
		this.isFeatured = isFeatured;
	}

	public LocalDateTime getCreated() {
		return created;
	}

	public void setCreated(LocalDateTime created) {
		this.created = created;
	}

	public LocalDateTime getUpdated() {
		return updated;
	}

	public void setUpdated(LocalDateTime updated) {
		this.updated = updated;
	}

	public LocalDate getDebut() {
		return debut;
	}

	public void setDebut(LocalDate debut) {
		this.debut = debut;
	}

	public LocalDate getFin() {
		return fin;
	}

	public void setFin(LocalDate fin) {
		this.fin = fin;
	}

	public String getGltfPath() {
		return gltfPath;
	}

	public void setGltfPath(String gltfPath) {
		this.gltfPath = gltfPath;
	}

	public String getBinPath() {
		return binPath;
	}

	public void setBinPath(String binPath) {
		this.binPath = binPath;
	}

	public String getTexturePath() {
		return texturePath;
	}

	public void setTexturePath(String texturePath) {
		this.texturePath = texturePath;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

    
}
