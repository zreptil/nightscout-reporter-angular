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
}
