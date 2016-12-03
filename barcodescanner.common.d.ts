export interface CommonScanOptions {
    formats?: string;
    continuousScanCallback?: Function;
    reportDuplicates?: boolean;
    preferFrontCamera?: boolean;
    showFlipCameraButton?: boolean;
    showTorchButton?: boolean;
}
export interface IOS extends CommonScanOptions {
    cancelLabel?: string;
    openSettingsIfPermissionWasPreviouslyDenied?: boolean;
}
export interface Android extends CommonScanOptions {
    message?: string;
    orientation?: string;
}
export interface ScanOptions extends IOS, Android {
    IOS?: IOS;
    Android?: Android;
}
