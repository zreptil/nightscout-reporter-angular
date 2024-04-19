import {Component, HostListener} from '@angular/core';
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

  filter = '';

  constructor(public ss: SessionService,
              public ds: DataService) {

  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get userList(): UserData[] {
    return GLOBALS.userList.filter(user => {
      return user.name.toLowerCase().includes(this.filter.toLowerCase())
        || user.listApiUrl.some(u => u.url.toLowerCase().includes(this.filter.toLowerCase()));
    });
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

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    const chars = '.-abcdefghijklmnopqrstuvwxyzäöüßABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ0123456789 ';
    if (chars.indexOf(event.key) >= 0) {
      this.filter += event.key;
    } else if (event.key === 'Backspace') {
      if (this.filter.length > 0) {
        this.filter = this.filter.substring(0, this.filter.length - 1);
      }
    }
  }
}
