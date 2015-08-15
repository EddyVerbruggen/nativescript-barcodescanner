# NativeScript BarcodeScanner

Scan a barcode (or a QR code, or a lot of other formats really)

## Prerequisites
Make sure you're using nativescript-cli 1.1.3 or up.
Instructions for older versions have been dropped from this readme.

## Prerequisites for Android
Check if you have Android-19 installed (required for building the ZXing library), run this from the command prompt:
```
android list targets
```

If it's not listed, run:
```
android
```

.. and install Android 4.2.2 > SDK Platform


## Installation
From the command prompt go to your app's root folder and execute:
```
tns plugin add nativescript-barcodescanner
```

### iOS post-installation step
Due to [this issue](https://github.com/NativeScript/ios-runtime/pull/266) in NativeScript frameworks installed
from an iOS plugin are not correctly resolved. As a temporary fix you need to edit your `project.pbxproj` file
and add the full path to the framework like `"\"/Users/eddyverbruggen/barcodescannertest/lib/iOS/BarcodeScannerFramework\"",`
to both `FRAMEWORK_SEARCH_PATHS` sections (near the bottom of the file) or your project can't use the plugin
and will crash if it does.


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