import {AfterViewInit, Component, OnDestroy, ViewChild} from '@angular/core';
import {ProgressService} from '@/_services/progress.service';
import {ThemeService} from '@/_services/theme.service';
import {Subscription} from 'rxjs';
import {CommonModule} from '@angular/common';
import {MaterialModule} from '@/material.module';

@Component({
  standalone: true,
  imports: [CommonModule, MaterialModule],
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss']
})
export class ProgressComponent implements AfterViewInit, OnDestroy {
  @ViewChild('overlay') overlay: any;

  subPsInit: Subscription;
  _cssStyle: any;

  constructor(public ps: ProgressService,
              public ts: ThemeService) {
    this.subPsInit = this.ps.initializer.subscribe((data: any) => {
      if (data == null) {
        data = this.ts.currTheme;
      }
      this.ts.assignStyle(this.overlay?.nativeElement.style, {
        panelBack: data.progressPanelBack,
        panelFore: data.progressPanelFore,
        bufferColor: data.progressBarColor
      });
    });
  }

  get value(): number {
    return this.ps.value / (this.ps.max ?? 1) * 100;
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
      this.ts.assignStyle(this.overlay.nativeElement.style, {
        panelBack: this.ts.currTheme.panelBack
      });
    }
  }

  ngOnDestroy(): void {
    this.subPsInit?.unsubscribe();
    this.subPsInit = null;
  }

}
