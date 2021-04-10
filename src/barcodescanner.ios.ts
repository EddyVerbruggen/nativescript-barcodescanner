import { Frame } from "@nativescript/core";
import { BarcodeFormat, BarcodeScannerView as BarcodeScannerBaseView, ScanOptions, ScanResult } from "./barcodescanner-common";

export class BarcodeScannerView extends BarcodeScannerBaseView {

  private _reader: QRCodeReader;
  private _scanner: QRCodeReaderViewController;
  private _hasSupport;
  private _delegate: QRCodeReaderDelegateImpl;

  constructor() {
    super();
    this._hasSupport = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo) !== null;
    if (this._hasSupport) {
      if (typeof AVAudioSession.sharedInstance().setCategoryModeOptionsError === "function") {
        // if music was playing, it would stop unless we do this:
        AVAudioSession.sharedInstance().setCategoryModeOptionsError(AVAudioSessionCategoryPlayback, AVAudioSessionModeDefault, AVAudioSessionCategoryOptions.MixWithOthers);
      }
    }
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
    this._delegate = QRCodeReaderDelegateImpl.initWithOwner(new WeakRef(this));
    this._delegate.setCallback(
        this.beepOnScan,
        true,
        this.reportDuplicates,
        this.formats,
        (text: string, format: string) => {
          that.notify({
            eventName: BarcodeScannerBaseView.scanResultEvent,
            object: that,
            format: format,
            text: text
          });
        });
    this._scanner.delegate = this._delegate;

    setTimeout(() => {
      if (this.ios && this.ios.layer) {
        this.ios.layer.insertSublayerAtIndex(this._reader.previewLayer, 0);
        if (!this.pause) {
          this._reader.startScanning();
        }
      }
    }, 0);
  }

  public onLayout(left: number, top: number, right: number, bottom: number): void {
    super.onLayout(left, top, right, bottom);
    if (this._hasSupport && this.ios && this._reader) {
      this._reader.previewLayer.frame = this.ios.layer.bounds;
    }
  }

  protected pauseScanning(): void {
    if (this._reader && this._reader.running()) {
      this._reader.stopScanning();
    }
  }

  protected resumeScanning(): void {
    if (this._reader && !this._reader.running()) {
      this._reader.startScanning();
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
  private _lastScanViewController: UIViewController;

  constructor() {
    if (typeof AVAudioSession.sharedInstance().setCategoryModeOptionsError === "function") {
      // if music was playing, it would stop unless we do this:
      AVAudioSession.sharedInstance().setCategoryModeOptionsError(AVAudioSessionCategoryPlayback, AVAudioSessionModeDefault, AVAudioSessionCategoryOptions.MixWithOthers);
    }

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

    this._audioSession = AVAudioSession.sharedInstance();
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

  public requestCameraPermission(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const cameraStatus = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo);

      switch (cameraStatus) {
        case AVAuthorizationStatus.NotDetermined: {
          AVCaptureDevice.requestAccessForMediaTypeCompletionHandler(
              AVMediaTypeVideo,
              granted => granted ? resolve() : reject()
          );
          break;
        }
        case AVAuthorizationStatus.Authorized: {
          resolve();
          break;
        }
        case AVAuthorizationStatus.Restricted:
        case AVAuthorizationStatus.Denied: {
          reject();
          break;
        }
      }
    });
  }

  public stop(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.close();
        this._removeVolumeObserver();
        if (this._scanner) {
          this._scanner.stopScanning();
        }
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
            UIApplication.sharedApplication.openURL(NSURL.URLWithString(UIApplicationOpenSettingsURLString));
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

        this._scanner.modalPresentationStyle = arg.fullScreen ? UIModalPresentationStyle.FullScreen : UIModalPresentationStyle.FormSheet;

        this._scanDelegate = QRCodeReaderDelegateImpl.initWithOwner(new WeakRef(this));
        this._scanner.delegate = this._scanDelegate;
        this._scanDelegate.setCallback(
            arg.beepOnScan !== false,
            isContinuous,
            arg.reportDuplicates,
            arg.formats,
            (text: string, barcodeFormat: BarcodeFormat) => {
              // invoke the callback / promise
              if (text === undefined) {
                this._removeVolumeObserver();
                this._closeCallback && this._closeCallback();
                reject("Scan aborted");
              } else {

                let value = text;

                if (shouldReturnEAN13AsUPCA(barcodeFormat, value, arg.formats)) {
                  barcodeFormat = "UPC_A";
                  value = value.substring(1);
                }

                const result: ScanResult = {
                  format: barcodeFormat,
                  text: value
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

        setTimeout(() => {
          this.getViewControllerToPresentFrom(arg.presentInRootViewController).presentViewControllerAnimatedCompletion(this._scanner, true, () => {
            if (arg.torchOn) {
              this._enableTorch();
            }
          });
        }, this.isPresentingModally() ? 650 : 0);

      } catch (ex) {
        console.log("Error in barcodescanner.scan: " + ex);
        reject(ex);
      }
    });
  }

  private isPresentingModally(): boolean {
    let viewController: UIViewController;
    const topMostFrame = Frame.topmost();

    if (topMostFrame) {
      viewController = topMostFrame.currentPage && topMostFrame.currentPage.ios;

      if (viewController) {
        while (viewController.parentViewController) {
          viewController = viewController.parentViewController;
        }

        return !!viewController.presentedViewController;
      }
    }

    return false;
  }

  private close(): void {
    if (this._lastScanViewController) {
      this._lastScanViewController.dismissViewControllerAnimatedCompletion(true, null);
      this._lastScanViewController = undefined;
    } else {
      this.getViewControllerToPresentFrom().dismissViewControllerAnimatedCompletion(true, null);
    }
  }

  private getViewControllerToPresentFrom(presentInRootViewController?: boolean): UIViewController {
    let viewController: UIViewController;
    const topMostFrame = Frame.topmost();

    if (topMostFrame && presentInRootViewController !== true) {
      viewController = topMostFrame.currentPage && topMostFrame.currentPage.ios;

      if (viewController) {
        while (viewController.parentViewController) {
          // find top-most view controler
          viewController = viewController.parentViewController;
        }

        while (viewController.presentedViewController) {
          // find last presented modal
          viewController = viewController.presentedViewController;
        }
      }
    }

    if (!viewController) {
      viewController = UIApplication.sharedApplication.keyWindow.rootViewController;
    }

    this._lastScanViewController = viewController;
    return viewController;
  }
}

