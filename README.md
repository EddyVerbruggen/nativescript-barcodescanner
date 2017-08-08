# NativeScript BarcodeScanner

[![Build Status][build-status]][build-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![Twitter Follow][twitter-image]][twitter-url]

[build-status]:https://travis-ci.org/EddyVerbruggen/nativescript-barcodescanner.svg?branch=master
[build-url]:https://travis-ci.org/EddyVerbruggen/nativescript-barcodescanner
[npm-image]:http://img.shields.io/npm/v/nativescript-barcodescanner.svg
[npm-url]:https://npmjs.org/package/nativescript-barcodescanner
[downloads-image]:http://img.shields.io/npm/dm/nativescript-barcodescanner.svg
[twitter-image]:https://img.shields.io/twitter/follow/eddyverbruggen.svg?style=social&label=Follow%20me
[twitter-url]:https://twitter.com/eddyverbruggen

#### Want a quick demo?
* git clone https://github.com/EddyVerbruggen/nativescript-barcodescanner barcodedemo
* cd barcodedemo
* npm run setup
* npm run demo.android (or demo.ios / demo.ios.device)

## Supported barcode types

### iOS and Android
* AZTEC (on Android only when passed in explicity via `formats`)
* CODE_39
* CODE_93
* CODE_128
* DATA_MATRIX
* EAN_8
* EAN_13
* ITF (also known as ITF14)
* PDF_417 (on Android only when passed in explicity via `formats`)
* QR_CODE
* UPC_E

### Android only
* CODABAR
* MAXICODE
* RSS_14
* UPC_A

## Installation
From the command prompt go to your app's root folder and execute:
```
tns plugin add nativescript-barcodescanner
```

## iOS runtime permission reason
You've probably seen a permission popup like this before (this plugin will trigger one as well, automatically):

<img src="ios_permission_custom_reason.png" width="271px" height="167px"/>

iOS 10+ requires not only this popup, but also a _reason_. In this case it's "We'd like to use the Camera ..".

You can provide your own reason for accessing the camera by adding something like this to `app/App_Resources/ios/Info.plist`:

```xml
  <key>NSCameraUsageDescription</key>
  <string>My reason justifying fooling around with your camera</string>
```

_To not crash your app in case you forgot to provide the reason this plugin adds an empty reason to the `.plist` during build. This value gets overridden by anything you specify yourself._

## Usage
Tip: during a scan you can use the volume up/down buttons to toggle the torch.

### function: scan (single mode)

#### TypeScript
This plugin was created and tested with TypeScript 2+, so please update your project if needed.

```typescript
  import { BarcodeScanner } from "nativescript-barcodescanner";
  let barcodescanner = new BarcodeScanner();

  barcodescanner.scan({
    formats: "QR_CODE, EAN_13",
    cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
    cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
    message: "Use the volume buttons for extra light", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
    showFlipCameraButton: true,   // default false
    preferFrontCamera: false,     // default false
    showTorchButton: true,        // default false
    beepOnScan: true,             // Play or Suppress beep on scan (default true)
    torchOn: false,               // launch with the flashlight on (default false)
    closeCallback: () => { console.log("Scanner closed")}, // invoked when the scanner was closed (success or abort)
    resultDisplayDuration: 500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
    orientation: orientation,     // Android only, default undefined (sensor-driven orientation), other options: portrait|landscape
    openSettingsIfPermissionWasPreviouslyDenied: true // On iOS you can send the user to the settings app if access was previously denied
  }).then((result) => {
      // Note that this Promise is never invoked when a 'continuousScanCallback' function is provided
      alert({
        title: "Scan result",
        message: "Format: " + result.format + ",\nValue: " + result.text,
        okButtonText: "OK"
      });
    }, (errorMessage) => {
      console.log("No scan. " + errorMessage);
    }
  );
```

