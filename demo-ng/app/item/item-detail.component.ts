import { ScanOptions } from './../../platforms/android/app/src/main/assets/app/tns_modules/nativescript-barcodescanner/barcodescanner-common.d';
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { Item } from "./item";
import { ItemService } from "./item.service";

import {isAndroid, isIOS} from "platform";
import { BarcodeScanner } from 'nativescript-barcodescanner';

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
        private barcodeScanner: BarcodeScanner        
    ) { }

    ngOnInit(): void {
        const id = +this.route.snapshot.params["id"];
        this.item = this.itemService.getItem(id);
    }

    //Event handler for iOS embedded scanner
    public onScanResult(evt) {
        console.log(evt);
        console.log(evt.object);
    }

    //Event handler for button tap Android & iOS
    public onScan($event): void {
        let scan = () => {
            this.barcodeScanner.scan({
                formats:"QR_CODE, EAN_13",
                beepOnScan:true,
                reportDuplicates:true,
                preferFrontCamera:false
            }).then(result=> {
                console.log(result);
            }).catch(error => {
                console.log(error);
            }); 
        }

        this.barcodeScanner.hasCameraPermission().then(
            function(granted) {
                scan();
            }
        ).catch(()=>{
            this.barcodeScanner.requestCameraPermission().then(
                function() {
                  scan();
                }
            );
        });       
    }
}
