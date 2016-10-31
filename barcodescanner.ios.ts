import {ScanOptions} from "./barcodescanner.common";
import {ContentView} from "ui/content-view";
import * as utils from "utils/utils";
import * as frame from "ui/frame";

declare let QRCodeReader, QRCodeReaderViewController, QRCodeReaderDelegate: any;

/* attempting XML declared scanner.. needs work ;)
export class BarcodeScannerView extends ContentView {

  private _reader: any;
  private _scanner: any;
  private _ios: any;
  private _continuous: boolean;

  constructor() {
    super();

    // let authStatus = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo);
    // if (authStatus !== AVAuthorizationStatus.Authorized) {
    // }

    let closeButtonLabel = "bla";
    let types = [AVMetadataObjectTypeUPCECode, AVMetadataObjectTypeCode39Code, AVMetadataObjectTypeCode39Mod43Code,
          AVMetadataObjectTypeEAN13Code, AVMetadataObjectTypeEAN8Code, AVMetadataObjectTypeCode93Code, AVMetadataObjectTypeCode128Code,
          AVMetadataObjectTypePDF417Code, AVMetadataObjectTypeQRCode, AVMetadataObjectTypeAztecCode];

    this._reader = QRCodeReader.readerWithMetadataObjectTypes(types);

    let torch = false;
    let flip = false;
    let startScanningAtLoad = true;
    // this._scanner = QRCodeReaderViewController.readerWithCancelButtonTitleCodeReaderStartScanningAtLoadShowSwitchCameraButtonShowTorchButton(closeButtonLabel, this._reader, startScanningAtLoad, flip, torch);
    // this._scanner.modalPresentationStyle = UIModalPresentationStyle.FormSheet;

    // Assign first to local variable, otherwise it will be garbage collected since delegate is weak reference.

    let isContinuous = false;
    let delegate = QRCodeReaderDelegateImpl.new().initWithCallback(isContinuous, (reader: string, text: string, format: string) => {
      // Remove the local variable for the delegate.
      delegate = undefined;
    });
    // this._scanner.delegate = delegate;

    console.log("--- ios: " + this._ios);
    this._ios = this._reader.previewLayer; // TODO

    // instead of a delegate we can use setCompletionWithBlock: https://github.com/yannickl/QRCodeReaderViewController/blob/master/QRCodeReaderViewController/QRCodeReader.h#L201

    this._reader.startScanning();
  }

  get ios(): any {
    return this._ios;
  }

  set continuous(value: boolean) {
    this._continuous = value;
  }
}
*/

export class BarcodeScanner {

  private _observer: NSObject;
  private _observerActive: boolean;
  private _currentVolume: any;
  private _scanner: any;

  constructor() {
    this._observer = VolumeObserverClass.alloc();
    this._observer["_owner"] = this;
  }

