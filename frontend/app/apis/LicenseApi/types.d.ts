export type LicenseStatus = "ACTIVE" | "EXPIRED" | "INVALID"| "NOT_EXISTS";

export interface LicensePayload {
    productId: string;
    expiryDate: string;
    startDate: string;
    consumerId: string;
    iat: string;
    consumerName: string;
}

export interface LicenseModel {
    status: LicenseStatus;
    payload: LicensePayload;
}

