import { ScanOptions } from "./barcodescanner.common";
import { ContentView } from "ui/content-view";
export declare class BarcodeScannerView extends ContentView {
    private _reader;
    private _scanner;
    private _ios;
    private _continuous;
    constructor();
    ios: any;
    continuous: boolean;
}
export declare class BarcodeScanner {
    private _observer;
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
    scan(arg: ScanOptions): Promise<any>;
}
