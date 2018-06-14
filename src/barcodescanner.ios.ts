import {BarcodeScannerView as BarcodeScannerBaseView, ScanOptions, ScanResult} from "./barcodescanner-common";
import * as utils from "tns-core-modules/utils/utils";

export class BarcodeScannerView extends BarcodeScannerBaseView {

  private _reader: QRCodeReader;
  private _scanner: QRCodeReaderViewController;
  private _hasSupport;

  constructor() {
    super();
    this._hasSupport = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo) !== null;
  }

  createNativeView(): Object {
    let v = super.createNativeView();
    if (this._hasSupport) {
      this.initView();
    }
    return v;
  }

  initView() {
    const types = getBarcodeTypes(this.formats);
    this._reader = QRCodeReader.readerWithMetadataObjectTypes(<any>types);

    let torch = false;
    let flip = false;
    let closeButtonLabel = null;
    let cancelLabelBackgroundColor = null;

    if (this.preferFrontCamera) {
      this._reader.switchDeviceInput();
    }

    this._scanner = QRCodeReaderViewController.readerWithCancelButtonTitleCodeReaderStartScanningAtLoadShowSwitchCameraButtonShowTorchButtonCancelButtonBackgroundColor(
        closeButtonLabel, this._reader, true, flip, torch, cancelLabelBackgroundColor);
    this._scanner.modalPresentationStyle = UIModalPresentationStyle.CurrentContext;

    const that = this;
    let delegate = QRCodeReaderDelegateImpl.initWithOwner(new WeakRef(this));
    delegate.setCallback(
        this.beepOnScan,
        true,
        this.reportDuplicates,
        (text: string, format: string) => {
          that.notify({
            eventName: BarcodeScannerBaseView.scanResultEvent,
            object: that,
            format: format,
            text: text
          });
        });
    this._scanner.delegate = delegate;

    if (this.ios) {
      this.ios.layer.insertSublayerAtIndex(this._reader.previewLayer, 0);
      this._reader.startScanning();
    }
  }

  public onLayout(left: number, top: number, right: number, bottom: number): void {
    super.onLayout(left, top, right, bottom);
    if (this._hasSupport && this.ios) {
      this._reader.previewLayer.frame = this.ios.layer.bounds;
    }
  }
}

export class BarcodeScanner {
  private _observer: NSObject;
  private _observerActive: boolean;
  public _currentVolume: number;
  private _scanner: QRCodeReaderViewController;
  private _scanDelegate: QRCodeReaderDelegateImpl;
  private _audioSession: AVAudioSession;
  private _closeCallback: any;
  private _device: AVCaptureDevice;

