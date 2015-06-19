# NativeScript BarcodeScanner

Scan a barcode (or a QR code, or a lot of other formats really)


For Android, iOS support is planned!


## Installation
Make sure you have at least NativeScript version 1.1.1 because it makes configuration a little easier.
```
nativescript --version
```

If that's less than 1.1.1, do:
```
sudo -g install nativescript
```

Then from the command prompt go to your app's `app` folder and execute:

Install the ZXing library (for your convenience bundled in this plugin) for Android in your project:
```
tns library add android </path/to/barcodescanner/plugin>/LibraryProject
```

Add this to your /platforms/android/AndroidManifest.xml in /manifest if it isn't there yet:

```xml
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.FLASHLIGHT" />
  <!-- Not required to allow users to work around this -->
  <uses-feature android:name="android.hardware.camera" android:required="false" />
```

And this should go into your /platforms/android/AndroidManifest.xml in /manifest/application:

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
  var barcodescanner = require("./node_modules/nativescript-barcodescanner/barcodescanner");

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