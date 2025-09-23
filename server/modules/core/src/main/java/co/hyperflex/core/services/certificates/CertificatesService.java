package co.hyperflex.core.services.certificates;

import co.hyperflex.common.exceptions.BadRequestException;
import co.hyperflex.core.services.clusters.dtos.UploadCertificateResponse;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class CertificatesService {

  private static final Logger logger = LoggerFactory.getLogger(CertificatesService.class);

  @Value("${seamless.output.dir}")
  private String seamlessOutputDir;

  private Path certsDir;

  @PostConstruct
  public void init() {
    this.certsDir = Paths.get(seamlessOutputDir, "certs");
    try {
      Files.createDirectories(certsDir);
      logger.info("Certificates directory initialized at {}", certsDir.toAbsolutePath());
    } catch (IOException e) {
      throw new IllegalStateException(
          "Failed to create certificates directory: " + certsDir, e);
    }
  }

  public UploadCertificateResponse uploadCertificates(List<CertificateFile> files) {
    if (files == null || files.isEmpty()) {
      throw new BadRequestException("No certificate files were provided.");
    }

    List<String> ids = new ArrayList<>(files.size());

    for (CertificateFile file : files) {
      if (file.empty()) {
        throw new BadRequestException("Empty certificate file was provided.");
      }

      String filename = UUID.randomUUID() + "-" + file.originalFilename();
      if (!filename.matches(".*\\.(crt|pem|cer|p12|pfx)$")) {
        throw new BadRequestException("Invalid certificate file type: " + filename);
      }

      Path targetLocation = certsDir.resolve(filename);
      try { // auto-close stream
        Files.copy(file.content(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        ids.add(filename);
      } catch (IOException e) {
        logger.error("Failed to upload certificate {}", file.originalFilename(), e);
        throw new RuntimeException("Upload failed for " + file.originalFilename(), e);
      }
    }

    return new UploadCertificateResponse(ids);
  }
}
