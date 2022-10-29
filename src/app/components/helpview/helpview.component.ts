import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-helpview',
  templateUrl: './helpview.component.html',
  styleUrls: ['./helpview.component.scss']
})
export class HelpviewComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }

  /*
    @Input()
     tileHelp: FormConfig[];

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
}
