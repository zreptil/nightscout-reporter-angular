import {Utils} from '@/classes/utils';

export class ColorUtils {
  static rgb2hsl(rgb: number[]): number[] {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h, s;

    if (max == min) {
      h = 0;
      s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    const H = h * 360;
    const S = s * 100;
    const L = l * 100;
    return [H, S, L];
  }

  static rgb2value(rgb: number[]): number {
    return rgb[0] * 65536 + rgb[1] * 256 + rgb[2];
  }

  static rgb2string(rgb: number[]): string {
    return Utils.pad(rgb[0].toString(16)) + Utils.pad(rgb[1].toString(16)) + Utils.pad(rgb[2].toString(16));
  }

  static hsl2rgb(hsl: number[]): number[] {
    // arguments: [H,S,L] or H,S,L
    //return [r, g, b];
    const h = Number(hsl[0]) / 360;
    const s = Number(hsl[1]) / 100;
    const l = Number(hsl[2]) / 100;
    let r, g, b;

    if (s === 0) {
      r = l;
      g = l;
      b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) {
          t += 1;
        }
        if (t > 1) {
          t -= 1;
        }
        if (t < 1 / 6) {
          return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
          return q;
        }
        if (t < 2 / 3) {
          return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  static rgb2hex(rgb: number[]): string[] {
    const r = +rgb[0];
    const g = +rgb[1];
    const b = +rgb[2];
    let hexR = r.toString(16);
    if (hexR.length === 1) {
      hexR = `0${hexR}`;
    }
    let hexG = g.toString(16);
    if (hexG.length === 1) {
      hexG = `0${hexG}`;
    }
    let hexB = b.toString(16);
    if (hexB.length === 1) {
      hexB = `0${hexB}`;
    }
    return [hexR, hexG, hexB];
  }

  static hex2rgb(hexList: string[]): number[] {
    const ret = [];
    for (const hex of hexList) {
      ret.push(parseInt(hex, 16));
    }
    return ret;
  }

  static hsl2hex(hsl: number[]): string[] {
    const ret = ColorUtils.hsl2rgb(hsl);
    return ColorUtils.rgb2hex(ret);
  }

  static hex2hsl(hex: string[]): number[] {
    var ret = ColorUtils.hex2rgb(hex);
    return ColorUtils.rgb2hsl(ret);
  }

  static hex2ry(hex: string): string[] {
    if (hex != null && hex.charAt(0) === '#') {
      hex = hex.substring(1);
    }

    const hexRy = ['ff', 'ff', 'ff'];
    if (hex != null) {
      if (hex.length === 6) {
        hexRy[0] = hex.slice(0, 2);
        hexRy[1] = hex.slice(2, 4);
        hexRy[2] = hex.slice(4, 6);
      } else if (hex.length === 3) {
        const r = hex.slice(0, 1);
        const g = hex.slice(1, 2);
        const b = hex.slice(2, 3);
        hexRy[0] = r + r;
        hexRy[1] = g + g;
        hexRy[2] = b + b;
      }
    }
    return hexRy;
  }

  static rgb2ry(rgb: string): number[] {
    // "rgb(255,100,178)"
    // "255,100,178"
    // ["255", "100", "178"]
    const src = rgb.split(/([()])/)[2].split(',');
    const ret = [];
    for (const v of src) {
      if (+v < 0 || +v > 255) {
        return [255, 255, 255];
      }
      ret.push(+v);
    }
    return ret;
  }

  static hsl2ry(hsl: string): number[] {
    // "hsl(255,100%,50%)"
    // "255,100%,50%"
    // ["255", "100", "178"]
    const hslry = [];
    const ry = hsl.split(/([()])/)[2].split(',');
    for (let i = 0; i < ry.length; i++) {
      const value = +(ry[i].replace('%', ''));
      if (i > 0 && value > 100) {
        return [0, 0, 100];
      }
      hslry.push(value);
    }
    return hslry;
  }

  static validateHex(hex: string): boolean {
    return /(^#?[0-9A-F]{6}$)|(^#?[0-9A-F]{3}$)/i.test(hex);
  }

  static validateRgb(rgb: string): boolean {
    return /^rgb\((\s*\d{1,3}\s*),(\s*\d{1,3}\s*),(\s*\d{1,3}\s*)\)$/.test(rgb);
  }

  static validateHsl(hsl: string): boolean {
    return /^hsl\((\s*\d{1,3}\s*),(\s*\d{1,3}%\s*),(\s*\d{1,3}%\s*)\)$/.test(hsl);
  }

  static display_hex(ry: string[]): string | false {
    var hex = `#${ry[0]}${ry[1]}${ry[2]}`;
    if (ColorUtils.validateHex(hex)) {
      return hex;
    } else {
      return false;
    }
  }

  static display_rgb(ry: number[]): string {
    var rgb = `rgb(${Math.round(ry[0])},${Math.round(ry[1])},${Math.round(ry[2])})`;
    if (ColorUtils.validateRgb(rgb)) {
      return rgb;
    } else {
      return '#000';
    }
  }

  static display_hsl(ry: number[]): string | false {
    var hsl = `hsl(${Math.round(ry[0])},${Math.round(ry[1])}%,${Math.round(ry[2])}%)`;
    if (ColorUtils.validateHsl(hsl)) {
      return hsl;
    } else {
      return false;
    }
  }

  static getRelativeLuminance(rgb: number[]): number {
    rgb = rgb.map(function (c) {
      c /= 255;
      return c < .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
    });
    return (21.26 * rgb[0] + 71.52 * rgb[1] + 7.22 * rgb[2]) / 100
  }

  static colorContrast(c1: number[], c2: number[]): number {
    var l1 = ColorUtils.getRelativeLuminance(c1);
    var l2 = ColorUtils.getRelativeLuminance(c2);
    var ret = (l1 + .05) / (l2 + .05);
    // 0.05 for not dividing with 0
    return ret < 1 ? 1 / ret : ret;
  }

  static getFontColor(rgbRy: number[]): string {
    if (ColorUtils.colorContrast(rgbRy, [255, 255, 255]) > 4.5) {
      return 'white';
    } else {
      return 'black';
    }
  }
}
