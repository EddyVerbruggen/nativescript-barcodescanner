declare var BarcodeScannerFrameworkVersionNumber: number;

declare var BarcodeScannerFrameworkVersionString: interop.Reference<number>;

declare class QRCodeReader extends NSObject {

  static alloc(): QRCodeReader; // inherited from NSObject

  static isAvailable(): boolean;

  static new(): QRCodeReader; // inherited from NSObject

  static readerWithMetadataObjectTypes(metadataObjectTypes: NSArray<any>): QRCodeReader;

  static supportsMetadataObjectTypes(metadataObjectTypes: NSArray<any>): boolean;

  static videoOrientationFromInterfaceOrientation(interfaceOrientation: UIInterfaceOrientation): AVCaptureVideoOrientation;

  readonly defaultDeviceInput: AVCaptureDeviceInput;

  readonly frontDeviceInput: AVCaptureDeviceInput;

  readonly metadataObjectTypes: NSArray<any>;

  readonly metadataOutput: AVCaptureMetadataOutput;

  readonly previewLayer: AVCaptureVideoPreviewLayer;

  constructor(o: { metadataObjectTypes: NSArray<any>; });

  hasFrontDevice(): boolean;

  initWithMetadataObjectTypes(metadataObjectTypes: NSArray<any>): this;

  isTorchAvailable(): boolean;

  running(): boolean;

  setCompletionWithBlock(completionBlock: (p1: string, p2: string) => void): void;

  startScanning(): void;

  stopScanning(): void;

  switchDeviceInput(): void;

  toggleTorch(): void;
}

interface QRCodeReaderDelegate extends NSObjectProtocol {

  readerDidCancel?(reader: QRCodeReaderViewController): void;

  readerDidScanResultForType?(reader: QRCodeReaderViewController, result: string, type: string): void;
}

declare var QRCodeReaderDelegate: {

  prototype: QRCodeReaderDelegate;
};

declare class QRCodeReaderViewController extends UIViewController {

  static alloc(): QRCodeReaderViewController; // inherited from NSObject

  static new(): QRCodeReaderViewController; // inherited from NSObject

  static readerWithCancelButtonTitle(cancelTitle: string): QRCodeReaderViewController;

  static readerWithCancelButtonTitleCodeReader(cancelTitle: string, codeReader: QRCodeReader): QRCodeReaderViewController;

  static readerWithCancelButtonTitleCodeReaderStartScanningAtLoad(cancelTitle: string, codeReader: QRCodeReader, startScanningAtLoad: boolean): QRCodeReaderViewController;

  static readerWithCancelButtonTitleCodeReaderStartScanningAtLoadShowSwitchCameraButtonShowTorchButtonCancelButtonBackgroundColor(cancelTitle: string, codeReader: QRCodeReader, startScanningAtLoad: boolean, showSwitchCameraButton: boolean, showTorchButton: boolean, cancelButtonBackgroundColor: string): QRCodeReaderViewController;

  static readerWithCancelButtonTitleMetadataObjectTypes(cancelTitle: string, metadataObjectTypes: NSArray<any>): QRCodeReaderViewController;

  static readerWithMetadataObjectTypes(metadataObjectTypes: NSArray<any>): QRCodeReaderViewController;

  readonly codeReader: QRCodeReader;

  delegate: QRCodeReaderDelegate;

  constructor(o: { cancelButtonTitle: string; });

  constructor(o: { cancelButtonTitle: string; codeReader: QRCodeReader; });

  constructor(o: { cancelButtonTitle: string; codeReader: QRCodeReader; startScanningAtLoad: boolean; });

  constructor(o: { cancelButtonTitle: string; codeReader: QRCodeReader; startScanningAtLoad: boolean; showSwitchCameraButton: boolean; showTorchButton: boolean; cancelButtonBackgroundColor: string; });

  constructor(o: { cancelButtonTitle: string; metadataObjectTypes: NSArray<any>; });

  constructor(o: { metadataObjectTypes: NSArray<any>; });

  initWithCancelButtonTitle(cancelTitle: string): this;

  initWithCancelButtonTitleCodeReader(cancelTitle: string, codeReader: QRCodeReader): this;

  initWithCancelButtonTitleCodeReaderStartScanningAtLoad(cancelTitle: string, codeReader: QRCodeReader, startScanningAtLoad: boolean): this;

  initWithCancelButtonTitleCodeReaderStartScanningAtLoadShowSwitchCameraButtonShowTorchButtonCancelButtonBackgroundColor(cancelTitle: string, codeReader: QRCodeReader, startScanningAtLoad: boolean, showSwitchCameraButton: boolean, showTorchButton: boolean, cancelButtonBackgroundColor: string): this;

  initWithCancelButtonTitleMetadataObjectTypes(cancelTitle: string, metadataObjectTypes: NSArray<any>): this;

  initWithMetadataObjectTypes(metadataObjectTypes: NSArray<any>): this;

  setCompletionWithBlock(completionBlock: (p1: string, p2: string) => void): void;

  startScanning(): void;

  stopScanning(): void;
}
