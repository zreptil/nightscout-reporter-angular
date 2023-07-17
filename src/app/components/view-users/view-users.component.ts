import {Component} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {SessionService} from '@/_services/session.service';
import {DataService} from '@/_services/data.service';
import {UserData} from '@/_model/nightscout/user-data';

@Component({
  selector: 'app-view-users',
  templateUrl: './view-users.component.html',
  styleUrls: ['./view-users.component.scss']
})
export class ViewUsersComponent {

  constructor(public ss: SessionService,
              public ds: DataService) {

  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  tileClicked($event: MouseEvent, idx: number) {
    if (idx === GLOBALS.userIdx) {
      GLOBALS.viewType = 'tile';
      this.ds.save();
    } else {
      this.ss.activateUser(idx)
    }
  }

  tileClass(idx: number) {
    const ret = ['tile'];
    if (idx === GLOBALS.userIdx) {
      ret.push('tilechecked');
    }
    if (GLOBALS.userList[idx].isPinned) {
      ret.push('pinned');
    }
    return ret;
  }

  clickDelete(evt: MouseEvent) {
    evt.stopPropagation();
    this.ss.deleteUser();
  }

  clickSettings(evt: MouseEvent) {
    evt.stopPropagation();
    this.ss.showSettings();
  }

  clickPin(evt: MouseEvent, user: UserData) {
    evt.stopPropagation();
    user.isPinned = !user.isPinned;
    GLOBALS.sortUserList();
    this.ds.save();
  }

  iconForPin(user: UserData): string {
    if (user.isPinned) {
      return 'star';
    }
    return 'star_border';
  }

  classForPin(user: UserData): string[] {
    const ret = [];
    if (user.isPinned) {
      ret.push('pinned');
    }
    return ret;
  }
}
