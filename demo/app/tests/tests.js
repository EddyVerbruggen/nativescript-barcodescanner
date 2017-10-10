var BarcodeScanner = require("nativescript-barcodescanner").BarcodeScanner;
var barcodeScanner = new BarcodeScanner();

describe("available", function () {
  it("exists", function () {
    expect(barcodeScanner.available).toBeDefined();
  });

  it("returns a Promise", function () {
    expect(barcodeScanner.available()).toEqual(jasmine.any(Promise));
  });
});

describe("hasCameraPermission", function () {
  it("exists", function () {
    expect(barcodeScanner.hasCameraPermission).toBeDefined();
  });

  it("returns a Promise", function () {
    expect(barcodeScanner.hasCameraPermission()).toEqual(jasmine.any(Promise));
  });
});

describe("requestCameraPermission", function () {
  it("exists", function () {
    expect(barcodeScanner.requestCameraPermission).toBeDefined();
  });

  it("returns a Promise", function () {
    expect(barcodeScanner.requestCameraPermission()).toEqual(jasmine.any(Promise));
  });
});

describe("scan", function () {
  it("exists", function () {
    expect(barcodeScanner.scan).toBeDefined();
  });

  it("returns a Promise", function () {
    expect(barcodeScanner.scan()).toEqual(jasmine.any(Promise));
  });
});

describe("stop", function () {
  it("exists", function () {
    expect(barcodeScanner.stop).toBeDefined();
  });

  it("returns a Promise", function () {
    expect(barcodeScanner.stop()).toEqual(jasmine.any(Promise));
  });
});