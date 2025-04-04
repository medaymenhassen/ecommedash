package com.cognitiex.school.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cognitiex.school.models.Length;
import com.cognitiex.school.repositories.LengthRepository;


@Service
public class LengthService {
	@Autowired
	private LengthRepository lengthRepository;
	
	public List<Length> getAllLength(){
		return lengthRepository.findAll();
	}
	
	public Length createLength(Length size) {
		return lengthRepository.save(size);
	}
	
	public void deleteLength(Long id) {
		lengthRepository.deleteById(id);
	}
	public Length updateLength(Long id, Length lengthDetails) {
		Optional<Length> lengthOptional= lengthRepository.findById(id);
		if(lengthOptional.isPresent()) {
			Length length=lengthOptional.get();
			length.setTitle(lengthDetails.getTitle());
			return lengthRepository.save(length);
		}else {
			throw new RuntimeException("length with id" +id +"not fund");
		}
	}
    public Optional<Length> getLengthById(Long id) {
        return lengthRepository.findById(id);
    }

}
