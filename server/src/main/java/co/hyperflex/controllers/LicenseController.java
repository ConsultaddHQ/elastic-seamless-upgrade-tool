package co.hyperflex.controllers;

import co.hyperflex.core.services.license.License;
import co.hyperflex.core.services.license.LicenseFile;
import co.hyperflex.core.services.license.LicenseService;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/license")
public class LicenseController {

  private static final Logger logger = LoggerFactory.getLogger(LicenseController.class);
  private final LicenseService licenseService;

  public LicenseController(LicenseService licenseService) {
    this.licenseService = licenseService;
  }

  @GetMapping
  public ResponseEntity<License> getLicence() {
    return ResponseEntity.ok().body(licenseService.getCurrentLicense());
  }

  @PostMapping(consumes = "multipart/form-data")
  public ResponseEntity<Map<String, Object>> addLicense(@RequestParam("license") MultipartFile license) {
    try {
      if (license.isEmpty()) {
        return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));
      }

      LicenseFile licenseFile = new LicenseFile(
          license.getOriginalFilename(),
          license.getInputStream(),
          false
      );

      return ResponseEntity.ok(licenseService.addLicense(licenseFile));

    } catch (Exception e) {
      logger.error("Failed to upload license", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("message", "An unexpected error occurred while processing the license file."));
    }
  }
}