  private _hasCameraPermission = function () {
    let authStatus = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo);
    return authStatus === AVAuthorizationStatus.Authorized;
  };

  private _hasDeniedCameraPermission = function () {
    let authStatus = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo);
    return authStatus === AVAuthorizationStatus.Denied || authStatus === AVAuthorizationStatus.Restricted;
  };

  private _addVolumeObserver = function () {
    this._audioSession = utils.ios.getter(AVAudioSession, AVAudioSession.sharedInstance);
    this._audioSession.setActiveError(true, null);
    this._currentVolume = this._audioSession.outputVolume;
    if (!this._observerActive) {
      this._audioSession.addObserverForKeyPathOptionsContext(this._observer, "outputVolume", 0, null);
      this._observerActive = true;
    }
  };

  private _removeVolumeObserver = function () {
    try {
      if (this._observerActive) {
        this._observerActive = false;
        this._audioSession.removeObserverForKeyPath(this._observer, "outputVolume");
      }
    } catch (ignore) {
    }
  };

  // TODO the lib actually has toggleTorch: https://github.com/yannickl/QRCodeReaderViewController/blob/9fa79106e1f0839d96d0166c78d7f263b03b3e61/QRCodeReaderViewController/QRCodeReader.h#L150
  private _enableTorch = function () {
    let device = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo);
    device.lockForConfiguration();
    device.setTorchModeOnWithLevelError(AVCaptureMaxAvailableTorchLevel);
    device.flashMode = AVCaptureFlashMode.On;
    device.unlockForConfiguration();
  };

  private _disableTorch = function () {
    let device = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo);
    device.lockForConfiguration();
    device.torchMode = AVCaptureTorchMode.Off;
    device.flashMode = AVCaptureFlashMode.Off;
    device.unlockForConfiguration();
  };

  public available(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // since this would also request permission on iOS 10: resolve(QRCodeReader.isAvailable());
      // ..and it's extremely likely to be 'true' anyway, I decided to hardcode this:
      resolve(true);
    });
  };

  public hasCameraPermission(): Promise<boolean> {
    let self = this;
    return new Promise(function (resolve) {
      resolve(self._hasCameraPermission());
    });
  };

  public requestCameraPermission(): Promise<boolean> {
    return new Promise(function (resolve) {
      // this will trigger the prompt on iOS 10+
      QRCodeReader.isAvailable();
      resolve();
    });
  };

  public stop(): Promise<any> {
    let self = this;
    return new Promise(function (resolve, reject) {
      try {
        let app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
        app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
        self._removeVolumeObserver();
        resolve();
      } catch (ex) {
        reject(ex);
      }
    });
  };

  public scan(arg: ScanOptions): Promise<any> {
    let self = this;
    return new Promise(function (resolve, reject) {
      try {
        // only need for denied permission as conveniently, this method will auto-request permission upon scan
        if (self._hasDeniedCameraPermission()) {
          if (arg.openSettingsIfPermissionWasPreviouslyDenied) {
            utils.ios.getter(UIApplication, UIApplication.sharedApplication).openURL(NSURL.URLWithString(UIApplicationOpenSettingsURLString));
          }
          reject("The user previously denied permission to access the camera.");
          return;
        }

        self._addVolumeObserver();

        arg = arg || {};
        let closeButtonLabel = arg.cancelLabel || "Close";
        let isContinuous = typeof arg.continuousScanCallback === "function";

        let types = [];
        if (arg.formats) {
          let formats = arg.formats.split(",");
          for (let format of formats) {
            format = format.trim();
            if (format === "QR_CODE") types.push(AVMetadataObjectTypeQRCode);
            else if (format === "PDF_417") types.push(AVMetadataObjectTypePDF417Code);
            else if (format === "AZTEC") types.push(AVMetadataObjectTypeAztecCode);
            else if (format === "UPC_E") types.push(AVMetadataObjectTypeUPCECode);
            else if (format === "CODE_39") types.push(AVMetadataObjectTypeCode39Code);
            else if (format === "CODE_39_MOD_43") types.push(AVMetadataObjectTypeCode39Mod43Code);
            else if (format === "CODE_93") types.push(AVMetadataObjectTypeCode93Code);
            else if (format === "CODE_128") types.push(AVMetadataObjectTypeCode128Code);
            else if (format === "EAN_8") types.push(AVMetadataObjectTypeEAN8Code);
            else if (format === "EAN_13") types.push(AVMetadataObjectTypeEAN13Code);
          }
        } else {
          types = [AVMetadataObjectTypeUPCECode, AVMetadataObjectTypeCode39Code, AVMetadataObjectTypeCode39Mod43Code,
            AVMetadataObjectTypeEAN13Code, AVMetadataObjectTypeEAN8Code, AVMetadataObjectTypeCode93Code, AVMetadataObjectTypeCode128Code,
            AVMetadataObjectTypePDF417Code, AVMetadataObjectTypeQRCode, AVMetadataObjectTypeAztecCode];
        }

        let reader = QRCodeReader.readerWithMetadataObjectTypes(types);

        if (arg.preferFrontCamera && reader.hasFrontDevice()) {
          reader.switchDeviceInput();
        }

        let torch = arg.showTorchButton;
        let flip = arg.showFlipCameraButton;
        let startScanningAtLoad = true;
        self._scanner = QRCodeReaderViewController.readerWithCancelButtonTitleCodeReaderStartScanningAtLoadShowSwitchCameraButtonShowTorchButton(closeButtonLabel, reader, startScanningAtLoad, flip, torch);
        self._scanner.modalPresentationStyle = UIModalPresentationStyle.FormSheet;

        // Assign first to local variable, otherwise it will be garbage collected since delegate is weak reference.

        let delegate = QRCodeReaderDelegateImpl.new().initWithCallback(isContinuous, arg.reportDuplicates, (reader: string, text: string, format: string) => {
          // invoke the callback / promise
          if (text === undefined) {
            self._removeVolumeObserver();
            reject("Scan aborted");
          } else {
            let result = {
              format : format,
              text : text
            };
            if (isContinuous) {
              arg.continuousScanCallback(result);
            } else {
              self._removeVolumeObserver();
              resolve(result);
            }
          }
          // Remove the local variable for the delegate.
          delegate = undefined;
        });
        self._scanner.delegate = delegate;

        // TODO this means we should be able to embed the QR scanner as well
        let topMostFrame = frame.topmost();
        if (topMostFrame) {
          let vc = topMostFrame.currentPage && topMostFrame.currentPage.ios;
          if (vc) {
            vc.presentViewControllerAnimatedCompletion(self._scanner, true, null);
          }
        }
        if (isContinuous) {
          resolve();
        }
      } catch (ex) {
        console.log("Error in barcodescanner.scan: " + ex);
        reject(ex);
      }
    });
  };
}

