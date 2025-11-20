package co.hyperflex.core.services.license;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;


@Component
public class LicenseValidator {


  private static final Logger logger = LoggerFactory.getLogger(LicenseValidator.class);
  private Path license;
  private static final Pattern JWT_PATTERN =
      Pattern.compile("([A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+)");

  public String extractJwt(String text) {
    Matcher m = JWT_PATTERN.matcher(text);
    if (m.find()) return m.group(1);
    throw new RuntimeException("No JWT token found in license file");
  }

  public RSAPublicKey loadPublicKey() {
    try {
      Resource resource = new ClassPathResource("keystore/publickey.pem");
      String pem = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

      pem = pem.replace("-----BEGIN PUBLIC KEY-----", "")
          .replace("-----END PUBLIC KEY-----", "")
          .replaceAll("\\s", "");

      byte[] decoded = Base64.getDecoder().decode(pem);
      KeyFactory keyFactory = KeyFactory.getInstance("RSA");
      X509EncodedKeySpec keySpec = new X509EncodedKeySpec(decoded);
      return (RSAPublicKey) keyFactory.generatePublic(keySpec);
    } catch (Exception e) {
      throw new RuntimeException("Could not load public key", e);
    }
  }

  public License validateLicense(String content){
    License license = new License();
    try{

      String token = content;
      RSAPublicKey publicKey = loadPublicKey();
      SecretKeySpec secretKey = new SecretKeySpec(publicKey.getEncoded(),publicKey.getAlgorithm());
      Jws<Claims> jws = Jwts.parser().setSigningKey(publicKey).build().parseSignedClaims(token);
      Claims claims = jws.getBody();
      logger.info("Claims: {}", claims);
        LicensePayload licensePayload = new LicensePayload(
            claims.get("productId").toString(),
            LocalDate.parse(claims.get("expiryDate").toString(), DateTimeFormatter.ISO_LOCAL_DATE),
            LocalDate.parse(claims.get("startDate").toString(),DateTimeFormatter.ISO_LOCAL_DATE),
           claims.get("consumerId").toString(),
            claims.get("iat").toString(),
            claims.get("consumerName").toString()
        );
        license.setPayload(licensePayload);
        if(licensePayload.getExpiryDate().isBefore(LocalDate.now())){
          license.setStatus(LicenseStatus.EXPIRED);
        }
        else if(licensePayload.getStartDate().isAfter(LocalDate.now())){
          license.setStatus(LicenseStatus.INVALID);
        }
        else{
          license.setStatus(LicenseStatus.ACTIVE);
          license.setPayload(licensePayload);
        }

      return license;
    } catch (Exception e) {

      logger.error("JWT signature verification failed.");
      license.setStatus(LicenseStatus.INVALID);
      license.setStatus(LicenseStatus.INVALID);
      return license;
    }
  }
}