const shouldReturnEAN13AsUPCA = (barcodeFormat: BarcodeFormat, value: string, requestedFormats?: string): boolean => {
  return barcodeFormat === "EAN_13" &&
      value.indexOf("0") === 0;
  // why not add the line below? Well, see https://github.com/EddyVerbruggen/nativescript-barcodescanner/issues/176
  // && (!requestedFormats || requestedFormats.indexOf("UPC_A") > -1);
};

const getBarcodeFormat = (nativeFormat: string): BarcodeFormat => {
  if (nativeFormat === AVMetadataObjectTypeQRCode) return "QR_CODE";
  else if (nativeFormat === AVMetadataObjectTypePDF417Code) return "PDF_417";
  else if (nativeFormat === AVMetadataObjectTypeAztecCode) return "AZTEC";
  else if (nativeFormat === AVMetadataObjectTypeUPCECode) return "UPC_E";
  else if (nativeFormat === AVMetadataObjectTypeCode39Code) return "CODE_39";
  else if (nativeFormat === AVMetadataObjectTypeCode39Mod43Code) return "CODE_39_MOD_43";
  else if (nativeFormat === AVMetadataObjectTypeCode93Code) return "CODE_93";
  else if (nativeFormat === AVMetadataObjectTypeCode128Code) return "CODE_128";
  else if (nativeFormat === AVMetadataObjectTypeDataMatrixCode) return "DATA_MATRIX";
  else if (nativeFormat === AVMetadataObjectTypeEAN8Code) return "EAN_8";
  else if (nativeFormat === AVMetadataObjectTypeITF14Code) return "ITF";
  else if (nativeFormat === AVMetadataObjectTypeEAN13Code) return "EAN_13";
  else if (nativeFormat === AVMetadataObjectTypeInterleaved2of5Code) return "INTERLEAVED_2_OF_5";
  else {
    console.log("Unknown format scanned: " + nativeFormat + ", please report this at https://github.com/EddyVerbruggen/nativescript-barcodescanner/issues");
    return <BarcodeFormat>nativeFormat;
  }
};

