var barcodescanner = require("./barcodescanner-common");
var frame = require("ui/frame");

barcodescanner.available = function () {
  return new Promise(function (resolve) {
    resolve(QRCodeReader.isAvailable());
  });
};

// TODO consider giving camera PERMISSION beforehand: https://github.com/yannickl/QRCodeReaderViewController/issues/4,
// would fit well with the Android 6 implementation.
barcodescanner.scan = function (arg) {
  return new Promise(function (resolve, reject) {
    try {
      arg = arg || {};
      var closeButtonLabel = arg.cancelLabel || "Close";

      var types = [];
      if (arg.formats) {
        var formats = arg.formats.split(",");
        for (var f in formats) {
          var format = formats[f].trim();
          console.log("---- format: " + format);
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
      var delegate = QRCodeReaderDelegateImpl.new().initWithCallback(function (reader, text, type) {
        // invoke the callback / promise
        if (text === undefined) {
          reject("Scan aborted");
        } else {
          resolve({
            format : type,
            text : text
          });
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
    } catch (ex) {
      console.log("Error in barcodescanner.scan: " + ex);
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
  QRCodeReaderDelegateImpl.prototype.initWithCallback = function (callback) {
    this._callback = callback;
    return this;
  };
  QRCodeReaderDelegateImpl.prototype.readerDidCancel = function (reader) {
    UIApplication.sharedApplication().keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
    this._callback(reader);
  };
  QRCodeReaderDelegateImpl.prototype.readerDidScanResultForType = function (reader, text, type) {
    UIApplication.sharedApplication().keyWindow.rootViewController.dismissViewControllerAnimatedCompletion(true, null);
    this._callback(reader, text, type);
  };
  QRCodeReaderDelegateImpl.ObjCProtocols = [QRCodeReaderDelegate];
  return QRCodeReaderDelegateImpl;
})(NSObject);

module.exports = barcodescanner;