import {BasePrint} from '@/forms/base-print';
import {PageData} from '@/_model/page-data';
import {ParamInfo} from '@/_model/param-info';
import {PdfService} from '@/_services/pdf.service';
import {GLOBALS} from '@/_model/globals-data';
import {JsonData} from '@/_model/json-data';
import {Utils} from '@/classes/utils';

export class PrintTest extends BasePrint {
  override help = $localize`:help for test@@help-test:`;
  override baseId = 'test';
  override baseIdx = '00';
  isFormParam1: boolean;
  override params = [
    new ParamInfo(0, 'Einträge', {boolValue: false}),
    new ParamInfo(1, 'Behandlungen', {boolValue: false}),
    new ParamInfo(2, 'Rohdaten Status', {boolValue: true, thumbValue: false}),
    new ParamInfo(3, 'Rohdaten Einträge', {boolValue: false}),
    new ParamInfo(4, 'Rohdaten Behandlungen', {boolValue: false, thumbValue: true}),
    new ParamInfo(5, 'Rohdaten Profile', {boolValue: false}),
    new ParamInfo(7, 'Rohdaten Spalten', {intValue: 2, min: 1, max: 3}),
    new ParamInfo(6, 'Tagesprofil', {boolValue: false}),
  ];

  showEntries = false;
  showTreatments = true;
  showRawStatus = false;
  showRawEntries = false;
  showRawTreatments = false;
  showRawProfiles = false;
  showDayProfile = false;
  rawCols = 3;
  _isFirst = true;
  _body: any[] = null;
  _root: any[] = null;
  _lastRootTitle: string = null;
  _lastRootType: string = null;
  _rawLineCount = 0;
  _rawCurrLines = 0;
  _page: PageData = null;

  constructor(ps: PdfService, suffix: string = null) {
    super(ps);
    this.init(suffix);
  }

  static get msgParam1(): string {
    return $localize`Parameter für PrintTest`;
  }

  override get title(): string {
    return $localize`Datensätze`;
  }

  override get isDebugOnly(): boolean {
    return true;
  }

  override get estimatePageCount(): any {
    return {count: 0, isEstimated: true};
  }

  createRoot(type: string, title: string = null): any {
    const color = '#eee';
    if (type == null) {
      type = this._lastRootType;
    }
    this._lastRootType = type;
    if (title == null) {
      title = this._lastRootTitle;
    }
    this._lastRootTitle = title;

    switch (type) {
      case 'entries':
        this._body.push([
          {text: 'Uhrzeit', fillColor: color},
          {text: 'Art', fillColor: color},
          {text: 'sgv', fillColor: color},
          {text: 'gluc', fillColor: color},
        ]);
        break;
      case 'treatments':
        this._body.push([
          {text: 'Uhrzeit', fillColor: color},
          {text: 'Art', fillColor: color},
          {text: 'Anpassung', fillColor: color},
          {text: 'Dauer', fillColor: color},
          {text: 'KH', fillColor: color},
          {text: 'IE', fillColor: color},
        ]);
        break;
      case 'profiles':
        this._body.push([
          {text: title, fillColor: color}
        ]);
        break;
      case 'raw':
        this._rawLineCount += 6;
        this._body.push([
          {text: title, fontSize: this.fs(12), colSpan: this.rawCols}
        ]);
        for (let i = 0; i < this.rawCols - 1; i++) {
          this._body[0].push({text: ''});
        }
        this._body.push([]);
        break;
    }

    const widths: number[] = [];
    for (let i = 0; i < this._body[0].length; i++) {
      widths.push(this.cm((this.width - 4.0) / this._body[0].length));
    }
    const ret = {
      margin: [this.cm(2.0), this.cm(this._isFirst ? this.yorg : 0.5), this.cm(2.0), this.cm(0.5)],
      layout: type === 'raw' ? '' : 'noBorders',
      table: {headerRows: 1, widths: widths, body: this._body}
    };
    this._isFirst = false;
    return ret;
  }

