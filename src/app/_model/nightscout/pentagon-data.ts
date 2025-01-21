import {Utils} from '@/classes/utils';
import {GLOBALS} from '@/_model/globals-data';
import {BasePrint} from '@/forms/base-print';

class PentagonScaleData {

  name: string;
  beg = 0.0;
  end = 1.0;
  nameX = 0.0;
  nameY = 0.0;
  valueX = 0.0;
  valueY = 0.0;
  _scaleMethod: (v: number) => number;

  constructor(public values: number[], public legendFactor: number, options?: {
    name?: string,
    beg?: number,
    end?: number,
    nameX?: number,
    nameY?: number,
    valueX?: number,
    valueY?: number,
    _scaleMethod?: (v: number) => number
  }) {
    Utils.pushArgs(options, this);
  }

  scaleMethod(v: number): number {
    return this._scaleMethod(v) / 76;
  }
}

export class PentagonData {
  axis: PentagonScaleData[];
  defFontSize = 6;
  axisLength: number;
  scale: number;
  xm: number;
  ym: number;
  fontsize = -1;
  showAreaLines = true;
  deg: number;
  outputCvs: any[] = [];
  outputText: any[] = [];
  hasLimitBreakers = false;

  constructor(public glucInfo: any,
              public base: BasePrint,
              args?: {
                xm?: number,
                ym?: number,
                scale?: number,
                fontsize?: number,
                showAreaLines?: boolean
              }) {
    Utils.pushArgs(args, this);
    this.axis = [
      new PentagonScaleData([0, 300, 480, 720, 900, 1080, 1200, 1440], 1, {
        _scaleMethod: (v: number) => Math.pow(v * 0.00614, 1.581) + 14,
        name: PentagonData.msgTOR(),
        nameX: -2.5,
        nameY: -0.4,
        valueX: 0.15,
        valueY: -0.11
      }),
      new PentagonScaleData([16.7, 20, 30, 40, 50, 60, 70, 80], 1, {
        _scaleMethod: (v: number) => (v >= 17 ? v - 17 : 0) * 0.92 + 14,
        name: PentagonData.msgCV(),
        nameX: -2.3,
        nameY: -0.4,
        valueX: -0.1,
        valueY: 0.1
      }),
      new PentagonScaleData([0, 3, 4, 5, 6, 7, 7.2], GLOBALS.glucFactor, {
        _scaleMethod: (v) => Math.exp(v * 0.57) + 13,
        name: PentagonData.msgHYPO(glucInfo.unit),
        end: 0.25,
        nameX: -2.5,
        nameY: 0.1,
        valueX: -0.2,
        valueY: 0.1
      }),
      new PentagonScaleData(
        [0, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130], GLOBALS.glucFactor, {
          _scaleMethod: (v) => Math.pow(v * 0.115, 1.51) + 14,
          name: PentagonData.msgHYPER(glucInfo.unit),
          beg: 0.25,
          nameX: -2.5,
          nameY: 0.1,
          valueX: 0.1,
          valueY: 0.1
        }),
      new PentagonScaleData([130, 190, 220, 250, 280, 310], GLOBALS.glucFactor, {
        _scaleMethod: (v) =>
          Math.pow((v >= 90 ? v - 90 : 0.0) * 0.0217, 2.63) + 14,
        name: PentagonData.msgMEAN(glucInfo.unit),
        nameX: -2.5,
        nameY: -0.73,
        valueX: -0.2,
        valueY: 0.1
      }),
    ];

    this.deg = (360.0 / this.axis.length) * Math.PI / 180.0;
    const h = 7.6;
    const a = h / Math.sqrt(5 + 2 * Math.sqrt(5)) * 2;
    this.axisLength = Math.sqrt(50 + 10 * Math.sqrt(5)) / 10 * a;
    if (this.fontsize === -1) {
      this.fontsize = this.defFontSize;
    }
    this.fontsize *= this.scale;
  }

  static get msgPGR(): string {
    return $localize`PGR`;
  }

  static get msgGreen(): string {
    return $localize`Das grüne Fünfeck stellt den Wertebereich eines gesunden Menschen ohne Diabetes dar.`;
  }

  static get msgYellow(): string {
    return $localize`Das gelbe Fünfeck stellt den Wertebereich des angegebenen Zeitraums dar.`;
  }

  static get msgYellowCircle(): string {
    return $localize`Gelbe Kreise zeigen an, dass der entsprechende Wert die Skala überschreitet.`;
  }

  static get msgCVInfo(): string {
    return $localize`:@@msgCVInfo:Die glykämische Variabilität stellt die Streuung der Werte um den glykämischen Mittelwert herum in Prozent dar.`;
  }

