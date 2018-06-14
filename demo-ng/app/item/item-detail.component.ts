import {Component, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";

import {Item} from "./item";
import {ItemService} from "./item.service";
import {BarcodeScanner} from 'nativescript-barcodescanner';

@Component({
  selector: "ns-details",
  moduleId: module.id,
  templateUrl: "./item-detail.component.html",
})
export class ItemDetailComponent implements OnInit {
  item: Item;

  constructor(
      private itemService: ItemService,
      private route: ActivatedRoute,
      private barcodeScanner: BarcodeScanner) {
  }

  ngOnInit(): void {
    const id = +this.route.snapshot.params["id"];
    this.item = this.itemService.getItem(id);
  }

  public onScanResult(evt) {
    // console.log(evt.object);
    console.log(`onScanResult: ${evt.text} (${evt.format})`);
  }

  public scanTapped(): void {
    let scan = () => {
      this.barcodeScanner.scan({
        formats: "QR_CODE, EAN_13",
        beepOnScan: true,
        reportDuplicates: true,
        preferFrontCamera: false
        // continuousScanCallback: scanResult => {
        //   console.log("result: " + JSON.stringify(scanResult));
        //   this.barcodeScanner.stop();
        // }
      })
          .then(result => console.log(JSON.stringify(result)))
          .catch(error => console.log(error));
    };

    this.barcodeScanner.hasCameraPermission()
        .then(granted => granted ? scan() : console.log("Permission denied"))
        .catch(() => {
          this.barcodeScanner.requestCameraPermission()
              .then(() => scan());
        });
  }
}
