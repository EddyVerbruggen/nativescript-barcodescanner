export interface ScanResult {
    text: string;
    format: string;
}
export interface CommonScanOptions {
    formats?: string;
    continuousScanCallback?: (scanResult: ScanResult) => void;
    closeCallback?: () => void;
    reportDuplicates?: boolean;
    preferFrontCamera?: boolean;
    showFlipCameraButton?: boolean;
    showTorchButton?: boolean;
    torchOn?: boolean;
    beepOnScan?: boolean;
}
export interface IOS extends CommonScanOptions {
    cancelLabel?: string;
    cancelLabelBackgroundColor?: string;
    openSettingsIfPermissionWasPreviouslyDenied?: boolean;
}
export interface Android extends CommonScanOptions {
    message?: string;
    orientation?: string;
    resultDisplayDuration?: number;
}
export interface ScanOptions extends IOS, Android {
    IOS?: IOS;
    Android?: Android;
}
export declare class BarcodeScanner {
    private _observer;
    private _observerActive;
    private _currentVolume;
    private _scanner;
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