  override fillPages(pages: PageData[]): void {
    this._rawLineCount = 0;
    this._rawCurrLines = 0;
    this._pages = pages;
    this._page = new PageData(this.isPortrait, [this.headerFooter({skipFooter: true})]);
    this._body = [];
    this._isFirst = true;
    const oldLength = pages.length;
    if (this.showEntries) {
      this._root = this.createRoot('entries');
      for (let i = 0; i < this.repData.ns.entries.length; i++) {
        const entry = this.repData.ns.entries[i];
        const row = [
          {text: this.fmtDateTime(entry.time, {def: '??.??.???? ??:?? Uhr'}), colSpan: 4},
          {text: entry.type},
          {text: GLOBALS.fmtNumber(entry.sgv)},
          {text: GLOBALS.fmtNumber(entry.gluc)},
        ];
        //      if(entry.direction != null && entry.direction.toLowerCase() == 'none')
        //       {
        //         for(any c in row)
        //           c['color'] = '#f00';
        //       }

        this._body.push(row);
        if (this._body.length > 35) {
          this.addPage();
        }
      }
      if (this._body.length > 0) {
        this.addPage();
      }
      //      _page.add(root);
    }

    if (this.showTreatments) {
      this._body = [];
      this._root = this.createRoot('treatments');
      const data = this.repData.ns.treatments;
      let lines = this._body.length;
      for (let i = 0; i < data.length; i++) {
        const entry = data[i];
        lines += 2;
        const row: any[] = [
          {text: this.fmtDateTime(entry.createdAt, {def: '??.??.???? ??:?? Uhr'})}
        ];
        row.push({text: entry.eventType});
        row.push({text: `${GLOBALS.fmtNumber(entry.adjustedValue(1), 0, 0, '')}`, alignment: 'right'});
        row.push({text: entry.duration > 0 ? GLOBALS.fmtNumber(entry.duration, 0, 0, ' ') : ' ', alignment: 'right'});
        const carbs = entry.isECarb ? entry.eCarbs : entry.carbs;
        let text = carbs > 0.0 ? GLOBALS.fmtNumber(carbs, 0, 0, ' ') : ' ';
        if (entry.isECarb) {
          text = `e${text}`;
        }
        row.push({text: text, alignment: 'right'});
        text = entry.insulin > 0.0 ? GLOBALS.fmtNumber(entry.insulin, 1, 0, ' ') : ' ';
        row.push({text: text, alignment: 'right'});
        switch (entry.eventType.toLowerCase()) {
          case 'temp basal':
            row[1].color = '#f00';
            break;
          case 'announcement':
          case 'note':
            row[1].text = `${row[1].text}\n${entry.notes}`;
            lines += entry.notes != null ? (entry.notes.split('\n').length - 1) : 0;
            break;
        }
        this._body.push(row);
        if (lines > 35) {
          this.addPage();
          lines = 0;
        }
      }
      if (this._body.length > 0) {
        this.addPage();
      }
      //      _page.add(root);
    }

    if (this.showRawStatus) {
      this._body = [];
      this._root = this.createRoot('raw', 'Status');
      this.addRawData(this.repData.status.raw);
      this.finalizeRawData();
    }
    if (this.showRawEntries) {
      this._body = [];
      this._root = this.createRoot('raw', 'Entries (sgv)');
      for (const entry of this.repData.ns.entries) {
        this.addRawData(entry.raw, this.fmtDateTime(JsonData.toLocal(entry.time)));
      }
      this.finalizeRawData();
      this._body = [];
      this._root = this.createRoot('raw', 'Entries (mbg)');
      for (const entry of this.repData.ns.bloody) {
        this.addRawData(entry.raw, this.fmtDateTime(JsonData.toLocal(entry.time)));
      }
      this.finalizeRawData();
      this._body = [];
      this._root = this.createRoot('raw', 'Entries (remaining)');
      for (const entry of this.repData.ns.remaining) {
        this.addRawData(entry.raw, this.fmtDateTime(JsonData.toLocal(entry.time)));
      }
      this.finalizeRawData();
    }
    if (this.showRawTreatments) {
      this._body = [];
      this._root = this.createRoot('raw', 'Treatments');
      for (const entry of this.repData.ns.treatments) {
        this.addRawData(entry.raw, this.fmtDateTime(JsonData.toLocal(entry.createdAt), {withSeconds: true}));
      }
      this.finalizeRawData();
    }
    if (this.showRawProfiles) {
      this._body = [];
      this._root = this.createRoot('raw', 'Profiles');
      for (const entry of this.repData.profiles) {
        this.addRawData(entry.raw, this.fmtDateTime(JsonData.toLocal(entry.createdAt)));
      }
      this.finalizeRawData();
    }
    if (this.showDayProfile) {
      for (const day of this.repData.data.days) {
        this._body = [];
        this._root = this.createRoot('profiles', 'Tagesprofil für ${fmtDate(day.date)}');
        let text = '';
        for (const entry of day.profile) {
          text = `${text}${this.fmtTime(entry.time(day.date), {withSeconds: true})} ${GLOBALS.fmtNumber(entry.tempAdjusted * 100, 0, 3, 'null', false, true)} / ${entry.duration} min\n`;
        }
        const row = [
          {text: text, fontSize: this.fs(8)}
        ];
        this._body.push(row);
        this._page.content.push(this._root);
      }
    }

    this._pages.push(this._page);
    if (this.repData.isForThumbs && pages.length - oldLength > 1) {
      pages.splice(oldLength + 1, pages.length);
    }
  }