const getBarcodeTypes = (formatsString: string): Array<string> => {
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
      else if (format === "ITF") types.push(AVMetadataObjectTypeITF14Code);
      else if (format === "INTERLEAVED_2_OF_5") types.push(AVMetadataObjectTypeInterleaved2of5Code);
      // see https://github.com/EddyVerbruggen/nativescript-barcodescanner/issues/176
      else if (format === "EAN_13" || format === "UPC_A") types.push(AVMetadataObjectTypeEAN13Code);
    }
  } else {
    types.push(AVMetadataObjectTypeUPCECode, AVMetadataObjectTypeCode39Code, AVMetadataObjectTypeCode39Mod43Code,
        AVMetadataObjectTypeEAN13Code, AVMetadataObjectTypeEAN8Code, AVMetadataObjectTypeCode93Code,
        AVMetadataObjectTypeCode128Code, AVMetadataObjectTypeDataMatrixCode, AVMetadataObjectTypeITF14Code,
        AVMetadataObjectTypePDF417Code, AVMetadataObjectTypeQRCode, AVMetadataObjectTypeAztecCode,
        AVMetadataObjectTypeInterleaved2of5Code);
  }
  return types;
};

@NativeClass
class QRCodeReaderDelegateImpl extends NSObject implements QRCodeReaderDelegate {
  public static ObjCProtocols = [QRCodeReaderDelegate];

  private _owner: WeakRef<any>;

  public static initWithOwner(owner: WeakRef<any>): QRCodeReaderDelegateImpl {
    let delegate = <QRCodeReaderDelegateImpl>QRCodeReaderDelegateImpl.new();
    delegate._owner = owner;
    return delegate;
  }

  private _callback: (text?: string, format?: BarcodeFormat) => void;
  private _beepOnScan: boolean;
  private _isContinuous: boolean;
  private _reportDuplicates: boolean;
  private _requestedFormats: string;
  private _scannedArray: Array<string>;
  // initializing this value may prevent recognizing too quickly
  private _lastScanResultTs: number = new Date().getTime();

  public setCallback(beepOnScan: boolean, isContinuous: boolean, reportDuplicates: boolean, requestedFormats: string, callback: (text?: string, format?: BarcodeFormat) => void): void {
    this._isContinuous = isContinuous;
    this._reportDuplicates = reportDuplicates;
    this._requestedFormats = requestedFormats;
    this._callback = callback;
    this._beepOnScan = beepOnScan;
  }

  public readerDidCancel(reader: QRCodeReaderViewController): void {
    this._owner.get().close();
    this._callback();
  }

  readerDidScanResultForType(reader: QRCodeReaderViewController, result: string, type: string): void {
    let validResult: boolean = false;

    let barcodeFormat = getBarcodeFormat(type);
    let value = result;

    if (shouldReturnEAN13AsUPCA(barcodeFormat, value, this._requestedFormats)) {
      barcodeFormat = "UPC_A";
      value = value.substring(1);
    }

    if (this._isContinuous) {
      if (!this._scannedArray) {
        this._scannedArray = Array<string>();
      }
      // don't report duplicates unless explicitly requested
      let newResult: boolean = this._scannedArray.indexOf("[" + value + "][" + barcodeFormat + "]") === -1;
      if (newResult || this._reportDuplicates) {
        let now: number = new Date().getTime();
        // prevent flooding the callback
        if (now - this._lastScanResultTs < 1700) {
          return;
        }
        this._lastScanResultTs = now;
        validResult = true;
        this._scannedArray.push("[" + value + "][" + barcodeFormat + "]");
        this._callback(value, barcodeFormat);
      }
    } else {
      validResult = true;
      this._owner.get().close();
      this._callback(value, barcodeFormat);
    }

    if (validResult && this._beepOnScan) {
      // tone
      AudioServicesPlaySystemSound(1200);
      // weak-boom (taptic feedback)
      setTimeout(() => {
        AudioServicesPlaySystemSound(1519);
      });
    }
  }
}

class VolumeObserverClass extends NSObject {
  observeValueForKeyPathOfObjectChangeContext(path: string, obj: Object, change: NSDictionary<any, any>, context: any) {
    if (path === "outputVolume") {
      let volumeLevel = MPMusicPlayerController.applicationMusicPlayer.volume;
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
