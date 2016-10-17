import {ScanOptions} from "./barcodescanner.common";
import * as appModule from "application";
import * as camera from "camera";
import * as utils from "utils/utils";

let SCANNER_REQUEST_CODE = 444;

declare let com, android: any;

export class BarcodeScanner {

  private broadcastManager: any = null;
  private onScanReceivedCallback: any;
  private onContinuousScanResult: any;
  private uniquelyScannedCodes: Array<string>;
  private onPermissionGranted: Function;
  private onPermissionRejected: Function;
  // I'd rather get rid of this one
  private rememberedContext: any = null;

  constructor() {
    let self = this;
    appModule.android.on(appModule.AndroidApplication.activityRequestPermissionsEvent, function (args: any) {
      for (let i = 0; i < args.permissions.length; i++) {
        if (args.grantResults[i] === android.content.pm.PackageManager.PERMISSION_DENIED) {
          self.onPermissionRejected("Please allow access to the Camera and try again.");
          return;
        }
      }

      if (self.onPermissionGranted) {
        self.onPermissionGranted();
      } else {
        console.log("No after-permission callback function specified for requestCode " + args.requestCode + ". That's a bug in the nativescript-barcodescanner plugin, please report it!")
      }
    });
  }

  private wasCameraPermissionGranted = function () {
    let hasPermission = android.os.Build.VERSION.SDK_INT < 23; // Android M. (6.0)
    if (!hasPermission) {
      hasPermission = android.content.pm.PackageManager.PERMISSION_GRANTED ===
          android.support.v4.content.ContextCompat.checkSelfPermission(utils.ad.getApplicationContext(), android.Manifest.permission.CAMERA);
    }
    return hasPermission;
  };

  private requestCameraPermissionInternal = function (onPermissionGranted, reject) {
    this.onPermissionGranted = onPermissionGranted;
    this.onPermissionRejected = reject;
    android.support.v4.app.ActivityCompat.requestPermissions(
        appModule.android.currentContext,
        [android.Manifest.permission.CAMERA],
        234 // irrelevant since we simply invoke onPermissionGranted
    );
  };

  public available(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        resolve(camera.isAvailable());
      } catch (ex) {
        console.log("Error in barcodescanner.available: " + ex);
        // let's just assume it's ok
        resolve(true);
      }
    });
  };

  public hasCameraPermission(): Promise<boolean> {
    let self = this;
    return new Promise(function (resolve) {
      let granted = self.wasCameraPermissionGranted();
      resolve(granted);
    });
  };

  public requestCameraPermission(): Promise<boolean> {
    let self = this;
    return new Promise(function (resolve, reject) {
      try {
        self.requestCameraPermissionInternal(resolve, reject);
      } catch (ex) {
        console.log("Error in barcodescanner.requestCameraPermission: " + ex);
        reject(ex);
      }
    });
  };

  public stop(): Promise<any> {
    let self = this;
    return new Promise(function (resolve, reject) {
      try {
        if (!self.broadcastManager) {
          reject("You found a bug in the plugin, please report that calling stop() failed with this message.");
          return;
        }
        let stopIntent = new android.content.Intent("barcode-scanner-stop");
        self.broadcastManager.sendBroadcast(stopIntent);

        if (self.onScanReceivedCallback) {
          self.broadcastManager.unregisterReceiver(self.onScanReceivedCallback);
          self.onScanReceivedCallback = undefined;
        }
        resolve();
      } catch (ex) {
        reject(ex);
      }
    });
  };

  public scan(arg: ScanOptions): Promise<any> {
    let self = this;
    return new Promise(function (resolve, reject) {
      let onPermissionGranted = function() {
        // the intent name should match the filter name in AndroidManifest.xml, don't change it
        let intent = new android.content.Intent("com.google.zxing.client.android.SCAN");

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

        // required for the 'stop' function
        if (!self.broadcastManager) {
          self.broadcastManager = android.support.v4.content.LocalBroadcastManager.getInstance(com.tns.NativeScriptApplication.getInstance());
        }

        let isContinuous = typeof arg.continuousScanCallback === "function";
        if (isContinuous) {

          self.onContinuousScanResult = arg.continuousScanCallback;
          intent.putExtra(com.google.zxing.client.android.Intents.Scan.BULK_SCAN, true);
          self.uniquelyScannedCodes = new Array<string>();

          let CallbackReceiver = android.content.BroadcastReceiver.extend({
            onReceive: function (context, data) {
              let format = data.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT_FORMAT);
              let text = data.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT);

              // don't report duplicates
              if (self.uniquelyScannedCodes.indexOf("[" + text + "][" + format + "]") == -1) {
                self.uniquelyScannedCodes.push("[" + text + "][" + format + "]");
                self.onContinuousScanResult({
                  format : format,
                  text : text
                });
              }
            }
          });
          self.onScanReceivedCallback = new CallbackReceiver();
          self.broadcastManager.registerReceiver(self.onScanReceivedCallback, new android.content.IntentFilter("bulk-barcode-result"));
        }

        if (intent.resolveActivity(com.tns.NativeScriptApplication.getInstance().getPackageManager()) !== null) {
          let previousResult = appModule.android.onActivityResult;
          appModule.android.onActivityResult = function (requestCode, resultCode, data) {
            if (self.rememberedContext !== null) {
              appModule.android.currentContext = self.rememberedContext;
              self.rememberedContext = null;
            }
            appModule.android.onActivityResult = previousResult;
            if (requestCode === SCANNER_REQUEST_CODE) {
              if (isContinuous) {
                self.broadcastManager.unregisterReceiver(self.onScanReceivedCallback);
                self.onScanReceivedCallback = undefined;
              } else {
                if (resultCode === android.app.Activity.RESULT_OK) {
                  let format = data.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT_FORMAT);
                  let text = data.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT);
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
          self.rememberedContext = appModule.android.currentContext;
          appModule.android.currentContext.startActivityForResult(intent, SCANNER_REQUEST_CODE);

          if (isContinuous) {
            resolve();
          }
        } else {
          // this is next to impossible
          reject("Configuration error");
        }
      };

      if (!self.wasCameraPermissionGranted()) {
        self.requestCameraPermissionInternal(onPermissionGranted, reject);
        return;
      }

      onPermissionGranted();
    });
  };
}