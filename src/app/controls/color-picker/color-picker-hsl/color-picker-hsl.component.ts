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
  styleUrls: ['./color-picker-hsl.component.scss']
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
  hslWheelAdjust = 90;

  constructor() {
    super();
  }

  _triggerValue: string;

  @Input()
  set triggerValue(value: number[]) {
    if (value?.length === 4) {
      this.color.update(value, value[3]);
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
      left: `${xm - pos.x}px`,
      top: `${ym - pos.y}px`,
      '--c': ColorUtils.fontColor(ColorUtils.hsl2rgb([this.hue, this.sat, this.light]) ?? [255, 255, 255]),
    };
  }

  get styleForHslWheel(): any {
    return {
      transform: `rotate(${this.hslWheelAdjust}deg)`
    };
  }

  get styleForHsl(): any {
    return {
      transform: `translate(-50%, -50%) rotate(${this.hue + 180}deg)`
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
      background: this.color.display,
      top: `${this.hptr.y}px`
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
    this.ctrls.mouseArea.x = this.mouseArea.nativeElement.clientLeft;
    this.ctrls.mouseArea.y = this.mouseArea.nativeElement.clientTop;
    this.ctrls.mouseArea.w = this.mouseArea.nativeElement.clientWidth;
    this.ctrls.mouseArea.h = this.mouseArea.nativeElement.clientHeight;
    this.ctrls.hslWheel.x = this.hslWheel.nativeElement.offsetLeft - this.mouseArea.nativeElement.offsetLeft;
    this.ctrls.hslWheel.y = this.hslWheel.nativeElement.offsetTop - this.mouseArea.nativeElement.offsetTop;
    this.ctrls.hslWheel.w = this.hslWheel.nativeElement.clientWidth;
    this.ctrls.hslWheel.h = this.hslWheel.nativeElement.clientHeight;
    this.ctrls.opcBar.x = this.opcBar.nativeElement.offsetLeft - this.mouseArea.nativeElement.offsetLeft;
    this.ctrls.opcBar.y = this.opcBar.nativeElement.offsetTop - this.mouseArea.nativeElement.offsetTop;
    this.ctrls.opcBar.w = this.opcBar.nativeElement.clientWidth;
    this.ctrls.opcBar.h = this.opcBar.nativeElement.clientHeight;
    this.ctx = this.canvas.getContext('2d');
    this.hptr.tape = this.ctrls.hslWheel.w / 2 * 0.2;
    this.hptr.frameHUE = 2;
    this.hptr.sizeHUE = this.hptr.tape - 2 * this.hptr.frameHUE;
    this.hptr.frameHSL = 2;
    this.hptr.sizeHSL = 4;
    this.hptr.y = this.hptr.tape / 2 - this.hptr.sizeHUE / 2 - this.hptr.frameHUE;
    const r = this.canvas.width * 0.45;
    this.hptr.pth = {
      x: 0,
      y: r,
    };
    this.hptr.ptb = {
      x: Math.sin(Math.PI * 2 / 3) * r,
      y: Math.cos(Math.PI * 2 / 3) * r,
    };
    this.hptr.ptw = {
      x: Math.sin(-Math.PI * 2 / 3) * r,
      y: Math.cos(-Math.PI * 2 / 3) * r,
    };

    this.paintCanvas();
  }

  paintCanvas(): void {
    if (this.ctx == null) {
      return;
    }
    this.ctx.fillStyle = '#fff';
    this.ctx.clearRect(0, 0, this.ctrls.hslWheel.w, this.ctrls.hslWheel.w);
    const xm = this.canvas.width / 2;
    const ym = this.canvas.height / 2;
    const pt_hue = this.hptr.pth;
    const pt_black = this.hptr.ptb;
    const pt_white = this.hptr.ptw;
    const step_x = 0.01;
    const step_y = 0.01;
    for (let s = 0; s <= 1; s += step_y) {
      const ptb = {
        x: pt_black.x + (pt_hue.x - pt_black.x) * s,
        y: pt_black.y + (pt_hue.y - pt_black.y) * s
      };
      const ptw = {
        x: pt_white.x + (pt_hue.x - pt_white.x) * s,
        y: pt_white.y + (pt_hue.y - pt_white.y) * s
      };
      const pt_mid = {
        x: (ptb.x + ptw.x) / 2,
        y: (ptb.y + ptw.y) / 2,
        c: new ColorData([128, 128, 128])
      };
      for (let l = 0; l <= 1; l += step_x) {
        const pos = this.calcLightPos(pt_black, pt_white, pt_mid, s, l);
        this.paintxy(xm + pos.x, ym + pos.y, pos.c.display);
      }
    }
  }

  calcLightPos(black: Area, white: Area, mid: Area, s: number, l: number): any {
    let ret: any;
    if (l <= 0.5) {
      const l1 = 0.5 - l;
      ret = {
        x: black.x + (mid.x - black.x) * (l * 2),
        y: black.y + (mid.y - black.y) * (l * 2),
        c: new ColorData(ColorUtils.hsl2rgb(
          [this.hue, s * 100, l * 100]))
      };
    } else {
      const l1 = l - 0.5;
      ret = {
        x: mid.x + (white.x - mid.x) * l1 * 2,
        y: mid.y + (white.y - mid.y) * l1 * 2,
        c: new ColorData(ColorUtils.hsl2rgb(
          [this.hue, s * 100, l * 100]))
      };
    }
    return ret;
  }

  calcHslPos(s: number, l: number): any {
    const ptb = {
      x: this.hptr.ptb.x + (this.hptr.pth.x - this.hptr.ptb.x) * s,
      y: this.hptr.ptb.y + (this.hptr.pth.y - this.hptr.ptb.y) * s
    };
    const ptw = {
      x: this.hptr.ptw.x + (this.hptr.pth.x - this.hptr.ptw.x) * s,
      y: this.hptr.ptw.y + (this.hptr.pth.y - this.hptr.ptw.y) * s
    };
    const ptm = {
      x: (ptb.x + ptw.x) / 2,
      y: (ptb.y + ptw.y) / 2
    };
    return this.calcLightPos(this.hptr.ptb, this.hptr.ptw, ptm, s, l);
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

  getColorAtPos(x: number, y: number): ColorData {
    const s = x / this.ctrls.hslWheel.w * 100;
    const l = 100 - y / this.ctrls.hslWheel.w * 100;
    return new ColorData(ColorUtils.hsl2rgb([this.hue, s, l]));
  }

  mouseDown(evt: MouseEvent) {
    let type: string;
    const pos = this.mousePos(evt);
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
        let adjust = (this.hue - 90 - this.hslWheelAdjust) * Math.PI / 180; //-this.hue * Math.PI / 180; //(270 - this.hue) * Math.PI / 180;
        const p = this.adjustDeg(pos.x, pos.y, xmid, ymid, adjust);
        const r1 = this.canvas.width * 0.45;
        const pb = {
          x: Math.cos(Math.PI * 2 / 3 + adjust) * r1,
          y: Math.sin(Math.PI * 2 / 3 + adjust) * r1,
        };
        const pw = {
          x: Math.cos(-Math.PI * 2 / 3 + adjust) * r1,
          y: Math.sin(-Math.PI * 2 / 3 + adjust) * r1,
        };
        // const pb = this.adjustDeg(xmid + this.hptr.ptb.x, ymid - this.hptr.ptb.y, xmid, ymid, adjust);
        // const pw = this.adjustDeg(xmid + this.hptr.ptw.x, ymid - this.hptr.ptw.y, xmid, ymid, adjust);
        this.markxy(xm - p.x, ym + p.y, 'lime');
        console.log(pb, xmid, ymid);
        this.markxy(xm + pb.x, ym + pb.y, 'black');
        this.markxy(xm + pw.x, ym + pw.y, 'white');
        break;
      case 'opc':
        x = pos.x - this.ctrls.opcBar.x;
        this.opacity = Math.max(0, Math.min(x / this.ctrls.opcBar.w, 1.0));
        this._color.update(ColorUtils.hsl2rgb([this.hue, this.sat, this.light]), this.opacity);
        this.colorChange?.next(this.color);
        break;
    }
  }

  adjustDeg(x: number, y: number, xm: number, ym: number, adjust: number): { x: number, y: number } {
    x = xm - x;
    y = ym - y;
    const r = Math.sqrt(x * x + y * y);
    const deg = Math.atan2(x, y) + adjust;
    return {x: Math.cos(deg) * r, y: Math.sin(deg) * r};
  }

  markxy(x: number, y: number, fill = 'red'): void {
    this.ctx.fillStyle = fill;
    this.ctx.fillRect(x - 5, y - 5, 10, 10);
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
