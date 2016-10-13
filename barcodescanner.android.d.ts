import { ScanOptions } from "./barcodescanner.common";
export declare class BarcodeScanner {
    private broadcastManager;
    private _onReceiveCallback;
    private _continuousScanCallback;
    private _scannedArray;
    private _onPermissionGranted;
    private _reject;
    private rememberedContext;
    constructor();
    private _cameraPermissionGranted;
    private _requestCameraPermission;
    available(): Promise<boolean>;
    hasCameraPermission(): Promise<boolean>;
    requestCameraPermission(): Promise<boolean>;
    stop(): Promise<any>;
    scan(arg: ScanOptions): Promise<any>;
}