  constructor() {
    this._device = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo);
    if (this._device && this._device.hasTorch && this._device.hasFlash) {
      this._observer = VolumeObserverClass.alloc();
      this._observer["_owner"] = this;
    }
  }

  private _hasCameraPermission(): boolean {
    let authStatus = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo);
    return authStatus === AVAuthorizationStatus.Authorized;
  }

  private _hasDeniedCameraPermission(): boolean {
    let authStatus = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo);
    return authStatus === AVAuthorizationStatus.Denied || authStatus === AVAuthorizationStatus.Restricted;
  }

  private _addVolumeObserver(): void {
    if (!this._observer) {
      return;
    }

    this._audioSession = utils.ios.getter(AVAudioSession, AVAudioSession.sharedInstance);
    this._audioSession.setActiveError(true);
    this._currentVolume = this._audioSession.outputVolume;
    if (!this._observerActive) {
      this._audioSession.addObserverForKeyPathOptionsContext(this._observer, "outputVolume", 0, null);
      this._observerActive = true;
    }
  }

  private _removeVolumeObserver(): void {
    try {
      if (this._observerActive) {
        this._observerActive = false;
        this._audioSession.removeObserverForKeyPath(this._observer, "outputVolume");
      }
    } catch (ignore) {
    }
  }

  private _enableTorch() {
    this._device.lockForConfiguration();
    this._device.setTorchModeOnWithLevelError(AVCaptureMaxAvailableTorchLevel);
    this._device.flashMode = AVCaptureFlashMode.On;
    this._device.unlockForConfiguration();
  }

  private _disableTorch() {
    this._device.lockForConfiguration();
    this._device.torchMode = AVCaptureTorchMode.Off;
    this._device.flashMode = AVCaptureFlashMode.Off;
    this._device.unlockForConfiguration();
  }

  public available(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      resolve(!!this._device);
    });
  }

  public hasCameraPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      resolve(this._hasCameraPermission());
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
    return new Promise((resolve, reject) => {
      try {
        const app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
        app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
        this._removeVolumeObserver();
        this._closeCallback && this._closeCallback();
        resolve();
      } catch (ex) {
        reject(ex);
      }
    });
  }

  public scan(arg: ScanOptions): Promise<ScanResult> {
    return new Promise((resolve, reject) => {
      try {
        // only need for denied permission as conveniently, this method will auto-request permission upon scan
        if (this._hasDeniedCameraPermission()) {
          if (arg.openSettingsIfPermissionWasPreviouslyDenied) {
            utils.ios.getter(UIApplication, UIApplication.sharedApplication).openURL(NSURL.URLWithString(UIApplicationOpenSettingsURLString));
          }
          reject("The user previously denied permission to access the camera.");
          return;
        }

        this._addVolumeObserver();

        arg = arg || {};
        let closeButtonLabel = arg.cancelLabel || "Close";
        let isContinuous = typeof arg.continuousScanCallback === "function";

        this._closeCallback = arg.closeCallback;

        const types = getBarcodeTypes(arg.formats);

        const reader = QRCodeReader.readerWithMetadataObjectTypes(<any>types);

        if (arg.preferFrontCamera && reader.hasFrontDevice()) {
          reader.switchDeviceInput();
        }

        let torch = arg.showTorchButton;
        let flip = arg.showFlipCameraButton;
        let startScanningAtLoad = true;

        this._scanner = QRCodeReaderViewController.readerWithCancelButtonTitleCodeReaderStartScanningAtLoadShowSwitchCameraButtonShowTorchButtonCancelButtonBackgroundColor(
            closeButtonLabel, reader, startScanningAtLoad, flip, torch, arg.cancelLabelBackgroundColor);

        this._scanner.modalPresentationStyle = UIModalPresentationStyle.FormSheet;

        this._scanDelegate = QRCodeReaderDelegateImpl.initWithOwner(new WeakRef(this));
        this._scanner.delegate = this._scanDelegate;
        this._scanDelegate.setCallback(
            arg.beepOnScan !== false,
            isContinuous,
            arg.reportDuplicates,
            (text: string, format: string) => {
              // invoke the callback / promise
              if (text === undefined) {
                this._removeVolumeObserver();
                this._closeCallback && this._closeCallback();
                reject("Scan aborted");
              } else {
                let result: ScanResult = {
                  format: format,
                  text: text
                };
                if (isContinuous) {
                  arg.continuousScanCallback(result);
                } else {
                  this._removeVolumeObserver();
                  this._closeCallback && this._closeCallback();
                  resolve(result);
                }
              }
            });

        if (this._device && this._device.autoFocusRangeRestrictionSupported) {
          this._device.lockForConfiguration();
          this._device.autoFocusRangeRestriction = AVCaptureAutoFocusRangeRestriction.Near;
          if (this._device.smoothAutoFocusSupported) {
            this._device.smoothAutoFocusEnabled = true;
          }
          this._device.unlockForConfiguration();
        }

        const app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
        app.keyWindow.rootViewController.presentViewControllerAnimatedCompletion(this._scanner, true, () => {
          if (arg.torchOn) {
            this._enableTorch();
          }
        });

      } catch (ex) {
        console.log("Error in barcodescanner.scan: " + ex);
        reject(ex);
      }
    });
  }
}

