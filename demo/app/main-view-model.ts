import {Observable} from "data/observable";
import {alert} from "ui/dialogs";
import {BarcodeScanner, ScanOptions} from "nativescript-barcodescanner";

export class HelloWorldModel extends Observable {
  public message: string;
  private barcodeScanner: BarcodeScanner;

  constructor() {
    super();
    this.barcodeScanner = new BarcodeScanner();
  }

  public doCheckAvailable() {
    this.barcodeScanner.available().then((avail) => {
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
    this.barcodeScanner.hasCameraPermission().then((permitted) => {
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
    this.barcodeScanner.requestCameraPermission().then(
      function() {
        console.log("Camera permission requested");
      }
    );
  };

  public doScanWithBackCamera() {
    this.scan(false, true);
  };

  public doScanWithFrontCamera() {
    this.scan(true, false);
  };

  public doScanPortrait() {
    this.scan(false, true, "portrait");
  };

  public doScanLandscape() {
    this.scan(false, true, "landscape");
  };

  public doContinuousScan() {
    this.barcodeScanner.scan({
      continuousScanCallback: function (result) {
        console.log(result.format + ": " + result.text);
      }
    });
  };

  public doContinuousScanMax3() {
    let count = 0;
    let self = this;
    this.barcodeScanner.scan({
      continuousScanCallback: function (result) {
        count++;
        console.log(result.format + ": " + result.text + " (count: " + count + ")");
        if (count === 3) {
          self.barcodeScanner.stop();
          setTimeout(function() {
            alert({
              title: "Scanned 3 codes",
              message: "Check the log for the results",
              okButtonText: "Sweet!"
            });
          }, 1000);
        }
      }
    });
  };

  private scan(front: boolean, flip: boolean, orientation?: string) {
    this.barcodeScanner.scan({
      formats: "QR_CODE, EAN_13",
      cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
      message: "Use the volume buttons for extra light", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
      preferFrontCamera: front,     // Android only, default false
      showFlipCameraButton: flip,   // Android only, default false (on iOS it's always available)
      orientation: orientation,     // Android only, default undefined (sensor-driven orientation), other options: portrait|landscape
      openSettingsIfPermissionWasPreviouslyDenied: true // On iOS you can send the user to the settings app if access was previously denied
    }).then(
      function(result) {
        // Note that this Promise is never invoked when a 'continuousScanCallback' function is provided
        alert({
          title: "Scan result",
          message: "Format: " + result.format + ",\nValue: " + result.text,
          okButtonText: "OK"
        });
      },
      function(errorMessage) {
        console.log("No scan. " + errorMessage);
      }
    );
  };
}