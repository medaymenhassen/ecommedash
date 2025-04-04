package com.cognitiex.school.controller;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.cognitiex.school.config.JwtUtil;
import com.cognitiex.school.config.JwtUtil.InvalidTokenException;
import com.cognitiex.school.models.AuthenticationRequest;
import com.cognitiex.school.models.AuthenticationResponse;
import com.cognitiex.school.models.Brand;
import com.cognitiex.school.models.CartOrderItems;
import com.cognitiex.school.models.Category;
import com.cognitiex.school.models.Color;
import com.cognitiex.school.models.ContactFormEntity;
import com.cognitiex.school.models.Length;
import com.cognitiex.school.models.Order;
import com.cognitiex.school.models.Product;
import com.cognitiex.school.models.ProductAttribute;
import com.cognitiex.school.models.ShopAddresses;
import com.cognitiex.school.models.Size;
import com.cognitiex.school.models.User;
import com.cognitiex.school.services.AiService;
import com.cognitiex.school.services.BrandService;
import com.cognitiex.school.services.CartOrderItemsService;
import com.cognitiex.school.services.CategoryService;
import com.cognitiex.school.services.ColorService;
import com.cognitiex.school.services.HandleFileUpload;
import com.cognitiex.school.services.ImageService;
import com.cognitiex.school.services.JwtTokenRefreshService;
import com.cognitiex.school.services.LengthService;
import com.cognitiex.school.services.MyUserDetailsService;
import com.cognitiex.school.services.OrderService;
import com.cognitiex.school.services.ProductAttributeService;
import com.cognitiex.school.services.ProductService;
import com.cognitiex.school.services.ShopAddressService;
import com.cognitiex.school.services.SizeService;
import com.cognitiex.school.services.UserService;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Valid;

import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api")
public class AuthenticationController {

   private static final Logger logger = LoggerFactory.getLogger(AuthenticationController.class);


    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private MyUserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtTokenRefreshService jwtTokenRefreshService;
        
    @Autowired
    private ImageService imageService;
    
    @Autowired
    private HandleFileUpload handleFileUpload;

    @Autowired
    private ColorService colorService;
    
    @Autowired
    private ProductService productService;
    
    @Autowired
	private ProductAttributeService productAttributeService;
    
    @GetMapping("color/list")
    public ResponseEntity<List<Color>> getAllColor(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);

