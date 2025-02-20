import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {SessionService} from '@/_services/session.service';
import {DataService} from '@/_services/data.service';
import {NightscoutService} from '@/_services/nightscout.service';
import {FormConfig} from '@/forms/form-config';

@Component({
  selector: 'app-view-list',
  templateUrl: './view-list.component.html',
  styleUrls: ['./view-list.component.scss'],
  standalone: false
})
export class ViewListComponent implements OnInit {
  constructor(public ss: SessionService,
              public ds: DataService,
              public ns: NightscoutService) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  ngOnInit(): void {
  }

  expansionPanelClicked(evt: MouseEvent, cfg: FormConfig) {
    if (!cfg.opened) {
//   if (evt.currentTarget.attributes['dontclick'] == 'true') {
//   evt.currentTarget.removeAttribute('dontclick');
//   return;
// }
      cfg.checked = !cfg.checked;
    }
  }

  clickTileHelp(evt: MouseEvent, cfg: FormConfig) {
    this.ss.showPopup('helpview', cfg)
    evt.stopPropagation();
  }
}
