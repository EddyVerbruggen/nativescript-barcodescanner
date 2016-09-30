var barcodescanner = {};

// a few default implementations because not all platforms provide them

barcodescanner.hasCameraPermission = function () {
  return new Promise(function (resolve) {
    resolve(true);
  });
};

barcodescanner.requestCameraPermission = function () {
  return new Promise(function (resolve) {
    resolve();
  });
};

module.exports = barcodescanner;