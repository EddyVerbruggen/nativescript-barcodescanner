import { Component } from "@angular/core";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";
import { BarcodeScanner } from "nativescript-barcodescanner";

@Component({
  selector: "modal",
  moduleId: module.id,
  templateUrl: "./modal.component.html",
  styleUrls: ["./modal.component.css"],

})

export class ModalComponent {
  barcodescanner: any;

  constructor(private params: ModalDialogParams) {
    this.barcodescanner = new BarcodeScanner();
  }

  close() {
    this.params.closeCallback();
  }

  public onScanResult(evt) {
    // console.log(evt.object);
    console.log(`onScanResult: ${evt.text} (${evt.format})`);
  }

  openNotification() {
    console.log("OPEN NOTIFICATION!");
    this.close();

    this.barcodescanner.scan({
      formats: "QR_CODE, EAN_13",
      cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
      cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)

      showFlipCameraButton: true,   // default false
      preferFrontCamera: false,     // default false
      showTorchButton: true,        // default false
      beepOnScan: true,             // Play or Suppress beep on scan (default true)
      torchOn: false,               // launch with the flashlight on (default false)
      closeCallback: () => {
        console.log("Scanner closed");
      }, // invoked when the scanner was closed (success or abort)

      openSettingsIfPermissionWasPreviouslyDenied: true // On iOS you can send the user to the settings app if access was previously denied
    }).then((result) => {
          // Note that this Promise is never invoked when a 'continuousScanCallback' function is provided
          console.log({
            title: "Scan result",
            message: "Format: " + result.format + ",\nValue: " + result.text,
            okButtonText: "OK"
          });
        }, (errorMessage) => {
          console.log("No scan. " + errorMessage);
        }
    );
  }
}