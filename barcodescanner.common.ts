export interface ScanResult {
  text: string;
  format: string;
}

export interface CommonScanOptions {
  /**
   * A comma sep. string of barcode types: "QR_CODE,PDF_417"
   * Default: empty, so all types of codes can be scanned.
   */
  formats?: string;

  /**
   * By default the scanned object is returned in the Promise,
   * but if you want to scan continuously (until you call 'stop'),
   * you can provide a callback function that receives the same object
   * as the Promise would, but every time something is scanned.
   *
   * This function doesn't report duplicates in the same scanning session,
   * unless reportDuplicates is set to true.
   */
  continuousScanCallback?: (scanResult: ScanResult) => void;

  /**
   * Called when the user stopped/cancelled scanning, or in single scan mode when the scan was successful.
   */
  closeCallback?: () => void;

  /**
   * Wheter or not to report duplicate scan results during continuous scanning.
   * Default false.
   */
  reportDuplicates?: boolean;

  /**
   * Start the scanner with the front camera?
   * Default: false, so the back camera is used.
   */
  preferFrontCamera?: boolean;

  /**
   * While scanning for a barcode show a button to flip to the other camera (front or back).
   * Default: false
   */
  showFlipCameraButton?: boolean;

  /**
   * Default: false
   */
  showTorchButton?: boolean;

  /**
   * Launch the scanner with the flashlight turned on.
   */
  torchOn?: boolean;

  /**
   * Play a sound when a code was scanned.
   * Default: true
   */
  beepOnScan?: boolean;
}

export interface IOS extends CommonScanOptions {
  /**
   * The label of the button used to close the scanner.
   * Default: "Close".
   */
  cancelLabel?: string;
  /**
   * The background color of the button the label is drawn upon.
   * Default: "#000000" (black)
   */
  cancelLabelBackgroundColor?: string;
  /**
   * You can send the user to the settings app if access was previously denied.
   * Default: false
   */
  openSettingsIfPermissionWasPreviouslyDenied?: boolean;
}

export interface Android extends CommonScanOptions {
  /**
   * The message shown when looking for something to scan.
   * Default: "Place a barcode inside the viewfinder rectangle to scan it."
   */
  message?: string;

  /**
   * Optionally lock the orientation to 'portrait' or 'landscape'.
   * Default: "sensor", which follows the current device rotation.
   */
  orientation?: string;

  /**
   * Default is 1500, set to 0 o suppress the scanner echoing the scanned text.
   */
  resultDisplayDuration?: number;
}

export interface ScanOptions extends IOS, Android {
  IOS?: IOS;
  Android?: Android;
}

// export abstract class BarcodeScannerView extends ContentView {
// }

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
