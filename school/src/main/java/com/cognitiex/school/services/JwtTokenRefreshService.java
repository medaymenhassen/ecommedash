package com.cognitiex.school.services;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.cognitiex.school.config.JwtUtil;
import com.cognitiex.school.controller.AuthenticationController;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
@Service
public class JwtTokenRefreshService {

	private static final Logger logger = LoggerFactory.getLogger(JwtTokenRefreshService.class);
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private MyUserDetailsService userDetailsService;

    public Map<String, String> refreshAccessToken(String refreshToken, String username) {        
        boolean isValid = jwtUtil.validateRefreshToken(refreshToken);
        String extractedUsername = jwtUtil.extractUsername(refreshToken);

        // Vérifiez si le token est valide et si le nom d'utilisateur correspond
        if (isValid && username.equals(extractedUsername)) {
            String newAccessToken = jwtUtil.generateAccessToken(username, jwtUtil.extractUserId(refreshToken));
            String newRefreshToken = jwtUtil.generateRefreshToken(username, jwtUtil.extractUserId(refreshToken));

            Map<String, String> tokens = new HashMap<>();
            tokens.put("accessToken", newAccessToken);
            tokens.put("refreshToken", newRefreshToken);

            logger.info("accessToken: {}", newAccessToken);
            logger.info("refreshToken: {}", refreshToken);
            return tokens;
        } else {
            throw new RuntimeException("Invalid refresh token or username does not match");
        }
    }
}
