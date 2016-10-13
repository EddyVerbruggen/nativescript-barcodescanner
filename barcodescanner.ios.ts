import {ScanOptions} from "./barcodescanner.common";
import * as utils from "utils/utils";
import * as frame from "ui/frame";

declare let QRCodeReader, QRCodeReaderViewController, QRCodeReaderDelegate: any;

export class BarcodeScanner {

  private _observer: NSObject;
  private _currentVolume: any;

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
    this._audioSession.addObserverForKeyPathOptionsContext(this._observer, "outputVolume", 0, null);
  };

  private _removeVolumeObserver = function () {
    try {
      this._audioSession.removeObserverForKeyPath(this._observer, "outputVolume");
    } catch (ignore) {
    }
  };

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

        let bs = QRCodeReaderViewController.readerWithCancelButtonTitleMetadataObjectTypes(closeButtonLabel, types);
        bs.modalPresentationStyle = UIModalPresentationStyle.FormSheet;

        // Assign first to local variable, otherwise it will be garbage collected since delegate is weak reference.

        let delegate = QRCodeReaderDelegateImpl.new().initWithCallback(isContinuous, (reader: string, text: string, format: string) => {
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
        bs.delegate = delegate;

        // TODO this means we should be able to embed the QR scanner as well
        let topMostFrame = frame.topmost();
        if (topMostFrame) {
          let vc = topMostFrame.currentPage && topMostFrame.currentPage.ios;
          if (vc) {
            vc.presentViewControllerAnimatedCompletion(bs, true, null);
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
  private _scannedArray: Array<string>;

  public initWithCallback(isContinuous: boolean, callback: (reader: string, text: string, format: string) => void): QRCodeReaderDelegateImpl {
    this._isContinuous = isContinuous;
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
      if (this._scannedArray.indexOf("[" + text + "][" + type + "]") === -1) {
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