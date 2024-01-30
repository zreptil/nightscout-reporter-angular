export enum DialogResultButton {
  ok,
  cancel,
  yes,
  no,
  abort
}

export enum DialogType {
  confirm,
  confirmNo,
  info,
  debug,
  error,
  warning
}

export class DialogParams {
  theme: string;
  icon: string;
  image: string;
  beforeClose: () => void;
  noClose: boolean;

  constructor(init?: { theme?: string, icon?: string, image?: string, beforeClose?: () => void, noClose?: boolean }) {
    init ??= {};
    init.theme ??= '';
    init.noClose ??= false;
    for (const key of Object.keys(init)) {
      (this as any)[key] = (init as any)[key];
    }
  }
}

export class DialogResult {
  btn: DialogResultButton | any;
  data?: any;
}

export interface IDialogButton {
  title: string;
  result?: DialogResult;
  url?: string;
  icon?: string;
  focus?: boolean;
}

export class HelpListItem {
  constructor(public type: string, public text: string, public data?: any, public cls?: string) {
  }
}

export interface IDialogControl {
  id: string;
  type: 'input' | 'textarea' | 'helplist' | 'checkbox';
  title: string;
  hint?: string,
  value?: any;
  helpList?: HelpListItem[];
}

export interface IDialogChip {
  title: string;
  selected: boolean;
}

export interface IDialogDef {
  type: DialogType;
  title: string;
  buttons: IDialogButton[];
  chips?: IDialogChip[];
  controls?: IDialogControl[];
}

export class DialogData {
  result: DialogResult;
  title: string | string[];
  buttons: IDialogButton[];
  controls: IDialogControl[];
  chips: IDialogChip[];
  private defs = new Map<DialogType, IDialogDef>([
    [DialogType.info, {
      type: DialogType.info,
      title: $localize`Information`,
      buttons: [
        {title: $localize`Ok`, result: {btn: DialogResultButton.ok}}
      ]
    }
    ],
    [DialogType.warning, {
      type: DialogType.warning,
      title: $localize`Warnung`,
      buttons: [
        {title: $localize`Nein`, result: {btn: DialogResultButton.no}, icon: 'close'},
        {title: $localize`Ja`, result: {btn: DialogResultButton.yes}, focus: true, icon: 'done'}
      ]
    }
    ],
    [DialogType.error, {
      type: DialogType.error,
      title: $localize`Fehler`,
      buttons: [
        {title: $localize`Ok`, result: {btn: DialogResultButton.ok}, icon: 'done'}
      ]
    }
    ],
    [DialogType.debug, {
      type: DialogType.debug,
      title: $localize`Debug Meldung`,
      buttons: [
        {title: $localize`Ok`, result: {btn: DialogResultButton.ok}, icon: 'done'}
      ]
    }
    ],
    [DialogType.confirm, {
      type: DialogType.confirm,
      title: $localize`Bestätigung`,
      buttons: [
        {title: $localize`Nein`, result: {btn: DialogResultButton.no}, icon: 'close'},
        {title: $localize`Ja`, result: {btn: DialogResultButton.yes}, focus: true, icon: 'done'}
      ]
    }
    ],
    [DialogType.confirmNo, {
      type: DialogType.confirmNo,
      title: $localize`Bestätigung`,
      buttons: [
        {title: $localize`Nein`, result: {btn: DialogResultButton.no}, focus: true, icon: 'close'},
        {title: $localize`Ja`, result: {btn: DialogResultButton.yes}, icon: 'done'}
      ]
    }
    ]
  ]);

  constructor(public type: DialogType | IDialogDef,
              public content: string | string[],
              public params: DialogParams,
              public ownButtons?: IDialogButton[]) {
    if (typeof type === 'number') {
      this.buttons = this.defs.get(type).buttons;
      this.chips = this.defs.get(type).chips;
      this.controls = this.defs.get(type).controls;
      this.title = this.defs.get(type).title;
      this.type = this.defs.get(type).type;
    } else {
      this.buttons = type.buttons;
      this.chips = type.chips;
      this.controls = type.controls;
      this.title = type.title;
      this.type = type.type;
    }
  }

  get display(): string[] {
    if (Array.isArray(this.content)) {
      if (this.content.length > 0) {
        if (typeof this.content[0] === 'string') {
          return (this.content as string[]).map(text => {
            text = text.replace(/@([^@]*)@/g, `<span class='mark'>$1</span>`);
            return text;
          });
        }
      }
      return [];
    }
    return [typeof this.content === 'string' ? this.content : null];
  }

  update(content: string | string[]): void {
    this.content = content;
  }
}
