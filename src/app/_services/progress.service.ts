import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {

  progressMax: number;
  progressValue: number;
  progressText: string;

  constructor() {
  }

  clear(): void {
    this.progressValue = 0;
    this.progressMax = 0;
    this.progressText = null;
  }
}
