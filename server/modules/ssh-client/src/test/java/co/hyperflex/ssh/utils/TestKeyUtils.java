package co.hyperflex.ssh.utils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

public class TestKeyUtils {

  public static KeyPair generateRsaKeyPair() throws Exception {
    KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
    keyGen.initialize(2048);
    return keyGen.generateKeyPair();
  }

  public static Path writePrivateKeyToPem(KeyPair keyPair, String filePrefix) throws IOException {
    byte[] encoded = keyPair.getPrivate().getEncoded();
    String base64 = Base64.getMimeEncoder(64, "\n".getBytes())
        .encodeToString(encoded);

    String pem = "-----BEGIN PRIVATE KEY-----\n"
        + base64
        + "\n-----END PRIVATE KEY-----\n";

    Path tempFile = Files.createTempFile(filePrefix, ".pem");
    Files.writeString(tempFile, pem);
    return tempFile;
  }
}
