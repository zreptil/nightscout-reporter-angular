import {Component, EventEmitter, HostBinding, Input, OnInit, Output} from '@angular/core';
import {WatchElement} from '@/_model/watch-element';

@Component({
  selector: 'app-watch-entry',
  templateUrl: './watch-entry.component.html',
  styleUrls: ['./watch-entry.component.scss']
})
export class WatchEntryComponent implements OnInit {

  @Input()
  element: WatchElement;
  @Input()
  isEditMode: boolean;
  @Input()
  cls: string
  @Output('click')
  click = new EventEmitter<WatchEntryComponent>();

  constructor() {
  }

  @HostBinding('attr.selected')
  get selected(): boolean {
    return this.element?.selected;
  }

  @HostBinding('attr.type')
  get type(): string {
    return this.element?.type;
  }

  @HostBinding('class')
  get cssClass(): string {
    const ret = [this.cls];
    if (this.element != null) {
      ret.push(`size${this.element.size}`);
      ret.push(`vertical${this.element.vertical}`);
      if (this.element.bold) {
        ret.push('bold');
      }
      if (this.element.italic) {
        ret.push('italic');
      }
      if (this.element.selected) {
        ret.push('mat-elevation-z20');
      }
    }
    return ret.join(' ');
  }

  ngOnInit(): void {
  }

  clickElement(evt: MouseEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.click.emit(this);
  }
}
