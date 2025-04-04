package com.cognitiex.school.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.cognitiex.school.models.Color;
import com.cognitiex.school.repositories.ColorRepository;

@Service
public class ColorService {

    @Autowired
    private ColorRepository colorRepository;

    // Lister toutes les couleurs
    public List<Color> getAllColors() {
        return colorRepository.findAll();
    }

    // Obtenir une couleur par ID
    public Optional<Color> getColorById(Long id) {
        return colorRepository.findById(id);
    }

    // Créer une nouvelle couleur
    public Color createColor(Color color) {
        // Vérification de l'existence d'une combinaison existante
        if (colorRepository.existsByColorCodeAndMission(color.getColorCode(), color.getMission())) {
            throw new RuntimeException("Une couleur avec cette combinaison de code couleur et de mission existe déjà.");
        }
        
        try {
            return colorRepository.save(color);
        } catch (DataIntegrityViolationException e) {
            throw new RuntimeException("Erreur lors de la création de la couleur.");
        }
    }


    public Color updateColor(Long id, Color colorDetails) {
        Optional<Color> colorOptional = colorRepository.findById(id);
        if (colorOptional.isPresent()) {
            Color color = colorOptional.get();
            color.setTitle(colorDetails.getTitle());
            color.setColorCode(colorDetails.getColorCode());
            try {
                return colorRepository.save(color);
            } catch (DataIntegrityViolationException e) {
                throw new RuntimeException("Le titre et le code couleur doivent être uniques ensemble.");
            }
        } else {
            throw new RuntimeException("Color with id " + id + " not found");
        }
    }


    // Supprimer une couleur par ID
    public void deleteColor(Long id) {
        colorRepository.deleteById(id);
    }
}