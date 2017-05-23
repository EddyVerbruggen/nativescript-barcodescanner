import { ScanOptions, ScanResult } from "./barcodescanner.common";
import * as utils from "utils/utils";
import * as frame from "ui/frame";
import * as fs from "file-system";



// TODO see https://github.com/jbristowe/nativescript-sound/blob/master/sound.ios.js
// .. and see https://github.com/phonegap/phonegap-plugin-barcodescanner/blob/2e36cd46de37969eae619e0d34fe1259f2db79b7/src/ios/CDVBarcodeScanner.mm#L414
// .. also: rename to disableSuccessBeep in the phonegap ios impl to beepOnScan


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
      resolve(AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo) !== null);
    });
  }

  public hasCameraPermission(): Promise<boolean> {
    let self = this;
    return new Promise((resolve) => {
      resolve(self._hasCameraPermission());
    });
  }

  public requestCameraPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      // this will trigger the prompt on iOS 10+
      QRCodeReader.isAvailable();
      resolve();
    });
  }

  public stop(): Promise<any> {
    let self = this;
    return new Promise((resolve, reject) => {
      try {
        let app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
        app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
        self._removeVolumeObserver();
        resolve();
      } catch (ex) {
        reject(ex);
      }
    });
  }

  public scan(arg: ScanOptions): Promise<ScanResult> {
    let self = this;
    return new Promise((resolve, reject) => {
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
        self._scanner = QRCodeReaderViewController.readerWithCancelButtonTitleCodeReaderStartScanningAtLoadShowSwitchCameraButtonShowTorchButtonCancelButtonBackgroundColor(closeButtonLabel, reader, startScanningAtLoad, flip, torch, arg.cancelLabelBackgroundColor);
        self._scanner.modalPresentationStyle = UIModalPresentationStyle.FormSheet;

        // Assign first to local variable, otherwise it will be garbage collected since delegate is weak reference.
        let delegate = QRCodeReaderDelegateImpl.new().initWithCallback(arg.beepOnScan !== false, isContinuous, arg.reportDuplicates, (reader: string, text: string, format: string) => {
          // invoke the callback / promise
          if (text === undefined) {
            self._removeVolumeObserver();
            reject("Scan aborted");
          } else {
            let result: ScanResult = {
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

        let device = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo);
        if (device.autoFocusRangeRestrictionSupported) {
          device.lockForConfiguration();
          device.autoFocusRangeRestriction = AVCaptureAutoFocusRangeRestriction.Near;
          if (device.smoothAutoFocusSupported) {
            device.smoothAutoFocusEnabled = true;
          }
          device.unlockForConfiguration();
        }

        let topMostFrame = frame.topmost();
        if (topMostFrame) {
          let vc = topMostFrame.currentPage && topMostFrame.currentPage.ios;
          if (vc) {
            vc.presentViewControllerAnimatedCompletion(self._scanner, true, () => {
              if (arg.torchOn) {
                this._enableTorch();
              }
            });
          }
        }
      } catch (ex) {
        console.log("Error in barcodescanner.scan: " + ex);
        reject(ex);
      }
    });
  }
}

class QRCodeReaderDelegateImpl extends NSObject /*implements QRCodeReaderDelegate*/ {
  public static ObjCProtocols = [QRCodeReaderDelegate];

  static new(): QRCodeReaderDelegateImpl {
    return <QRCodeReaderDelegateImpl>super.new();
  }

  private _callback: (reader: string, text?: string, format?: string) => void;
  private _beepOnScan: boolean;
  private _isContinuous: boolean;
  private _reportDuplicates: boolean;
  private _scannedArray: Array<string>;
  private _player: AVAudioPlayer;
  private _lastScanResultTs: number = 0;

  public initWithCallback(beepOnScan: boolean, isContinuous: boolean, reportDuplicates: boolean, callback: (reader: string, text: string, format: string) => void): QRCodeReaderDelegateImpl {
    this._isContinuous = isContinuous;
    this._reportDuplicates = reportDuplicates;
    this._callback = callback;
    this._beepOnScan = beepOnScan;
    if (this._beepOnScan) {
      let soundPath = fs.knownFolders.currentApp().path + "/tns_modules/nativescript-barcodescanner/sound/beep.caf";
      this._player = new AVAudioPlayer({contentsOfURL: NSURL.fileURLWithPath(soundPath)});
      this._player.numberOfLoops = 1;
      this._player.volume = 0.7;
      this._player.prepareToPlay();
    }
    return this;
  }

  public readerDidCancel(reader) {
    let app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
    app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
    this._callback(reader);
  }

  public readerDidScanResultForType(reader, text, type) {
    let validResult: boolean = false;
    if (this._isContinuous) {
      if (!this._scannedArray) {
        this._scannedArray = Array<string>();
      }
      // don't report duplicates unless explicitly requested (in which case delay 2 seconds to avoid bursts)
      let newResult: boolean = this._scannedArray.indexOf("[" + text + "][" + type + "]") === -1;
      let now: number = new Date().getTime();
      if (newResult || (this._reportDuplicates && now - this._lastScanResultTs > 2000)) {
        validResult = true;
        this._lastScanResultTs = now;
        this._scannedArray.push("[" + text + "][" + type + "]");
        this._callback(reader, text, type);
      }
    } else {
      validResult = true;
      let app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
      app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
      this._callback(reader, text, type);
    }
    if (validResult && this._player) {
      this._player.play();
    }
  }
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