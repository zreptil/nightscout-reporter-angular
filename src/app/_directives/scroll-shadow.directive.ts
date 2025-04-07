import {AfterViewInit, Directive, ElementRef, HostListener, Renderer2} from '@angular/core';

@Directive({
  selector: '[scrollShadow]'
})
export class ScrollShadowDirective implements AfterViewInit {
  private topShadowStyle = 'inset 0 10px 10px -10px rgba(0, 0, 0, 0.6)';
  private bottomShadowStyle = 'inset 0 -10px 10px -10px rgba(0, 0, 0, 0.6)';

  constructor(private el: ElementRef, private renderer: Renderer2) {
  }

  @HostListener('scroll')
  onScroll(): void {
    const element = this.el.nativeElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const offsetHeight = element.offsetHeight;

    let boxShadow = '';

    // Überprüfen, ob nach oben gescrollt werden kann
    if (scrollTop > 0) {
      boxShadow += this.topShadowStyle;
    }

    // Überprüfen, ob nach unten gescrollt werden kann
    if (scrollTop + offsetHeight < scrollHeight - 0.5) {
      boxShadow += (boxShadow ? ', ' : '') + this.bottomShadowStyle;
    }

    this.renderer.setStyle(element, 'box-shadow', boxShadow);
  }

  ngAfterViewInit(): void {
    // Initialer Aufruf, um den Schattenstatus beim Laden zu setzen
    this.onScroll();
  }
}