  static get msgPGRInfo(): string {
    return $localize`:@@msgPGRInfo:Der prognostische glykämische Risikoparameter stellt das Risiko von Langzeitkomplikationen dar (bisher nicht durch Studien belegt).`;
  }

  static get msgPGR02(): string {
    return $localize`bis 2,0`;
  }

  static get msgPGR02Info(): string {
    return $localize`sehr geringes Risiko`;
  }

  static get msgPGR23(): string {
    return $localize`2,1 bis 3,0`;
  }

  static get msgPGR23Info(): string {
    return $localize`geringes Risiko`;
  }

  static get msgPGR34(): string {
    return $localize`3,1 bis 4,0`;
  }

  static get msgPGR34Info(): string {
    return $localize`moderates Risiko`;
  }

  static get msgPGR45(): string {
    return $localize`4,1 bis 4,5`;
  }

  static get msgPGR45Info(): string {
    return $localize`hohes Risiko`;
  }

  static get msgPGR5(): string {
    return $localize`ab 4,6`;
  }

  static get msgPGR5Info(): string {
    return $localize`extrem hohes Risiko`;
  }

  static msgTOR(value = ''): string {
    if (value !== '') {
      value = `${value} `;
    }
    return $localize`:@@msgTOR:ToR [${value}min/d]`;
  }

  static msgCV(value = ''): string {
    if (value !== '') {
      value = `${value} `;
    }
    return $localize`:@@msgCV:VarK [${value}%]`
  }

  static msgHYPO(unit: string, value = ''): string {
    if (value !== '') {
      unit = `${value} ${unit}`;
    }
    return $localize`:@@msgHYPO:Intensität HYPO\n[${unit} x min²]`;
  }

  static msgHYPER(unit: string, value = ''): string {
    if (value !== '') {
      unit = `${value} ${unit}`;
    }
    return $localize`:@@msgHYPER:Intensität HYPER\n[${unit} x min²]`
  }

  static msgMEAN(unit: string, value = ''): string {
    if (value !== '') {
      unit = `${value} ${unit}`;
    }
    return $localize`:@@msgMEAN:Mittlere Glukose\n[${unit}]`;
  }

  static msgTORInfo(min: string, max: string): string {
    return $localize`:@@msgTORInfo:Die Zeit pro Tag in Minuten, in denen die Werte ausserhalb des Bereichs ${min} bis ${max} liegen.`;
  }

  static msgHYPOInfo(unit: string): string {
    return $localize`:@@msgHYPOInfo:Die Intensität von Hypoglykämien pro Tag (Werte kleiner oder gleich ${unit}).`;
  }

  static msgHYPERInfo(unit: string): string {
    return $localize`:@@msgHYPERInfo:Die Intensität von Hyperglykämien pro Tag (Werte grösser oder gleich ${unit}).`;
  }

  static msgMEANInfo(_: string): string {
    return $localize`:@@msgMEANInfo:Der glykämische Mittelwert im betrachteten Zeitraum.`;
  }

  _point(idx: number, factor: number): any {
    let x = this.xm + Math.sin(idx * this.deg) * this.axisLength * this.scale * factor;
    let y = this.ym - Math.cos(idx * this.deg) * this.axisLength * this.scale * factor;
    if (isNaN(x)) {
      x = 0;
    }
    if (isNaN(y)) {
      y = 0;
    }
    return {x: this.base.cm(x), y: this.base.cm(y)};
  }

  paintPentagon(factor: number, lw: number, args?: {
    colLine?: string, colFill?: string, opacity?: number
  }): void {
    args ??= {};
    args.opacity ??= 1.0;
    lw *= this.scale;
    const points: any[] = [];
    for (let i = 0; i < this.axis.length; i++) {
      points.push(this._point(i, factor));
    }
    this.outputCvs.push({
      type: 'polyline',
      lineWidth: this.base.cm(lw),
      closePath: true,
      points: points,
      fillOpacity: args.opacity
    });
    if (args.colLine != null) {
      Utils.last(this.outputCvs).lineColor = args.colLine;
    }
    if (args.colFill != null) {
      Utils.last(this.outputCvs).color = args.colFill;
    }
  }

