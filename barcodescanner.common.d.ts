export interface CommonScanOptions {
    formats?: string;
    continuousScanCallback?: Function;
}
export interface IOS extends CommonScanOptions {
    cancelLabel?: string;
    openSettingsIfPermissionWasPreviouslyDenied?: boolean;
}
export interface Android extends CommonScanOptions {
    message?: string;
    preferFrontCamera?: boolean;
    showFlipCameraButton?: boolean;
    orientation?: string;
}
export interface ScanOptions extends IOS, Android {
    IOS?: IOS;
    Android?: Android;
}
