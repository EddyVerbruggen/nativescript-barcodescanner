import { Observable } from "tns-core-modules/data/observable";
import { alert } from "tns-core-modules/ui/dialogs";
import { BarcodeScanner } from "nativescript-barcodescanner";

export class HelloWorldModel extends Observable {
  public message: string;
  private barcodeScanner: BarcodeScanner;

  constructor() {
    super();
    this.barcodeScanner = new BarcodeScanner();
  }

  public onScanResult(scanResult: any) {
    console.log(`onScanResult: ${scanResult.text} (${scanResult.format})`);
  }

  public doCheckAvailable() {
    this.barcodeScanner.available().then(avail => {
      alert({
        title: "Scanning available?",
        message: avail ? "YES" : "NO",
        okButtonText: "OK"
      });
    }, (err) => {
      alert(err);
    });
  }

  public doCheckHasCameraPermission() {
    this.barcodeScanner.hasCameraPermission().then(permitted => {
      alert({
        title: "Has Camera permission?",
        message: permitted ? "YES" : "NO",
        okButtonText: "OK"
      });
    }, (err) => {
      alert(err);
    });
  }

  public doRequestCameraPermission() {
    this.barcodeScanner.requestCameraPermission()
        .then(() => console.log("Camera permission granted"))
        .catch(() => console.log("Camera permission not granted"));
  }

  public doScanWithBackCamera() {
    this.scan(false, true);
  }

  public doScanWithFrontCamera() {
    this.scan(true, false);
  }

  public doScanWithTorch() {
    this.scan(false, true, true, "portrait");
  }

  public doScanPortrait() {
    this.scan(false, true, false, "portrait");
  }

  public doScanLandscape() {
    this.scan(false, true, false, "landscape");
  }

  public doContinuousScan() {
    this.barcodeScanner.scan({
      reportDuplicates: true,
      continuousScanCallback: function (result) {
        console.log(`${result.format}: ${result.text} @ ${new Date().getTime()}`);
      },
      closeCallback: () => {
        console.log("Scanner closed @ " + new Date().getTime());
      }
    });
  }

  public doContinuousScanMax3() {
    let count = 0;
    let self = this;
    this.barcodeScanner.scan({
      reportDuplicates: false,
      closeCallback: () => {
        console.log("Scanner closed @ " + new Date().getTime());
      },
      continuousScanCallback: function (result) {
        count++;
        console.log(result.format + ": " + result.text + " (count: " + count + ")");
        if (count === 3) {
          self.barcodeScanner.stop();
          setTimeout(function () {
            alert({
              title: "Scanned 3 codes",
              message: "Check the log for the results",
              okButtonText: "Sweet!"
            });
          }, 1000);
        }
      }
    });
  }

  private scan(front: boolean, flip: boolean, torch?: boolean, orientation?: string) {
    this.barcodeScanner.scan({
      presentInRootViewController: true, // not needed here, but added it just for show
      cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
      cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
      message: "Use the volume buttons for extra light", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
      preferFrontCamera: front,     // Android only, default false
      showFlipCameraButton: flip,   // default false
      showTorchButton: torch,       // iOS only, default false
      torchOn: false,               // launch with the flashlight on (default false)
      resultDisplayDuration: 500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
      orientation: orientation,     // Android only, default undefined (sensor-driven orientation), other options: portrait|landscape
      beepOnScan: true,             // Play or Suppress beep on scan (default true)
      fullScreen: true,             // iOS 13+ modal appearance changed so they can be swiped down when this is false (default false)
      openSettingsIfPermissionWasPreviouslyDenied: true, // On iOS you can send the user to the settings app if access was previously denied
      closeCallback: () => {
        console.log("Scanner closed @ " + new Date().getTime());
      }
    }).then(
        function (result) {
          console.log("--- scanned: " + result.text);
          // Note that this Promise is never invoked when a 'continuousScanCallback' function is provided
          setTimeout(function () {
            // if this alert doesn't show up please upgrade to {N} 2.4.0+
            alert({
              title: "Scan result",
              message: "Format: " + result.format + ",\nValue: " + result.text,
              okButtonText: "OK"
            });
          }, 500);
        },
        function (errorMessage) {
          console.log("No scan. " + errorMessage);
        }
    );
  }
}