
package PharmacyManagement.controller;

import PharmacyManagement.entity.Category;
import PharmacyManagement.service.CategoryService;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "http://localhost:5173")
public class CategoryController {

    private final CategoryService service;

    public CategoryController(CategoryService service) {
        this.service = service;
    }

    // Get all categories
    @GetMapping
    public List<Category> getAllCategories() {
        return service.getAllCategories();
    }

    // Add category
    @PostMapping
    public Category addCategory(@RequestBody Category category) {
        return service.addCategory(category);
    }

    // Update category
    @PutMapping("/{id}")
    public Category updateCategory(
            @PathVariable Integer id,
            @RequestBody Category category) {

        return service.updateCategory(id, category);
    }

    // Delete category
    @DeleteMapping("/{id}")
    public String deleteCategory(@PathVariable Integer id) {
        service.deleteCategory(id);
        return "Category deleted successfully";
    }
}