  addRawData(raw: any, title: string = null): void {
    let text = JSON.stringify(raw);
    text = text.substring(1, text.length - 1);
    text = text.replace(/,'/g, ',\n\'');
    text = text.replace(/},/g, '},\n');
    if (title != null) {
      text = `${title}\n${text}`;
    }
    const parts = text.split('\n');
    this._rawCurrLines = Math.max(this._rawCurrLines, parts.length + 1);
    for (const part of parts) {
      this._rawCurrLines += Math.floor(part.length / (400 / this.rawCols));
    }
    Utils.last(this._body).push({text: text, fontSize: this.fs(8)});
    if (Utils.last(this._body).length >= this.rawCols) {
      this._rawLineCount += this._rawCurrLines;
      if (this._rawLineCount > 66) {
        while (this._rawLineCount > 66) {
          const maxLines = 66 - (this._rawLineCount - this._rawCurrLines);
          const newRow: any[] = [];
          let lineCount = 0;
          for (const cell of Utils.last(this._body)) {
            newRow.push({text: '', fontSize: this.fs(8)});
            const lines: string[] = cell['text'].split('\n');
            let oldText: string[] = [];
            const newText: string[] = [];
            if (lines.length > maxLines && maxLines > 0) {
              for (let i = 0; i < maxLines; i++) {
                oldText.push(lines[i]);
              }
              for (let i = maxLines; i < lines.length; i++) {
                newText.push(lines[i]);
              }
            } else {
              oldText = lines;
            }
            cell.text = oldText.join('\n');
            Utils.last(newRow).text = newText.join('\n');
            lineCount = Math.max(lineCount, newText.length + 1);
          }
          this.addPage();
          this._body[this._body.length - 1] = newRow;
          this._rawLineCount += lineCount;
          this._rawCurrLines = lineCount;
        }
        this._body.push([]);
      } else {
        this._body.push([]);
      }
    }

// if (body.length > 7)
// {
//   finalizeRawData(pages);
//   pages.add(page);
//   ret = [headerFooter(skipFooter: true)];
//   body = [];
//   root = createRoot('raw');
// }
  }

  addPage() {
    this._rawLineCount = 0;
    this._rawCurrLines = 0;
    this._page.content.push(this._root);
    this._pages.push(this._page);
    this._isFirst = true;
    this._page = new PageData(this.isPortrait, [this.headerFooter({skipFooter: true})]);
    this._body = [];
    this._root = this.createRoot(null);
  }

  finalizeRawData() {
    //    if (body.last.length < rawCols)body.last.last['colSpan'] = rawCols - body.last.length + 1;
    while (Utils.last(this._body).length < this.rawCols) {
      Utils.last(this._body).push({text: ''});
    }
    this._page.content.push(this._root);
    //    pages.add(body);
  }

  override extractParams(): void {
    this.showEntries = this.params[0].boolValue;
    this.showTreatments = this.params[1].boolValue;
    this.showRawStatus = this.params[2].boolValue;
    this.showRawEntries = this.params[3].boolValue;
    this.showRawTreatments = this.params[4].boolValue;
    this.showRawProfiles = this.params[5].boolValue;
    this.rawCols = this.params[6].intValue;
    this.showDayProfile = this.params[7].boolValue;
  }
}
