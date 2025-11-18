package co.hyperflex;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

public class LicenseGenerator {
  public static void main(String[] args) throws Exception {
    // load private key
    byte[] keyBytes = Files.readAllBytes(Path.of("license_private_key.pem"));
    PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(keyBytes);
    PrivateKey privateKey = KeyFactory.getInstance("RSA").generatePrivate(keySpec);

    // example license fields
    ObjectMapper objectMapper = new ObjectMapper();

    Map<String, String> license = new LinkedHashMap<>();
    license.put("user", "Vijay Patidar");
    license.put("expiry", "2026-01-01");
    license.put("licenseType", "PRO");

    // sign only the data (not signature field)
    byte[] dataToSign = license.toString().getBytes();

    Signature signature = Signature.getInstance("SHA256withRSA");
    signature.initSign(privateKey);
    signature.update(dataToSign);
    String signatureBase64 = Base64.getEncoder().encodeToString(signature.sign());

    // attach signature
    license.put("signature", signatureBase64);

    Files.write(Path.of("license.lic"), objectMapper.writeValueAsString(license).getBytes());

    System.out.println("License generated: license.lic");
  }
}

