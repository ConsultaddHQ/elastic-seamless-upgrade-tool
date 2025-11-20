package co.hyperflex.core.services.license;

import co.hyperflex.common.exceptions.BadRequestException;
import co.hyperflex.core.services.secret.Secret;
import co.hyperflex.core.services.secret.SecretStoreService;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;


@ComponentScan
@Service
public class LicenseService {

  private static final Logger logger = LoggerFactory.getLogger(LicenseService.class);

  private final LicenseValidator licenseValidator;
  public volatile License currentLicense;
  private final SecretStoreService secretStoreService;

  @Value("${seamless.output.dir}")
  private String seamlessOutputDir;

  public LicenseService(LicenseValidator licenseValidator, SecretStoreService secretStoreService) {
    this.licenseValidator = licenseValidator;
    this.secretStoreService = secretStoreService;
    this.currentLicense = new License();
  }


  public void validateInstalledLicense(){
    try{
      Secret licenseKey = secretStoreService.getSecret("license-key");
      if(licenseKey != null){
        String token = licenseKey.value();
        this.currentLicense = licenseValidator.validateLicense(token);
      }
      else{
        this.currentLicense.setStatus(LicenseStatus.NOT_EXISTS);
      }
    } catch (Exception e) {
      this.currentLicense.setStatus(LicenseStatus.NOT_EXISTS);
    }
  }


  //Oninit
  @PostConstruct
  public void init() {
    validateInstalledLicense();
  }

 //On regular basis
  @Scheduled(fixedDelay = 24*60*60)
  public void regularLicenseCheck(){
      validateInstalledLicense();
  }


  public Map<String,Object> addLicense(LicenseFile licenseFile) throws IOException, ParseException, Exception {

    //Extracting token from the licenseFile

    if(licenseFile == null){

      throw new BadRequestException("No License File provided");
    }

    if(licenseFile.empty()){
      throw new BadRequestException("Please Provide correct license file");
    }

    String content = new String(licenseFile.content().readAllBytes(), StandardCharsets.UTF_8);
    License license = licenseValidator.validateLicense(content);

    if(license.getStatus().equals(LicenseStatus.INVALID)){
      throw new BadRequestException("Please Enter a valid License");
    }
    //Storing license into P12Store
    try{
      secretStoreService.putSecret("license-key",new Secret(content));
      if(license.getStatus().equals(LicenseStatus.EXPIRED)){
        this.currentLicense.setPayload(license.getPayload());
        this.currentLicense.setStatus(license.getStatus());
        throw  new BadRequestException(("The Uploaded License is expire. Please contact the delivery team to renew"));
      }
      else if(license.getStatus().equals(LicenseStatus.ACTIVE)){
        this.currentLicense.setPayload(license.getPayload());
        this.currentLicense.setStatus(license.getStatus());
      }
      return Map.of("message","License Uploaded Successfully","license",this.currentLicense);
    }
    catch(Exception e){
      logger.info("Can't Add key into secret store: {}",e.getMessage());
      return Map.of("message","License Uploaded Successfully","license",this.currentLicense);
    }
  }

  public License getCurrentLicense() {
    return currentLicense;
  }

  public void setCurrentLicense(License currentLicense) {
    this.currentLicense = currentLicense;
  }
}
