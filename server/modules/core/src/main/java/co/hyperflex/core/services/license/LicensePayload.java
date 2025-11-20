package co.hyperflex.core.services.license;

import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import java.time.LocalDate;
import java.util.Date;

public class LicensePayload {
      private  String productId;
      private  LocalDate expiryDate;
      private  LocalDate startDate;
      private  String consumerId;
      private  String iat;
      private  String consumerName;

  public LicensePayload(String productId, LocalDate expiryDate, LocalDate startDate, String iat, String consumerId, String consumerName) {
    this.productId = productId;
    this.expiryDate = expiryDate;
    this.startDate = startDate;
    this.iat = iat;
    this.consumerId = consumerId;
    this.consumerName = consumerName;
  }


  public String getProductId() {
    return productId;
  }

  public void setProductId(String productId) {
    this.productId = productId;
  }

  public LocalDate getExpiryDate() {
    return expiryDate;
  }

  public void setExpiryDate(LocalDate expiryDate) {
    this.expiryDate = expiryDate;
  }

  public LocalDate getStartDate() {
    return startDate;
  }

  public void setStartDate(LocalDate startDate) {
    this.startDate = startDate;
  }

  public String getConsumerName() {
    return consumerName;
  }

  public void setConsumerName(String consumerName) {
    this.consumerName = consumerName;
  }

  public String getIat() {
    return iat;
  }

  public void setIat(String iat) {
    this.iat = iat;
  }

  public String getConsumerId() {
    return consumerId;
  }

  public void setConsumerId(String consumerId) {
    this.consumerId = consumerId;
  }
}

