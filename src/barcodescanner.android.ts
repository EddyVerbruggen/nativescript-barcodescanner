import { ScanOptions, ScanResult } from "./barcodescanner-common";
import { AndroidActivityRequestPermissionsEventData} from "tns-core-modules/application";
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
  private uniquelyScannedCodes: Array<string> = [];

  constructor() {
    appModule.android.on(appModule.AndroidApplication.activityRequestPermissionsEvent, (args: AndroidActivityRequestPermissionsEventData) => {
      for (let i = 0; i < args.permissions.length; i++) {
        if (args.grantResults[i] === android.content.pm.PackageManager.PERMISSION_DENIED) {
          if (this.onPermissionRejected) {
            this.onPermissionRejected("Please allow access to the Camera and try again.");
          } else {
            console.log("Please allow access to the Camera and try again. (tip: pass in a reject to receive this message in your app)");
          }
          return;
        }
      }

      if (this.onPermissionGranted) {
        this.onPermissionGranted();
      }
    });
  }

  private wasCameraPermissionGranted() {
    let hasPermission = android.os.Build.VERSION.SDK_INT < 23; // Android M. (6.0)
    if (!hasPermission) {
      hasPermission = android.content.pm.PackageManager.PERMISSION_GRANTED ===
        android.support.v4.content.ContextCompat.checkSelfPermission(utils.ad.getApplicationContext(), android.Manifest.permission.CAMERA);
    }
    return hasPermission;
  }

  private requestCameraPermissionInternal(onPermissionGranted, reject) {
    this.onPermissionGranted = onPermissionGranted;
    this.onPermissionRejected = reject;
    android.support.v4.app.ActivityCompat.requestPermissions(
      appModule.android.foregroundActivity,
      [android.Manifest.permission.CAMERA],
      234 // irrelevant since we simply invoke onPermissionGranted
    );
  }

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
    return new Promise((resolve) => {
      resolve(this.wasCameraPermissionGranted());
    });
  }

  public requestCameraPermission(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.requestCameraPermissionInternal(resolve, reject);
      } catch (ex) {
        console.log("Error in barcodescanner.requestCameraPermission: " + ex);
        reject(ex);
      }
    });
  }

  public stop(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.broadcastManager) {
          reject("You found a bug in the plugin, please report that calling stop() failed with this message.");
          return;
        }
        const stopIntent = new android.content.Intent("barcode-scanner-stop");
        this.broadcastManager.sendBroadcast(stopIntent);

        if (_onScanReceivedCallback) {
          this.broadcastManager.unregisterReceiver(_onScanReceivedCallback);
          _onScanReceivedCallback = undefined;
        }
        resolve();
      } catch (ex) {
        reject(ex);
      }
    });
  }

  public scan(arg: ScanOptions): Promise<ScanResult> {
    return new Promise((resolve, reject) => {
      const onPermissionGranted = (): any => {

        this.uniquelyScannedCodes = [];

        // the intent name should match the filter name in AndroidManifest.xml, don't change it
        const intent = new android.content.Intent("com.google.zxing.client.android.SCAN");

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
        if (!this.broadcastManager) {
          this.broadcastManager = android.support.v4.content.LocalBroadcastManager.getInstance(com.tns.NativeScriptApplication.getInstance());
        }

        const isContinuous = typeof arg.continuousScanCallback === "function";
        if (isContinuous) {
          _onContinuousScanResult = arg.continuousScanCallback;
          intent.putExtra(com.google.zxing.client.android.Intents.Scan.BULK_SCAN, true);

          _onScanReceivedCallback = android.content.BroadcastReceiver.extend({
            onReceive: (context, data) => {
              const format = data.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT_FORMAT);
              const text = data.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT);

              // don't report duplicates unless requested
              if (arg.reportDuplicates || this.uniquelyScannedCodes.indexOf("[" + text + "][" + format + "]") === -1) {
                this.uniquelyScannedCodes.push("[" + text + "][" + format + "]");
                const result: ScanResult = {
                  format: format,
                  text: text
                };
                _onContinuousScanResult(result);
              }
            }
          });
          this.broadcastManager.registerReceiver(_onScanReceivedCallback, new android.content.IntentFilter("bulk-barcode-result"));
        }

        if (intent.resolveActivity(com.tns.NativeScriptApplication.getInstance().getPackageManager()) !== null) {
          const onScanResult = (data) => {
            console.log(">> activity result: @ " + new Date().getTime());
            if (data.requestCode === SCANNER_REQUEST_CODE) {
              this.onPermissionGranted = null;
              if (isContinuous) {
                if (_onScanReceivedCallback) {
                  this.broadcastManager.unregisterReceiver(_onScanReceivedCallback);
                  _onScanReceivedCallback = undefined;
                }
              } else {
                if (data.resultCode === android.app.Activity.RESULT_OK) {
                  const format = data.intent.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT_FORMAT);
                  const text = data.intent.getStringExtra(com.google.zxing.client.android.Intents.Scan.RESULT);
                  const result: ScanResult = {
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

      if (!this.wasCameraPermissionGranted()) {
        this.requestCameraPermissionInternal(onPermissionGranted.bind(this), reject);
        return;
      }

      onPermissionGranted();
    });
  }
}
