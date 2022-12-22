import {Directive, ElementRef, HostListener, OnInit} from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appTextareaAutoresize]'
})
export class TextareaAutoresizeDirective implements OnInit {

  constructor(private elementRef: ElementRef) {
  }

  @HostListener(':input')
  onInput() {
    this.resize();
  }

  ngOnInit() {
    if (this.elementRef.nativeElement.scrollHeight) {
      setTimeout(() => this.resize());
    }
  }

  resize() {
    this.elementRef.nativeElement.style.maxHeight = 'calc(100vh - 200px)';
    this.elementRef.nativeElement.style.height = '0';
    this.elementRef.nativeElement.style.height = this.elementRef.nativeElement.scrollHeight + 'px';
  }
}
