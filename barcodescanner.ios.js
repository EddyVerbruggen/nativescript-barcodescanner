var barcodescanner = require("./barcodescanner-common");
var frame = require("ui/frame");
var utils = require("utils/utils");

barcodescanner.available = function () {
  return new Promise(function (resolve) {
    // since this would also request permission...
    //   resolve(QRCodeReader.isAvailable());
    // ... and it's extremely likely to be 'true' anyway, I decided to hardcode this:
    resolve(true);
  });
};

// TODO consider asking camera PERMISSION beforehand: https://github.com/yannickl/QRCodeReaderViewController/issues/4,
// would fit well with the Android 6 implementation.
barcodescanner.scan = function (arg) {
  return new Promise(function (resolve, reject) {
    try {
      arg = arg || {};
      var closeButtonLabel = arg.cancelLabel || "Close";
      var isContinuous = typeof arg.continuousScanCallback === "function";

      var types = [];
      if (arg.formats) {
        var formats = arg.formats.split(",");
        for (var f in formats) {
          var format = formats[f].trim();
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

      var bs = QRCodeReaderViewController.readerWithCancelButtonTitleMetadataObjectTypes(closeButtonLabel, types);
      bs.modalPresentationStyle = UIModalPresentationFormSheet;

      // Assign first to local variable, otherwise it will be garbage collected since delegate is weak reference.
      var delegate = QRCodeReaderDelegateImpl.new().initWithCallback(isContinuous, function (reader, text, format) {
        // invoke the callback / promise
        if (text === undefined) {
          reject("Scan aborted");
        } else {
          var result = {
            format : format,
            text : text
          };
          if (isContinuous) {
            arg.continuousScanCallback(result);
          } else {
            resolve(result);
          }
        }
        // Remove the local variable for the delegate.
        delegate = undefined;
      });
      bs.delegate = delegate;

      var topMostFrame = frame.topmost();
      if (topMostFrame) {
        var vc = topMostFrame.currentPage && topMostFrame.currentPage.ios;
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

barcodescanner.stop = function (arg) {
  return new Promise(function (resolve, reject) {
    try {
      var app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
      app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
      resolve();
    } catch (ex) {
      reject(ex);
    }
  });
};

var QRCodeReaderDelegateImpl = (function (_super) {
  __extends(QRCodeReaderDelegateImpl, _super);
  function QRCodeReaderDelegateImpl() {
    _super.apply(this, arguments);
  }

  QRCodeReaderDelegateImpl.new = function () {
    return _super.new.call(this);
  };
  QRCodeReaderDelegateImpl.prototype.initWithCallback = function (isContinuous, callback) {
    this._isContinuous = isContinuous;
    this._callback = callback;
    return this;
  };
  QRCodeReaderDelegateImpl.prototype.readerDidCancel = function (reader) {
    var app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
    app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
    this._callback(reader);
  };
  QRCodeReaderDelegateImpl.prototype.readerDidScanResultForType = function (reader, text, type) {
    if (this._isContinuous) {
      if (!this._scannedArray) {
        this._scannedArray = [];
      }
      // don't report duplicates
      if (this._scannedArray.indexOf("[" + text + "][" + type + "]") == -1) {
        this._scannedArray.push("[" + text + "][" + type + "]");
        this._callback(reader, text, type);
      }
    } else {
      var app = utils.ios.getter(UIApplication, UIApplication.sharedApplication);
      app.keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
      this._callback(reader, text, type);
    }
  };
  QRCodeReaderDelegateImpl.ObjCProtocols = [QRCodeReaderDelegate];
  return QRCodeReaderDelegateImpl;
})(NSObject);

module.exports = barcodescanner;