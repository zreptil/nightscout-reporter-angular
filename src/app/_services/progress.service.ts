import {Injectable} from '@angular/core';
import {Utils} from '@/classes/utils';
import {BehaviorSubject, Observable} from 'rxjs';
import {MessageService} from '@/_services/message.service';

export class ProgressData {
  max: number;
  value: number;
  text: string;
  info: string;
  timeout: number;
  isStopped = false;
  isPaused = false;

  get isActive(): boolean {
    return !Utils.isEmpty(this.text);
  }

  get percent(): number {
    return this.value / (this.max ?? 1) * 100;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  data = new ProgressData();
  mayCancel = true;
  style: any;
  public initializer: Observable<any>;
  private initializerSubject: BehaviorSubject<any>;

  constructor(public ms: MessageService) {
    this.initializerSubject = new BehaviorSubject<any>(null);
    this.initializer = this.initializerSubject.asObservable();
  }

  get value(): number {
    return this.data.value;
  }

  set value(value: number) {
    this.data.value = value;
  }

  set text(value: string) {
    this.data.text = value;
    if (value == null) {
      setTimeout(() => {
        this.data.value = 0;
      });
    }
  }

  set info(value: string) {
    this.data.info = value;
  }

  get max(): number {
    return this.data.max;
  }

  set max(value: number) {
    this.data.max = value;
  }

  set isPaused(value: boolean) {
    this.initializerSubject.next(this.style);
    this.data.isPaused = value;
  }

  cancel(): void {
    this.data.value = 0;
    this.data.text = null;
    this.data.info = null;
    this.data.isStopped = true;
    this.data.isPaused = true;
  }

  next(): boolean {
    this.data.value++;
    return !this.data.isStopped;
  }

  init(style?: any, mayCancel = true): void {
    this.data.isPaused = false;
    this.data.isStopped = false;
    this.style = style;
    this.mayCancel = mayCancel;
    this.initializerSubject.next(style);
  }

  clear(): void {
    this.data.isPaused = true;
    this.data.isStopped = true;
  }
}
