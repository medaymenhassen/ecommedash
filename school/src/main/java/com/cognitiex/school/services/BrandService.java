package com.cognitiex.school.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cognitiex.school.models.Brand;
import com.cognitiex.school.repositories.BrandRepository;

@Service
public class BrandService {
	@Autowired
	private BrandRepository brandRepository;
	
	public Brand createBrand(Brand brand) {
		return brandRepository.save(brand);
	}
	
	public List<Brand> getAllBrands() {
		return brandRepository.findAll();
	}
	
	public Optional<Brand> getBrandById(Long id){
		return brandRepository.findById(id);
	}
	
	public Optional<Brand> getBrandBySlug(String slug){
		return brandRepository.findAll()
				.stream()
				.filter(brand->brand.getSlug().equals(slug))
				.findFirst();
	}
	
	public Brand updateBrand(Long id, Brand updateBrand) {
		Optional<Brand> brandOptional=brandRepository.findById(id);
		if(brandOptional.isPresent()) {
			Brand brand=brandOptional.get();
			brand.setTitle(updateBrand.getTitle());
			brand.setSlug(updateBrand.getSlug());
			brand.setSpecs(updateBrand.getSpecs());
			brand.setImagePath(updateBrand.getImagePath());
			return brandRepository.save(brand);
		}else {
			return null;
		}
	}
	public void deleteBrand(Long id) {
		brandRepository.deleteById(id);
	}
}
