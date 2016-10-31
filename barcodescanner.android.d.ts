import { ScanOptions } from "./barcodescanner.common";
export declare class BarcodeScanner {
    private broadcastManager;
    private onContinuousScanResult;
    private onPermissionGranted;
    private onPermissionRejected;
    private rememberedContext;
    constructor();
    private wasCameraPermissionGranted;
    private requestCameraPermissionInternal;
    available(): Promise<boolean>;
    hasCameraPermission(): Promise<boolean>;
    requestCameraPermission(): Promise<boolean>;
    stop(): Promise<any>;
    scan(arg: ScanOptions): Promise<any>;
}
