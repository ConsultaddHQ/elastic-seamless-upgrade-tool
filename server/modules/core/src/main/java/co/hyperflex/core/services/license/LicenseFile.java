package co.hyperflex.core.services.license;

import java.io.InputStream;

public record LicenseFile(
    String originalFilename,
    InputStream content,
    boolean empty
) {


}
