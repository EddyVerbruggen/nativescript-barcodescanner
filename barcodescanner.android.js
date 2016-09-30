var barcodescanner = require("./barcodescanner-common");
var appModule = require("application");
var camModule = require("camera");

var SCANNER_REQUEST_CODE = 444;
var CAMERA_PERMISSION_REQUEST_CODE = 555;
var broadcastManager;

barcodescanner.rememberedContext = null;

barcodescanner._cameraPermissionGranted = function () {
  var hasPermission = android.os.Build.VERSION.SDK_INT < 23; // Android M. (6.0)
  if (!hasPermission) {
    hasPermission = android.content.pm.PackageManager.PERMISSION_GRANTED ==
        android.support.v4.content.ContextCompat.checkSelfPermission(appModule.android.currentContext, android.Manifest.permission.CAMERA);
  }
  return hasPermission;
};

barcodescanner.available = function () {
  return new Promise(function (resolve, reject) {
    try {
      resolve(camModule.isAvailable());
    } catch (ex) {
      console.log("Error in barcodescanner.available: " + ex);
      // let's just assume it's ok
      resolve(true);
    }
  });
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
          appModule.android.currentContext,
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
      intent.setPackage(appModule.android.context.getPackageName());

      arg = arg || {};

      // shown at the bottom of the scan UI, default is: "Place a barcode inside the viewfinder rectangle to scan it."
      if (arg.message) {
        intent.putExtra("PROMPT_MESSAGE", arg.message);
      }
      if (arg.preferFrontCamera === true) {
        // if no front cam is found this will fall back to the back camera
        intent.putExtra(com.google.zxing.client.android.Intents.Scan.CAMERA_ID, 1);
      }
      if (arg.showFlipCameraButton === true) {
        intent.putExtra(com.google.zxing.client.android.Intents.Scan.SHOW_FLIP_CAMERA_BUTTON, true);
      }
      if (arg.orientation) {
        // if not set, sensor orientation is used (rotates with the device)
        intent.putExtra(com.google.zxing.client.android.Intents.Scan.ORIENTATION_LOCK, arg.orientation);
      }
      if (arg.formats) {
        intent.putExtra(com.google.zxing.client.android.Intents.Scan.FORMATS, arg.formats);
        // intent.putExtra(com.google.zxing.client.android.Intents.Scan.MODE, com.google.zxing.client.android.Intents.Scan.QR_CODE_MODE);
      }

      // rectangle size can be controlled as well (but don't bother as of yet)
      // intent.putExtra(com.google.zxing.client.android.Intents.Scan.WIDTH, 200);
      // intent.putExtra(com.google.zxing.client.android.Intents.Scan.HEIGHT, 200);

      var isContinuous = typeof arg.continuousScanCallback === "function";
      if (isContinuous) {

        if (!broadcastManager) {
          broadcastManager = android.support.v4.content.LocalBroadcastManager.getInstance(com.tns.NativeScriptApplication.getInstance());
        }

        barcodescanner._continuousScanCallback = arg.continuousScanCallback;
        intent.putExtra(com.google.zxing.client.android.Intents.Scan.BULK_SCAN, true);
        barcodescanner._scannedArray = [];

        var CallbackReceiver = android.content.BroadcastReceiver.extend({
          onReceive: function (context, data) {
            var format = data.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT_FORMAT);
            var text = data.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT);

            // don't report duplicates
            if (barcodescanner._scannedArray.indexOf("[" + text + "][" + format + "]") == -1) {
              barcodescanner._scannedArray.push("[" + text + "][" + format + "]");
              barcodescanner._continuousScanCallback({
                format : format,
                text : text
              });
            }
          }
        });
        barcodescanner._onReceiveCallback = new CallbackReceiver();
        broadcastManager.registerReceiver(barcodescanner._onReceiveCallback, new android.content.IntentFilter("bulk-barcode-result"));
      }

      if (intent.resolveActivity(com.tns.NativeScriptApplication.getInstance().getPackageManager()) !== null) {
        var previousResult = appModule.android.onActivityResult;
        appModule.android.onActivityResult = function (requestCode, resultCode, data) {
          if (barcodescanner.rememberedContext !== null) {
            appModule.android.currentContext = barcodescanner.rememberedContext;
            barcodescanner.rememberedContext = null;
          }
          appModule.android.onActivityResult = previousResult;
          if (requestCode === SCANNER_REQUEST_CODE) {
            if (isContinuous) {
              broadcastManager.unregisterReceiver(barcodescanner._onReceiveCallback);
              barcodescanner._onReceiveCallback = undefined;
            } else {
              if (resultCode === android.app.Activity.RESULT_OK) {
                var format = data.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT_FORMAT);
                var text = data.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT);
                resolve({
                  format : format,
                  text : text
                });
              } else {
                reject("Scan aborted");
              }
            }
          }
        };

        // we need to cache and restore the context, otherwise the dialogs module will be broken (and possibly other things as well)
        barcodescanner.rememberedContext = appModule.android.currentContext;
        appModule.android.currentContext.startActivityForResult(intent, SCANNER_REQUEST_CODE);

        if (isContinuous) {
          resolve();
        }
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

barcodescanner.stop = function (arg) {
  return new Promise(function (resolve, reject) {
    try {
      var stopIntent = new android.content.Intent("barcode-scanner-stop");
      broadcastManager.sendBroadcast(stopIntent);
      broadcastManager.unregisterReceiver(barcodescanner._onReceiveCallback);
      barcodescanner._onReceiveCallback = undefined;
      resolve();
    } catch (ex) {
      reject(ex);
    }
  });
};

module.exports = barcodescanner;