#### JavaScript
```js
  var BarcodeScanner = require("nativescript-barcodescanner").BarcodeScanner;
  var barcodescanner = new BarcodeScanner();

  barcodescanner.scan({
    formats: "QR_CODE,PDF_417",   // Pass in of you want to restrict scanning to certain types
    cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
    cancelLabelBackgroundColor: "#333333", // iOS only, default '#000000' (black)
    message: "Use the volume buttons for extra light", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
    showFlipCameraButton: true,   // default false
    preferFrontCamera: false,     // default false
    showTorchButton: true,        // default false
    beepOnScan: true,             // Play or Suppress beep on scan (default true)
    torchOn: false,               // launch with the flashlight on (default false)
    closeCallback: function () { console.log("Scanner closed"); }, // invoked when the scanner was closed (success or abort)
    resultDisplayDuration: 500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
    orientation: "landscape",     // Android only, optionally lock the orientation to either "portrait" or "landscape"
    openSettingsIfPermissionWasPreviouslyDenied: true // On iOS you can send the user to the settings app if access was previously denied
  }).then(
      function(result) {
        console.log("Scan format: " + result.format);
        console.log("Scan text:   " + result.text);
      },
      function(error) {
        console.log("No scan: " + error);
      }
  );
```

### function: scan (bulk / continuous mode)
In this mode the scanner will continuously report scanned codes back to your code,
but it will only be dismissed if the user tells it to, or you call `stop` programmatically.

The plugin handles duplicates for you so don't worry about checking those;
every result withing the same scan session is unique unless you set `reportDuplicates` to `true`.

Here's an example of scanning 3 unique QR codes and then stopping scanning programmatically.
You'll notice that the Promise will no longer receive the result as there may be many results:

#### JavaScript
```js
  var count = 0;
  barcodescanner.scan({
    formats: "QR_CODE",
    // this callback will be invoked for every unique scan in realtime!
    continuousScanCallback: function (result) {
      count++;
      console.log(result.format + ": " + result.text + " (count: " + count + ")");
      if (count === 3) {
        barcodescanner.stop();
      }
    },
    closeCallback: function () { console.log("Scanner closed"); }, // invoked when the scanner was closed
    reportDuplicates: false // which is the default
  }).then(
      function() {
        console.log("We're now reporting scan results in 'continuousScanCallback'");
      },
      function(error) {
        console.log("No scan: " + error);
      }
  );
```

### function: available
Note that the iOS implementation will always return `true` at the moment,
on Android we actually check for a camera to be available.

#### JavaScript
```js
  var barcodescanner = require("nativescript-barcodescanner");

  barcodescanner.available().then(
      function(avail) {
        console.log("Available? " + avail);
      }
  );
```

### function: hasCameraPermission / requestCameraPermission
On Android 6+ you need to request permission to use the camera at runtime when targeting API level 23+.
Even if the `uses-permission` tag for the Camera is present in `AndroidManifest.xml`.

On iOS 10+ there's something similar going on.

Since version 1.5.0 you can let the plugin handle this for you
(if need be a prompt will be shown to the user when the scanner launches),
but if for some reason you want to handle permissions yourself you can use these functions.

#### JavaScript
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

### Usage with `nativescript-angular`

When using Angular 2, it is best to inject dependencies into your classes.  Here is an example of how you
can set up `nativescript-barcodescanner` in an Angular 2 app with dependency injection.

1. Register the provider with your module
    ```typescript
    //app.module.ts
    import { NgModule, ValueProvider } from '@angular/core';
    import { BarcodeScanner } from 'nativescript-barcodescanner';
    //other imports

    @NgModule({
      //bootstrap, declarations, imports, etc.
      providers: [
        BarcodeScanner
      ]
    })
    export class AppModule {}
    ```
1. Inject it into your component
    ```typescript
    // my-component.ts
    import { Component, Inject } from '@angular/core';
    import { BarcodeScanner } from 'nativescript-barcodescanner';

    @Component({ ... })
    export class MyComponent {
      constructor(private barcodeScanner: BarcodeScanner) {
      }

      //use the barcodescanner wherever you need it. See general usage above.
      scanBarcode() {
        this.barcodeScanner.scan({ ... });
      }
    }
    ```

#### Webpack usage
If you run into an error when Webpacking, open `app.module.ts` and add this:

```typescript
import { BarcodeScanner } from "nativescript-barcodescanner";

export function createBarcodeScanner() {
  return new BarcodeScanner();
}

providers: [
  { provide: BarcodeScanner, useFactory: (createBarcodeScanner) }
]
```
