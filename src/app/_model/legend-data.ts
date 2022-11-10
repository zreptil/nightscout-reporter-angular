import {Utils} from '@/classes/utils';

export class LegendData {
  columns: any[] = [];

  constructor(public x: number, public y: number, public colWidth: number, public maxLines: number) {
  }

  get asOutput(): any {
    return this.columns.length > 0 ? {stack: this.columns} : null;
  }

  current(forceNew: boolean): any[] {
    if (Utils.isEmpty(this.columns) || Utils.last(this.columns).stack.length >= this.maxLines || forceNew) {
      this.x += !Utils.isEmpty(this.columns) ? this.colWidth : 0.0;
      this.columns.push({
        relativePosition: {x: this.x, y: this.y},
        stack: []
      });
    }
    return Utils.last(this.columns).stack;
  }
}

