package com.cognitiex.school.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.cognitiex.school.services.JwtTokenRefreshService;
import com.cognitiex.school.services.MyUserDetailsService;

import io.jsonwebtoken.ExpiredJwtException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private MyUserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private JwtTokenRefreshService jwtTokenRefreshService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
    	String path = request.getRequestURI();
        System.out.println("Request path: " + path);
        final String authorizationHeader = request.getHeader("Authorization");
        final String refreshTokenHeader = request.getHeader("Refresh-Token");

        String jwt = null;
        String username = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (ExpiredJwtException e) {
                handleExpiredToken(refreshTokenHeader, response);
                return;
            } catch (Exception e) {
                setUnauthorizedResponse(response, "JWT token parsing failed.");
                return;
            }

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                processAuthentication(jwt, username, response, request);
            }
        }

        chain.doFilter(request, response);
    }

    // Méthode pour gérer les tokens expirés
    private void handleExpiredToken(String refreshTokenHeader, HttpServletResponse response) throws IOException {
        if (refreshTokenHeader != null && jwtUtil.validateRefreshToken(refreshTokenHeader)) {
            String refreshTokenUsername = jwtUtil.extractUsername(refreshTokenHeader);
            Map<String, String> tokens = jwtTokenRefreshService.refreshAccessToken(refreshTokenHeader, refreshTokenUsername);

            response.setHeader("New-Access-Token", tokens.get("accessToken"));
            response.setHeader("New-Refresh-Token", tokens.get("refreshToken"));
        } else {
            setUnauthorizedResponse(response, "Refresh token is invalid or not provided.");
        }
    }

    // Méthode pour configurer une réponse non autorisée
    private void setUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter().write("{\"message\": \"" + message + "\"}");
    }

    // Méthode pour traiter l'authentification
    private void processAuthentication(String jwt, String username, HttpServletResponse response, HttpServletRequest request) throws IOException {
        try {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (jwtUtil.validateAccessToken(jwt, username)) {
                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            } else {
                setUnauthorizedResponse(response, "Invalid JWT token.");
            }
        } catch (Exception e) {
            setUnauthorizedResponse(response, "Exception in setting authentication: " + e.getMessage());
        }
    }

}