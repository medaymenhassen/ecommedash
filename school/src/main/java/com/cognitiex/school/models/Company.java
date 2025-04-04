package com.cognitiex.school.models;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;



@Entity
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Subscription subscription = Subscription.BASIC;

    @Column(name = "subscription_start_date")
    private String subscriptionStartDate;

    @Column(name = "subscription_end_date")
    private String subscriptionEndDate;

    @Column(name = "access_token", unique = true)
    private String accessToken;

    @Column(name = "token_expiry")
    private LocalDateTime tokenExpiry;

    // Constructeurs, getters et setters
    public Company() {}

    
    public Company(Long id, String name, Subscription subscription, 
            String subscriptionStartDate, String subscriptionEndDate) {
		 this.id = id;
		 this.name = name;
		 this.subscription = subscription;
		 this.subscriptionStartDate = subscriptionStartDate;
		 this.subscriptionEndDate = subscriptionEndDate;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Subscription getSubscription() {
        return subscription;
    }

    public void setSubscription(Subscription subscription) {
        this.subscription = subscription;
    }
    

    public String getSubscriptionStartDate() {
        return subscriptionStartDate;
    }

    public void setSubscriptionStartDate(String subscriptionStartDate) {
        this.subscriptionStartDate = subscriptionStartDate;
    }

    public String getSubscriptionEndDate() {
        return subscriptionEndDate;
    }

    public void setSubscriptionEndDate(String subscriptionEndDate) {
        this.subscriptionEndDate = subscriptionEndDate;
    }

	public String getAccessToken() {
		return accessToken;
	}

	public void setAccessToken(String accessToken) {
		this.accessToken = accessToken;
	}

	public LocalDateTime getTokenExpiry() {
		return tokenExpiry;
	}

	public void setTokenExpiry(LocalDateTime tokenExpiry) {
		this.tokenExpiry = tokenExpiry;
	}
    
    
}
