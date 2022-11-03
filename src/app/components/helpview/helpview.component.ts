import {Component, Inject, OnInit} from '@angular/core';
import {FormConfig} from '@/forms/form-config';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-helpview',
  templateUrl: './helpview.component.html',
  styleUrls: ['./helpview.component.scss']
})
export class HelpviewComponent implements OnInit {

  tileHelp: FormConfig[];

  constructor(@Inject(MAT_DIALOG_DATA) cfg: FormConfig) {
    this.tileHelp = [cfg];
  }

  ngOnInit(): void {
  }

  onBackClick() {
    this.tileHelp.splice(this.tileHelp.length - 1, 1);
  }

  /*
    @Output('buttonClicked')
    Stream<UIEvent> get trigger => _trigger.stream;
    final _trigger = StreamController<UIEvent>.broadcast(sync: true);

    isVisible = true;

    void fire(String type, [int detail = 0]) async {
      switch (type) {
        case 'closeAll':
          this.tileHelp = [];
          break;
        case 'close':
          tileHelp.removeLast();
          break;
        case 'btn':
          if (detail >= 0 && detail < tileHelp.last.form.helpStrings.length) {
            tileHelp.add(tileHelp.last.form.helpStrings[detail].cfg);
          }
          break;
      }
      _trigger.add(UIEvent(type, detail: detail));
    }
  */
  onLinkClick(idx: number) {
    this.tileHelp.push(this.tileHelp[this.tileHelp.length - 1].form.helpStrings[idx].cfg);
  }
}
