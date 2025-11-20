package co.hyperflex.core.services.license;


import java.time.LocalDate;
import java.time.LocalDateTime;

public class License {
  private LicenseStatus status;
  private LicensePayload payload;
  private LocalDateTime lastVerifiedAt;

  License(){

  }

  public LicenseStatus getStatus() {
    return status;
  }

  public void setStatus(LicenseStatus status) {
    this.status = status;
  }

  public LicensePayload getPayload() {
    return payload;
  }

  public void setPayload(LicensePayload payload) {
    this.payload = payload;
  }
}
