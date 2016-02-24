var barcodescanner = require("./barcodescanner-common");
var appModule = require("application");
var context = appModule.android.context;

var SCANNER_REQUEST_CODE = 444;
var CAMERA_PERMISSION_REQUEST_CODE = 555;

barcodescanner._cameraPermissionGranted = function () {
  var hasPermission = android.os.Build.VERSION.SDK_INT < 23; // Android M. (6.0)
  if (!hasPermission) {
    hasPermission = android.content.pm.PackageManager.PERMISSION_GRANTED ==
    android.support.v4.content.ContextCompat.checkSelfPermission(appModule.android.foregroundActivity, android.Manifest.permission.CAMERA);
  }
  return hasPermission;
};

barcodescanner.hasCameraPermission = function () {
  return new Promise(function (resolve) {
    resolve(barcodescanner._cameraPermissionGranted());
  });
};

barcodescanner.requestCameraPermission = function () {
  return new Promise(function (resolve) {
    if (!barcodescanner._cameraPermissionGranted()) {
      // in a future version we could hook up the callback and change this flow a bit
      android.support.v4.app.ActivityCompat.requestPermissions(
          appModule.android.foregroundActivity,
          [android.Manifest.permission.CAMERA],
          CAMERA_PERMISSION_REQUEST_CODE);
      // this is not the nicest solution as the user needs to initiate scanning again after granting permission,
      // so enhance this in a future version, but it's ok for now
      resolve();
    }
  });
};

barcodescanner.scan = function(arg) {
  return new Promise(function (resolve, reject) {
    try {
      if (!barcodescanner._cameraPermissionGranted()) {
        barcodescanner.requestCameraPermission();
        reject("Permission needed");
        return;
      }

      // the intent name should match the filter name in AndroidManifest.xml, don't change it
      var intent = new android.content.Intent("com.google.zxing.client.android.SCAN");

      // limit searching for a valid Intent to this package only
      intent.setPackage(context.getPackageName());

      if (arg !== null) {
        // shown at the bottom of the scan UI, default is: "Place a barcode inside the viewfinder rectangle to scan it."
        if (arg.message) {
          intent.putExtra("PROMPT_MESSAGE", arg.message);
        }
        if (arg.preferFrontCamera === true) {
          intent.putExtra(com.google.zxing.client.android.Intents.Scan.PREFER_FRONTCAMERA, true);
        }
        if (arg.showFlipCameraButton === true) {
          intent.putExtra(com.google.zxing.client.android.Intents.Scan.SHOW_FLIP_CAMERA_BUTTON, true);
        }
      }

      if (intent.resolveActivity(appModule.android.context.getPackageManager()) !== null) {
        var previousResult = appModule.android.onActivityResult;
        appModule.android.onActivityResult = function (requestCode, resultCode, data) {
          appModule.android.onActivityResult = previousResult;
          if (requestCode === SCANNER_REQUEST_CODE) {
            if (resultCode === android.app.Activity.RESULT_OK) {
              resolve({
                format : data.getStringExtra("SCAN_RESULT_FORMAT"),
                text : data.getStringExtra("SCAN_RESULT")
              });
            } else {
              reject("Scan aborted");
            }
          }
        };

        appModule.android.foregroundActivity.startActivityForResult(intent, SCANNER_REQUEST_CODE);
      } else {
        // this is next to impossible
        reject("Configuration error");
      }
    } catch (ex) {
      console.log("Error in barcodescanner.scan: " + ex);
      reject(ex);
    }
  });
};

module.exports = barcodescanner;