        User user = userService.findByUsername(usernameFromToken);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        return ResponseEntity.ok(colorService.getAllColors());
    }


    @PostMapping("color/create")
    public ResponseEntity<Color> createColor(@RequestBody Map<String, Object> requestBody, @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7); // Assumption of "Bearer " prefix
        String usernameFromToken = jwtUtil.extractUsername(token);

        User user = userService.findByUsername(usernameFromToken);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        // Création de l'objet Color à partir des données envoyées
        Color color = new Color();
        color.setTitle((String) requestBody.get("title")); // Mapper title à title
        color.setColorCode((String) requestBody.get("colorCode")); // Assurez-vous que le nom correspond
        color.setMission((String) requestBody.get("mission")); // Mapper mission à mission
        Color savedColor = colorService.createColor(color);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedColor);
    }

    @PutMapping("color/update/{id}")
    public ResponseEntity<Color> updateColor(
            @PathVariable("id") Long colorId, 
            @RequestBody Map<String, Object> requestBody, 
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        Optional<Color> optionalColor = colorService.getColorById(colorId);
        if (optionalColor.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Color existingColor = optionalColor.get();
        existingColor.setTitle((String) requestBody.get("title"));
        existingColor.setColorCode((String) requestBody.get("colorCode"));
        existingColor.setMission((String) requestBody.get("mission"));

        // Validation manuelle
        boolean hasColorCode = existingColor.getColorCode() != null && !existingColor.getColorCode().isEmpty();
        boolean hasMission = existingColor.getMission() != null && !existingColor.getMission().isEmpty();

        if ((hasColorCode && hasMission) || (!hasColorCode && !hasMission)) {
            return ResponseEntity.badRequest()
                                 .body(null); // Vous pouvez également retourner un message d'erreur
        }

        Color updatedColor = colorService.updateColor(colorId, existingColor);
        return ResponseEntity.ok(updatedColor);
    }



    @DeleteMapping("color/delete/{id}")
    public ResponseEntity<Void> deleteColor(
            @PathVariable("id") Long colorId, 
            @RequestHeader("Authorization") String authHeader) {
        
        String token = authHeader.substring(7); // Assumption of "Bearer " prefix
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        // Utilisation de Optional pour obtenir le produit
        Optional<Color> optionalColor = colorService.getColorById(colorId);
        if (optionalColor.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Color existingColor = optionalColor.get();

      //&& !user.isAdmin())
        colorService.deleteColor(colorId);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("color/{id}")
    public ResponseEntity<Color> getColorById(@PathVariable("id") Long id, @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Color> color = colorService.getColorById(id);
        return color.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));
    }
    @GetMapping("/images/{fileName}")
    public ResponseEntity<byte[]> getImage(@PathVariable String fileName) throws IOException {
        byte[] image = imageService.getImage(fileName);
        if (image == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=31536000") // Cache pendant un an
            .body(image);
    }

    @GetMapping("/video/{fileName}")
    public ResponseEntity<byte[]> getVideo(@PathVariable String fileName) throws IOException {
        byte[] video = imageService.getVideo(fileName);
        if (video == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok()
            .header("Cache-Control", "public, max-age=31536000") // Cache pendant un an
            .body(video);
    }

    
    // Soumission d'un formulaire de contact
    @PostMapping("/submit")
    public ResponseEntity<Map<String, String>> submitContactForm(@RequestBody ContactFormEntity contactForm) {
        userService.saveContactForm(contactForm);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Contact form submitted successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    // Authentification de l'utilisateur et génération du token JWT
    @PostMapping("/authenticate")
    public ResponseEntity<Map<String, String>> createAuthenticationToken(@RequestBody AuthenticationRequest authenticationRequest) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authenticationRequest.getUsername(), authenticationRequest.getPassword())
            );
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Nom d'utilisateur ou mot de passe incorrect")); // Retourne un JSON
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(authenticationRequest.getUsername());
        User user = userService.findByUsername(authenticationRequest.getUsername());
        String jwt = jwtUtil.generateAccessToken(userDetails.getUsername(), user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(userDetails.getUsername(), user.getId());

        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", jwt);
        tokens.put("refreshToken", refreshToken);
        return ResponseEntity.ok(tokens); // Retourne le JSON avec les tokens
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<Map<String, String>> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        String username = request.get("username");

        if (refreshToken == null || username == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Refresh token or username is missing"));
        }

        try {
            Map<String, String> tokens = jwtTokenRefreshService.refreshAccessToken(refreshToken, username);
            return ResponseEntity.ok(tokens);
        } catch (InvalidTokenException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", e.getMessage())); // More detailed error
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "Internal server error: " + e.getMessage())); // Detailed error
        }
    }


    // Suppression d'un utilisateur par ID
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteUserById(@PathVariable Long id) {
        System.out.println("DELETE request received for ID: " + id);
        try {
            userService.deleteUserById(id);
            return ResponseEntity.ok("Utilisateur supprimé avec succès");
        } catch (RuntimeException e) {
            System.err.println("Erreur lors de la suppression : " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Utilisateur non trouvé");
        }
    }

    // Changement de mot de passe d'un utilisateur
    @PutMapping("/change-password/{username}")
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable String username,
            @RequestBody Map<String, String> passwordChangeRequest,
            @RequestHeader("Authorization") String authHeader) {

        String oldPassword = passwordChangeRequest.get("oldPassword");
        String newPassword = passwordChangeRequest.get("newPassword");

        if (oldPassword == null || oldPassword.isEmpty() || newPassword == null || newPassword.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Les mots de passe ne peuvent pas être vides"));
        }

        if (!authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Token manquant ou invalide"));
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);

        if (!usernameFromToken.equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Non autorisé à modifier ce mot de passe"));
        }

        User user = userService.findByUsername(username);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Utilisateur non trouvé"));
        }

        if (!userService.isPasswordValid(user, oldPassword)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Ancien mot de passe incorrect"));
        }

        userService.changeUserPassword(user, newPassword);

        return ResponseEntity.ok(Map.of("message", "Mot de passe changé avec succès"));
    }

    @Autowired
    private LengthService lengthService;
    
    @GetMapping("length/list")
    public ResponseEntity<List<Length>> getAllLength(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);

        User user = userService.findByUsername(usernameFromToken);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        return ResponseEntity.ok(lengthService.getAllLength());
    }


    @PostMapping("length/create")
    public ResponseEntity<Length> createLength(@RequestBody Map<String, Object> requestBody, @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);

        User user = userService.findByUsername(usernameFromToken);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        Length length = new Length();
        
        // Check if title is an Integer and convert it to Long
        Object titleObj = requestBody.get("title");
        if (titleObj instanceof Integer) {
            length.setTitle(((Integer) titleObj).longValue());
        } else if (titleObj instanceof Long) {
            length.setTitle((Long) titleObj);
        } else {
            return ResponseEntity.badRequest().build(); // Handle invalid data type
        }

        Length savedLength = lengthService.createLength(length);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedLength);
    }

    @PutMapping("length/update/{id}")
    public ResponseEntity<Length> updateLength(
            @PathVariable("id") Long lengthId, 
            @RequestBody Map<String, Object> requestBody, 
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7); // Assumption of "Bearer " prefix
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        Optional<Length> optionalLength = lengthService.getLengthById(lengthId);
        if (optionalLength.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Length existingLength = optionalLength.get();
        
        // Convert Integer to Long
        Object titleObj = requestBody.get("title");
        if (titleObj instanceof Integer) {
            existingLength.setTitle(((Integer) titleObj).longValue());
        } else if (titleObj instanceof Long) {
            existingLength.setTitle((Long) titleObj);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        
        Length updatedLength = lengthService.createLength(existingLength); // Save updated length
        return ResponseEntity.ok(updatedLength);
    }

    @DeleteMapping("length/delete/{id}")
    public ResponseEntity<Void> deleteLength(
            @PathVariable("id") Long lengthId, 
            @RequestHeader("Authorization") String authHeader) {
        
        String token = authHeader.substring(7); // Assumption of "Bearer " prefix
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        // Utilisation de Optional pour obtenir le produit
        Optional<Length> optionalLength = lengthService.getLengthById(lengthId);
        if (optionalLength.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Length existingLength = optionalLength.get();

      //&& !user.isAdmin())
        lengthService.deleteLength(lengthId);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("length/{id}")
    public ResponseEntity<Length> getLengthById(@PathVariable("id") Long id, @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Length> length = lengthService.getLengthById(id);
        return length.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));
    }
    
    @Autowired
    private SizeService sizeService;
    
    @GetMapping("size/list")
    public ResponseEntity<List<Size>> getAllSize(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);

        User user = userService.findByUsername(usernameFromToken);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        return ResponseEntity.ok(sizeService.getAllSize());
    }


    @PostMapping("size/create")
    public ResponseEntity<Size> createSize(@RequestBody Map<String, Object> requestBody, @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7); // Assumption of "Bearer " prefix
        String usernameFromToken = jwtUtil.extractUsername(token);

        User user = userService.findByUsername(usernameFromToken);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        // Création de l'objet Color à partir des données envoyées
        Size size = new Size();
        size.setTitle((String) requestBody.get("title"));
        Size savedSize = sizeService.createSize(size);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedSize);
    }

    @PutMapping("size/update/{id}")
    public ResponseEntity<Size> updateSize(
            @PathVariable("id") Long sizeId, 
            @RequestBody Map<String, Object> requestBody, 
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7); // Assumption of "Bearer " prefix
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        Optional<Size> optionalSize = sizeService.getSizeById(sizeId);
        if (optionalSize.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Size existingSize = optionalSize.get();
        existingSize.setTitle((String) requestBody.get("title")); // Mapper title à title
        Size updatedSize = sizeService.createSize(existingSize); // Vous pouvez utiliser saveColor si disponible
        return ResponseEntity.ok(updatedSize);
    }

    @DeleteMapping("size/delete/{id}")
    public ResponseEntity<Void> deleteSize(
            @PathVariable("id") Long sizeId, 
            @RequestHeader("Authorization") String authHeader) {
        
        String token = authHeader.substring(7); // Assumption of "Bearer " prefix
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        // Utilisation de Optional pour obtenir le produit
        Optional<Size> optionalSize = sizeService.getSizeById(sizeId);
        if (optionalSize.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Size existingSize = optionalSize.get();

      //&& !user.isAdmin())
        sizeService.deleteSize(sizeId);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("size/{id}")
    public ResponseEntity<Size> getSizeById(@PathVariable("id") Long id, @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Size> size = sizeService.getSizeById(id);
        return size.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));
    }
    
    

    @PostMapping("/attribut/create")
    public ResponseEntity<?> createProductAttribute(
            @RequestPart("productAttribute") ProductAttribute productAttribute,
            @RequestParam("colorId") Long colorId,
            @RequestParam("sizeId") Long sizeId,
            @RequestParam("productId") Long productId,
            @RequestParam(value = "lengthId", required = false) Long lengthId,
            @RequestPart(value = "imagePath", required = false) MultipartFile imagePath,
            @RequestPart(value = "texturePath", required = false) MultipartFile texturePath,
            @RequestPart(value = "videoPath", required = false) MultipartFile videoPath,
            @RequestHeader("Authorization") String authHeader) {

        // Vérification du token JWT
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token non fourni ou invalide");
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Utilisateur non trouvé");
        }

        if (colorId == null || sizeId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Couleur ou taille non spécifiée");
        }


        // Création d'un nouvel attribut produit
        ProductAttribute newAttribute = new ProductAttribute();
        newAttribute.setColor(colorService.getColorById(colorId).orElse(null));
        newAttribute.setSize(sizeService.getSizeById(sizeId).orElse(null));
        newAttribute.setLength(lengthId != null ? lengthService.getLengthById(lengthId).orElse(null) : null);
        newAttribute.setProduct(productService.getProductById(productId).orElse(null)); // Utilisation de l'objet Product
        newAttribute.setDetail(productAttribute.getDetail());
        newAttribute.setText(productAttribute.getText());
        newAttribute.setPrice(productAttribute.getPrice());
        newAttribute.setQte(productAttribute.getQte());
        newAttribute.setSales(productAttribute.getSales());
        newAttribute.setUser(user);

        // Gestion des fichiers
        handleFileUpload.handleFileUpload(imagePath, newAttribute::setImagePath, "image");
        handleFileUpload.handleFileUpload(texturePath, newAttribute::setTexturePath, "texture");
        handleFileUpload.handleFileUpload(videoPath, newAttribute::setVideoPath, "vidéo");

        // Sauvegarde du nouvel attribut
        ProductAttribute createdAttribute = productAttributeService.createProductAttribute(newAttribute);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAttribute);
    }

    // Méthode pour mettre à jour un attribut produit
    @PutMapping("/attribut/update/{id}")
    public ResponseEntity<?> updateProductAttribute(
            @PathVariable Long id,
            @RequestPart("productAttribute") ProductAttribute productAttribute,
            @RequestParam("colorId") Long colorId,
            @RequestParam("sizeId") Long sizeId,
            @RequestParam("productId") Long productId,
            @RequestParam(value = "lengthId", required = false) Long lengthId,
            @RequestPart(value = "imagePath", required = false) MultipartFile imagePath,
            @RequestPart(value = "texturePath", required = false) MultipartFile texturePath,
            @RequestPart(value = "videoPath", required = false) MultipartFile videoPath,
            @RequestHeader("Authorization") String authHeader) {

        // Vérification du token JWT
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token non fourni ou invalide");
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Utilisateur non trouvé");
        }

        // Validation des IDs
        if (colorId == null || sizeId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Couleur ou taille non spécifiée");
        }

        // Récupérer l'attribut produit existant
        Optional<ProductAttribute> optionalProductAttribute = productAttributeService.getProductAttributeById(id);

        if (!optionalProductAttribute.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Attribut produit non trouvé");
        }

        ProductAttribute existingAttribute = optionalProductAttribute.get();

        // Mise à jour des champs
        existingAttribute.setColor(colorService.getColorById(colorId).orElse(null));
        existingAttribute.setSize(sizeService.getSizeById(sizeId).orElse(null));
        existingAttribute.setLength(lengthId != null ? lengthService.getLengthById(lengthId).orElse(null) : null);
        existingAttribute.setDetail(productAttribute.getDetail());
        existingAttribute.setText(productAttribute.getText());
        existingAttribute.setPrice(productAttribute.getPrice());
        existingAttribute.setQte(productAttribute.getQte());
        existingAttribute.setSales(productAttribute.getSales());
        existingAttribute.setProduct(productService.getProductById(productId).orElse(null));
        existingAttribute.setUser(user);

        // Gestion des fichiers
        handleFileUpload.handleFileUpload(imagePath, existingAttribute::setImagePath, "image");
        handleFileUpload.handleFileUpload(texturePath, existingAttribute::setTexturePath, "texture");
        handleFileUpload.handleFileUpload(videoPath, existingAttribute::setVideoPath, "vidéo");

        // Sauvegarde des modifications
        ProductAttribute updatedAttribute = productAttributeService.updateProductAttribute(existingAttribute);
        return ResponseEntity.ok(updatedAttribute);
    }
    // Méthode pour obtenir tous les attributs produits
    @GetMapping("/attribut/list")
    public ResponseEntity<List<ProductAttribute>> getAllProductAttributes() {
        return ResponseEntity.ok(productAttributeService.getAllProductAttribute());
    }

    @GetMapping("/attribut/product/list")
    public ResponseEntity<List<ProductAttribute>> getAllProductProductByAttribut() {

        // Filtrer les attributs des produits
        List<ProductAttribute> allAttributes = productAttributeService.getAllProductAttribute();
        List<ProductAttribute> filteredAttributes = allAttributes.stream()
                .filter(attr -> attr.getQte() > 0) // Garde seulement les attributs avec quantité > 0
                .collect(Collectors.toList());

        return ResponseEntity.ok(filteredAttributes);
    }

    // Méthode pour obtenir les attributs produits par utilisateur
    @GetMapping("/attribut/user")
    public ResponseEntity<List<ProductAttribute>> getAllProductAttributesByUser(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        List<ProductAttribute> productAttributes = productAttributeService.getproductattributeByUserId(user.getId());
        return ResponseEntity.ok(productAttributes);
    }

    // Méthode pour obtenir un attribut produit par ID
    @GetMapping("/attribut/{id}")
    public ResponseEntity<ProductAttribute> getProductAttributeById(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<ProductAttribute> attribute = productAttributeService.getProductAttributeById(id);
        return attribute.map(ResponseEntity::ok)
                        .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // Méthode pour supprimer un attribut produit
    @DeleteMapping("/attribut/delete/{id}")
    public ResponseEntity<?> deleteProductAttribute(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {

        // Extraire et valider le token JWT
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token non fourni ou invalide");
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Utilisateur non trouvé");
        }

        // Vérifier si l'attribut existe
        Optional<ProductAttribute> existingAttribute = productAttributeService.getProductAttributeById(id);
        if (existingAttribute.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Attribut non trouvé");
        }

        // Vérifier que l'utilisateur a le droit de supprimer cet attribut
        if (!existingAttribute.get().getUser().equals(user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Vous n'avez pas la permission de supprimer cet attribut");
        }

        // Supprimer l'attribut
        productAttributeService.deleteProductAttributeById(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @Autowired
    private ShopAddressService shopAddressService;
    
    @PostMapping("/address/create")
    public ResponseEntity<?> createShopAddress(
            @RequestBody ShopAddresses shopAddressDto,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7); // Assumption of "Bearer " prefix
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Utilisateur non trouvé");
        }

        ShopAddresses shopAddress = new ShopAddresses();
        shopAddress.setUser(user);
        shopAddress.setAddress(shopAddressDto.getAddress());
        shopAddress.setEmail(shopAddressDto.getEmail());
        shopAddress.setCity(shopAddressDto.getCity());
        shopAddress.setState(shopAddressDto.getState());
        shopAddress.setCountry(shopAddressDto.getCountry());
        shopAddress.setZipcode(shopAddressDto.getZipcode());
        shopAddress.setPhone(shopAddressDto.getPhone());
        shopAddress.setCardname(shopAddressDto.getCardname());
        shopAddress.setCardnum(shopAddressDto.getCardnum());
        shopAddress.setCardexp(shopAddressDto.getCardexp());
        shopAddress.setCvv(shopAddressDto.getCvv());
        shopAddress.setStatus(shopAddressDto.getStatus());

        ShopAddresses savedShopAddress = shopAddressService.saveShopAddress(shopAddress);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedShopAddress);
    }

    // Get all shop addresses by user ID
    @GetMapping("/address/user")
    public ResponseEntity<List<ShopAddresses>> getShopAddressesByUserId(
            @RequestHeader("Authorization") String authHeader) {
        
        String token = authHeader.substring(7); // Supposition de préfixe "Bearer "
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.emptyList()); // Retourne une liste vide
        }

        List<ShopAddresses> addresses = shopAddressService.getShopAddressesByUserId(user.getId());
        return ResponseEntity.ok(addresses);
    }

    // Get a shop address by ID
    @GetMapping("address/{id}")
    public ResponseEntity<?> getShopAddressById(@PathVariable Long id) {
        ShopAddresses shopAddress = shopAddressService.getShopAddressById(id);
        if (shopAddress == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Adresse de magasin non trouvée");
        }
        return ResponseEntity.ok(shopAddress);
    }

    // Update a shop address
    @PutMapping("address/{id}/update")
    public ResponseEntity<?> updateShopAddress(@PathVariable Long id, @RequestBody ShopAddresses shopAddressDto) {
        ShopAddresses existingShopAddress = shopAddressService.getShopAddressById(id);
        if (existingShopAddress == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Adresse de magasin non trouvée");
        }

        existingShopAddress.setAddress(shopAddressDto.getAddress());
        existingShopAddress.setEmail(shopAddressDto.getEmail());
        existingShopAddress.setCity(shopAddressDto.getCity());
        existingShopAddress.setState(shopAddressDto.getState());
        existingShopAddress.setCountry(shopAddressDto.getCountry());
        existingShopAddress.setZipcode(shopAddressDto.getZipcode());
        existingShopAddress.setPhone(shopAddressDto.getPhone());
        existingShopAddress.setCardname(shopAddressDto.getCardname());
        existingShopAddress.setCardnum(shopAddressDto.getCardnum());
        existingShopAddress.setCardexp(shopAddressDto.getCardexp());
        existingShopAddress.setCvv(shopAddressDto.getCvv());
        existingShopAddress.setStatus(shopAddressDto.getStatus());

        ShopAddresses updatedShopAddress = shopAddressService.saveShopAddress(existingShopAddress);
        return ResponseEntity.ok(updatedShopAddress);
    }

    // Delete a shop address
    @DeleteMapping("address/{id}/delete")
    public ResponseEntity<?> deleteShopAddress(@PathVariable Long id) {
        boolean isRemoved = shopAddressService.deleteShopAddress(id);
        if (!isRemoved) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Adresse de magasin non trouvée");
        }
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
    
    
    
    
    
    
    
    
    
    
    
    
    @Autowired
    private OrderService orderService;

    @Autowired
    private CartOrderItemsService cartOrderItemsService;
    
    @PostMapping("/order/create")
    public ResponseEntity<?> addItemsToOrder(
            @Valid @RequestBody List<CartOrderItems> items,
            @RequestHeader("Authorization") String authHeader) {
        try {
            // Extraction du token JWT
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token JWT manquant ou invalide");
            }
            String token = authHeader.substring(7); // Supposition du préfixe "Bearer "
            String usernameFromToken = jwtUtil.extractUsername(token);
            User user = userService.findByUsername(usernameFromToken);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Utilisateur non trouvé");
            }

            // Créer la commande avec les articles
            Order order = orderService.createOrderWithItems(user, items);

            return new ResponseEntity<>(order, HttpStatus.CREATED);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'ajout des éléments au panier: " + e.getMessage());
        }
    }
    /*    @Autowired
    private AiService chatService;
	        
  @PostMapping("/chat")
  public ResponseEntity<?> chat(@RequestBody String message, @RequestHeader Map<String, String> headers) {
      System.out.println("Received headers: " + headers);
    
      String authHeader = headers.get("Authorization");

      if (authHeader == null || !authHeader.startsWith("Bearer ")) {
          System.out.println("Missing or invalid Authorization header.");
          return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token non fourni ou invalide");
      }

      String token = authHeader.substring(7);
      System.out.println("Extracted JWT token: " + token);

      try {
          String usernameFromToken = jwtUtil.extractUsername(token);
          System.out.println("Username from JWT: " + usernameFromToken);
        
          User user = userService.findByUsername(usernameFromToken);
          if (user == null) {
              System.out.println("User not found.");
              return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Utilisateur non trouvé");
          }

          String response = chatService.getChatResponse(message);
          return ResponseEntity.ok(response);
      } catch (Exception e) {
          System.out.println("Error parsing JWT or other error: " + e.getMessage());
          return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur interne du serveur");
      }
  }
  
@Value("${app.domain}")
private String domain;

@GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
public String generateSitemap() {
    List<Product> products = productService.getAllProducts();
    List<Category> categories = categoryService.getAllCategories();

    StringBuilder sitemap = new StringBuilder();
    sitemap.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")
           .append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");

    // Page d'accueil
    sitemap.append("<url><loc>").append(domain).append("/</loc></url>");

    // Pages statiques
    String[] staticPages = {"/register", "/settings", "/product", "/categories", "/brand", "/color", "/size", "/length", "/attribut", "/address", "/liste", "/cart", "/api/robots.txt"};
    for (String page : staticPages) {
        sitemap.append("<url><loc>").append(domain).append(page).append("</loc></url>");
    }

    // Produits dynamiques
    for (Product product : products) {
        sitemap.append("<url><loc>")
               .append(domain)
               .append("/product/")
               .append(product.getSlug()) // Vérifiez que getSlug() renvoie bien une URL valide
               .append("</loc></url>");
    }

    // Catégories dynamiques
    for (Category category : categories) {
        sitemap.append("<url><loc>")
               .append(domain)
               .append("/category/")
               .append(category.getSlug()) // Vérifiez que getSlug() renvoie bien une URL valide
               .append("</loc></url>");
    }

    sitemap.append("</urlset>");
    return sitemap.toString();
}


  @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
  public String getRobotsTxt() {
      return "User-agent: *\n" +
             "Disallow: /admin/\n" +
             "Allow: /\n" +
             "Sitemap: " + domain + "/api/sitemap.xml"; // Utilisation du domaine ici
  }*/
}
