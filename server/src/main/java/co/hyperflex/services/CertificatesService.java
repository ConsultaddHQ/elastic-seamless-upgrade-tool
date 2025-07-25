package co.hyperflex.services;

import co.hyperflex.dtos.clusters.UploadCertificateResponse;
import co.hyperflex.exceptions.BadRequestException;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.multipart.MultipartFile;

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
      logger.error("Failed to create certificates directory: {}", certsDir, e);
      throw new IllegalStateException("Failed to create certificated keys directory: " + certsDir,
          e);
    }
  }

  public UploadCertificateResponse uploadCertificate(MultipartFile[] files,
                                                     @PathVariable String clusterId) {
    List<String> ids = new ArrayList<>(files.length);
    for (MultipartFile file : files) {
      if (file.isEmpty()) {
        throw new BadRequestException("No SSH key file was provided.");
      }

      try {

        String filename = UUID.randomUUID() + "-" + file.getOriginalFilename();
        if (!filename.matches(".*\\.(crt|pem|cer|p12|pfx)$")) {
          throw new BadRequestException("Invalid certificate file type");
        }

        Path targetLocation = certsDir.resolve(filename);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        ids.add(filename);
      } catch (IOException e) {
        throw new RuntimeException(e);
      }
    }
    return new UploadCertificateResponse(ids);
  }

}
