package co.hyperflex;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Map;

public class LicenseValidator {

  private PublicKey loadPublicKey() throws Exception {
    byte[] keyBytes = Files.readAllBytes(Path.of("license_public_key.pem"));
    X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
    return KeyFactory.getInstance("RSA").generatePublic(spec);
  }

  public static void main(String[] args) {
    new LicenseValidator().validate();
  }
  public boolean validate() {
    try {
      PublicKey publicKey = loadPublicKey();

      String content = Files.readString(Path.of("license.lic"));
      ObjectMapper mapper = new ObjectMapper();
      Map lic = mapper.readValue(new File("license.lic"), Map.class);
      String signature = lic.get("signature").toString();
      lic.remove("signature");

      byte[] data = lic.toString().getBytes();
      byte[] sigBytes = Base64.getDecoder().decode(signature);

      Signature sig = Signature.getInstance("SHA256withRSA");
      sig.initVerify(publicKey);
      sig.update(data);

      if (!sig.verify(sigBytes)) {
        System.err.println("Invalid license signature");
        return false;
      }

      // expiry check
      String expiry = lic.get("expiry").toString();
      if (java.time.LocalDate.now().isAfter(java.time.LocalDate.parse(expiry))) {
        System.err.println("License expired");
        return false;
      }

      System.out.println("License OK for user: " + lic.get("user").toString());
      return true;

    } catch (Exception e) {
      System.err.println("License validation error: " + e.getMessage());
      return false;
    }
  }
}
