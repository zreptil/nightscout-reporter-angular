import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {DataService} from '@/_services/data.service';
import {SessionService} from '@/_services/session.service';
import {Log} from '@/_services/log.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {

  constructor(public ds: DataService,
              public ss: SessionService) {
  }

  get g(): GlobalsData {
    return GLOBALS;
  }

  get mayDebug(): boolean {
    return Log.mayDebug;
  }

  ngOnInit(): void {
  }

  /*
    @Output('closeClicked')
    Stream<UIEvent> get trigger => _trigger.stream;
    final _trigger = StreamController<UIEvent>.broadcast(sync: true);

    WelcomeComponent();

    void fire(String key) {
      _trigger.add(UIEvent(key, detail: 0));
    }

    void clickDebug() {
      g.isDebug = !g.isDebug;
      g.msg.dismiss(g.msg.clear);
    }

    void signinEvent(SigninEvent e) {
      switch (e.status) {
        case SigninStatus.signinOk:
          g.loadSettings();
          fire('@normal');
          break;
        default:
          break;
      }
    }
  */
  clickDebug() {
    this.g.isDebug = !this.g.isDebug;
  }
}
