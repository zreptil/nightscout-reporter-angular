import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {ColorPickerBaseComponent} from '@/controls/color-picker/color-picker-base.component';
import {ColorUtils} from '@/controls/color-picker/color-utils';
import {ColorData} from '@/_model/color-data';
import {Utils} from '@/classes/utils';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';

class Area {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

@Component({
  selector: 'app-color-picker-hsl',
  templateUrl: './color-picker-hsl.component.html',
  styleUrls: ['./color-picker-hsl.component.scss'],
  standalone: false
})
export class ColorPickerHslComponent extends ColorPickerBaseComponent implements AfterViewInit {
  @ViewChild('mouseArea')
  mouseArea: ElementRef<HTMLDivElement>;
  @ViewChild('imageBox')
  imageBox: ElementRef<HTMLDivElement>;
  @ViewChild('hslWheel')
  hslWheel: ElementRef<HTMLDivElement>;
  @ViewChild('opcBar')
  opcBar: ElementRef<HTMLDivElement>;
  // @ViewChild('canvasImage')
  // canvasImage: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasHSL')
  canvasHSL: ElementRef<HTMLCanvasElement>;
  ctrls: {
    mouseArea: Area,
    hslWheel: Area,
    opcBar: Area,
  } = {mouseArea: {}, hslWheel: {}, opcBar: {}};
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  downPos: { [key: string]: any } = {};
  downType: string;
  hueColor: ColorData;
  hptr = {
    sizeHSL: 0,
    frameHSL: 0,
    sizeHUE: 0,
    frameHUE: 0,
    tape: 0,
    y: 0,
    pth: {x: 0, y: 0},
    ptb: {x: 0, y: 0},
    ptw: {x: 0, y: 0}
  };
  // adjustment for direction of colorwheel
  hslWheelAdjust = 0;

  constructor() {
    super();
  }

  _triggerValue: string;

  @Input()
  set triggerValue(value: number[]) {
    if (value?.length === 4) {
      this.color.update([value[0], value[1], value[2]], value[3]);
    }
    this.calcHsl();
    this.colorChange?.next(this.color);
  }

  _opacity: number;

  get opacity(): number {
    return this._opacity;
  }

  set opacity(value: number) {
    this._opacity = value;
    this.calcHueColor();
  }

  _hue: number;

  get hue(): number {
    return this._hue;
  }

  set hue(value: number) {
    this._hue = value;
    this.calcHueColor();
  }

  _sat: number;

  get sat(): number {
    return this._sat;
  }

  set sat(value: number) {
    this._sat = value;
  }

  _light: number;

  get light(): number {
    return this._light;
  }

