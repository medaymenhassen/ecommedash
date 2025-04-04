package com.cognitiex.school.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.cognitiex.school.config.JwtUtil;
import com.cognitiex.school.models.User;

@Service
public class AuthService {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    public User validateTokenAndGetUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token non fourni ou invalide");
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Utilisateur non trouvé");
        }

        return user;
    }
}
