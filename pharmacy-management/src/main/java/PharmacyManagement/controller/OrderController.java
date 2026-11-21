
package PharmacyManagement.controller;

import org.springframework.security.core.Authentication;

import PharmacyManagement.entity.Order;
import PharmacyManagement.entity.OrderItem;
import PharmacyManagement.entity.Customer;
import PharmacyManagement.entity.Medicine;
import PharmacyManagement.service.OrderService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/customer/{customerId}")
public List<Order> getCustomerOrders(
        @PathVariable Integer customerId) {

    return orderService.getCustomerOrders(customerId);
}


@GetMapping("/my")
public ResponseEntity<List<Order>> getMyOrders(
        Authentication authentication) {

    List<Order> orders =
            orderService.getMyOrders(authentication.getName());

    return ResponseEntity.ok(orders);
}


    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable Integer id) {
        return orderService.getOrderById(id);
    }

    @GetMapping("/{id}/items")
    public List<OrderItem> getOrderItems(@PathVariable Integer id) {
        return orderService.getOrderItems(id);
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(
            @RequestBody Map<String, Object> request) {

        Order order = new Order();

        Map<String, Object> customerData =
                (Map<String, Object>) request.get("customer");

        Customer customer = new Customer();
        customer.setId(
                Integer.valueOf(customerData.get("id").toString())
        );

        order.setCustomer(customer);
        order.setShippingAddress(
                (String) request.get("shippingAddress")
        );

        List<Map<String, Object>> itemsData =
                (List<Map<String, Object>>) request.get("items");

        List<OrderItem> items = itemsData.stream().map(data -> {

            OrderItem item = new OrderItem();

            Medicine medicine = new Medicine();
            medicine.setId(
                    Integer.valueOf(data.get("medicineId").toString())
            );

            item.setMedicine(medicine);
            item.setQuantity(
                    Integer.valueOf(data.get("quantity").toString())
            );

            return item;

        }).toList();

        return ResponseEntity.ok(
                orderService.createOrder(order, items)
        );
    }

    // EDIT COMPLETE ORDER
    @PutMapping("/{id}")
    public ResponseEntity<Order> updateOrder(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> request) {

        Order order = new Order();

        Map<String, Object> customerData =
                (Map<String, Object>) request.get("customer");

        Customer customer = new Customer();
        customer.setId(
                Integer.valueOf(customerData.get("id").toString())
        );

        order.setCustomer(customer);
        order.setShippingAddress(
                (String) request.get("shippingAddress")
        );

        if (request.get("status") != null) {
            order.setStatus(request.get("status").toString());
        }

        List<Map<String, Object>> itemsData =
                (List<Map<String, Object>>) request.get("items");

        List<OrderItem> items = itemsData.stream().map(data -> {

            OrderItem item = new OrderItem();

            Medicine medicine = new Medicine();
            medicine.setId(
                    Integer.valueOf(data.get("medicineId").toString())
            );

            item.setMedicine(medicine);
            item.setQuantity(
                    Integer.valueOf(data.get("quantity").toString())
            );

            return item;

        }).toList();

        return ResponseEntity.ok(
                orderService.updateOrder(id, order, items)
        );
    }

    @PutMapping("/{id}/status")
    public Order updateOrderStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> request) {

        return orderService.updateOrderStatus(
                id,
                request.get("status")
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteOrder(
            @PathVariable Integer id) {

        orderService.deleteOrder(id);

        return ResponseEntity.ok("Order deleted successfully");
    }
}
