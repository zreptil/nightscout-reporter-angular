import {AfterViewInit, Component} from '@angular/core';
import {ColorPickerBaseComponent} from '@/controls/color-picker/color-picker-base.component';
import {ColorUtils} from '@/controls/color-picker/color-utils';

@Component({
  selector: 'app-color-picker-rgb',
  templateUrl: './color-picker-rgb.component.html',
  styleUrls: ['./color-picker-rgb.component.scss']
})
export class ColorPickerRGBComponent extends ColorPickerBaseComponent implements AfterViewInit {
  constructor() {
    super();
  }

  get hue(): number {
    return ColorUtils.rgb2hsl(this.color.value)[0];
  }

  set hue(value: number) {
    const hsl = ColorUtils.rgb2hsl(this.color.value);
    hsl[0] = value;
    this.color.value = ColorUtils.hsl2rgb(hsl);
  }

  get saturation(): number {
    return ColorUtils.rgb2hsl(this.color.value)[1];
  }

  set saturation(value: number) {
    const hsl = ColorUtils.rgb2hsl(this.color.value);
    hsl[1] = value;
    this.color.value = ColorUtils.hsl2rgb(hsl);
  }

  get lightness(): number {
    return ColorUtils.rgb2hsl(this.color.value)[2];
  }

  set lightness(value: number) {
    const hsl = ColorUtils.rgb2hsl(this.color.value);
    hsl[2] = value;
    this.color.value = ColorUtils.hsl2rgb(hsl);
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();
    setTimeout(() => this.color.fillFromJson(this.data.color.asJson), 10);
  }

  rgbChange() {
    // this.data.colorChange?.emit(this.color);
  }
}
