import {Observable} from 'rxjs';

export class CloseButtonData {
  closeAction?: () => Observable<boolean>;
  dialogClose?: any = 'ok';
  colorKey?: string;
  showClose?: boolean = true;
}