class QRCodeReaderDelegateImpl extends NSObject /*implements QRCodeReaderDelegate*/ {
  public static ObjCProtocols = [QRCodeReaderDelegate];

  static new(): QRCodeReaderDelegateImpl {
    return <QRCodeReaderDelegateImpl>super.new();
  }

  private _callback: (reader: string, text?: string, format?: string) => void;
  private _isContinuous: boolean;
  private _reportDuplicates: boolean;
  private _scannedArray: Array<string>;

  public initWithCallback(isContinuous: boolean, reportDuplicates: boolean, callback: (reader: string, text: string, format: string) => void): QRCodeReaderDelegateImpl {
    this._isContinuous = isContinuous;
    this._reportDuplicates = reportDuplicates;
    this._callback = callback;
    return this;
  }

  public readerDidCancel(reader) {
    let app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
    app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
    this._callback(reader);
  };

  public readerDidScanResultForType(reader, text, type) {
    if (this._isContinuous) {
      if (!this._scannedArray) {
        this._scannedArray = Array<string>();
      }
      // don't report duplicates
      if (this._reportDuplicates || this._scannedArray.indexOf("[" + text + "][" + type + "]") === -1) {
        this._scannedArray.push("[" + text + "][" + type + "]");
        this._callback(reader, text, type);
      }
    } else {
      let app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
      app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
      this._callback(reader, text, type);
    }
  };
}

class VolumeObserverClass extends NSObject {
  observeValueForKeyPathOfObjectChangeContext(path: string, obj: Object, change: NSDictionary<any, any>, context: any) {
    if (path === "outputVolume") {
      let volumeLevel = utils.ios.getter(MPMusicPlayerController, MPMusicPlayerController.applicationMusicPlayer).volume;
      if (volumeLevel > this["_owner"]._currentVolume) {
        // volume up button pressed, so enable torch
        this["_owner"]._enableTorch();
      } else {
        // volume down button pressed, so disable torch
        this["_owner"]._disableTorch();
      }
      this["_owner"]._currentVolume = volumeLevel;
    }
  }
}