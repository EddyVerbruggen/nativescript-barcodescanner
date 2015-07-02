var barcodescanner = require("./barcodescanner-common");

barcodescanner.scan = function(arg) {
  return new Promise(function(resolve, reject) {
    // TODO implement
    resolve(true);
  });
};

// TODO doesn't common do that already?
module.exports = barcodescanner;