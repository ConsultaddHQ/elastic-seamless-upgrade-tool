package co.hyperflex;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;

public class KeyGeneratorTool {
  public static void main(String[] args) throws Exception {
    KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
    gen.initialize(2048);
    KeyPair pair = gen.generateKeyPair();

    Files.write(Path.of("license_private_key.pem"), pair.getPrivate().getEncoded());
    Files.write(Path.of("license_public_key.pem"), pair.getPublic().getEncoded());

    System.out.println("Generated private_key.pem and public_key.pem");
  }
}
