package com.cognitiex.school.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Constraint(validatedBy = MissionOrColorCodeValidator.class)
@Target({ ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
public @interface MissionOrColorCode {
    String message() default "Either mission or color_code must be filled, but not both";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
