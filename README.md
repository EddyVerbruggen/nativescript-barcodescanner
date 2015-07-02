# NativeScript BarcodeScanner

Scan a barcode (or a QR code, or a lot of other formats really)


For Android, iOS support is planned!


## Prerequisites
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
From the command prompt go to your app's `app` folder(!) and execute:
```
tns plugin add nativescript-barcodescanner
```

Still from the app folder, install the ZXing library for Android in your project:
```
tns library add android ../node_modules/nativescript-barcodescanner/platforms/android/LibraryProject
```

You will find this `activity` *outside* the `/manifest/application` section of `/platforms/android/AndroidManifest.xml`, move it *inside*:

```xml
    <activity
        android:name="com.google.zxing.client.android.CaptureActivity"
        android:clearTaskOnLaunch="true"
        android:configChanges="orientation|keyboardHidden"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
        android:windowSoftInputMode="stateAlwaysHidden"
        android:exported="false">
      <intent-filter>
        <action android:name="com.google.zxing.client.android.SCAN"/>
        <category android:name="android.intent.category.DEFAULT"/>
      </intent-filter>
    </activity>
```

## Usage

### scan

```js
  var barcodescanner = require("nativescript-barcodescanner");

  barcodescanner.scan({
    message: "Go scan something",
    preferFrontCamera: false,
    showFlipCameraButton: true
  }).then(
      function(result) {
        console.log("Scan format: " + result.format);
        console.log("Scan text:   " + result.text);
      },
      function(error) {
        console.log("Scan error: " + error);
      }
  )
```