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
      var closeButtonLabel = arg.cancelLabel || "Close";

      var types = [AVMetadataObjectTypeUPCECode, AVMetadataObjectTypeCode39Code, AVMetadataObjectTypeCode39Mod43Code,
        AVMetadataObjectTypeEAN13Code, AVMetadataObjectTypeEAN8Code, AVMetadataObjectTypeCode93Code, AVMetadataObjectTypeCode128Code,
        AVMetadataObjectTypePDF417Code, AVMetadataObjectTypeQRCode, AVMetadataObjectTypeAztecCode];

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