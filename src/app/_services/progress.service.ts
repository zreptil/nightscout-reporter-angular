import {Injectable} from '@angular/core';
import {Utils} from '@/classes/utils';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {

  progressMax: number;

  constructor() {
  }

  _progressValue: number;

  get progressValue(): number {
    return this._progressValue;
  }

  set progressValue(value: number) {
    this._progressValue = value;
  }

  _progressText: string;

  get progressText(): string {
    return this._progressText;
  }

  set progressText(value: string) {
    this._progressText = value;
  }

  get isActive(): boolean {
    return !Utils.isEmpty(this.progressText);
  }

  clear(): void {
    this.progressMax = 0;
    this._progressValue = 0;
    this.progressText = null;
  }
}
