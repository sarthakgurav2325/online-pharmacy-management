
package PharmacyManagement.repository;

import PharmacyManagement.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {

    List<Customer> findByFullNameContainingIgnoreCase(String fullName);

    List<Customer> findByPhoneContaining(String phone);

    Optional<Customer> findByEmail(String email);
}
