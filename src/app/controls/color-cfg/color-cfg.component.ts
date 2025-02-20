import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {SessionService} from '@/_services/session.service';

@Component({
  selector: 'color-cfg',
  templateUrl: './color-cfg.component.html',
  styleUrls: ['./color-cfg.component.scss'],
  standalone: false
})
export class ColorCfgComponent {

  @ViewChild('input') input: ElementRef;

  @Input() colorKey: string;

  constructor(private ss: SessionService) {
  }

  // btnOpen(evt: MouseEvent) {
  //   evt.stopPropagation();
  //   this.value = this.ts.currTheme[this.color];
  //   this.lastValue = this.value;
  //   setTimeout(() => this.input.nativeElement.click());
  // }
  //
  // colorInput(_evt: any) {
  //   this.ts.currTheme[this.color] = this.value;
  //   this.ts.assignStyle(document.body.style, this.ts.currTheme);
  // }
  showDialog() {
    this.ss.showPopup('colorcfgdialog', {colorKey: this.colorKey});
  }
}
