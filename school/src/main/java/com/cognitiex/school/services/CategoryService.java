package com.cognitiex.school.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cognitiex.school.models.Category;
import com.cognitiex.school.repositories.CategoryRepository;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    // CREATE
    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    // READ (Get All)
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // READ (Get by ID)
    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }

    // READ (Get by Slug)
    public Optional<Category> getCategoryBySlug(String slug) {
        return categoryRepository.findAll()
                                 .stream()
                                 .filter(category -> category.getSlug().equals(slug))
                                 .findFirst();
    }

    // UPDATE
    public Category updateCategory(Long id, Category updatedCategory) {
        Optional<Category> categoryOptional = categoryRepository.findById(id);
        if (categoryOptional.isPresent()) {
            Category category = categoryOptional.get();
            category.setTitle(updatedCategory.getTitle());
            category.setSlug(updatedCategory.getSlug());
            category.setSpecs(updatedCategory.getSpecs());
            category.setImagePath(updatedCategory.getImagePath());
            return categoryRepository.save(category);
        } else {
            return null; // Or throw an exception if needed
        }
    }

    // DELETE
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}