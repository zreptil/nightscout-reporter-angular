import {Directive, ElementRef, HostListener} from '@angular/core';

@Directive({
  selector: '[hideMissingImage]',
  standalone: false
})
export class HideMissingImageDirective {

  constructor(private el: ElementRef) {
  }

  @HostListener('error')
  private onError() {
    this.el.nativeElement.style.display = 'none';
  }

  @HostListener('load')
  private onLoad() {
    this.el.nativeElement.style.display = 'initial';
  }

}
