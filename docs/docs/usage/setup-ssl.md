# Configuring SSL

The **Elastic Seamless Upgrade Tool** runs **securely over HTTPS by default** using a built-in **custom-signed SSL
certificate**. This ensures that all communication between your browser and the tool is encrypted.

However, if your organization prefers to use a **custom SSL certificate**, the tool allows you to override the default
and configure your own.

---

## **Default SSL Behavior**

* The tool ships with a **self-signed certificate**.
* All traffic to the web interface is automatically served over **HTTPS**.
* No additional configuration is required to start using SSL.

---

## **Using a Custom SSL Certificate**

You can provide a **PKCS12 keystore** containing your own SSL certificate and private key. The tool will use this
keystore instead of the default certificate.

### **Steps to Configure a Custom SSL**

1. **Create a `certs` folder**

   In the directory where you will run the start script, create a folder to hold your SSL files:

   ```bash
   mkdir certs
   ```

2. **Generate a PKCS12 keystore**

   Use your certificate and private key to create a `keystore.p12` keystore:

   ```bash
   openssl pkcs12 -export \
     -in fullchain.pem \
     -inkey privkey.pem \
     -out certs/keystore.p12 \
     -name hyperflex \
     -password pass:<keystore-password>
   ```

   Replace `<keystore-password>` with a secure password of your choice.

3. **Set Environment Variables**

   Before starting the tool, define the following environment variables:

   ```bash
   export SEAMLESS_UPGRADE_TOOL_TLS_KEY_STORE_PASSWORD=<keystore-password>
   export SEAMLESS_UPGRADE_TOOL_TLS_KEY_ALIAS=<alias-name>
   ```

   The tool automatically reads the keystore from `./certs/keystore.p12`.

4. **Start the Tool**

   Run the start script as usual:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/ConsultaddHQ/elastic-seamless-upgrade-tool/main/start.sh | sh
   ```

   The tool will now serve **HTTPS** using your custom certificate.

---

## Important Warning

The start script must be run from the same directory that contains the certs folder.

* The script mounts the certs folder to a Docker volume inside the container.
* Running the script from a different directory may cause the container to fail to find your custom certificate.

---

## **Key Notes**

* If a **custom certificate is not provided**, the tool defaults to its **built-in SSL certificate**.
* Ensure that your SSL certificate is **valid and trusted** by your organization to avoid browser warnings.
* The keystore password must be **kept secure** and should match the password used when creating the PKCS12 keystore.

