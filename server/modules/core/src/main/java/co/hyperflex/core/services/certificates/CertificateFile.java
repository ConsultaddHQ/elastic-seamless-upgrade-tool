package co.hyperflex.core.services.certificates;


import java.io.InputStream;

public record CertificateFile(
    String originalFilename,
    InputStream content,
    boolean empty
) {
}
