# NativeScript BarcodeScanner

Scan a barcode (or a QR code, or a lot of other formats really)

## Prerequisites
NativeScript 1.2.3+ for iOS, 1.3.0+ for Android (`tns --version`), so please upgrade if you need to.

If -for some reason- you need to build for {N} 1.2 on Android, please [use this branch](https://github.com/EddyVerbruggen/nativescript-barcodescanner/tree/nativescript-pre-1.3).

## Installation
From the command prompt go to your app's root folder and execute:
```
tns plugin add nativescript-barcodescanner
```

## Usage

### function: scan
```js
  var barcodescanner = require("nativescript-barcodescanner");

  barcodescanner.scan({
    cancelLabel: "Stop scanning", // iOS only, default 'Close'
    message: "Go scan something", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
    preferFrontCamera: false,     // Android only, default false
    showFlipCameraButton: true    // Android only, default false (on iOS it's always available)
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