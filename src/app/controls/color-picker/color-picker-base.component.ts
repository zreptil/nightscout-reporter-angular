import {AfterViewInit, Component, EventEmitter, Input, Output} from '@angular/core';
import {ColorDialogData} from '@/controls/color-picker/color-picker.component';
import {ColorData} from '@/_model/color-data';

@Component({
  template: ``
})
export class ColorPickerBaseComponent implements AfterViewInit {
  @Input()
  data: ColorDialogData;
  @Input()
  color!: ColorData;
  @Output()
  colorChange = new EventEmitter<ColorData>();
  @Output()
  colorClick = new EventEmitter<ColorData>();

  // Can be used to redirect actions from the parent component
  // to this component. When parentClick is received the
  // component looks for a method named parentFiredXXX, where
  // XXX has to be the same as the paramter received in parentClick.
  // If this method is available it will be called.
  @Input()
  parentClick: EventEmitter<string>;

  constructor() {
  }

  ngAfterViewInit(): void {
    this.parentClick?.subscribe(cmd => {
      (this as any)[`parentFired${cmd}`]?.();
    });
  }
}
