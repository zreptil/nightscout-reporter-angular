import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {DataService} from '@/_services/data.service';
import {SessionService} from '@/_services/session.service';
import {DropboxService} from '@/_services/sync/dropbox.service';
import {CloseButtonData} from '@/controls/close-button/close-button-data';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  standalone: false
})
export class WelcomeComponent implements OnInit {

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
  closeData: CloseButtonData = {
    colorKey: 'whatsnew'
  };

  constructor(public ds: DataService,
              public ss: SessionService,
              public dbs: DropboxService) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  ngOnInit(): void {
  }

  clickDebug() {
    this.globals.isDebug = !this.globals.isDebug;
  }

  doSync() {
    this.dbs.connect();
  }

  showSettings() {
    this.ss.showSettings(() => {
      if (GLOBALS.isConfigured) {
        this.ss.closeAllPopups();
        this.ds.confirmGoogleTag();
        this.ss.checkPrint();
      }
    }, {cmd: 'createUser'});
  }
}
