package com.cognitiex.school.controller;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cognitiex.school.config.JwtUtil;
import com.cognitiex.school.models.Brand;
import com.cognitiex.school.models.Category;
import com.cognitiex.school.models.Product;
import com.cognitiex.school.models.ProductAttribute;
import com.cognitiex.school.models.User;
import com.cognitiex.school.services.AuthService;
import com.cognitiex.school.services.BrandService;
import com.cognitiex.school.services.CategoryService;
import com.cognitiex.school.services.HandleFileUpload;
import com.cognitiex.school.services.ImageService;
import com.cognitiex.school.services.JwtTokenRefreshService;
import com.cognitiex.school.services.ProductAttributeService;
import com.cognitiex.school.services.ProductService;
import com.cognitiex.school.services.UserService;

@RestController
@RequestMapping("/api")
public class ProductController {
	

	private static final Logger logger = LoggerFactory.getLogger(AuthenticationController.class);
    @Autowired
    private CategoryService categoryService;

    @Autowired
    private ImageService imageService;
    
    @Autowired
    private HandleFileUpload handleFileUpload;

    @Autowired
    private BrandService brandService;
    
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @Autowired
    private ProductService productService;
    
    @Autowired
    private AuthService authService;

    @Autowired
	private ProductAttributeService productAttributeService;
    
    @GetMapping("products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }
    
    @GetMapping("/products/user")
    public ResponseEntity<List<Product>> getProductByUserId(
            @RequestHeader("Authorization") String authHeader) {
        
        String token = authHeader.substring(7); // Supposition de préfixe "Bearer "
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.emptyList()); // Retourne une liste vide
        }

