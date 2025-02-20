import {Directive, Input, TemplateRef, ViewContainerRef} from '@angular/core';
import {GLOBALS} from '@/_model/globals-data';

@Directive({
  selector: '[colorEdit]',
  standalone: false
})
export class ColorEditDirective {
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {
  }

  @Input() set colorEdit(check: boolean) {
    check = check == null ? GLOBALS.editColors : check;
    if (check && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!check && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
