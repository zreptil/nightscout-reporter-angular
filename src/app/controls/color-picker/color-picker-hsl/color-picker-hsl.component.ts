import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {ColorPickerBaseComponent} from '@/controls/color-picker/color-picker-base.component';
import {ColorUtils} from '@/controls/color-picker/color-utils';
import {ColorData} from '@/_model/color-data';
import {Utils} from '@/classes/utils';

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
  // @ViewChild('canvasImage')
  // canvasImage: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasHSL')
  canvasHSL: ElementRef<HTMLCanvasElement>;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  mouseAreaWidth: number;
  mouseAreaHeight: number;
  downPos: { [key: string]: any } = {};
  downType: string;
  hueColor: ColorData;
  hptr = {
    size: 0,
    frame: 0,
    tape: 0,
    y: 0,
  };

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
    const x = (180 - this.hue) / 360 * this.width;
    return {
      'background-position-x': `${x}px`
    };
  }

  get styleForHuePointerBox(): any {
    return {
      transform: `rotate(${this.hue}deg)`,
    };
  }

  get styleForHuePointer(): any {
    return {
      '--ps': `${this.hptr.size}px`,
      '--pf': `${this.hptr.frame}px`,
      '--c': ColorUtils.fontColor(ColorUtils.hsl2rgb([this.hue, 100, 50]) ?? [255, 255, 255]),
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
    this.width = this.hslWheel.nativeElement.clientWidth;
    this.height = this.hslWheel.nativeElement.clientHeight;
    this.mouseAreaWidth = this.mouseArea.nativeElement.clientWidth;
    this.mouseAreaHeight = this.mouseArea.nativeElement.clientHeight;
    console.log(this.mouseAreaWidth, this.mouseAreaHeight);
    this.ctx = this.canvas.getContext('2d');
    this.hptr.tape = this.width / 2 * 0.2;
    this.hptr.frame = 2;
    this.hptr.size = this.hptr.tape * 0.75 - 2 * this.hptr.frame;
    this.hptr.y = this.hptr.tape / 2 - this.hptr.size / 2 - this.hptr.frame;
    this.paintCanvas();
  }

  paintCanvas(): void {
    if (this.ctx == null) {
      return;
    }
    this.ctx.fillStyle = '#fff';
    this.ctx.clearRect(0, 0, this.width, this.canvas.height);
    const deg = Math.PI - Math.PI / 180 * this.hue;
    const r = this.canvas.width * 0.45;
    const xm = this.canvas.width / 2;
    const ym = this.canvas.height / 2;
    const pt_hue = {
      x: Math.sin(deg) * r,
      y: Math.cos(deg) * r,
      c: this.hueColor
    };
    const pt_black = {
      x: Math.sin(deg + Math.PI * 2 / 3) * r,
      y: Math.cos(deg + Math.PI * 2 / 3) * r,
      c: new ColorData([0, 0, 0])
    };
    const pt_white = {
      x: Math.sin(deg - Math.PI * 2 / 3) * r,
      y: Math.cos(deg - Math.PI * 2 / 3) * r,
      c: new ColorData([255, 255, 255])
    };
    const step_x = 0.01;
    const step_y = 0.01;
    for (let s = 1; s >= 0; s -= step_y) {
      const s1 = 1 - s;
      const pt_black_curr = {
        x: pt_hue.x + (pt_black.x - pt_hue.x) * s1,
        y: pt_hue.y + (pt_black.y - pt_hue.y) * s1
      };
      const pt_white_curr = {
        x: pt_hue.x + (pt_white.x - pt_hue.x) * s1,
        y: pt_hue.y + (pt_white.y - pt_hue.y) * s1
      };
      const pt_mid = {
        x: (pt_black_curr.x + pt_white_curr.x) / 2,
        y: (pt_black_curr.y + pt_white_curr.y) / 2,
        c: new ColorData([128, 128, 128])
      };
      for (let l = 0; l < 0.5; l += step_x) {
        const l1 = 0.5 - l;
        let x = pt_mid.x + (pt_black.x - pt_mid.x) * (l * 2);
        let y = pt_mid.y + (pt_black.y - pt_mid.y) * (l * 2);
        let c = new ColorData(ColorUtils.hsl2rgb([this.hue, (l1 + 0.5) * 100 * s, l1 * 100]));
        this.paintxy(xm + x, ym + y, c.display);
        if (l > 0) {
          x = pt_mid.x + (pt_white.x - pt_mid.x) * (l * 2);
          y = pt_mid.y + (pt_white.y - pt_mid.y) * (l * 2);
          c = new ColorData(ColorUtils.hsl2rgb([this.hue, (l1 + 0.5) * 100 * s, (l + 0.5) * 100]));
          this.paintxy(xm + x, ym + y, c.display);
        }
      }
    }
  }

  paintxy(x: number, y: number, fill = 'red'): void {
    this.ctx.fillStyle = fill; //ColorUtils.display_rgb(this.getColorAtPos(x, y).value);
    this.ctx.fillRect(x, y, 1, 1);
  }

  mousePos(event: MouseEvent): any {
    return {
      x: event.offsetX,
      y: event.offsetY
    };
  }

  mouseDown(type: string, evt: MouseEvent) {
    const pos = this.mousePos(evt);
    if (type === 'cvs') {
      const x = this.mouseAreaWidth / 2 - pos.x;
      const y = this.mouseAreaHeight / 2 - pos.y;
      const r = Math.sqrt(x * x + y * y);
      if (r > this.width / 2 * 0.8) {
        type = 'hue';
      } else {
        console.log('Nix gibts');
        this.downPos[type] = null;
        return;
      }
      this.downPos[type] = pos;
      this.downType = type;
    }

    this.mouseMove(type, evt);
  }

  getColorAtPos(x: number, y: number): ColorData {
    const s = x / this.width * 100;
    const l = 100 - y / this.height * 100;
    return new ColorData(ColorUtils.hsl2rgb([this.hue, s, l]));
  }

  mouseMove(type: string, evt: MouseEvent) {
    if (type == null) {
      type = this.downType;
    }
    if (this.downPos[type] == null) {
      return;
    }
    const m = this.mousePos(evt);
    const prz = Math.min(m.x / (this.width * 0.99), 1.0);
    switch (type) {
      case 'cvs':
        this.sat = prz * 100;
        this.light = 100 - m.y / this.height * 100;
        this._color.update(this.getColorAtPos(m.x, m.y).value);
        this.colorChange?.next(this.color);
        break;
      case 'hue':
        const pos = this.mousePos(evt);
        const x = this.mouseAreaWidth / 2 - pos.x;
        const y = this.mouseAreaHeight / 2 - pos.y;
        const r = Math.sqrt(x * x + y * y);
        this.hue = Math.asin(y / r) / Math.PI * 180 + 270;
        if (x < 0) {
          this.hue = 360 - this.hue;
        }
        this.hue = Utils.limit(this.hue, 0, 360);
        this._color.update(ColorUtils.hsl2rgb([this.hue, this.sat, this.light]), this.opacity);
        this.colorChange?.next(this.color);
        this.calcHsl();
        break;
      case 'opc':
        this.opacity = prz;
        this._color.update(ColorUtils.hsl2rgb([this.hue, this.sat, this.light]), this.opacity);
        this.colorChange?.next(this.color);
        break;
    }
  }

  mouseUp(type: string, _evt: MouseEvent) {
    if (type == null) {
      type = this.downType;
    }
    console.log('Auf gehts!', type);
    this.downPos[type] = null;
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
