package com.cognitiex.school.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.cognitiex.school.controller.AuthenticationController;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class JwtUtil {
    private final Key SECRET_KEY = Keys.secretKeyFor(SignatureAlgorithm.HS256); // Clé sécurisée pour les JWT
    
    // Durée de vie du Token d'Accès (15 minutes)
    private final long ACCESS_TOKEN_EXPIRATION = 1000 * 60 * 15;
    // Durée de vie du Refresh Token (7 jours)
    private final long REFRESH_TOKEN_EXPIRATION = 1000 * 60 * 60 * 24 * 7;

    // Extraction des informations du JWT
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    public String generateAccessToken(String username, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId); // Assurez-vous que userId est de type Long
        return createToken(claims, username, ACCESS_TOKEN_EXPIRATION, SECRET_KEY);
    }

    public String generateRefreshToken(String username, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId); // Assurez-vous que userId est de type Long
        return createToken(claims, username, REFRESH_TOKEN_EXPIRATION, SECRET_KEY);
    }
    public Long extractUserId(String token) {
        final Claims claims = extractAllClaims(token);
        Object userIdClaim = claims.get("userId");
        
        if (userIdClaim instanceof Long) {
            return (Long) userIdClaim;
        } else if (userIdClaim instanceof Integer) {
            return ((Integer) userIdClaim).longValue(); // Convertir Integer en Long
        }
        return null; // Gérer le cas où userId n'est pas trouvé
    }

    
    public class InvalidTokenException extends RuntimeException {
        public InvalidTokenException(String message) {
            super(message);
        }
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Création d'un JWT avec expiration personnalisée et clé donnée
    private String createToken(Map<String, Object> claims, String subject, long expirationTime, Key key) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(key) // Utilisez la clé appropriée
                .compact();
    }

    // Validation du Token d'Accès
    public Boolean validateAccessToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }

    public Boolean validateRefreshToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Boolean validateTokenUserId(String token, Long userId) {
        Long tokenUserId = extractUserId(token);
        return userId.equals(tokenUserId);
    }


    // Vérification si le Token d'Accès est expiré
    public Boolean isAccessTokenExpired(String token) {
        return isTokenExpired(token);
    }
}