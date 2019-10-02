import { ContentView } from "tns-core-modules/ui/content-view";
import { Property } from "tns-core-modules/ui/core/properties";
import { booleanConverter } from "tns-core-modules/ui/core/view-base";

export type BarcodeFormat =
    "QR_CODE" |
    "PDF_417" |
    "AZTEC" |
    "UPC_E" |
    "CODE_39" |
    "CODE_39_MOD_43" |
    "CODE_93" |
    "CODE_128" |
    "DATA_MATRIX" |
    "EAN_8" |
    "ITF" |
    "EAN_13" |
    "UPC_A" |
    "CODABAR" |
    "MAXICODE" |
    "RSS_14" |
    "INTERLEAVED_2_OF_5";

export interface ScanResult {
  text: string;
  format: BarcodeFormat;
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
  /**
   * If you're sure you're not presenting the (non embedded) scanner in a modal,
   * or are experiencing issues with fi. the navigationbar, please set this to 'true'.
   * Default: false
   */
  presentInRootViewController?: boolean;
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


/**** View-related stuff below ****/
export const formatsProperty = new Property<BarcodeScannerView, string>({
  name: "formats",
  defaultValue: null,
});

export const preferFrontCameraProperty = new Property<BarcodeScannerView, boolean>({
  name: "preferFrontCamera",
  defaultValue: false,
  valueConverter: booleanConverter
});

export const beepOnScanProperty = new Property<BarcodeScannerView, boolean>({
  name: "beepOnScan",
  defaultValue: true,
  valueConverter: booleanConverter
});

export const reportDuplicatesProperty = new Property<BarcodeScannerView, boolean>({
  name: "reportDuplicates",
  defaultValue: false,
  valueConverter: booleanConverter
});

export const pauseProperty = new Property<BarcodeScannerView, boolean>({
  name: "pause",
  defaultValue: false,
  valueConverter: booleanConverter
});

export abstract class BarcodeScannerView extends ContentView {

  static scanResultEvent: string = "scanResult";

  protected formats: string;
  protected preferFrontCamera: boolean;
  protected beepOnScan: boolean;
  protected reportDuplicates: boolean;
  protected pause: boolean;

  protected pauseScanning(): void {
    // implemented in concrete classes
  }

  protected resumeScanning(): void {
    // implemented in concrete classes
  }

  [formatsProperty.setNative](value: string) {
    this.formats = value;
  }

  [preferFrontCameraProperty.setNative](value: boolean) {
    this.preferFrontCamera = value;
  }

  [beepOnScanProperty.setNative](value: boolean) {
    this.beepOnScan = value;
  }

  [reportDuplicatesProperty.setNative](value: boolean) {
    this.reportDuplicates = value;
  }

  [pauseProperty.setNative](value: boolean) {
    this.pause = value;
    this.pause ? this.pauseScanning() : this.resumeScanning();
  }
}

pauseProperty.register(BarcodeScannerView);
formatsProperty.register(BarcodeScannerView);
preferFrontCameraProperty.register(BarcodeScannerView);
beepOnScanProperty.register(BarcodeScannerView);
reportDuplicatesProperty.register(BarcodeScannerView);
