import { ScanOptions, ScanResult } from "./barcodescanner.common";
export declare class BarcodeScanner {
    private _observer;
    private _observerActive;
    private _currentVolume;
    private _scanner;
    private _scanDelegate;
    constructor();
    private _hasCameraPermission;
    private _hasDeniedCameraPermission;
    private _addVolumeObserver;
    private _removeVolumeObserver;
    private _enableTorch;
    private _disableTorch;
    available(): Promise<boolean>;
    hasCameraPermission(): Promise<boolean>;
    requestCameraPermission(): Promise<boolean>;
    stop(): Promise<any>;
    scan(arg: ScanOptions): Promise<ScanResult>;
}
