
package PharmacyManagement.service;

import PharmacyManagement.entity.Customer;
import PharmacyManagement.repository.CustomerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Customer getCustomerById(Integer id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with ID: " + id));
    }

    public Customer addCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    public Customer updateCustomer(Integer id, Customer customerDetails) {
        Customer customer = getCustomerById(id);

        customer.setFullName(customerDetails.getFullName());
        customer.setEmail(customerDetails.getEmail());
        customer.setPhone(customerDetails.getPhone());
        customer.setAddress(customerDetails.getAddress());

        return customerRepository.save(customer);
    }

    public void deleteCustomer(Integer id) {
        Customer customer = getCustomerById(id);
        customerRepository.delete(customer);
    }

    public List<Customer> searchCustomers(String name, String phone) {

        if (name != null && !name.trim().isEmpty()) {
            return customerRepository.findByFullNameContainingIgnoreCase(name.trim());
        }

        if (phone != null && !phone.trim().isEmpty()) {
            return customerRepository.findByPhoneContaining(phone.trim());
        }

        return customerRepository.findAll();
    }
}
