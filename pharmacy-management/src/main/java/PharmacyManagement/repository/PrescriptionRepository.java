
package PharmacyManagement.repository;

import PharmacyManagement.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Integer> {

    List<Prescription> findByCustomerIdOrderByUploadedAtDesc(Integer customerId);

    List<Prescription> findByStatusOrderByUploadedAtDesc(String status);
}
