declare namespace barcodeScanner {
  namespace ScanOptions {
    interface Common {
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
       * you're welcome ;)
       */
      continuousScanCallback?: Function;
    }

    interface IOS extends Common {
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
    }

    interface Android extends Common {
      /**
       * The message shown when looking for something to scan.
       * Default: "Place a barcode inside the viewfinder rectangle to scan it."
       */
      message?: string;

      /**
       * Start the scanner with the front camera?
       * Default: false, so the back camera is used.
       */
      preferFrontCamera?: boolean;

      /**
       * While scanning for a barcode show a button to flip to the other camera (front or back).
       * Default: false, so no flip button is shown.
       * Note that on iOS the button is always shown.
       */
      showFlipCameraButton?: boolean;

      /**
       * Optionally lock the orientation to 'portrait' or 'landscape'.
       * Default: "sensor", which follows the current device rotation.
       */
      orientation?: string;
    }
  }

  /**
   * The options object passed into the scan function.
   */
  export interface ScanOptions extends ScanOptions.IOS, ScanOptions.Android {
  }

  interface BarcodeScanner {
    available(): Promise<boolean>;
    /**
     * Not recommended to use this as it's all handled automatically for you.
     */
    hasCameraPermission(): Promise<boolean>;
    /**
     * Not recommended to use this as it's all handled automatically for you.
     */
    requestCameraPermission(): Promise<boolean>;
    /**
     * Start scanning, with many options.
     * Will automatically request permission for you if not granted previously.
     * Note that during a scan users can use the volume buttons to toggle the torch.
     */
    scan(options: ScanOptions): Promise<any>;
    /**
     * Stop scanning, particularly useful when 'scan' was used with 'continuousScanCallback'
     */
    stop(): Promise<any>;
  }
}

declare var barcodeScanner: barcodeScanner.BarcodeScanner;
export = barcodeScanner;