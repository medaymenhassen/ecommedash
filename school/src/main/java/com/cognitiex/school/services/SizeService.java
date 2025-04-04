package com.cognitiex.school.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

import com.cognitiex.school.models.Size;
import com.cognitiex.school.repositories.SizeRepository;

@Service
public class SizeService {
	@Autowired
	private SizeRepository sizeRepository;
	
	public List<Size> getAllSize(){
		return sizeRepository.findAll();
	}
	
	public Size createSize(Size size) {
		return sizeRepository.save(size);
	}
	
	public void deleteSize(Long id) {
		sizeRepository.deleteById(id);
	}
	public Size updateSize(Long id, Size sizeDetails) {
		Optional<Size> sizeOptional= sizeRepository.findById(id);
		if(sizeOptional.isPresent()) {
			Size size=sizeOptional.get();
			size.setTitle(sizeDetails.getTitle());
			return sizeRepository.save(size);
		}else {
			throw new RuntimeException("size with id" +id +"not fund");
		}
	}
    public Optional<Size> getSizeById(Long id) {
        return sizeRepository.findById(id);
    }

}
