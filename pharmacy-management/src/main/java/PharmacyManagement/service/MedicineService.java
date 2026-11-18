
package PharmacyManagement.service;

import PharmacyManagement.dto.MedicineRequest;
import PharmacyManagement.entity.Category;
import PharmacyManagement.entity.Medicine;
import PharmacyManagement.repository.CategoryRepository;
import PharmacyManagement.repository.MedicineRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final CategoryRepository categoryRepository;

    public MedicineService(
            MedicineRepository medicineRepository,
            CategoryRepository categoryRepository) {

        this.medicineRepository = medicineRepository;
        this.categoryRepository = categoryRepository;
    }

    // Display all medicines
    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    // Find medicine by ID
    public Medicine getMedicineById(Integer id) {
        return medicineRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Medicine not found"));
    }

    // Search medicine by name
    public List<Medicine> searchMedicines(String name) {
        return medicineRepository
            .findByNameContainingIgnoreCase(name);
    }

    // Filter medicines by category
    public List<Medicine> getByCategory(Integer categoryId) {
        return medicineRepository.findByCategoryId(categoryId);
    }

    // Display low-stock medicines
    public List<Medicine> getLowStockMedicines(Integer limit) {
        return medicineRepository.findByStockLessThanEqual(limit);
    }

    // Add medicine
    public Medicine addMedicine(MedicineRequest request) {

        Medicine medicine = new Medicine();
        copyRequest(request, medicine);

        return medicineRepository.save(medicine);
    }

    // Update medicine
    public Medicine updateMedicine(
            Integer id, MedicineRequest request) {

        Medicine medicine = getMedicineById(id);
        copyRequest(request, medicine);

        return medicineRepository.save(medicine);
    }

    // Delete medicine
    public void deleteMedicine(Integer id) {
        Medicine medicine = getMedicineById(id);
        medicineRepository.delete(medicine);
    }

    // Copy request information into medicine entity
    private void copyRequest(
            MedicineRequest request, Medicine medicine) {

        if (request.getName() == null ||
                request.getName().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Medicine name is required");
        }

        if (request.getPrice() == null ||
                request.getPrice().signum() < 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Valid price is required");
        }

        if (request.getStock() == null ||
                request.getStock() < 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Stock cannot be negative");
        }

        medicine.setName(request.getName());
        medicine.setDescription(request.getDescription());
        medicine.setManufacturer(request.getManufacturer());
        medicine.setBatchNumber(request.getBatchNumber());
        medicine.setPrice(request.getPrice());
        medicine.setStock(request.getStock());
        medicine.setExpiryDate(request.getExpiryDate());

        medicine.setPrescriptionRequired(
            request.getPrescriptionRequired() != null
                ? request.getPrescriptionRequired()
                : false
        );

        if (request.getCategoryId() != null) {

            Category category = categoryRepository
                .findById(request.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Category not found"));

            medicine.setCategory(category);

        } else {
            medicine.setCategory(null);
        }
    }
}
