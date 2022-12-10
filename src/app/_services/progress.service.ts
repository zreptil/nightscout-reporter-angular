import {Injectable} from '@angular/core';
import {Utils} from '@/classes/utils';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  max: number;
  isStopped = false;
  info: string;
  mayCancel = true;
  public initializer: Observable<any>;
  private initializerSubject: BehaviorSubject<any>;
  constructor() {
    this.initializerSubject = new BehaviorSubject<any>(null);
    this.initializer = this.initializerSubject.asObservable();
  }
  _value: number;
  get value(): number {
    return this._value;
  }
  set value(value: number) {
    this._value = value;
  }
  _text: string;
  get text(): string {
    return this._text;
  }
  set text(value: string) {
    this._text = value;
    this.isStopped = value == null;
  }

  get isActive(): boolean {
    return !Utils.isEmpty(this.text);
  }

  cancel(): void {
    this.isStopped = true;
    this.text = null;
    this.info = null;
  }

  next(): boolean {
    this.value++;
    return !this.isStopped;
  }

  init(data?: any, mayCancel = true): void {
    this.info = null;
    this.mayCancel = mayCancel;
    this.isStopped = false;
    this.initializerSubject.next(data);
  }

  clear(): void {
    this.max = 0;
    this._value = 0;
    this.text = null;
    this.info = null;
    this.isStopped = true;
  }
}
