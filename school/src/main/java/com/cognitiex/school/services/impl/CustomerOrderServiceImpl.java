package com.cognitiex.school.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cognitiex.school.models.CustomerOrder;
import com.cognitiex.school.repositories.CustomerOrderRepositiory;
import com.cognitiex.school.services.CustomerOrderService;

@Service
public class CustomerOrderServiceImpl implements CustomerOrderService {

    private final CustomerOrderRepositiory customerOrderRepository;

    @Autowired
    public CustomerOrderServiceImpl(CustomerOrderRepositiory customerOrderRepository) {
        this.customerOrderRepository = customerOrderRepository;
    }

    @Override
    public CustomerOrder createCustomerOrder(CustomerOrder customerOrder) {
        return customerOrderRepository.save(customerOrder);
    }

    @Override
    public CustomerOrder getCustomerOrderById(Long id) {
        Optional<CustomerOrder> order = customerOrderRepository.findById(id);
        if (order.isPresent()) {
            return order.get();
        } else {
            throw new RuntimeException("Customer order not found with ID: " + id);
        }
    }

    @Override
    public List<CustomerOrder> getOrdersByUserId(Long userId) {
        return customerOrderRepository.findByUserId(userId);
    }

    @Override
    public CustomerOrder updateCustomerOrder(Long id, CustomerOrder updatedCustomerOrder) {
        CustomerOrder existingCustomerOrder = getCustomerOrderById(id);

        existingCustomerOrder.setPaidStatus(updatedCustomerOrder.getPaidStatus());
        existingCustomerOrder.setTotalAmt(updatedCustomerOrder.getTotalAmt());
        existingCustomerOrder.setStatusConversion(updatedCustomerOrder.getStatusConversion());
        existingCustomerOrder.setTypeSales(updatedCustomerOrder.getTypeSales());
        existingCustomerOrder.setUser(updatedCustomerOrder.getUser());
        existingCustomerOrder.setCreated(updatedCustomerOrder.getCreated());
        existingCustomerOrder.setOrderStatus(updatedCustomerOrder.getOrderStatus());

        return customerOrderRepository.save(existingCustomerOrder);
    }

    @Override
    public void deleteCustomerOrder(Long id) {
        if (!customerOrderRepository.existsById(id)) {
            throw new RuntimeException("Cannot delete. Customer order not found with ID: " + id);
        }
        customerOrderRepository.deleteById(id);
    }
}
