import {BasePrint} from '@/forms/base-print';

abstract class BaseDaily extends BasePrint {
  showSMB: boolean;
  showSMBAtGluc: boolean;

  graphHeight: number;

  static get msgDaily1(): string {
    return $localize`SMB Werte anzeigen`;
  }

  static get msgDaily2(): string {
    return $localize`SMB an der Kurve platzieren`;
  }

  smbY(value: number): number {
    return this.graphHeight / 50 * value;
  }

  paintSMB(insulin: number, x: number, y: number, cvs: any): void {
    const h = this.smbY(insulin) * 2;
    cvs.add({
      type: 'polyline',
      closePath: true,
      _lineColor: '#000000',
      color: this.colBolus,
      lineWidth: this.cm(0),
      points: [
        {x: this.cm(x), y: this.cm(y)},
        {x: this.cm(x + 0.1), y: this.cm(y - h - 0.1)},
        {x: this.cm(x - 0.1), y: this.cm(y - h - 0.1)}
      ],
    });
  }
}
