# Configuring SSL

The **Elastic Seamless Upgrade Tool** runs **securely over HTTPS by default** using a built-in **self-signed SSL
certificate**.
This ensures that all communication between your browser and the tool is encrypted and secure.

If your organization prefers to use a **custom SSL certificate**, you can easily override the default configuration and
use your own.

---

## Default SSL Configuration

* The tool includes a **self-signed SSL certificate** out of the box.
* All traffic to the web interface is automatically served over **HTTPS**.
* **No additional setup** is required to enable SSL.

---

## Using a Custom SSL Certificate

You can configure the tool to use your own SSL certificate by supplying a **PKCS#12 keystore** containing your
certificate and private key.

### Steps to Configure a Custom SSL Certificate

1. **Locate the `certs` directory**

   When you start the tool using the provided install script, a folder structure is automatically created at:

   ```
   ./seamless-upgrade-tool/certs
   ```

   You can place your SSL files directly in this `certs` folder.

2. **Generate a PKCS#12 keystore**

   Convert your existing certificate and private key into a `.p12` keystore:

   ```bash
   openssl pkcs12 -export \
     -in fullchain.pem \
     -inkey privkey.pem \
     -out seamless-upgrade-tool/certs/keystore.p12 \
     -name hyperflex \
     -password pass:<keystore-password>
   ```

   Replace `<keystore-password>` with a strong password of your choice.

3. **Update `app.yaml` configuration**

   Override the default SSL configuration in your `app.yaml` file:

   ```yaml
   app.ssl.keystore.alias: <key-alias>
   app.ssl.keystore.password: <keystore-password>
   # The keystore file should be placed inside the ./seamless-upgrade-tool/certs folder
   app.ssl.keystore.path: <keystore-p12-file-name>
   ```

   The tool automatically looks for the keystore in `./seamless-upgrade-tool/certs/keystore.p12` by default.

4. **Restart the Seamless Upgrade Tool**

   Restart the container to apply your new SSL configuration:

   **Using Docker:**

   ```bash
   docker restart seamless-upgrade-tool
   ```

   **Using Podman:**

   ```bash
   podman restart seamless-upgrade-tool
   ```

   After restart, the tool will serve HTTPS using your custom SSL certificate.

---

## Important Notes

* If no custom certificate is configured, the tool uses its **default self-signed certificate**.
* To avoid browser warnings, ensure your certificate is **valid and trusted** by your organization.
* Keep your **keystore password secure** — it must match the one you used when creating the PKCS#12 file.
