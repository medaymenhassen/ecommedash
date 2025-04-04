package com.cognitiex.school.services;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.UUID;

@Service
public class ImageService {

    private final String uploadDir = "../public/images/";  // Chemin vers le répertoire de ressources de Spring Boot
    private final String uploadDirVideos = "../public/videos/";

    public String uploadImage(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalStateException("Cannot upload empty file.");
        }

        // Vérifie si le répertoire existe, sinon il le crée
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);  // Crée le répertoire s'il n'existe pas
        }

        String originalFileName = file.getOriginalFilename();
        String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String newFileName = UUID.randomUUID().toString() + fileExtension;
        Path filePath = uploadPath.resolve(newFileName);

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return newFileName;  // Retourne le nouveau nom du fichier pour l'enregistrer dans l'entité Category
    }

    
    public String uploadVideo(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalStateException("Cannot upload empty file.");
        }

        // Vérifie si le répertoire existe, sinon il le crée
        Path uploadPath = Paths.get(uploadDirVideos);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);  // Crée le répertoire s'il n'existe pas
        }

        String originalFileName = file.getOriginalFilename();
        String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String newFileName = UUID.randomUUID().toString() + fileExtension;
        Path filePath = uploadPath.resolve(newFileName);

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return newFileName;  // Retourne le nouveau nom du fichier pour l'enregistrer
    }
    
        // Ajoutez l'annotation @Cacheable pour les méthodes de récupération
    @Cacheable("images")
    public byte[] getImage(String fileName) throws IOException {
        Path filePath = Paths.get(uploadDir + fileName);
        return Files.readAllBytes(filePath);
    }

    @Cacheable("videos")
    public byte[] getVideo(String fileName) throws IOException {
        Path filePath = Paths.get(uploadDirVideos + fileName);
        return Files.readAllBytes(filePath);
    }

}
