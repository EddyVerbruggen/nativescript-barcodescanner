var observable = require("data/observable");
var barcodescanner = require("nativescript-barcodescanner");
var HelloWorldModel = (function (_super) {
  __extends(HelloWorldModel, _super);
  function HelloWorldModel() {
    _super.call(this);
    this.counter = 42;
    this.set("message", this.counter + " taps left");
  }

  HelloWorldModel.prototype.tapAction = function () {
    this.counter--;
    barcodescanner.scan({
      cancelLabel: "Stop scanning", // iOS only, default 'Close' 
      message: "Go scan something", // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.' 
      preferFrontCamera: false,     // Android only, default false 
      showFlipCameraButton: true    // Android only, default false (on iOS it's always available) 
    }).then(
        function (result) {
          console.log("Scan format: " + result.format);
          console.log("Scan text:   " + result.text);
        },
        function (error) {
          console.log("No scan: " + error);
        }
    );
    if (this.counter <= 0) {
      this.set("message", "Hoorraaay! You unlocked the NativeScript clicker achievement!");
    } else {
      this.set("message", this.counter + " taps left");
    }
  };
  return HelloWorldModel;
})(observable.Observable);
exports.HelloWorldModel = HelloWorldModel;
exports.mainViewModel = new HelloWorldModel();
