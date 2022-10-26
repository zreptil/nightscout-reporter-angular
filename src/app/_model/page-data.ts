export class PageData {
  x = 0;
  y = 0;

  constructor(public isPortrait: boolean, public content: any[]) {
  }

  get width(): number {
    return this.isPortrait ? 21.0 : 29.7;
  }

  get height(): number {
    return this.isPortrait ? 29.7 : 21.0;
  }

  get asElement(): any {
    return {
      absolutePosition: {x: this.x, y: this.y},
      stack: this.content
    }
  };

  offset(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

