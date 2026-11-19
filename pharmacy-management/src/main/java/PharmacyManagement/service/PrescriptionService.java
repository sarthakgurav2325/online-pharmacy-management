
package PharmacyManagement.service;

import PharmacyManagement.entity.Prescription;
import PharmacyManagement.repository.PrescriptionRepository;
import PharmacyManagement.repository.CustomerRepository;
import PharmacyManagement.repository.MedicineRepository;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final CustomerRepository customerRepository;
    private final MedicineRepository medicineRepository;

    private final Path uploadDirectory =
            Paths.get("uploads", "prescriptions").toAbsolutePath().normalize();

    public PrescriptionService(
            PrescriptionRepository prescriptionRepository,
            CustomerRepository customerRepository,
            MedicineRepository medicineRepository) {
        this.prescriptionRepository = prescriptionRepository;
        this.customerRepository = customerRepository;
        this.medicineRepository = medicineRepository;
    }

    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAll();
    }

    public List<Prescription> getCustomerPrescriptions(Integer customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new RuntimeException("Customer not found");
        }

        return prescriptionRepository
                .findByCustomerIdOrderByUploadedAtDesc(customerId);
    }

    public Prescription uploadPrescription(
            Integer customerId,
            Integer medicineId,
            MultipartFile file) throws IOException {

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Please select a prescription file");
        }

        String contentType = file.getContentType();

        if (contentType == null ||
                !(contentType.equalsIgnoreCase("application/pdf") ||
                  contentType.equalsIgnoreCase("image/jpeg") ||
                  contentType.equalsIgnoreCase("image/png"))) {
            throw new RuntimeException("Only PDF, JPG and PNG files are allowed");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("File size must not exceed 5 MB");
        }

        var customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        var medicine = medicineId == null ? null :
                medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        Files.createDirectories(uploadDirectory);

        String originalName = Path.of(file.getOriginalFilename() == null
                ? "prescription"
                : file.getOriginalFilename()).getFileName().toString();

        String extension = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf("."))
                : "";

        String storedName = java.util.UUID.randomUUID() + extension;

        Path destination = uploadDirectory.resolve(storedName).normalize();

        if (!destination.startsWith(uploadDirectory)) {
            throw new RuntimeException("Invalid file path");
        }

        file.transferTo(destination);

        Prescription prescription = new Prescription();
        prescription.setCustomer(customer);
        prescription.setMedicine(medicine);
        prescription.setFileName(originalName);
        prescription.setFilePath(destination.toString());
        prescription.setStatus("PENDING");

        return prescriptionRepository.save(prescription);
    }

    public Prescription reviewPrescription(
            Integer prescriptionId,
            String status,
            String remarks) {

        if (!"APPROVED".equals(status) && !"REJECTED".equals(status)) {
            throw new RuntimeException("Status must be APPROVED or REJECTED");
        }

        Prescription prescription = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));

        if (!"PENDING".equals(prescription.getStatus())) {
            throw new RuntimeException("This prescription has already been reviewed");
        }

        prescription.setStatus(status);
        prescription.setPharmacistRemarks(remarks);
        prescription.setReviewedAt(LocalDateTime.now());

        return prescriptionRepository.save(prescription);
    }

    public Path getPrescriptionFilePath(Integer prescriptionId) {

    Prescription prescription = prescriptionRepository.findById(prescriptionId)
            .orElseThrow(() -> new RuntimeException("Prescription not found"));

    Path filePath = Paths.get(prescription.getFilePath())
            .toAbsolutePath()
            .normalize();

    if (!Files.isRegularFile(filePath)) {
        throw new RuntimeException("Prescription file not found");
    }

    return filePath;
}
}
