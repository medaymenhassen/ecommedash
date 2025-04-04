package com.cognitiex.school.services;

import com.cognitiex.school.models.AuthenticationRequest;
import com.cognitiex.school.models.Company;
import com.cognitiex.school.models.ContactFormEntity;
import com.cognitiex.school.models.User;
import com.cognitiex.school.repositories.ContactFormRepository;
import com.cognitiex.school.repositories.UserRepository;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

	 private final UserRepository userRepository;
	    private final PasswordEncoder passwordEncoder;
	    private final ContactFormRepository contactFormRepository;

	    @Autowired
	    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, ContactFormRepository contactFormRepository) {
	        this.userRepository = userRepository;
	        this.passwordEncoder = passwordEncoder;
	        this.contactFormRepository = contactFormRepository;
	    }

	    public void registerUser(User user, AuthenticationRequest authenticationRequest) {
	        String encodedPassword = passwordEncoder.encode(authenticationRequest.getPassword());
	        user.setPassword(encodedPassword);
	        user.setUsername(authenticationRequest.getUsername());
	        userRepository.save(user);
	    }
	    public User saveUser(User user) {
	        return userRepository.save(user);
	    }
	    
	    public List<User> findAllByIds(List<Long> ids) {
	        return userRepository.findAllById(ids);
	    }

    public ContactFormEntity saveContactForm(ContactFormEntity contactForm) {
        return contactFormRepository.save(contactForm);
    }

    
    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    public void registerUser(User user) {
        String encodedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encodedPassword);
        userRepository.save(user);
    }
    
    public User findById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void deleteUserById(Long id) {
        userRepository.deleteById(id);
    }

    public void updateUser(Long id, User user) {
        User existingUser = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        existingUser.setUsername(user.getUsername());
        existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(existingUser);
    }

    public void updateUserProfile(User user) {
        User existingUser = userRepository.findByUsername(user.getUsername());
        if (existingUser != null) {
            existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
            userRepository.save(existingUser);
        }
    }

    public void deleteUserByUsername(String username) {
        User user = userRepository.findByUsername(username);
        if (user != null) {
            userRepository.delete(user);
        }
    }

    public boolean isPasswordValid(User user, String password) {
        return passwordEncoder.matches(password, user.getPassword());
    }

    public void changeUserPassword(User user, String newPassword) {
        // Encodez le nouveau mot de passe avant de le sauvegarder
        String encodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedPassword);
        userRepository.save(user);
    }
    
    public List<User> getUsersByCompany(Company company) {
        return userRepository.findByWorkCompaniesContains(company);
    }

}
