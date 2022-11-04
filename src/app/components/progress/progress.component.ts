import {AfterViewInit, Component, Input, ViewChild} from '@angular/core';
import {ProgressService} from '@/_services/progress.service';
import {ThemeService} from '@/_services/theme.service';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss']
})
export class ProgressComponent implements AfterViewInit {
  @ViewChild('overlay') overlay: any;

  constructor(public ps: ProgressService,
              public ts: ThemeService) {
  }

  _cssStyle: any;

  @Input()
  set cssStyle(value: any) {
    this._cssStyle = value;
    this.ts.assignStyle(this.overlay?.nativeElement.style, value);
  }

  get value(): number {
    return this.ps.progressValue / (this.ps.progressMax ?? 1) * 100;
  }

  classForOverlay(hide: boolean): string[] {
    const ret = [];
    if (hide) {
      ret.push('hidden');
    }
    return ret;
  }

  ngAfterViewInit(): void {
    if (this._cssStyle != null) {
      this.ts.assignStyle(this.overlay.nativeElement.style, this._cssStyle);
    }
  }

}
