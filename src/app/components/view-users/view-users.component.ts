import {Component, HostListener} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {SessionService} from '@/_services/session.service';
import {DataService} from '@/_services/data.service';
import {UserData} from '@/_model/nightscout/user-data';
import {Utils} from '@/classes/utils';

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
      return user.name?.toLowerCase()?.includes(this.filter.toLowerCase())
        || user.listApiUrl?.some(u => u.url?.toLowerCase()?.includes(this.filter.toLowerCase()));
    });
  }

  tileClicked(evt: MouseEvent, idx: number) {
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
    if (GLOBALS.userList[idx]?.isPinned) {
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
    GLOBALS.togglePin(user);
    this.ds.save();
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if ((event.target as any)?.tagName?.toLowerCase() !== 'body') {
      return;
    }
    const chars = '.-abcdefghijklmnopqrstuvwxyzäöüßABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ0123456789 ';
    if (chars.indexOf(event.key) >= 0) {
      this.filter += event.key;
    } else if (event.key === 'Backspace') {
      if (this.filter.length > 0) {
        this.filter = this.filter.substring(0, this.filter.length - 1);
      }
    } else if (event.key === 'ArrowRight') {
      this.activateUser(1);
    } else if (event.key === 'ArrowLeft') {
      this.activateUser(-1);
    } else if (event.key === 'ArrowDown') {
      this.activateUser(4);
    } else if (event.key === 'ArrowUp') {
      this.activateUser(-4);
    } else if (event.key === 'Enter') {
      GLOBALS.viewType = 'tile';
      this.ds.save();
    }
  }

  activateUser(count: number): void {
    const diff = Math.sign(count);
    count = Math.abs(count);
    while (count > 0) {
      let idx = GLOBALS.userIdx + diff;
      const list = this.userList;
      let done = false;
      while (list.length > 0 && !done && idx !== GLOBALS.userIdx) {
        const found = list.find(u => u.userIdx === idx);
        if (found == null) {
          idx += diff;
          if (idx > GLOBALS.userList.length - 1) {
            idx = 0;
          } else if (idx < 0) {
            idx = GLOBALS.userList.length - 1;
          }
        } else {
          GLOBALS.userIdx = idx;
          done = true;
        }
      }
      count--;
    }
    document.getElementById(`tile-${GLOBALS.userIdx}`).scrollIntoView({
      behavior: 'instant',
      block: 'center',
      inline: 'nearest'
    });
  }

  userInfo(user: UserData) {
    switch (GLOBALS.userInfo) {
      case 1:
        return Utils.isEmpty(user.birthDate) ? $localize`Geburtstag unbekannt` : user.birthDate;
      case 2:
        return Utils.isEmpty(user.insulin) ? $localize`Insulin unbekannt` : user.insulin;
      default:
        GLOBALS.userInfo = 0;
        return user.apiUrl(null, '', {noApi: true, noToken: true});
    }
  }

  clickUserInfo(evt: MouseEvent, idx: number) {
    if (idx === GLOBALS.user.userIdx) {
      evt.stopPropagation();
      GLOBALS.userInfo++;
      this.ds.save();
    }
  }
}
