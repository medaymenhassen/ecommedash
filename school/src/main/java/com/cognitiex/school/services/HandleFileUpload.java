package com.cognitiex.school.services;

import java.io.IOException;
import java.util.function.Consumer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class HandleFileUpload {

    @Autowired
    private ImageService imageService;

    public void handleFileUpload(MultipartFile file, Consumer<String> setFilePath, String fileType) {
        if (file != null && !file.isEmpty()) {
            try {
                // Détermine le type de fichier et télécharge en conséquence
                String uploadedFilePath = fileType.equalsIgnoreCase("vidéo") 
                    ? imageService.uploadVideo(file) 
                    : imageService.uploadImage(file);

                // Affecte le chemin du fichier téléchargé en utilisant le Consumer
                setFilePath.accept(uploadedFilePath);
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                    "Erreur lors de l'upload de " + fileType + ": " + e.getMessage());
            }
        }
    }
}
