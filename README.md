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


## Instructions for nativescript-cli 1.1.3+
Installation with `tns --version` 1.1.3 and up is way easier,
but at the moment of writing 1.1.3 is not yet released, but you can use [nativescript-cli master](https://github.com/nativescript/nativescript-cli) of course.
So if you're impatient like me and don't want to install this plugin the hard way, upgrade your cli:

```
git clone git@github.com:NativeScript/nativescript-cli.git
cd nativescript-cli
git submodule init
git submodule update
npm i
grunt
npm link
```

Now, from the command prompt go to your app's root folder and execute:
```
tns plugin add nativescript-barcodescanner
```

That's it :)



## Instructions for nativescript-cli <= 1.1.2
So you're taking the harder path to barcodescanning heaven. Alright, follow these instructions closely!

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
        console.log("~~~~~~~~~~~ Scan format: " + result.format);
        console.log("~~~~~~~~~~~ Scan text:   " + result.text);
      },
      function(error) {
        console.log("~~~~~~~~~~~ Scan error: " + error);
      }
  )
```