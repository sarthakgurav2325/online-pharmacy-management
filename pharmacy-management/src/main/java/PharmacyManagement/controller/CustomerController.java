
package PharmacyManagement.controller;

import PharmacyManagement.entity.Customer;
import PharmacyManagement.service.CustomerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "http://localhost:5173")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    // Get all customers
    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerService.getAllCustomers();
    }

    // Get customer by ID
    @GetMapping("/{id}")
    public Customer getCustomerById(@PathVariable Integer id) {
        return customerService.getCustomerById(id);
    }

    // Add customer
    @PostMapping
    public Customer addCustomer(@RequestBody Customer customer) {
        return customerService.addCustomer(customer);
    }

    // Update customer
    @PutMapping("/{id}")
    public Customer updateCustomer(
            @PathVariable Integer id,
            @RequestBody Customer customer) {
        return customerService.updateCustomer(id, customer);
    }

    // Delete customer
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Integer id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }

    // Search customers
    @GetMapping("/search")
    public List<Customer> searchCustomers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone) {
        return customerService.searchCustomers(name, phone);
    }
}
