import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {ColorData} from '@/_model/color-data';
import {ColorUtils} from '@/controls/color-picker/color-utils';
import {Log} from '@/_services/log.service';
import {ColorPickerBaseComponent} from '@/controls/color-picker/color-picker-base.component';

@Component({
  selector: 'app-color-picker-image',
  templateUrl: './color-picker-image.component.html',
  styleUrls: ['./color-picker-image.component.scss']
})
export class ColorPickerImageComponent extends ColorPickerBaseComponent implements AfterViewInit {
  @ViewChild('canvasBox')
  canvasBox: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasImage')
  canvasImage: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasLens')
  canvasLens: ElementRef<HTMLCanvasElement>;
  @ViewChild('img')
  img: ElementRef<HTMLImageElement>;
  @ViewChild('imgSelect')
  imgSelect: ElementRef<HTMLInputElement>;
  cw: number;
  ch: number;
  pixels: Uint8ClampedArray;
  // canvas: HTMLCanvasElement;
  // lens: HTMLCanvasElement;
  // ctxLens: CanvasRenderingContext2D;
  wl: number;
  hl: number;
  cr: DOMRect;
  currentRGB: string;
  paintSize = 1;

  constructor() {
    super();
  }

  get canvas(): HTMLCanvasElement {
    return this.canvasImage.nativeElement;
  }

  get lens(): HTMLCanvasElement {
    return this.canvasLens.nativeElement;
  }

  get ctxLens(): CanvasRenderingContext2D {
    return this.canvasLens.nativeElement.getContext('2d');
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    if (this.data.imageDataUrl != null) {
      setTimeout(() => {
        this.init();
      }, 100);
    }
  }

  init(): void {
    const ctx = this.canvas.getContext('2d');
    const box = this.canvasBox.nativeElement;
    this.canvas.width = box.clientWidth;
    this.canvas.height = box.clientHeight;
    const img = this.img.nativeElement;
    this.cw = this.canvas.clientWidth;
    this.ch = Math.floor(this.cw * img.height / img.width);
    if (this.ch > this.canvas.clientHeight) {
      this.ch = this.canvas.clientHeight;
      this.cw = Math.floor(this.ch * img.width / img.height);
    }
    ctx.fillRect(0, 0, this.cw, this.ch);
    this.canvas.width = this.cw;
    this.canvas.height = this.ch;
    ctx.drawImage(img, 0, 0, this.cw, this.ch);
    const imgData = ctx.getImageData(0, 0, this.cw, this.ch);
    this.pixels = imgData.data;
    this.ctxLens.fillStyle = '#ff000000';
    this.ctxLens.fillRect(0, 0, this.lens.clientWidth, this.lens.clientHeight);
    this.wl = this.ctxLens.canvas.width;
    this.hl = this.ctxLens.canvas.height;
    this.cr = this.canvasImage.nativeElement.getBoundingClientRect();
  }

  fileSelected(imageInput: any) {
    if (imageInput?.target?.files?.length > 0) {
      const reader = new FileReader();
      const file = imageInput.target.files[0];
      if (file.size < this.data.maxFilesize) {
        reader.addEventListener('load', (event: any) => {
          this.data.imageDataUrl = event.target.result;
          this.data.onDataChanged?.emit(this.data);
          setTimeout(() => {
            this.init();
          }, 100);
        });
        reader.readAsDataURL(file);
      } else {
        Log.error($localize`Die Datei hat ${file.size} Bytes, darf aber maximal ${this.data.maxFilesize} Bytes haben.`);
        Log.debug(file);
      }
    } else {
      console.error(imageInput);
      Log.error(imageInput);
    }
  }

  mousePos(event: MouseEvent): any {
    return {
      x: event.offsetX,
      y: event.offsetY
    };
  }

  getPixelAt(x: number, y: number): number[] {
    const i = (x + y * this.cw) * 4;
    let R = this.pixels?.[i];
    let G = this.pixels?.[i + 1];
    let B = this.pixels?.[i + 2];
    if (this.pixels?.[i + 3] === 0) {
      R = 255;
      G = 255;
      B = 255;
    }
    return [R, G, B];
  }

  clickCanvas(_event: MouseEvent) {
//    const m = this.mousePos(event);
//    this.colorSaveClick?.emit(new ColorData(this.getPixelAt(m.x, m.y)));
  }

  wheelLens(event: WheelEvent) {
    this.paintSize += Math.sign(event.deltaY);
    this.paintSize = Math.max(Math.min(this.paintSize, 12), 1);
    this.paintLens(event);
  }

  paintLens(event: MouseEvent): void {
    const m = this.mousePos(event);
    const thisRGBRy = this.getPixelAt(m.x, m.y);
    this.currentRGB = ColorUtils.display_rgb(thisRGBRy);
    this.colorChange?.emit(new ColorData(thisRGBRy));
    this.lens.style.borderColor = this.currentRGB;

    if (this.paintSize > 1) {
      const xl = Math.round(event.clientX - this.wl / 2);
      const yl = Math.round(event.clientY - this.hl / 2);
      this.lens.style.left = xl + 'px';
      this.lens.style.top = yl + 'px';
      const xs = Math.floor((this.wl - 1) / this.paintSize);
      const ys = Math.floor((this.hl - 1) / this.paintSize);
      const x2 = Math.floor(xs / 2);
      const y2 = Math.floor(ys / 2);
      this.ctxLens.fillStyle = '#000';
      this.ctxLens.fillRect(0, 0, (xs + 1) * this.paintSize, (ys + 1) * this.paintSize);
      for (let y = 0; y <= ys; y++) {
        const ySrc = m.y - y2 + y;
        if (ySrc < 0 || ySrc >= this.ch) {
          this.ctxLens.fillStyle = '#fff';
          this.ctxLens.fillRect(0, y * this.paintSize, xs * this.paintSize, this.paintSize);
        } else {
          for (let x = 0; x <= xs; x++) {
            const xSrc = m.x - x2 + x;
            let rgb;
            if (xSrc < 0 || xSrc >= this.cw) {
              rgb = [255, 255, 255];
            } else {
              rgb = this.getPixelAt(Math.floor(xSrc), Math.floor(ySrc));
            }
            this.ctxLens.fillStyle = ColorUtils.display_rgb(rgb);
            this.ctxLens.fillRect(x * this.paintSize, y * this.paintSize, this.paintSize, this.paintSize);
          }
        }
      }
      this.lens.style.display = 'block';
    } else {
      this.lens.style.display = 'none';
    }
  }

  canvasMouseOut(_: MouseEvent) {
    if (this.lens != null) {
      this.lens.style.display = 'none';
    }
  }

  canvasMouseEnter(event: MouseEvent) {
    if (this.lens != null) {
      this.lens.style.display = 'block';
      this.paintLens(event);
    }
  }

  // Called when the parentcomponent fires an event
  // with File as parameter
  parentFiredFile() {
    this.imgSelect.nativeElement.click();
  }
}
