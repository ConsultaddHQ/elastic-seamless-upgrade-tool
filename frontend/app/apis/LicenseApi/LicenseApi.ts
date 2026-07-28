// api/LicenseApi.ts
import axiosJSON from "../http"
import type { LicenseModel } from "./types";

class LicenseApi {  
    
    // Fetch the current license state
    static async getCurrentLicense(): Promise<LicenseModel> {
        const response = await axiosJSON.get('/license');
        return response.data;
    }

    // Upload a new license file
    static async activateLicense(file: File): Promise<any> {
        const formData = new FormData();
        formData.append("license", file); // Must match the @RequestParam("license")

        const response = await axiosJSON.post('/license', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
}

export default LicenseApi;