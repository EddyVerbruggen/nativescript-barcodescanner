"use strict";
var utils = require("utils/utils");
var frame = require("ui/frame");
var BarcodeScanner = (function () {
    function BarcodeScanner() {
        this._hasCameraPermission = function () {
            var authStatus = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo);
            return authStatus === 3;
        };
        this._hasDeniedCameraPermission = function () {
            var authStatus = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo);
            return authStatus === 2 || authStatus === 1;
        };
        this._addVolumeObserver = function () {
            this._audioSession = utils.ios.getter(AVAudioSession, AVAudioSession.sharedInstance);
            this._audioSession.setActiveError(true, null);
            this._currentVolume = this._audioSession.outputVolume;
            if (!this._observerActive) {
                this._audioSession.addObserverForKeyPathOptionsContext(this._observer, "outputVolume", 0, null);
                this._observerActive = true;
            }
        };
        this._removeVolumeObserver = function () {
            try {
                if (this._observerActive) {
                    this._observerActive = false;
                    this._audioSession.removeObserverForKeyPath(this._observer, "outputVolume");
                }
            }
            catch (ignore) {
            }
        };
        this._enableTorch = function () {
            var device = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo);
            device.lockForConfiguration();
            device.setTorchModeOnWithLevelError(AVCaptureMaxAvailableTorchLevel);
            device.flashMode = 1;
            device.unlockForConfiguration();
        };
        this._disableTorch = function () {
            var device = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo);
            device.lockForConfiguration();
            device.torchMode = 0;
            device.flashMode = 0;
            device.unlockForConfiguration();
        };
        this._observer = VolumeObserverClass.alloc();
        this._observer["_owner"] = this;
    }
    BarcodeScanner.prototype.available = function () {
        return new Promise(function (resolve, reject) {
            resolve(AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo) !== null);
        });
    };
    ;
    BarcodeScanner.prototype.hasCameraPermission = function () {
        var self = this;
        return new Promise(function (resolve) {
            resolve(self._hasCameraPermission());
        });
    };
    ;
    BarcodeScanner.prototype.requestCameraPermission = function () {
        return new Promise(function (resolve) {
            QRCodeReader.isAvailable();
            resolve();
        });
    };
    ;
    BarcodeScanner.prototype.stop = function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            try {
                var app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
                app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
                self._removeVolumeObserver();
                resolve();
            }
            catch (ex) {
                reject(ex);
            }
        });
    };
    ;
    BarcodeScanner.prototype.scan = function (arg) {
        var self = this;
        return new Promise(function (resolve, reject) {
            try {
                if (self._hasDeniedCameraPermission()) {
                    if (arg.openSettingsIfPermissionWasPreviouslyDenied) {
                        utils.ios.getter(UIApplication, UIApplication.sharedApplication).openURL(NSURL.URLWithString(UIApplicationOpenSettingsURLString));
                    }
                    reject("The user previously denied permission to access the camera.");
                    return;
                }
                self._addVolumeObserver();
                arg = arg || {};
                var closeButtonLabel = arg.cancelLabel || "Close";
                var isContinuous_1 = typeof arg.continuousScanCallback === "function";
                var types = [];
                if (arg.formats) {
                    var formats = arg.formats.split(",");
                    for (var _i = 0, formats_1 = formats; _i < formats_1.length; _i++) {
                        var format = formats_1[_i];
                        format = format.trim();
                        if (format === "QR_CODE")
                            types.push(AVMetadataObjectTypeQRCode);
                        else if (format === "PDF_417")
                            types.push(AVMetadataObjectTypePDF417Code);
                        else if (format === "AZTEC")
                            types.push(AVMetadataObjectTypeAztecCode);
                        else if (format === "UPC_E")
                            types.push(AVMetadataObjectTypeUPCECode);
                        else if (format === "CODE_39")
                            types.push(AVMetadataObjectTypeCode39Code);
                        else if (format === "CODE_39_MOD_43")
                            types.push(AVMetadataObjectTypeCode39Mod43Code);
                        else if (format === "CODE_93")
                            types.push(AVMetadataObjectTypeCode93Code);
                        else if (format === "CODE_128")
                            types.push(AVMetadataObjectTypeCode128Code);
                        else if (format === "EAN_8")
                            types.push(AVMetadataObjectTypeEAN8Code);
                        else if (format === "EAN_13")
                            types.push(AVMetadataObjectTypeEAN13Code);
                    }
                }
                else {
                    types = [AVMetadataObjectTypeUPCECode, AVMetadataObjectTypeCode39Code, AVMetadataObjectTypeCode39Mod43Code,
                        AVMetadataObjectTypeEAN13Code, AVMetadataObjectTypeEAN8Code, AVMetadataObjectTypeCode93Code, AVMetadataObjectTypeCode128Code,
                        AVMetadataObjectTypePDF417Code, AVMetadataObjectTypeQRCode, AVMetadataObjectTypeAztecCode];
                }
                var reader = QRCodeReader.readerWithMetadataObjectTypes(types);
                if (arg.preferFrontCamera && reader.hasFrontDevice()) {
                    reader.switchDeviceInput();
                }
                var torch = arg.showTorchButton;
                var flip = arg.showFlipCameraButton;
                var startScanningAtLoad = true;
                self._scanner = QRCodeReaderViewController.readerWithCancelButtonTitleCodeReaderStartScanningAtLoadShowSwitchCameraButtonShowTorchButton(closeButtonLabel, reader, startScanningAtLoad, flip, torch);
                self._scanner.modalPresentationStyle = 2;
                var delegate_1 = QRCodeReaderDelegateImpl.new().initWithCallback(isContinuous_1, arg.reportDuplicates, function (reader, text, format) {
                    if (text === undefined) {
                        self._removeVolumeObserver();
                        reject("Scan aborted");
                    }
                    else {
                        var result = {
                            format: format,
                            text: text
                        };
                        if (isContinuous_1) {
                            arg.continuousScanCallback(result);
                        }
                        else {
                            self._removeVolumeObserver();
                            resolve(result);
                        }
                    }
                    delegate_1 = undefined;
                });
                self._scanner.delegate = delegate_1;
                var device = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo);
                device.lockForConfiguration();
                device.autoFocusRangeRestriction = 1;
                device.unlockForConfiguration();
                var topMostFrame = frame.topmost();
                if (topMostFrame) {
                    var vc = topMostFrame.currentPage && topMostFrame.currentPage.ios;
                    if (vc) {
                        vc.presentViewControllerAnimatedCompletion(self._scanner, true, null);
                    }
                }
                if (isContinuous_1) {
                    resolve();
                }
            }
            catch (ex) {
                console.log("Error in barcodescanner.scan: " + ex);
                reject(ex);
            }
        });
    };
    ;
    return BarcodeScanner;
}());
exports.BarcodeScanner = BarcodeScanner;
var QRCodeReaderDelegateImpl = (function (_super) {
    __extends(QRCodeReaderDelegateImpl, _super);
    function QRCodeReaderDelegateImpl() {
        _super.apply(this, arguments);
    }
    QRCodeReaderDelegateImpl.new = function () {
        return _super.new.call(this);
    };
    QRCodeReaderDelegateImpl.prototype.initWithCallback = function (isContinuous, reportDuplicates, callback) {
        this._isContinuous = isContinuous;
        this._reportDuplicates = reportDuplicates;
        this._callback = callback;
        return this;
    };
    QRCodeReaderDelegateImpl.prototype.readerDidCancel = function (reader) {
        var app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
        app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
        this._callback(reader);
    };
    ;
    QRCodeReaderDelegateImpl.prototype.readerDidScanResultForType = function (reader, text, type) {
        if (this._isContinuous) {
            if (!this._scannedArray) {
                this._scannedArray = Array();
            }
            if (this._reportDuplicates || this._scannedArray.indexOf("[" + text + "][" + type + "]") === -1) {
                this._scannedArray.push("[" + text + "][" + type + "]");
                this._callback(reader, text, type);
            }
        }
        else {
            var app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
            app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
            this._callback(reader, text, type);
        }
    };
    ;
    QRCodeReaderDelegateImpl.ObjCProtocols = [QRCodeReaderDelegate];
    return QRCodeReaderDelegateImpl;
}(NSObject));
var VolumeObserverClass = (function (_super) {
    __extends(VolumeObserverClass, _super);
    function VolumeObserverClass() {
        _super.apply(this, arguments);
    }
    VolumeObserverClass.prototype.observeValueForKeyPathOfObjectChangeContext = function (path, obj, change, context) {
        if (path === "outputVolume") {
            var volumeLevel = utils.ios.getter(MPMusicPlayerController, MPMusicPlayerController.applicationMusicPlayer).volume;
            if (volumeLevel > this["_owner"]._currentVolume) {
                this["_owner"]._enableTorch();
            }
            else {
                this["_owner"]._disableTorch();
            }
            this["_owner"]._currentVolume = volumeLevel;
        }
    };
    return VolumeObserverClass;
}(NSObject));
