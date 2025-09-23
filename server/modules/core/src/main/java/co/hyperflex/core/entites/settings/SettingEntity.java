package co.hyperflex.core.entites.settings;

import jakarta.annotation.Nullable;
import java.time.Instant;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "settings")
public class SettingEntity {
  @Id
  private String id = "settings";

  @Nullable
  private String notificationWebhookUrl;

  @CreatedDate
  private Instant createdAt;

  @LastModifiedDate
  private Instant updatedAt;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  @Nullable
  public String getNotificationWebhookUrl() {
    return notificationWebhookUrl;
  }

  public void setNotificationWebhookUrl(@Nullable String notificationWebhookUrl) {
    this.notificationWebhookUrl = notificationWebhookUrl;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
