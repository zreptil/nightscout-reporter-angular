import {EntryData} from '@/_model/nightscout/entry-data';
import {Utils} from '@/classes/utils';

export class StatisticData {
  values: number[] = [];
  entries: EntryData[] = [];
  sum = 0.0;
  varianz = 0.0;
  median: number;

  constructor(public min: number, public max: number) {

  }

  get mid(): number {
    return Utils.isEmpty(this.values) ? 0 : this.sum / this.values.length;
  }

  get stdAbw(): number {
    return Math.sqrt(this.varianz);
  }

  add(entry: EntryData, value: number): void {
    this.values.push(value);
    this.entries.push(entry);
    this.sum += value;
  }
}