const getBarcodeTypes = (formatsString: string) => {
  const types = [];
  if (formatsString) {
    let formats = formatsString.split(",");
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
      else if (format === "DATA_MATRIX") types.push(AVMetadataObjectTypeDataMatrixCode);
      else if (format === "EAN_8") types.push(AVMetadataObjectTypeEAN8Code);
      else if (format === "EAN_13") types.push(AVMetadataObjectTypeEAN13Code);
      else if (format === "ITF") types.push(AVMetadataObjectTypeITF14Code);
    }
  } else {
    types.push(AVMetadataObjectTypeUPCECode, AVMetadataObjectTypeCode39Code, AVMetadataObjectTypeCode39Mod43Code,
        AVMetadataObjectTypeEAN13Code, AVMetadataObjectTypeEAN8Code, AVMetadataObjectTypeCode93Code, AVMetadataObjectTypeCode128Code,
        AVMetadataObjectTypeDataMatrixCode, AVMetadataObjectTypeITF14Code,
        AVMetadataObjectTypePDF417Code, AVMetadataObjectTypeQRCode, AVMetadataObjectTypeAztecCode);
  }
  return types;
};

class QRCodeReaderDelegateImpl extends NSObject implements QRCodeReaderDelegate {
  public static ObjCProtocols = [QRCodeReaderDelegate];

  private _owner: WeakRef<any>;

  public static initWithOwner(owner: WeakRef<any>): QRCodeReaderDelegateImpl {
    let delegate = <QRCodeReaderDelegateImpl>QRCodeReaderDelegateImpl.new();
    delegate._owner = owner;
    return delegate;
  }

  private _callback: (text?: string, format?: string) => void;
  private _beepOnScan: boolean;
  private _isContinuous: boolean;
  private _reportDuplicates: boolean;
  private _scannedArray: Array<string>;
  private _player: AVAudioPlayer;
  // initializing this value may prevent recognizing too quickly
  private _lastScanResultTs: number = new Date().getTime();

  public setCallback(beepOnScan: boolean, isContinuous: boolean, reportDuplicates: boolean, callback: (text?: string, format?: string) => void): void {
    this._isContinuous = isContinuous;
    this._reportDuplicates = reportDuplicates;
    this._callback = callback;
    this._beepOnScan = beepOnScan;
    if (this._beepOnScan) {
      const barcodeBundlePath = NSBundle.bundleWithIdentifier("com.telerik.BarcodeScannerFramework").bundlePath;
      this._player = new AVAudioPlayer({contentsOfURL: NSURL.fileURLWithPath(barcodeBundlePath + "/beep.caf")});
      this._player.numberOfLoops = 1;
      this._player.volume = 0.7; // this is not the actual volume, as that really depends on the device volume
      this._player.prepareToPlay();
    }
  }

  public readerDidCancel(reader: QRCodeReaderViewController): void {
    let app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
    app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
    this._callback();
  }

  readerDidScanResultForType(reader: QRCodeReaderViewController, result: string, type: string): void {
    let validResult: boolean = false;

    if (this._isContinuous) {
      if (!this._scannedArray) {
        this._scannedArray = Array<string>();
      }
      // don't report duplicates unless explicitly requested
      let newResult: boolean = this._scannedArray.indexOf("[" + result + "][" + type + "]") === -1;
      if (newResult || this._reportDuplicates) {
        let now: number = new Date().getTime();
        // prevent flooding the callback
        if (now - this._lastScanResultTs < 1700) {
          return;
        }
        this._lastScanResultTs = now;
        validResult = true;
        this._scannedArray.push("[" + result + "][" + type + "]");
        this._callback(result, type);
      }
    } else {
      validResult = true;
      let app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
      app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
      this._callback(result, type);
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
