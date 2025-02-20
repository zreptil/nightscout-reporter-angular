import {Component, OnInit} from '@angular/core';
import {SessionService} from '@/_services/session.service';
import {MessageService} from '@/_services/message.service';
import {ActivatedRoute, Router} from '@angular/router';
import {DataService} from '@/_services/data.service';
import {GLOBALS} from '@/_model/globals-data';

@Component({
  selector: 'app-execute',
  template: '',
  styleUrls: [],
  standalone: false
})
export class ExecuteComponent implements OnInit {

  constructor(private ss: SessionService,
              private ds: DataService,
              private ms: MessageService,
              private router: Router,
              private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.route.data.subscribe((data: any) => {
      data.params = {};
      const list = location.search.replace(/^\?/g, '').split('&');
      for (const p of list) {
        const parts = p.split('=');
        data.params[parts[0]] = (parts.length > 1) ? parts[1] : true;
      }
      const method = (this as any)[data.cmd];
      if (method != null) {
        method.bind(this)(data);
      }
      this.router.navigate(['/']);
    });
  }

  authorize(data: any): void {
    this.ds.loadFromStorage();
    GLOBALS.apiAuth = Object.keys(data.params)[0];
    this.ds.save();
    // this.ms.info(['Da kam was rein!', data.cmd, Object.keys(data.params)[0]]);
  }
}
