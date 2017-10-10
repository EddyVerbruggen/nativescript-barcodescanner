import { ScanOptions, ScanResult } from "./barcodescanner-common";
import * as appModule from "tns-core-modules/application";
import * as utils from "tns-core-modules/utils/utils";

let SCANNER_REQUEST_CODE = 444;

declare let com, android: any;

let _onScanReceivedCallback = undefined;
let _onContinuousScanResult = undefined;

export class BarcodeScanner {

  private broadcastManager: any = null;
  private onPermissionGranted: Function;
  private onPermissionRejected: Function;

  constructor() {
    let self = this;
    appModule.android.on(appModule.AndroidApplication.activityRequestPermissionsEvent, function (args: any) {
      for (let i = 0; i < args.permissions.length; i++) {
        if (args.grantResults[i] === android.content.pm.PackageManager.PERMISSION_DENIED) {
          if (self.onPermissionRejected) {
            self.onPermissionRejected("Please allow access to the Camera and try again.");
          } else {
            console.log("Please allow access to the Camera and try again. (tip: pass in a reject to receive this message in your app)");
          }
          return;
        }
      }

      if (self.onPermissionGranted) {
        self.onPermissionGranted();
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
      appModule.android.foregroundActivity,
      [android.Manifest.permission.CAMERA],
      234 // irrelevant since we simply invoke onPermissionGranted
    );
  };

  public available(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        resolve(utils.ad.getApplicationContext().getPackageManager().hasSystemFeature(android.content.pm.PackageManager.FEATURE_CAMERA));
      } catch (ex) {
        console.log("Error in barcodescanner.available: " + ex);
        // let's just assume it's ok
        resolve(true);
      }
    });
  }

  public hasCameraPermission(): Promise<boolean> {
    let self = this;
    return new Promise((resolve) => {
      let granted = self.wasCameraPermissionGranted();
      resolve(granted);
    });
  }

  public requestCameraPermission(): Promise<boolean> {
    let self = this;
    return new Promise((resolve, reject) => {
      try {
        self.requestCameraPermissionInternal(resolve, reject);
      } catch (ex) {
        console.log("Error in barcodescanner.requestCameraPermission: " + ex);
        reject(ex);
      }
    });
  }

  public stop(): Promise<any> {
    let self = this;
    return new Promise((resolve, reject) => {
      try {
        if (!self.broadcastManager) {
          reject("You found a bug in the plugin, please report that calling stop() failed with this message.");
          return;
        }
        let stopIntent = new android.content.Intent("barcode-scanner-stop");
        self.broadcastManager.sendBroadcast(stopIntent);

        if (_onScanReceivedCallback) {
          self.broadcastManager.unregisterReceiver(_onScanReceivedCallback);
          _onScanReceivedCallback = undefined;
        }
        resolve();
      } catch (ex) {
        reject(ex);
      }
    });
  }

  public scan(arg: ScanOptions): Promise<ScanResult> {
    let self = this;
    return new Promise((resolve, reject) => {
      let onPermissionGranted: () => any = function () {
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
        if (arg.showTorchButton === true) {
          intent.putExtra(com.google.zxing.client.android.Intents.Scan.SHOW_TORCH_BUTTON, true);
        }
        if (arg.orientation) {
          // if not set, sensor orientation is used (rotates with the device)
          intent.putExtra(com.google.zxing.client.android.Intents.Scan.ORIENTATION_LOCK, arg.orientation);
        }
        if (arg.formats) {
          intent.putExtra(com.google.zxing.client.android.Intents.Scan.FORMATS, arg.formats);
          // intent.putExtra(com.google.zxing.client.android.Intents.Scan.MODE, com.google.zxing.client.android.Intents.Scan.QR_CODE_MODE);
        }
        if (arg.torchOn === true) {
          intent.putExtra(com.google.zxing.client.android.Intents.Scan.TORCH_ON, true);
        }
        intent.putExtra(com.google.zxing.client.android.Intents.Scan.BEEP_ON_SCAN, arg.beepOnScan !== false);
        if (arg.resultDisplayDuration !== undefined) {
          //  ZXing expects a String
          intent.putExtra(com.google.zxing.client.android.Intents.Scan.RESULT_DISPLAY_DURATION_MS, "" + arg.resultDisplayDuration);
        }
        intent.putExtra(com.google.zxing.client.android.Intents.Scan.SAVE_HISTORY, false);

        // rectangle size can be controlled as well (but don't bother as of yet)
        // intent.putExtra(com.google.zxing.client.android.Intents.Scan.WIDTH, 200);
        // intent.putExtra(com.google.zxing.client.android.Intents.Scan.HEIGHT, 200);

        // required for the 'stop' function
        if (!self.broadcastManager) {
          self.broadcastManager = android.support.v4.content.LocalBroadcastManager.getInstance(com.tns.NativeScriptApplication.getInstance());
        }

        let isContinuous = typeof arg.continuousScanCallback === "function";
        if (isContinuous) {

          _onContinuousScanResult = arg.continuousScanCallback;
          intent.putExtra(com.google.zxing.client.android.Intents.Scan.BULK_SCAN, true);

          let CallbackReceiver = android.content.BroadcastReceiver.extend({
            onReceive: function (context, data) {
              let format = data.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT_FORMAT);
              let text = data.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT);

              // don't report duplicates
              if (!this.uniquelyScannedCodes) {
                this.uniquelyScannedCodes = [];
              }
              if (arg.reportDuplicates || this.uniquelyScannedCodes.indexOf("[" + text + "][" + format + "]") === -1) {
                this.uniquelyScannedCodes.push("[" + text + "][" + format + "]");
                let result: ScanResult = {
                  format: format,
                  text: text
                };
                _onContinuousScanResult(result);
              }
            }
          });
          _onScanReceivedCallback = new CallbackReceiver();
          self.broadcastManager.registerReceiver(_onScanReceivedCallback, new android.content.IntentFilter("bulk-barcode-result"));
        }

        if (intent.resolveActivity(com.tns.NativeScriptApplication.getInstance().getPackageManager()) !== null) {
          const onScanResult = (data) => {
            console.log(">> activity result: @ " + new Date().getTime());
            if (data.requestCode === SCANNER_REQUEST_CODE) {
              self.onPermissionGranted = null;
              if (isContinuous) {
                if (_onScanReceivedCallback) {
                  self.broadcastManager.unregisterReceiver(_onScanReceivedCallback);
                  _onScanReceivedCallback = undefined;
                }
              } else {
                if (data.resultCode === android.app.Activity.RESULT_OK) {
                  let format = data.intent.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT_FORMAT);
                  let text = data.intent.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT);
                  let result: ScanResult = {
                    format: format,
                    text: text
                  };
                  resolve(result);
                } else {
                  reject("Scan aborted");
                }
              }
              arg.closeCallback && arg.closeCallback();
              appModule.android.off('activityResult', onScanResult);
            }
          };
          appModule.android.on('activityResult', onScanResult);
          appModule.android.foregroundActivity.startActivityForResult(intent, SCANNER_REQUEST_CODE);
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
  }
}
