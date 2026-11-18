
package PharmacyManagement.service;

import PharmacyManagement.entity.Order;
import PharmacyManagement.entity.OrderItem;
import PharmacyManagement.repository.OrderRepository;
import PharmacyManagement.repository.OrderItemRepository;
import PharmacyManagement.repository.CustomerRepository;
import PharmacyManagement.repository.MedicineRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerRepository customerRepository;
    private final MedicineRepository medicineRepository;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CustomerRepository customerRepository,
            MedicineRepository medicineRepository) {

        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.customerRepository = customerRepository;
        this.medicineRepository = medicineRepository;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order getOrderById(Integer id) {
        return orderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Order not found with ID: " + id));
    }

    public List<OrderItem> getOrderItems(Integer orderId) {
        getOrderById(orderId);
        return orderItemRepository.findByOrderId(orderId);
    }

    @Transactional
    public Order createOrder(Order order, List<OrderItem> items) {

        if (items == null || items.isEmpty()) {
            throw new RuntimeException("Order must contain at least one medicine");
        }

        Integer customerId = order.getCustomer().getId();

        var customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        order.setCustomer(customer);
        order.setTotalAmount(BigDecimal.ZERO);
        order.setStatus("PENDING");

        BigDecimal total = BigDecimal.ZERO;

        Order savedOrder = orderRepository.save(order);

        for (OrderItem item : items) {

            if (item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new RuntimeException("Medicine quantity must be greater than zero");
            }

            Integer medicineId = item.getMedicine().getId();

            var medicine = medicineRepository.findById(medicineId)
                    .orElseThrow(() -> new RuntimeException("Medicine not found"));

            if (medicine.getStock() == null ||
                    medicine.getStock() < item.getQuantity()) {
                throw new RuntimeException(
                        "Insufficient stock for medicine: " + medicine.getName());
            }

            BigDecimal price = medicine.getPrice();
            BigDecimal subtotal =
                    price.multiply(BigDecimal.valueOf(item.getQuantity()));

            item.setOrder(savedOrder);
            item.setMedicine(medicine);
            item.setPrice(price);
            item.setSubtotal(subtotal);

            medicine.setStock(medicine.getStock() - item.getQuantity());

            medicineRepository.save(medicine);
            orderItemRepository.save(item);

            total = total.add(subtotal);
        }

        savedOrder.setTotalAmount(total);

        return orderRepository.save(savedOrder);
    }

    // EDIT COMPLETE ORDER
    @Transactional
    public Order updateOrder(
            Integer id,
            Order updatedOrder,
            List<OrderItem> updatedItems) {

        Order existingOrder = getOrderById(id);

        if (updatedItems == null || updatedItems.isEmpty()) {
            throw new RuntimeException(
                    "Order must contain at least one medicine");
        }

        if (updatedOrder.getCustomer() == null ||
                updatedOrder.getCustomer().getId() == null) {
            throw new RuntimeException("Please select a customer");
        }

        var customer = customerRepository.findById(
                updatedOrder.getCustomer().getId()
        ).orElseThrow(() ->
                new RuntimeException("Customer not found"));

        // Restore stock from the previous order items
        List<OrderItem> oldItems = orderItemRepository.findByOrderId(id);

        for (OrderItem oldItem : oldItems) {
            var medicine = oldItem.getMedicine();
            medicine.setStock(medicine.getStock() + oldItem.getQuantity());
            medicineRepository.save(medicine);
        }

        // Remove previous order items
        orderItemRepository.deleteAll(oldItems);

        BigDecimal total = BigDecimal.ZERO;

        // Update customer and shipping address
        existingOrder.setCustomer(customer);
        existingOrder.setShippingAddress(
                updatedOrder.getShippingAddress());

        // Update order status only if supplied
        if (updatedOrder.getStatus() != null &&
                !updatedOrder.getStatus().isBlank()) {
            existingOrder.setStatus(updatedOrder.getStatus());
        }

        // Save updated medicine items
        for (OrderItem item : updatedItems) {

            if (item.getQuantity() == null ||
                    item.getQuantity() <= 0) {
                throw new RuntimeException(
                        "Medicine quantity must be greater than zero");
            }

            if (item.getMedicine() == null ||
                    item.getMedicine().getId() == null) {
                throw new RuntimeException("Please select a medicine");
            }

            Integer medicineId = item.getMedicine().getId();

            var medicine = medicineRepository.findById(medicineId)
                    .orElseThrow(() ->
                            new RuntimeException("Medicine not found"));

            if (medicine.getStock() == null ||
                    medicine.getStock() < item.getQuantity()) {
                throw new RuntimeException(
                        "Insufficient stock for medicine: " +
                                medicine.getName());
            }

            BigDecimal price = medicine.getPrice();

            BigDecimal subtotal = price.multiply(
                    BigDecimal.valueOf(item.getQuantity()));

            item.setOrder(existingOrder);
            item.setMedicine(medicine);
            item.setPrice(price);
            item.setSubtotal(subtotal);

            medicine.setStock(
                    medicine.getStock() - item.getQuantity());

            medicineRepository.save(medicine);
            orderItemRepository.save(item);

            total = total.add(subtotal);
        }

        existingOrder.setTotalAmount(total);

        return orderRepository.save(existingOrder);
    }

    public Order updateOrderStatus(Integer id, String status) {

        Order order = getOrderById(id);

        order.setStatus(status);

        return orderRepository.save(order);
    }

    @Transactional
    public void deleteOrder(Integer id) {

        Order order = getOrderById(id);

        List<OrderItem> items = orderItemRepository.findByOrderId(id);

        for (OrderItem item : items) {
            var medicine = item.getMedicine();

            medicine.setStock(medicine.getStock() + item.getQuantity());

            medicineRepository.save(medicine);
        }

        orderItemRepository.deleteAll(items);
        orderRepository.delete(order);
    }
}