  paintAxis(lw: number, colLine: string = null): void {
    lw *= this.scale;
    for (let i = 0; i < this.axis.length; i++) {
      if (i > 11) {
        continue;
      }
      let pt = this._point(i, 1.10);
      this.outputCvs.push({
        type: 'line',
        x1: this.base.cm(this.xm),
        y1: this.base.cm(this.ym),
        x2: pt['x'],
        y2: pt['y'],
        lineWidth: this.base.cm(lw)
      });
      if (colLine != null) {
        Utils.last(this.outputCvs).lineColor = colLine;
      }
      this.outputText.push({
        relativePosition: {
          x: pt.x + this.base.cm(this.axis[i].nameX * this.fontsize / this.defFontSize),
          y: pt.y + this.base.cm(this.axis[i].nameY * this.fontsize / this.defFontSize)
        },
        columns: [
          {
            width: this.base.cm(5 * this.fontsize / this.defFontSize),
            text: this.axis[i].name,
            fontSize: this.base.fs(this.fontsize),
            alignment: 'center'
          }
        ]
      });
      pt = this._point(i, 1.0);
      const dx = pt.x - this.base.cm(this.xm);
      const dy = pt.y - this.base.cm(this.ym);
      let lastNr = '';
      let lastValue = 0.0;
      for (const value of this.axis[i].values) {
        pt = this._point(i, this.axis[i].scaleMethod(value)); // * axis[i].legendFactor
        const x = pt.x;
        const y = pt.y;
        const f = 0.05;
        const x1 = x + 0.5 * dy * f;
        const y1 = y - 0.5 * dx * f;
        const x2 = x - 0.5 * dy * f;
        const y2 = y + 0.5 * dx * f;
        this.outputCvs.push({
          type: 'line',
          x1: x1,
          y1: y1,
          x2: x2,
          y2: y2,
          lineWidth: this.base.cm(lw)
        });
        if (colLine != null) {
          Utils.last(this.outputCvs).lineColor = colLine;
        }
        let precision = this.axis[i].legendFactor === 1 ? 0 : 1;
        let nr = GLOBALS.fmtNumber(value / this.axis[i].legendFactor, precision);
        while (nr === lastNr) {
          nr = GLOBALS.fmtNumber(value / this.axis[i].legendFactor, ++precision);
          lastNr = GLOBALS.fmtNumber(
            lastValue / this.axis[i].legendFactor, precision, 0, 'null', true);
        }
        if (i > 0) {
          Utils.last(this.outputText).text = lastNr;
        }
        this.outputText.push({
          relativePosition: {
            x: x + this.base.cm(this.axis[i].valueX * this.fontsize / this.defFontSize),
            y: y + this.base.cm(this.axis[i].valueY * this.fontsize / this.defFontSize)
          },
          text: nr,
          fontSize: this.base.fs(this.fontsize * 0.7)
        });
        lastNr = nr;
        lastValue = value;
      }
    }
  }

  limitValue(value: number, min: number, max: number): number {
    return value < min
      ? min
      : value > max
        ? max
        : value;
  }

  paintValues(values: number[], lw: number, args:
    {
      colLine: string,
      colFill: string,
      opacity: number,
      showLimitBreaks?: boolean,
      limitValues?: boolean
    }): number {
    args.opacity ??= 1.0;
    args.showLimitBreaks ??= true;
    args.limitValues ??= true;
    lw *= this.scale;
    const points: any[] = [];
    this.hasLimitBreakers = false;
    for (let i = 0; i < values.length && i < this.axis.length; i++) {
      let y: number;
      if (args.limitValues) {
        y = this.limitValue(values[i], Utils.first(this.axis[i].values), Utils.last(this.axis[i].values));
      } else {
        y = this.limitValue(values[i], 0, Utils.last(this.axis[i].values));
      }
      points.push(this._point(i, this.axis[i].scaleMethod(y)));
      if (values[i] > Utils.last(this.axis[i].values) && args.showLimitBreaks) {
        const pt = this._point(i, 1.1);
        this.hasLimitBreakers = true;
        this.outputCvs.push({
          type: 'ellipse',
          x: pt.x,
          y: pt.y,
          r1: this.base.cm(0.3),
          r2: this.base.cm(0.3),
          color: args.colFill,
          //          lineColor: colLine,
          fillOpacity: 0.75
        });
      }
    }
    this.outputCvs.push({
      type: 'polyline',
      lineWidth: this.base.cm(lw),
      closePath: true,
      points: points,
      fillOpacity: args.opacity
    });
    if (args.colLine != null && this.showAreaLines) {
      Utils.last(this.outputCvs).lineColor = args.colLine;
    }
    if (args.colFill != null) {
      Utils.last(this.outputCvs).color = args.colFill;
    }

    return this.calcArea(values);
  }

  calcArea(values: number[]): number {
    let ret = 0.0;
    for (let i = 0; i < values.length && i < this.axis.length; i++) {
      const a = this.axis[i]._scaleMethod(values[i]);
      const b = this.axis[i < this.axis.length - 1 ? i + 1 : 0]
        ._scaleMethod(values[i < values.length - 1 ? i + 1 : 0]);
      ret += a * b / 2 * Math.sin(this.deg);
    }
    return ret;
  }
}
