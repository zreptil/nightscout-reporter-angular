import {Component, OnInit} from '@angular/core';
import {LinkDef, Log} from '@/_services/log.service';
import {SessionService} from '@/_services/session.service';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss']
})
export class LogComponent implements OnInit {

  constructor(public ss: SessionService,
              public ps: PdfService) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get msg(): { [key: string]: any[] } {
    return Log.msg;
  };

  get links(): LinkDef[] {
    return Log.links;
  }

  typeOf(line: any): string {
    if (typeof line === 'string') {
      return 'string';
    }
    return '';
  }

  onClickDelete(event: Event, type: string): void {
    event.preventDefault();
    Log.clear(type);
  }

  ngOnInit(): void {
  }

  showType(type: string) {
    let ret = this.msg[type].length > 0;
    if (ret && ['debug', 'todo'].includes(type) && !GLOBALS.isDebug) {
      return false;
    }
    return ret;
  }

  openLink(link: LinkDef) {
    switch (link.url) {
      case 'showPdf':
        this.ps.showPdf(link.data);
        return;
      case 'showPlayground':
        // 'http://pdf.zreptil.de/playground.php'
        let doc = JSON.stringify(link.data);
        if (doc != null) {
          doc = doc.replace(/],/g, '],\n');
          doc = doc.replace(/,"/g, ',\n"');
          doc = doc.replace(/:\[/g, ':\n[');
        }
        // doc = btoa(encodeURIComponent(doc).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        //   return String.fromCharCode(parseInt(p1, 16))
        // }));
        doc = btoa(doc);
        const params: any = {
          data: doc,
          filename: ''
        }

        const form = document.createElement('form');
        form.target = '_blank';
        form.method = 'POST';
        form.action = GLOBALS.urlPlayground;
        for (const key of Object.keys(params)) {
          const inp = document.createElement('input');
          inp.type = 'hidden';
          inp.name = key;
          inp.value = params[key];
          form.appendChild(inp);
          document.body.appendChild(form);
        }
        form.submit();
        return;
    }
    window.open(link.url);
  }
}
