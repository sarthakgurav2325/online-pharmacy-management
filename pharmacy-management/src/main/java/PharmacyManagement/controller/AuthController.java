
package PharmacyManagement.controller;

import PharmacyManagement.entity.User;
import PharmacyManagement.entity.Customer;
import PharmacyManagement.repository.UserRepository;
import PharmacyManagement.repository.CustomerRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            UserRepository userRepository,
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // CUSTOMER REGISTRATION
    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request) {

        if (request.fullName() == null || request.fullName().isBlank()
                || request.email() == null || request.email().isBlank()
                || request.password() == null || request.password().isBlank()
                || request.phone() == null || request.phone().isBlank()) {

            return ResponseEntity.badRequest()
                    .body(Map.of("message", "All fields are required"));
        }

        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email already registered"));
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setPhone(request.phone().trim());
        user.setRole("ROLE_CUSTOMER");

        userRepository.save(user);

        Customer customer = new Customer();
        customer.setFullName(request.fullName().trim());
        customer.setEmail(email);
        customer.setPhone(request.phone().trim());

        customerRepository.save(customer);

        return ResponseEntity.ok(
                Map.of("message", "Registration successful")
        );
    }

    // FIRST ADMIN REGISTRATION
@PostMapping("/register-admin")
@Transactional
public ResponseEntity<?> registerAdmin(
        @RequestBody AdminRegisterRequest request) {

    if (request.fullName() == null || request.fullName().isBlank()
            || request.email() == null || request.email().isBlank()
            || request.password() == null || request.password().isBlank()
            || request.phone() == null || request.phone().isBlank()) {

        return ResponseEntity.badRequest()
                .body(Map.of("message", "All fields are required"));
    }

    if (request.password().length() < 8) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", "Password must contain at least 8 characters"));
    }

    // Allow public creation only for the first admin
    if (userRepository.existsByRole("ROLE_ADMIN")) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Admin account already exists"));
    }

    String email = request.email().trim().toLowerCase();

    if (userRepository.existsByEmail(email)) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "Email already registered"));
    }

    User admin = new User();
    admin.setFullName(request.fullName().trim());
    admin.setEmail(email);
    admin.setPassword(passwordEncoder.encode(request.password()));
    admin.setPhone(request.phone().trim());
    admin.setRole("ROLE_ADMIN");

    userRepository.save(admin);

    return ResponseEntity.ok(
            Map.of("message", "Admin account created successfully")
    );
}

    // ADMIN AND CUSTOMER LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        if (request.email() == null || request.password() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email and password are required"));
        }

        String email = request.email().trim().toLowerCase();

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null ||
                !passwordEncoder.matches(request.password(), user.getPassword())) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }

        String role = user.getRole();

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        null,
                        List.of(new SimpleGrantedAuthority(role))
                );

        SecurityContext context =
                SecurityContextHolder.createEmptyContext();

        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        new HttpSessionSecurityContextRepository()
                .saveContext(context, httpRequest, httpResponse);

        return ResponseEntity.ok(
                Map.of(
                        "email", user.getEmail(),
                        "fullName", user.getFullName(),
                        "role", role
                )
        );
    }

    // CHECK CURRENT LOGGED-IN USER
    
// CHECK CURRENT LOGGED-IN USER
@GetMapping("/me")
public ResponseEntity<?> currentUser() {

    Authentication authentication =
            SecurityContextHolder.getContext().getAuthentication();

    if (authentication == null ||
            !authentication.isAuthenticated() ||
            "anonymousUser".equals(authentication.getPrincipal())) {

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Not logged in"));
    }

    User user = userRepository
            .findByEmail(authentication.getName())
            .orElse(null);

    if (user == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "User not found"));
    }

    if ("ROLE_CUSTOMER".equals(user.getRole())) {

        Customer customer = customerRepository
                .findByEmail(user.getEmail())
                .orElse(null);

        if (customer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Customer record not found"));
        }

        return ResponseEntity.ok(
                Map.of(
                        "id", customer.getId(),
                        "email", user.getEmail(),
                        "fullName", user.getFullName(),
                        "role", user.getRole(),
                        "phone", customer.getPhone(),
                        "address", customer.getAddress() == null
                                ? "" : customer.getAddress()
                )
        );
    }

    return ResponseEntity.ok(
            Map.of(
                    "email", user.getEmail(),
                    "fullName", user.getFullName(),
                    "role", user.getRole()
            )
    );
}


    // LOGOUT
    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            HttpServletRequest request) {

        SecurityContextHolder.clearContext();

        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }

        return ResponseEntity.ok(
                Map.of("message", "Logout successful")
        );
    }

    public record RegisterRequest(
            String fullName,
            String email,
            String password,
            String phone
    ) {}

    public record LoginRequest(
            String email,
            String password
    ) {}

    public record AdminRegisterRequest(
        String fullName,
        String email,
        String password,
        String phone
) {}
}
