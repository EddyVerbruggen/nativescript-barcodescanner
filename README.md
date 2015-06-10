# NativeScript BarcodeScanner

Scan a barcode (or a QR code, or a lot of other formats really)


For Android, iOS support is planned!


## Installation
From the command prompt go to your app's `app` folder and execute:

IT'S NOT ON NPM YET, SO IGNORE THIS :)

```
npm install nativescript-barcodescanner
```

Download the ZXing library (TODO: link) and add it to your project:
```
tns library add android </path/to/barcodescanner>/LibraryProject
```

Add this to your /platforms/android/AndroidManifest.xml in /manifest:

```xml
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.FLASHLIGHT" />
  <!-- Not required to allow users to work around this -->
  <uses-feature android:name="android.hardware.camera" android:required="false" />
```

Add this to your /platforms/android/AndroidManifest.xml in /manifest/application:

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

### getVersionName

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