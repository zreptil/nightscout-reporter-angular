import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {ThemeService} from '@/_services/theme.service';
import {ColorData} from '@/_model/color-data';
import {ColorDialogData} from '@/controls/color-picker/color-picker.component';

@Component({
  selector: 'color-cfg',
  templateUrl: './color-cfg.component.html',
  styleUrls: ['./color-cfg.component.scss']
})
export class ColorCfgComponent {

  @ViewChild('input') input: ElementRef;

  @Input() color: string;
  value: string;
  lastValue: string;
  colorData: ColorData;

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
    this.ts.assignStyle(document.body.style, this.ts.currTheme);
  }

  onColorPicker(data: ColorDialogData) {
    switch (data.action) {
      case 'open':
        data.mode = 'rgb';
        this.colorData = ColorData.fromJson(this.ts.currTheme[this.color]);
        break;
    }
  }
}
