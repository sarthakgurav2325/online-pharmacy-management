
package PharmacyManagement.service;

import PharmacyManagement.entity.Category;
import PharmacyManagement.repository.CategoryRepository;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository repository;

    public CategoryService(CategoryRepository repository) {
        this.repository = repository;
    }

    // Get all categories
    public List<Category> getAllCategories() {
        return repository.findAll();
    }

    // Add category
    public Category addCategory(Category category) {
        category.setId(null);
        return repository.save(category);
    }

    // Update category
    public Category updateCategory(Integer id, Category data) {

        Category category = repository.findById(id)
            .orElseThrow(() ->
                new RuntimeException("Category not found"));

        category.setCategoryName(data.getCategoryName());

        return repository.save(category);
    }

    // Delete category
    public void deleteCategory(Integer id) {

        if (!repository.existsById(id)) {
            throw new RuntimeException("Category not found");
        }

        repository.deleteById(id);
    }
}
