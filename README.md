# NativeScript BarcodeScanner

Scan a barcode (or a QR code, or a lot of other formats really)

> Looking for a demo? [Look no further!](https://github.com/EddyVerbruggen/nativescript-barcodescanner-demo)

## Supported barcode types

### iOS and Android
* CODE_39
* CODE_93
* CODE_128
* EAN_8
* EAN_13
* QR_CODE
* UPC_E
* AZTEC (on Android only when passed in explicity via `formats`)
* PDF_417 (on Android only when passed in explicity via `formats`)

### Android only
* DATA_MATRIX
* CODABAR
* MAXICODE
* ITF
* RSS_14
* UPC_A

## Installation
Make sure you're using __NativeScript 2.3.0 or higher__. Run `npm install -g nativescript` if not.

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

_To not crash your app in case you forgot to provide the reason this plugin adds an empty reason to the `.plist` during build. This value gets overridden by anything you specified yourself. You're welcome._

## Usage
Tip: during a scan you can use the volume up/down buttons to toggle the torch.

### function: scan (single mode)
```js
  var barcodescanner = require("nativescript-barcodescanner");

  barcodescanner.scan({
    formats: "QR_CODE,PDF_417",   // Pass in of you want to restrict scanning to certain types
    cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
    message: "Use the volume buttons for extra light", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
    preferFrontCamera: false,     // Android only, default false
    showFlipCameraButton: true,   // Android only, default false (on iOS it's always available)
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
By popular demand version 1.4.0 added bulk mode.
The scanner will continuously report scanned codes back to your code,
but it will only be dismissed if the user tells it to, or you call `stop` programmatically.

The plugin handles duplicates for you so don't worry about checking those;
every result withing the same scan session is unique.

Here's an example of scanning 3 unique QR codes and then stopping scanning programmatically.
You'll notice that the Promise will no longer receive the result as there may be many results:
```js
  var count = 0;
  barcodescanner.scan({
    formats: "QR_CODE",
    // this callback will be invoked for every unique scan in realtime!
    continuousScanCallback: function (result) {
      count++;
      console.log(result.format + ": " + result.text + " (count: " + count + ")");
      if (count == 3) {
        barcodescanner.stop();
      }
    }
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

## Changelog
1.5.0  Automatic permission handling & you can now us the volume up/down buttons to toggle the torch (on both iOS and Android)
1.4.0  Bulk scanning