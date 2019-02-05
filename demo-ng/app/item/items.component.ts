import { Component, OnInit, ViewContainerRef } from "@angular/core";

import { Item } from "./item";
import { ItemService } from "./item.service";
import { ModalDialogOptions, ModalDialogService } from "nativescript-angular";
import { ModalComponent } from "~/item/modal/modal.component";

@Component({
  selector: "ns-items",
  moduleId: module.id,
  templateUrl: "./items.component.html",
})
export class ItemsComponent implements OnInit {
  items: Item[];

  constructor(private itemService: ItemService,
              private modalService: ModalDialogService,
              private vcRef: ViewContainerRef) {
  }

  ngOnInit(): void {
    this.items = this.itemService.getItems();
  }

  openModal(): void {
    const options: ModalDialogOptions = {
      viewContainerRef: this.vcRef,
      context: {},
      fullscreen: true
    };

    this.modalService.showModal(ModalComponent, options);

  }
}