        List<Product> product = productService.getproductByUserId(user.getId());
        return ResponseEntity.ok(product);
    }

    @PostMapping(value="products/create",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createProduct(
            @RequestParam Map<String, String> requestBody,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam(value = "brandId") Long brandId, 
            @RequestPart(value = "gltfPath", required = false) MultipartFile gltfPath,
            @RequestPart(value = "binPath", required = false) MultipartFile binPath,
            @RequestPart(value = "texturePath", required = false) MultipartFile texturePath,
            @RequestHeader("Authorization") String authHeader) {

    	User user = authService.validateTokenAndGetUser(authHeader);
        if (categoryId == null || brandId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Catégorie ou marque non spécifiée");
        }

        // Création de l'objet Product à partir des données envoyées
        Product product = new Product();
        product.setTitle(requestBody.get("title")); // Directly mapping title from requestBody
        product.setSlug(requestBody.get("slug"));

        product.setCategory(categoryService.getCategoryById(categoryId).orElse(null));
        product.setBrand(brandService.getBrandById(brandId).orElse(null));
        product.setSpecs(requestBody.get("specs")); // Directly mapping specs
        product.setStatus(Boolean.parseBoolean(requestBody.get("status"))); // Safely parse the status
        product.setIsFeatured(Boolean.parseBoolean(requestBody.get("isFeatured"))); // Safely parse the isFeatured

        handleFileUpload.handleFileUpload(gltfPath, product::setGltfPath, "gltf");
        handleFileUpload.handleFileUpload(texturePath, product::setTexturePath, "texture");
        handleFileUpload.handleFileUpload(binPath, product::setBinPath, "bin");

        // Convertir les chaînes en LocalDate
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        try {
            String debutStr = requestBody.get("debut");
            String finStr = requestBody.get("fin");
            
            if (debutStr != null && !debutStr.isEmpty()) {
                product.setDebut(LocalDate.parse(debutStr, formatter));
            }
            
            if (finStr != null && !finStr.isEmpty()) {
                product.setFin(LocalDate.parse(finStr, formatter));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur de parsing des dates");
        }

        // Set default values for status and isFeatured
        product.setStatus(product.getStatus() != null ? product.getStatus() : false);
        product.setIsFeatured(product.getIsFeatured() != null ? product.getIsFeatured() : false);

        product.setUser(user);
        Product savedProduct = productService.saveProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }
    @PutMapping(value="products/update/{id}",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProduct(
            @PathVariable("id") Long productId,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam(value = "brandId") Long brandId,
            @RequestPart(value = "gltfPath", required = false) MultipartFile gltfPath,
            @RequestPart(value = "binPath", required = false) MultipartFile binPath,
            @RequestPart(value = "texturePath", required = false) MultipartFile texturePath,
            @RequestParam Map<String, String> requestBody, 
            @RequestHeader("Authorization") String authHeader) {

        // Extraire le token d'authentification
        String token = authHeader.substring(7); // Assumption of "Bearer " prefix
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        // Vérifier si le produit existe
        Optional<Product> optionalProduct = productService.getProductById(productId);
        if (optionalProduct.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Product existingProduct = optionalProduct.get();
        existingProduct.setTitle(requestBody.get("title")); // Direct mapping title from requestBody
        existingProduct.setSlug(requestBody.get("slug"));
        existingProduct.setCategory(categoryService.getCategoryById(categoryId).orElse(null));
        existingProduct.setBrand(brandService.getBrandById(brandId).orElse(null));
        existingProduct.setSpecs(requestBody.get("specs")); // Direct mapping specs
        existingProduct.setStatus(Boolean.parseBoolean(requestBody.get("status"))); // Safely parse the status
        existingProduct.setIsFeatured(Boolean.parseBoolean(requestBody.get("isFeatured"))); // Safely parse the isFeatured

        // Gérer le téléchargement de fichiers
        handleFileUpload.handleFileUpload(gltfPath, existingProduct::setGltfPath, "gltf");
        handleFileUpload.handleFileUpload(texturePath, existingProduct::setTexturePath, "texture");
        handleFileUpload.handleFileUpload(binPath, existingProduct::setBinPath, "bin");

        // Convertir les chaînes en LocalDate
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        try {
            String debutStr = requestBody.get("debut");
            String finStr = requestBody.get("fin");
            
            if (debutStr != null && !debutStr.isEmpty()) {
                existingProduct.setDebut(LocalDate.parse(debutStr, formatter));
            }
            
            if (finStr != null && !finStr.isEmpty()) {
                existingProduct.setFin(LocalDate.parse(finStr, formatter));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur de parsing des dates");
        }

        // Définir des valeurs par défaut pour status et isFeatured
        existingProduct.setStatus(existingProduct.getStatus() != null ? existingProduct.getStatus() : false);
        existingProduct.setIsFeatured(existingProduct.getIsFeatured() != null ? existingProduct.getIsFeatured() : false);

        existingProduct.setUser(user);
        Product updatedProduct = productService.saveProduct(existingProduct);
        return ResponseEntity.ok(updatedProduct);
    }

    @DeleteMapping("products/delete/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable("id") Long productId, 
            @RequestHeader("Authorization") String authHeader) {
        
        String token = authHeader.substring(7); // Assumption of "Bearer " prefix
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        // Utilisation de Optional pour obtenir le produit
        Optional<Product> optionalProduct = productService.getProductById(productId);
        if (optionalProduct.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Product existingProduct = optionalProduct.get();

        // Vérifier que le produit appartient à l'utilisateur ou que l'utilisateur est administrateur
        if (!existingProduct.getUser().equals(user)) { // Vous pouvez également ajouter la vérification pour l'administrateur si nécessaire
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
      //&& !user.isAdmin())
        productService.deleteProduct(productId);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("products/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable("id") Long id) {
        Optional<Product> product = productService.getProductById(id);
        return product.map(ResponseEntity::ok)
                      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));
    }

    @GetMapping("/products/detail/{slug}")
    public ResponseEntity<?> getProductWithAttributes(@PathVariable String slug) {
        Product product = productService.getProductBySlug(slug);
        
        if (product != null) { // Vérifiez si le produit est trouvé
            List<ProductAttribute> attributes = productAttributeService.getAttributesByProduct(product);
            Map<String, Object> response = new HashMap<>();
            response.put("product", product);
            response.put("attributes", attributes);
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build(); // Si le produit n'est pas trouvé, retourner 404
        }
    }

    
    @GetMapping("/brand/liste")
    public ResponseEntity<List<Brand>> getAllBrand(@RequestHeader("Authorization") String authHeader){
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<Brand> brands= brandService.getAllBrands();
        return ResponseEntity.ok(brands);
    }

    @GetMapping("/brand/{id}")
    public ResponseEntity<Brand> getBrandById(@PathVariable("id") Long id, @RequestHeader("Authorization") String authHeader){
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Optional<Brand> brand=brandService.getBrandById(id);
        return brand.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
    
    @PostMapping(value="/brand/create",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Brand> createBrand(
            @RequestParam("title") String title,
            @RequestParam("slug") String slug,
            @RequestParam("specs") String specs,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        Brand brand = new Brand();
        brand.setTitle(title);
        brand.setSlug(slug);
        brand.setSpecs(specs);
        
        if (image != null && !image.isEmpty()) {
            try {
                String imagePath = imageService.uploadImage(image);
                brand.setImagePath(imagePath);
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
        
        Brand savedBrand = brandService.createBrand(brand);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedBrand);
    }
    
    
    
    @PutMapping(value="/brand/update/{id}",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Brand> updateBrand(
            @PathVariable("id") Long id,
            @RequestParam("title") String title,
            @RequestParam("slug") String slug,
            @RequestParam("specs") String specs,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Brand> brandOptional = brandService.getBrandById(id);
        if (!brandOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Brand existingBrand = brandOptional.get();
        existingBrand.setTitle(title);
        existingBrand.setSlug(slug);
        existingBrand.setSpecs(specs);

        if (image != null && !image.isEmpty()) {
            try {
                String imagePath = imageService.uploadImage(image);
                existingBrand.setImagePath(imagePath);
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }

        Brand updatedBrand = brandService.updateBrand(id, existingBrand);
        return ResponseEntity.ok(updatedBrand);
    }

    @DeleteMapping("/brand/delete/{id}")
    public ResponseEntity<Void> deleteBrand(@PathVariable("id") Long id, @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        brandService.deleteBrand(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories/liste")
    public ResponseEntity<List<Category>> getAllCategories(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<Category> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable("id") Long id, @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Category> category = categoryService.getCategoryById(id);
        return category.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping(value="/categories/create" ,consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Category> createCategory(
            @RequestParam("title") String title,
            @RequestParam("slug") String slug,
            @RequestParam("specs") String specs,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Category category = new Category();
        category.setTitle(title);
        category.setSlug(slug);
        category.setSpecs(specs);

        if (image != null && !image.isEmpty()) {
            try {
                String imagePath = imageService.uploadImage(image);
                category.setImagePath(imagePath);
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }

        Category savedCategory = categoryService.createCategory(category);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCategory);
    }

    @PutMapping(value="/categories/update/{id}",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Category> updateCategory(
            @PathVariable("id") Long id,
            @RequestParam("title") String title,
            @RequestParam("slug") String slug,
            @RequestParam("specs") String specs,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestHeader("Authorization") String authHeader) {

             logger.debug("start update.");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        logger.debug("check authHeader.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
          logger.debug("check user.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

          logger.debug("get category by id");
        Optional<Category> categoryOptional = categoryService.getCategoryById(id);
        if (!categoryOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }


        Category existingCategory = categoryOptional.get();
        existingCategory.setTitle(title);
        existingCategory.setSlug(slug);
        existingCategory.setSpecs(specs);

          logger.debug("check image.");
          if (image != null && !image.isEmpty()) {
        	    logger.debug("Uploading image.");
        	    try {
        	        String imagePath = imageService.uploadImage(image);
        	        existingCategory.setImagePath(imagePath);
        	    } catch (IOException e) {
        	        logger.error("Failed to upload image: " + e.getMessage());
        	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        	    }
        	}

        Category updatedCategory = categoryService.updateCategory(id, existingCategory);
        return ResponseEntity.ok(updatedCategory);
    }

    @DeleteMapping("/categories/delete/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable("id") Long id, @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = authHeader.substring(7);
        String usernameFromToken = jwtUtil.extractUsername(token);
        User user = userService.findByUsername(usernameFromToken);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

}