  set light(value: number) {
    this._light = value;
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  override get color(): ColorData {
    return super.color;
  }

  @Input()
  override set color(value: ColorData) {
    if (super.color !== value) {
      super.color = value;
      if (this.color != null) {
        this.calcHsl();
        this.colorChange?.next(this.color);
      }
    }
  }

  get styleForHueBack(): any {
    const x = (180 - this.hue) / 360 * this.ctrls.hslWheel.w;
    return {
      'background-position-x': `${x}px`
    };
  }

  get styleForHslPointer(): any {
    const xm = this.ctrls.hslWheel.w / 2;
    const ym = this.ctrls.hslWheel.h / 2;
    const pos = this.calcHslPos(this.sat / 100, this.light / 100);
    return {
      '--ps': `${this.hptr.sizeHSL}px`,
      '--pf': `${this.hptr.frameHSL}px`,
      transform: 'translate(-50%, -50%)',
      left: `${xm + pos.x}px`,
      top: `${ym + pos.y}px`,
      '--c': ColorUtils.fontColor(ColorUtils.hsl2rgb([this.hue, this.sat, this.light]) ?? [255, 255, 255]),
    };
  }

  get styleForHslWheel(): any {
    const ret: any = {
      transform: `rotate(${this.hslWheelAdjust}deg)`
    };
    if (this.sat === 0 || this.light === 100 || this.light === 0) {
      ret.background = ColorUtils.display_rgb(this.color.value);
    }
    return ret;
  }

  get styleForHsl(): any {
    return {
      transform: `translate(-50%, -50%) rotate(${this.hue}deg)`
    };
  }

  get styleForHuePointerBox(): any {
    return {
      transform: `rotate(${this.hue}deg)`,
    };
  }

  get styleForHuePointer(): any {
    return {
      '--ps': `${this.hptr.sizeHUE}px`,
      '--pf': `${this.hptr.frameHUE}px`,
      '--c': ColorUtils.fontColor(ColorUtils.hsl2rgb([this.hue, 100, 50]) ?? [255, 255, 255]),
      background: 'transparent',
      top: `${this.hptr.y}px`
    };
  }

  get styleForHuePointerFore(): any {
    return {
      background: this.color.css,
      opacity: this.opacity
    };
  }

  get styleForOpcBack(): any {
    return {
      '--c': ColorUtils.display_rgb(this._color.value),
      '--o': this.opacity
    };
  }

  get styleForOpcPointer(): any {
    return {
      '--c': ColorUtils.fontColor(this._color?.value ?? [255, 255, 255]),
      left: `${Math.floor(this.opacity * 100)}%`
    };
  }

  floor(value: number): number {
    return Math.floor(value);
  }

  calcHueColor(): void {
    this.hueColor = new ColorData(ColorUtils.hsl2rgb([this.hue, 100, 50]));
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();
//    this.canvas = this.canvasImage.nativeElement;
    const imageBox = this.imageBox.nativeElement;
    this.canvas = this.canvasHSL.nativeElement;
    this.canvas.width = imageBox.clientWidth;
    this.canvas.height = imageBox.clientHeight;
    this.loadCtrls();
    this.ctx = this.canvas.getContext('2d');
    this.hptr.tape = this.ctrls.hslWheel.w / 2 * 0.2;
    this.hptr.frameHUE = 2;
    this.hptr.sizeHUE = this.hptr.tape - 2 * this.hptr.frameHUE;
    this.hptr.frameHSL = 2;
    this.hptr.sizeHSL = 4;
    this.hptr.y = this.hptr.tape / 2 - this.hptr.sizeHUE / 2 - this.hptr.frameHUE;
    const r = this.canvas.width * 0.45;
    // the coordinates are relative to the middle of the triangle
    this.hptr.pth = {
      x: 0,
      y: -r,
    };
    this.hptr.ptb = {
      x: Math.sin(-Math.PI / 3) * r,
      y: Math.cos(-Math.PI / 3) * r
    };
    this.hptr.ptw = {
      x: Math.sin(Math.PI / 3) * r,
      y: Math.cos(Math.PI / 3) * r
    };

    this.paintCanvas();
  }

  loadCtrls(): void {
    this.ctrls.mouseArea.x = this.mouseArea.nativeElement.clientLeft;
    this.ctrls.mouseArea.y = this.mouseArea.nativeElement.clientTop;
    this.ctrls.mouseArea.w = this.mouseArea.nativeElement.clientWidth;
    this.ctrls.mouseArea.h = this.mouseArea.nativeElement.clientHeight;
    this.ctrls.hslWheel.x = this.hslWheel.nativeElement.offsetLeft;
    this.ctrls.hslWheel.y = this.hslWheel.nativeElement.offsetTop;
    this.ctrls.hslWheel.w = this.hslWheel.nativeElement.clientWidth;
    this.ctrls.hslWheel.h = this.hslWheel.nativeElement.clientHeight;
    this.ctrls.opcBar.x = this.opcBar?.nativeElement?.offsetLeft;
    this.ctrls.opcBar.y = this.opcBar?.nativeElement?.offsetTop;
    this.ctrls.opcBar.w = this.opcBar?.nativeElement?.clientWidth;
    this.ctrls.opcBar.h = this.opcBar?.nativeElement?.clientHeight;
  }

  paintCanvas(): void {
    if (this.ctx == null) {
      return;
    }
    this.ctx.fillStyle = '#ffffff20';
    this.ctx.clearRect(0, 0, this.ctrls.hslWheel.w, this.ctrls.hslWheel.w);
    const xm = this.canvas.width / 2;
    const ym = this.canvas.height / 2;
    const step_y = 1 / (this.hptr.ptw.y - this.hptr.pth.y) * 0.9;
    const step_x = 0.5 / (this.hptr.ptw.x - this.hptr.pth.x) * 0.9;
    for (let y = 0; y <= 1; y += step_y) {
      for (let x = 0; x <= 1; x += step_x) {
        const pos = this.calcLightSatPos(x, y);
        this.paintxy(xm + pos.x, ym + pos.y, pos.c.display);
      }
    }
  }

  // TODO: should give the exact same position as mousemove - hsl
  calcLightSatPos(l: number, s: number): any {
    let ret: any = {x: 0, y: this.hptr.ptb.y + (this.hptr.pth.y - this.hptr.ptb.y) * s};
    let light, sat;
    if (l <= 0.5) {
      const xmin = this.hptr.ptb.x + (this.hptr.pth.x - this.hptr.ptb.x) * s;
      ret.x = xmin + (this.hptr.pth.x - xmin) * l * 2;
      // calculate light
      const minLight = s / 2;
      const rangeLight = 0.5 - minLight;
      light = minLight + l * rangeLight / 0.5;
      // calculate saturation
      const minSat = s;
      const maxSat = 1;
      const rangeSat = maxSat - minSat;
      sat = 1 - (l * 2) * rangeSat / maxSat;
    } else {
      const l1 = l - 0.5;
      const xmax = this.hptr.ptw.x - (this.hptr.ptw.x - this.hptr.pth.x) * s;
      ret.x = this.hptr.pth.x + (xmax - this.hptr.pth.x) * l1 * 2;
      // calculate light
      const maxLight = 0.5 + (1 - s) / 2;
      const rangeLight = maxLight - 0.5;
      light = 0.5 + l1 * rangeLight / 0.5;
      // calculate saturation
      const minSat = s;
      const maxSat = 1;
      const rangeSat = maxSat - minSat;
      sat = minSat + (l1 * 2) * rangeSat / maxSat;
    }
    ret.c = new ColorData(ColorUtils.hsl2rgb([this.hue, sat * 100, light * 100]));
    return ret;
  }

  calcHslPos(s: number, l: number): any {
    const ret = this.calcLightSatPos(l, s);
    // for 100% saturation the position is at one of the sides of the triangle
    if (s === 1) {
      if (l < 0.5) {
        ret.x = this.hptr.ptb.x + (this.hptr.pth.x - this.hptr.ptb.x) * l * 2;
        ret.y = this.hptr.ptb.y - (this.hptr.ptb.y - this.hptr.pth.y) * l * 2;
      } else {
        ret.x = this.hptr.pth.x + (this.hptr.ptw.x - this.hptr.pth.x) * (l - 0.5) * 2;
        ret.y = this.hptr.pth.y + (this.hptr.ptw.y - this.hptr.pth.y) * (l - 0.5) * 2;
      }
    }
    return ret;
  }

  paintxy(x: number, y: number, fill = 'red'): void {
    this.ctx.fillStyle = fill;
    this.ctx.fillRect(x, y, 1, 1);
  }

  mousePos(event: MouseEvent): any {
    return {
      x: event.offsetX,
      y: event.offsetY
    };
  }

  mouseDown(evt: MouseEvent) {
    let type: string;
    const pos = this.mousePos(evt);
    this.loadCtrls();
    const x = this.ctrls.hslWheel.x + this.ctrls.hslWheel.w / 2 - pos.x;
    const y = this.ctrls.hslWheel.y + this.ctrls.hslWheel.h / 2 - pos.y;
    const r = Math.sqrt(x * x + y * y);

    if (r > this.ctrls.hslWheel.w / 2 * 0.8 && pos.y <= this.ctrls.hslWheel.h) {
      type = 'hue';
    } else if (r < this.ctrls.hslWheel.w / 2 * 0.8) {
      type = 'hsl';
    } else if (
      pos.x >= this.ctrls.opcBar.x
      && pos.x < this.ctrls.opcBar.x + this.ctrls.opcBar.w
      && pos.y >= this.ctrls.opcBar.y
      && pos.y < this.ctrls.opcBar.y + this.ctrls.opcBar.h) {
      type = 'opc';
    }
    if (type != null) {
      this.downPos[type] = pos;
      this.downType = type;
      this.mouseMove(evt);
    }
  }

  mouseMove(evt: MouseEvent) {
    if (this.downPos[this.downType] == null) {
      return;
    }
    const pos = this.mousePos(evt);
    let x, y, r;
    let doUpdate = false;
    switch (this.downType) {
      case 'hue':
        x = this.ctrls.hslWheel.x + this.ctrls.hslWheel.w / 2 - pos.x;
        y = this.ctrls.hslWheel.y + this.ctrls.hslWheel.h / 2 - pos.y;
        r = Math.sqrt(x * x + y * y);
        this.hue = Math.asin(y / r) / Math.PI * 180 + 270;
        if (x < 0) {
          this.hue = 360 - this.hue;
        }
        this.hue = Utils.limit(this.hue - this.hslWheelAdjust, 0, 360);
        this._color.update(ColorUtils.hsl2rgb([this.hue, this.sat, this.light]), this.opacity);
        this.colorChange?.next(this.color);
        this.calcHsl();
        break;
      case 'hsl':
        const xm = this.ctx.canvas.width / 2;
        const ym = this.ctx.canvas.height / 2;
        const xmid = this.ctrls.hslWheel.x + this.ctrls.hslWheel.w / 2;
        const ymid = this.ctrls.hslWheel.y + this.ctrls.hslWheel.h / 2;
        let adjust = (this.hue + this.hslWheelAdjust) * Math.PI / 180;
        const p = this.adjustDeg(pos.x, pos.y, xmid, ymid, adjust);
        p.x = xm - p.x;
        p.y = ym - p.y;
        // this.markxy(p.x, p.y, 'lime');
        // this.markxy(xm, ym, 'red');
        // this.markxy(xmid, ymid, 'yellow');
        let yd = (p.y - (this.hptr.pth.y + ym)) / (this.hptr.ptb.y - this.hptr.pth.y);
        yd = Math.min(Math.max(1 - yd, 0), 1);
        let sat = ((p.y - ym) - this.hptr.ptb.y) / (this.hptr.pth.y - this.hptr.ptb.y);
        sat = Math.min(Math.max(sat, 0), 1);
        let light = this.light / 100;
        if (p.y < this.hptr.pth.y + ym) {
          light = 0.5;
        } else {
          let x = xm - p.x;
          if (p.x < xm) {
            const xmin = this.hptr.ptb.x + (this.hptr.pth.x - this.hptr.ptb.x) * sat;
            // const lightMin = sat / 2;
            if (-x < xmin) {
              x = -xmin;
              light = sat / 2;
              sat = 1;
            } else {
              light = (x - xmin) / 2 / (this.hptr.pth.x - xmin);
              light = 0.5 - (light - 0.5);
            }
            light = Math.min(Math.max(light, 0), 0.5);
          } else {
            const xmax = this.hptr.ptw.x - (this.hptr.ptw.x - this.hptr.pth.x) * sat;
            // const lightMax = 1 - sat / 2;
            if (-x > xmax) {
              x = -xmax;
              light = 1 - sat / 2;
              sat = 1;
            } else {
              light = (xm - p.x - this.hptr.pth.x) / 2 / (xmax - this.hptr.pth.x);
              light = 0.5 - light;
            }
            light = Math.min(Math.max(light, 0.5), 1);
          }
        }
        this.sat = sat * 100;
        this.light = light * 100;
        doUpdate = true;
        break;
      case 'opc':
        x = pos.x - this.ctrls.opcBar.x;
        this.opacity = Math.max(0, Math.min(x / this.ctrls.opcBar.w, 1.0));
        doUpdate = true;
        break;
    }
    if (doUpdate) {
      this._color.update(ColorUtils.hsl2rgb([this.hue, this.sat, this.light]), this.opacity);
      this.colorChange?.next(this.color);
    }
  }

  adjustDeg(x: number, y: number, xm: number, ym: number, adjust: number): { x: number, y: number } {
    x = xm - x;
    y = ym - y;
    const r = Math.sqrt(x * x + y * y);
    const deg = Math.atan2(x, y) + adjust;
    return {x: Math.sin(deg) * r, y: Math.cos(deg) * r};
  }

  markxy(x: number, y: number, fill = 'red'): void {
    this.ctx.fillStyle = fill;
    this.ctx.fillRect(x - 1, y - 1, 3, 3);
  }

  mouseUp(_evt: MouseEvent) {
    this.downPos[this.downType] = null;
    this.downType = null;
  }

  calcHsl(): void {
    const hsl = ColorUtils.rgb2hsl(this.color.value);
    this.sat = hsl[1];
    this.light = hsl[2];
    this.hue = hsl[0];
    this.opacity = this.color.opacity;
    this.paintCanvas();
  }

  selectColor(color: ColorData) {
    return {backgroundColor: ColorUtils.display_rgba(color.value, color.opacity)};
  }
}
