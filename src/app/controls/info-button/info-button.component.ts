import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-info-button',
  templateUrl: './info-button.component.html',
  styleUrls: ['./info-button.component.scss']
})
export class InfoButtonComponent {
  @Input()
  text: string;

  infoPos: { x: string, y: string };

  showInfo = false;

  get infoStyle(): any {
    return {left: this.infoPos.x, top: this.infoPos.y};
  }

  onInfoMouseOut(_evt: MouseEvent) {
    this.showInfo = false;
  }

  btnInfoClick(_evt: MouseEvent) {
    this.infoPos = {x: `-20px`, y: `-20px`};
    this.showInfo = true;
  }
}
