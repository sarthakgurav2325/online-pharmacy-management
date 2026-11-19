
package PharmacyManagement.controller;

import PharmacyManagement.entity.Prescription;
import PharmacyManagement.service.PrescriptionService;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = "*")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    // Get all prescriptions
    @GetMapping
    public List<Prescription> getAllPrescriptions() {
        return prescriptionService.getAllPrescriptions();
    }

    // Get prescriptions for a customer
    @GetMapping("/customer/{customerId}")
    public List<Prescription> getCustomerPrescriptions(
            @PathVariable Integer customerId) {
        return prescriptionService.getCustomerPrescriptions(customerId);
    }

    // Upload prescription
    @PostMapping("/upload")
    public ResponseEntity<Prescription> uploadPrescription(
            @RequestParam Integer customerId,
            @RequestParam(required = false) Integer medicineId,
            @RequestParam("file") MultipartFile file) throws IOException {

        Prescription prescription =
                prescriptionService.uploadPrescription(
                        customerId, medicineId, file);

        return ResponseEntity.ok(prescription);
    }

    // Approve or reject prescription
    @PutMapping("/{id}/review")
    public ResponseEntity<Prescription> reviewPrescription(
            @PathVariable Integer id,
            @RequestBody ReviewRequest request) {

        Prescription prescription =
                prescriptionService.reviewPrescription(
                        id, request.getStatus(), request.getRemarks());

        return ResponseEntity.ok(prescription);
    }

    public static class ReviewRequest {
        private String status;
        private String remarks;

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getRemarks() {
            return remarks;
        }

        public void setRemarks(String remarks) {
            this.remarks = remarks;
        }
    }

    // View prescription file
@GetMapping("/{id}/file")
public ResponseEntity<Resource> viewPrescriptionFile(
        @PathVariable Integer id) throws IOException {

    Path filePath = prescriptionService.getPrescriptionFilePath(id);

    Resource resource = new UrlResource(filePath.toUri());

    String fileName = filePath.getFileName().toString();

    MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;

    String lowerName = fileName.toLowerCase();

    if (lowerName.endsWith(".pdf")) {
        mediaType = MediaType.APPLICATION_PDF;
    } else if (lowerName.endsWith(".png")) {
        mediaType = MediaType.IMAGE_PNG;
    } else if (lowerName.endsWith(".jpg") ||
               lowerName.endsWith(".jpeg")) {
        mediaType = MediaType.IMAGE_JPEG;
    }

    return ResponseEntity.ok()
            .contentType(mediaType)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"" + fileName + "\"")
            .body(resource);
}
}
