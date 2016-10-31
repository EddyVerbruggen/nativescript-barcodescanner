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
  continuousScanCallback?: Function;

  /**
   * Wheter or not to report duplicate scan results during continuous scanning.
   * 
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
}

export interface IOS extends CommonScanOptions {
  /**
   * The label of the button used to close the scanner.
   * Default: "Close".
   */
  cancelLabel?: string;
  /**
   * You can send the user to the settings app if access was previously denied.
   * Default: false
   */
  openSettingsIfPermissionWasPreviouslyDenied?: boolean;

  /**
   * Default: false
   */
  showTorchButton?: boolean;
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
}

export interface ScanOptions extends IOS, Android {
  IOS?: IOS;
  Android?: Android;
}