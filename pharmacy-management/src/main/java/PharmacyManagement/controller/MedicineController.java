
package PharmacyManagement.controller;

import PharmacyManagement.dto.MedicineRequest;
import PharmacyManagement.entity.Medicine;
import PharmacyManagement.service.MedicineService;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/medicines")
@CrossOrigin(origins = "http://localhost:5173")
public class MedicineController {

    private final MedicineService service;

    public MedicineController(MedicineService service) {
        this.service = service;
    }

    // Get all medicines
    @GetMapping
    public List<Medicine> getAllMedicines() {
        return service.getAllMedicines();
    }

    // Get medicine by ID
    @GetMapping("/{id}")
    public Medicine getMedicine(@PathVariable Integer id) {
        return service.getMedicineById(id);
    }

    // Search medicine
    @GetMapping("/search")
    public List<Medicine> searchMedicines(
            @RequestParam String name) {

        return service.searchMedicines(name);
    }

    // Get medicines by category
    @GetMapping("/category/{categoryId}")
    public List<Medicine> getByCategory(
            @PathVariable Integer categoryId) {

        return service.getByCategory(categoryId);
    }

    // Get low-stock medicines
    @GetMapping("/low-stock")
    public List<Medicine> getLowStock(
            @RequestParam(defaultValue = "10") Integer limit) {

        return service.getLowStockMedicines(limit);
    }

    // Add medicine
    @PostMapping
    public Medicine addMedicine(
            @RequestBody MedicineRequest request) {

        return service.addMedicine(request);
    }

    // Update medicine
    @PutMapping("/{id}")
    public Medicine updateMedicine(
            @PathVariable Integer id,
            @RequestBody MedicineRequest request) {

        return service.updateMedicine(id, request);
    }

    // Delete medicine
    @DeleteMapping("/{id}")
    public String deleteMedicine(@PathVariable Integer id) {
        service.deleteMedicine(id);
        return "Medicine deleted successfully";
    }
}
