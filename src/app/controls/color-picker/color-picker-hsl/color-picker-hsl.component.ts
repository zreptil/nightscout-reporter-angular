import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {ColorPickerBaseComponent} from '@/controls/color-picker/color-picker-base.component';
import {ColorUtils} from '@/controls/color-picker/color-utils';
import {ColorData} from '@/_model/color-data';

@Component({
  selector: 'app-color-picker-hsl',
  templateUrl: './color-picker-hsl.component.html',
  styleUrls: ['./color-picker-hsl.component.scss']
})
export class ColorPickerHslComponent extends ColorPickerBaseComponent implements AfterViewInit {
  @ViewChild('imageBox')
  canvasBox: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasImage')
  canvasImage: ElementRef<HTMLCanvasElement>;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  colorWheelXY: any = {display: 'none'};
  colorWheelPos = 'tl';
  colorWheelAnim: string;
  downPos: { [key: string]: any } = {};
  hueColor: ColorData;

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

  get styleForHuePointer(): any {
    return {
      left: `${Math.floor(this.hue / 360 * 100)}%`,
      '--c': ColorUtils.fontColor(ColorUtils.hsl2rgb([this.hue, 100, 50]) ?? [255, 255, 255])
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

  get styleForCanvasPointer(): any {
    const x = this.sat / 100;
    const y = 1 - this.light / 100;
    return {
      left: `${Math.floor(x * 100)}%`,
      top: `${Math.floor(y * 100)}%`,
      '--c': ColorUtils.fontColor(this._color?.value ?? [255, 255, 255])
    };
  }

  calcHueColor(): void {
    this.hueColor = new ColorData(ColorUtils.hsl2rgb([this.hue, 100, 50]));
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();
    const box = this.canvasBox.nativeElement;
    this.canvas = this.canvasImage.nativeElement;
    this.canvas.width = box.clientWidth;
    this.canvas.height = box.clientHeight;
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.ctx = this.canvas.getContext('2d');
    this.paintCanvas();
  }

  paintCanvas(): void {
    if (this.ctx == null) {
      return;
    }
    const w = this.width;
    const h = this.height;
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, this.width, this.height);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        this.ctx.fillStyle = ColorUtils.display_rgb(this.getColorAtPos(x, y).value);
        this.ctx.fillRect(x, y, 1, 1);
      }

    }
  }

  mousePos(event: MouseEvent): any {
    return {
      x: event.offsetX,
      y: event.offsetY
    };
  }

  mouseDown(type: string, evt: MouseEvent) {
    this.downPos[type] = this.mousePos(evt);
    this.mouseMove(type, evt);
  }

  getColorAtPos(x: number, y: number): ColorData {
    const s = x / this.width * 100;
    const l = 100 - y / this.height * 100;
    return new ColorData(ColorUtils.hsl2rgb([this.hue, s, l]));
  }

  mouseMove(type: string, evt: MouseEvent) {
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
        this.hue = prz * 360;
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
    this.downPos[type] = null;
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

  clickColorSelect(color: ColorData) {
    (this.data.mixColors as any)[`${this.colorWheelPos}`] = color;
    this.data.onDataChanged?.emit(this.data);
    this.colorWheelAnim = 'close';
    this.paintCanvas();
  }

  clickSelectTrigger(pos: string) {
    this.colorWheelPos = pos;
    switch (pos) {
      case 'tl':
        this.colorWheelXY = {top: 0, left: 0};
        break;
      case 'tr':
        this.colorWheelXY = {top: 0, right: 0};
        break;
      case 'br':
        this.colorWheelXY = {bottom: 0, right: 0};
        break;
      case 'bl':
        this.colorWheelXY = {bottom: 0, left: 0};
        break;
    }
    this.colorWheelAnim = 'open';
  }
}
