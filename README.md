# NativeScript BarcodeScanner

Scan a barcode (or a QR code, or a lot of other formats really)

## Installation
From the command prompt go to your app's root folder and execute:
```
tns plugin add nativescript-barcodescanner
```

## Supported barcode types

### iOS and Android
* Code39
* Code93
* Code128
* EAN8
* EAN13
* QR
* UPC_E

### iOS only
* Aztec
* PDF417

### Android only
* DATA_MATRIX
* CODABAR
* ITF
* RSS14
* UPC_A

## Usage

### function: scan
```js
  var barcodescanner = require("nativescript-barcodescanner");

  barcodescanner.scan({
    cancelLabel: "Stop scanning", // iOS only, default 'Close'
    message: "Go scan something", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
    preferFrontCamera: false,     // Android only, default false
    showFlipCameraButton: true,   // Android only, default false (on iOS it's always available)
    orientation: "landscape"      // Android only, optionally lock the orientation to either "portrait" or "landscape"
  }).then(
      function(result) {
        console.log("Scan format: " + result.format);
        console.log("Scan text:   " + result.text);
      },
      function(error) {
        console.log("No scan: " + error);
      }
  )
```

### function: available
Note that the Android implementation will always return `true` at the moment.
```js
  var barcodescanner = require("nativescript-barcodescanner");

  barcodescanner.available().then(
      function(avail) {
        console.log("Available? " + avail);
      }
  );
```

### function: hasCameraPermission / requestCameraPermission
On Android 6 you need to request permission to use the camera at runtime when targeting API level 23+.
Even if the `uses-permission` tag for the Camera is present in `AndroidManifest.xml`.

Note that `hasCameraPermission` will return true when:
* You're running this on iOS, or
* You're targeting an API level lower than 23, or
* You're using Android < 6, or
* You've already granted permission.

```js
  barcodescanner.hasCameraPermission().then(
      function(granted) {
        // if this is 'false' you probably want to call 'requestCameraPermission' now
        console.log("Has Camera Permission? " + result);
      }
  );

  // if no permission was granted previously this wil open a user consent screen
  barcodescanner.requestCameraPermission().then(
      function() {
        console.log("Camera permission requested");
      }
  );
```

Note that the `scan` function will also check for permission and ask for it if it wasn't previously granted.
If you're relying on that, then you should know that since we're not catching the consent result
the user will then need to allow camera access and launch the scanner again.
