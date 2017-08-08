import { BarcodeScannerView as BarcodeScannerBaseView, ScanOptions, ScanResult } from "./barcodescanner.common";
export declare class BarcodeScannerView extends BarcodeScannerBaseView {
    private _reader;
    private _scanner;
    private _ios;
    private _continuous;
    constructor();
    onLayout(left: number, top: number, right: number, bottom: number): void;
    readonly ios: any;
    continuous: boolean;
}
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
