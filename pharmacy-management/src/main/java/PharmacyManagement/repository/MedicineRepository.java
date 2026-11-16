
package PharmacyManagement.repository;

import PharmacyManagement.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicineRepository
        extends JpaRepository<Medicine, Integer> {

    List<Medicine> findByNameContainingIgnoreCase(String name);

    List<Medicine> findByCategoryId(Integer categoryId);

    List<Medicine> findByStockLessThanEqual(Integer stock);
}
