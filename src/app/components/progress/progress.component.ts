import {AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ProgressService} from '@/_services/progress.service';
import {ThemeService} from '@/_services/theme.service';
import {of, Subscription} from 'rxjs';
import {MaterialModule} from '@/material.module';

@Component({
  imports: [MaterialModule],
  standalone: true,
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss'],
})
export class ProgressComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('overlay') overlay: any;

  subPsInit: Subscription;
  _cssStyle: any;
  protected readonly of = of;

  constructor(public ps: ProgressService,
              public ts: ThemeService,
              public cdr: ChangeDetectorRef) {
    this.subPsInit = this.ps.initializer.subscribe((data: any) => {
      if (data == null) {
        data = this.ts.currTheme;
      }
      setTimeout(() =>
        this.ts.assignStyle(this.overlay?.nativeElement.style, {
          panelBack: data.progressPanelBack,
          panelFore: data.progressPanelFore,
          bufferColor: data.progressBarColor
        }));
    });
  }

  ngOnInit() {
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
