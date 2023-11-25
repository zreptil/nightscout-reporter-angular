import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {ThemeService} from '@/_services/theme.service';
import {ColorData} from '@/_model/color-data';
import {ColorDialogData} from '@/controls/color-picker/color-picker.component';
import {ColorUtils} from '@/controls/color-picker/color-utils';
import {Utils} from '@/classes/utils';

@Component({
  selector: 'color-cfg',
  templateUrl: './color-cfg.component.html',
  styleUrls: ['./color-cfg.component.scss']
})
export class ColorCfgComponent {

  @ViewChild('input') input: ElementRef;

  @Input() color: string;
  value: string;
  valueFore: string;
  lastValue: string;
  orgTheme: any;

  constructor(private ts: ThemeService) {
  }

  btnOpen(evt: MouseEvent) {
    evt.stopPropagation();
    this.value = this.ts.currTheme[this.color];
    this.lastValue = this.value;
    setTimeout(() => this.input.nativeElement.click());
  }

  colorInput(_evt: any) {
    this.ts.currTheme[this.color] = this.value;
    this.ts.assignStyle(document.body.style, this.ts.currTheme);
  }

  colorChange(_evt: any) {
    this.ts.currTheme[this.color] = this.value;
    if (this.color.endsWith('Back')) {
      this.ts.currTheme[`${this.color.replace(/Back/, 'Fore')}`] =
        this.valueFore;
    }
    if (this.color.indexOf('Head') >= 0) {
      const hsl = ColorUtils.rgb2hsl(ColorData.fromString(this.value).value);
      this.ts.currTheme[`${this.color.replace(/Head/, 'Body')}`] =
        new ColorData(ColorUtils.hsl2rgb([hsl[0], hsl[1], hsl[2] * 1.5])).display;
    }
    this.ts.assignStyle(document.body.style, this.ts.currTheme);
  }

  updateDialogData(data: any): void {
    data.color = ColorData.fromString(this.ts.currTheme[this.color]);
  }

  onColorPicker(data: ColorDialogData) {
    switch (data.action) {
      case 'open':
        this.orgTheme = Utils.jsonize(this.ts.currTheme);
        break;
      case 'colorChange':
        this.valueFore = ColorUtils.fontColor(data.color.value);
        this.value = `#${ColorUtils.rgb2string(data.color.value)}`;
        this.colorChange(null);
        break;
      case 'close':
        for (const key of Object.keys(this.orgTheme)) {
          this.ts.currTheme[key] = this.orgTheme[key];
        }
        this.ts.assignStyle(document.body.style, this.ts.currTheme);
        console.log(data);
        break;
      default:
        break;
    }
  }
}
