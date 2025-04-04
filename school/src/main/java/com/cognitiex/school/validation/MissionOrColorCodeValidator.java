package com.cognitiex.school.validation;

import com.cognitiex.school.models.Color;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class MissionOrColorCodeValidator implements ConstraintValidator<MissionOrColorCode, Color> {

    @Override
    public boolean isValid(Color color, ConstraintValidatorContext context) {
        boolean isMissionFilled = color.getMission() != null && !color.getMission().isEmpty();
        boolean isColorCodeFilled = color.getColorCode() != null && !color.getColorCode().isEmpty();

        // Valide que l'un des deux champs est rempli, mais pas les deux ni aucun
        return (isMissionFilled || isColorCodeFilled) && !(isMissionFilled && isColorCodeFilled);
    }
}
