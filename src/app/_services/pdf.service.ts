import {Injectable} from '@angular/core';
import {HttpClient, HttpRequest} from '@angular/common/http';
import {PageData} from '@/_model/page-data';
import {Log} from '@/_services/log.service';
import {GLOBALS} from '@/_model/globals-data';
import {ProgressService} from '@/_services/progress.service';
import {ReportData} from '@/_model/report-data';
import {FormConfig} from '@/forms/form-config';
import {Utils} from '@/classes/utils';
import {forkJoin, map, Observable, of} from 'rxjs';
import {NightscoutService} from '@/_services/nightscout.service';
import {DataService} from './data.service';
import {LangData} from '@/_model/nightscout/lang-data';

export class PdfData {
  isPrinted = false;

  constructor(public pdf: any) {
  }
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  pdfMake: any;
  pdfList: PdfData[] = [];
  pdfDoc: any = null;
  images: any;
  thumbLangIdx: number = -1;
  thumbLangSave: LangData = null;

  constructor(public http: HttpClient,
              public ps: ProgressService,
              public ns: NightscoutService,
              public ds: DataService) {
  }

  get msgCreatingPDF(): string {
    return $localize`:text when pdf is being created:Erzeuge PDF...`;
  }

  get msgPreparingPDF(): string {
    return $localize`Lade die Basisdaten...`;
  }

  get msgLoadingDataError(): string {
    return $localize`Fehler beim Laden der Daten`;
  }

  get msgShowPDF(): string {
    return $localize`PDF anzeigen`;
  }

  async createThumbs() {
    if (this.thumbLangSave == null && GLOBALS.language.img !== 'de') {
      this.thumbLangIdx = GLOBALS.languageList.length;
      this.thumbLangSave = GLOBALS.language;
    } else {
      this.thumbLangSave ??= GLOBALS.language;
      this.thumbLangIdx++;
      await this.ds.setLanguage(GLOBALS.languageList[this.thumbLangIdx]);
    }
    this.generatePdf(true);
  }

  msgLoadingData(error: string, stacktrace: string): string {
    return $localize`Fehler beim Laden der Daten:\n${error}\n${stacktrace}`;
  }

  async loadPdfMaker() {
    if (this.pdfMake == null) {
      const pdfMakeModule: any = await import('pdfmake/build/pdfmake');
      const pdfFontsModule: any = await import('pdfmake/build/vfs_fonts');
      this.pdfMake = pdfMakeModule.default;
      this.pdfMake.vfs = pdfFontsModule.default.pdfMake.vfs;
    }
  }

  async generatePdf(isForThumbs = false) {
    this.ds.save({skipReload: isForThumbs});
    this.pdfList = [];
    this.ps.progressMax = 1;
    this.ps.progressValue = 0;
    this.ps.progressText = this.msgPreparingPDF;
    const repData = await this.ns.loadData(isForThumbs);
    console.log('repData', repData);
    GLOBALS.isCreatingPDF = true;
    try {
      this.ps.progressMax = 1;
      this.ps.progressValue = 0;
      this.ps.progressText = this.msgCreatingPDF;
      if (repData.error != null) {
        if (GLOBALS.isDebug) {
          Log.error(this.msgLoadingData(repData.error.toString(), repData.error.stack.toString()));
        } else {
          Log.error(this.msgLoadingDataError);
        }
        GLOBALS.isCreatingPDF = false;
        return;
      }
      this.ps.progressValue = this.ps.progressMax + 1;
      // let docLen = 0;
      // let prevPage: PageData = null;
      let listConfig: FormConfig[] = [];
      if (isForThumbs) {
        for (let cfg of GLOBALS.listConfigOrg) {
          listConfig.push(cfg);
          switch (cfg.id) {
            case 'cgp':
//                              cfg = new FormConfig(PrintCGP(), false);
              cfg.form.params[0].options.thumbValue = 1;
              listConfig.push(cfg);
              break;
            case 'dayanalysis':
//                              cfg = new FormConfig(PrintDailyAnalysis(), false);
              cfg.form.params[2].options.thumbValue = 1;
              listConfig.push(cfg);
              break;
            case 'percentile':
//                              cfg = new FormConfig(PrintPercentile(), false);
              cfg.form.params[0].options.thumbValue = 0;
              cfg.form.params[2].options.thumbValue = true;
              listConfig.push(cfg);
              break;
          }
        }
      } else {
        listConfig = GLOBALS.listConfig;
      }
      const cfgList: Observable<any>[] = [];
      let idx = 0;
      for (const cfg of listConfig) {
        cfgList.push(this.collectPages(cfg, idx++, isForThumbs, repData));
      }
      forkJoin(cfgList).subscribe((dataList: { idx: number, docList: any[] }[]) => {
        // pdfMake.Styles styles = pdfMake.Styles();
        // pdfMake.PDFContent pdf = pdfMake.PDFContent(content: [doc], styles: styles);
        // pdfMake.create(pdf).open();
        // .getDataUrl(function(outDoc)
        // {
        // $("#output").text(outDoc);
        // });
        dataList.sort((a, b) => Utils.compare(a.idx, b.idx));
        const docList: any[] = []
        for (const data of dataList) {
          Utils.pushAll(docList, data.docList);
        }
        if (docList.length > 1) {
          console.log('länge', docList.length);
          const pdfData: any = docList[0];
          for (let i = 1; i < docList.length; i++) {
            pdfData.content.push([{
              text: '',
              pageBreak: 'after',
              pageSize: 'a4',
              pageOrientation: listConfig[i].form.isPortrait ? 'portrait' : 'landscape'
            }, docList[i].content]);
          }
          this.makePdf(pdfData);
          return;
          // this.pdfList = [];
          // let pdfDoc: any = null;
          //
          // // for (const doc of docList) {
          // //   const dst = jsonEncode(doc);
          // //   if (GLOBALS.isDebug) {
          // //     // pdfUrl = 'http://pdf.zreptil.de/playground.php';
          // //     dst = dst.replaceAll('],', '],\n');
          // //     dst = dst.replaceAll(',\"', ',\n\"');
          // //     dst = dst.replaceAll(':[', ':\n[');
          // //   } else {
          // //     // pdfUrl = 'https://nightscout-reporter.zreptil.de/pdfmake/pdfmake.php';
          // //   }
          // //   pdfList.add(PdfData(pdfString(dst)));
          // // }
          // for (const doc of docList) {
          //   this.pdfList.push(new PdfData(doc));
          // }
          // this.ps.progressText = null;
          // this._generatePdf(docList);
          // return;
        } else {
          this.pdfDoc = docList[0];
        }
        this.makePdf(this.pdfDoc);
      });
      // if (!g.isDebug) {
      //   if (g.msg.text.isEmpty) {
      //     if (isForThumbs) {
      //       navigate('makePdfImages');
      //     } else {
      //       navigate('showPdf');
      //     }
      //   } else {
      //     displayLink(msgShowPDF, 'showPdf', btnClass: 'action', icon: 'description');
      //   }
      // } else {
      //   displayLink('playground', 'showPlayground', btnClass: 'action', icon: 'description');
      //   displayLink('pdf', 'showPdf', btnClass: 'action', icon: 'description');
      // }
      // sendIcon = 'send';
      // progressText = null;
    } finally {
      GLOBALS.isCreatingPDF = false;
    }
    /*
        }).catchError((error) {
          g.info.addDevError(error, msgPDFCreationError);
          sendIcon = 'send';
          progressText = null;
          return -1;
        });
    */
  }

  collectBase64Images(list: string[]): Observable<any> {
    this.images = {};
    const listObservables: Observable<any>[] = [];
    for (const id of list) {
      listObservables.push(this.collectBase64Image(id));
    }
    return forkJoin(listObservables);
  }

  showPdf(data: any) {
    this._generatePdf(data);
  }

  private collectPages(cfg: FormConfig, idx: number, isForThumbs: boolean, repData: ReportData): Observable<{ idx: number, docList: any[] }> {
    let doc: any;
    const docList: any[] = [];

    const form = cfg.form;
    let prevPage: PageData;
    if (this.ns.checkCfg(cfg) || isForThumbs) {
      const docLen = JSON.stringify(doc ?? {}).length;
      const gmiSave = GLOBALS.glucMGDLIdx;
      if (isForThumbs) {
        GLOBALS.glucMGDLIdx = 0;
      }
      return form.getFormPages(repData, docLen).pipe(map((formPages: PageData[]) => {
        GLOBALS.glucMGDLIdx = gmiSave;
        const fileList: PageData[][] = [[]];
        for (const page of formPages) {
          const entry = page.content[page.content.length - 1];
          if (entry.pageBreak === 'newFile' && !Utils.isEmpty(fileList[fileList.length - 1])) {
            entry.remove('pageBreak');
            fileList[fileList.length - 1].push(page);
            fileList.push([]);
          } else {
            if (entry.pageBreak === 'newFile') {
              entry.remove('pageBreak');
            } //entry["pageBreak"] = "after";
            fileList[fileList.length - 1].push(page);
          }
        }

        if (isForThumbs && fileList.length > 1) {
          fileList.splice(1, fileList.length - 1);
          if (fileList[0].length > 1) {
            fileList[0].splice(1, fileList[0].length - 1);
          }
        }

        for (const pageList of fileList) {
          const content: any[] = [];
          for (const page of pageList) {
            if (prevPage != null) {
              const pagebreak: any = {text: '', pageBreak: 'after'};
              if (page.isPortrait != prevPage.isPortrait) {
                pagebreak.pageSize = 'a4';
                pagebreak.pageOrientation = page.isPortrait ? 'portrait' : 'landscape';
              }
              content.push(pagebreak);
            }
            content.push(page.asElement);
            prevPage = page;
          }
          if (doc == null) {
            doc = {
              pageSize: 'a4',
              pageOrientation: Utils.isEmpty(pageList) || pageList[0].isPortrait ? 'portrait' : 'landscape',
              pageMargins: [form.cm(0), form.cm(1.0), form.cm(0), form.cm(0.0)],
              content: content,
              images: form.images,
              styles: {
                infoline: {
                  margin: [form.cm(0), form.cm(0.25), form.cm(0), form.cm(0.25)]
                },
                perstitle: {alignment: 'right'},
                persdata: {color: '#0000ff'},
                infotitle: {alignment: 'left'},
                infodata: {alignment: 'right', color: '#0000ff'},
                infounit: {
                  margin: [form.cm(0), form.cm(0), form.cm(0), form.cm(0)],
                  color: '#0000ff'
                },
                hba1c: {color: '#5050ff'},
                total: {bold: true, fillColor: '#d0d0d0', margin: form.m0},
                timeDay: {bold: true, fillColor: '#d0d0d0', margin: form.m0},
                timeNight: {bold: true, fillColor: '#303030', color: 'white', margin: form.m0},
                timeLate: {bold: true, fillColor: '#a0a0a0', margin: form.m0},
                row: {}
              }
            };
          } else {
            doc.content.push(content);
            for (const key of Object.keys(form.images)) {
              doc.images[key] = form.images[key];
            }
          }

          if (pageList != fileList[fileList.length - 1]) {
            docList.push(doc);
            doc = null;
            prevPage = null;
          }
        }
        if (doc != null) {
          docList.push(doc);
        }

        return {idx: idx, docList: docList};
      }));
    }
    return of(null);
    //        if (g.isLocal && data != fileList.last)doc = null;
    //        prevForm = form;
  }

  private makePdf(data: any) {
    if (GLOBALS.isDebug) {
      Log.displayLink(this.msgShowPDF, `showPdf`, {btnClass: 'action', icon: 'description', data: data});
      Log.displayLink('playground', `showPlayground`, {btnClass: 'action', icon: 'description', data: data});
      return;
    }
    this._generatePdf(data).then(_ => {
      this.ps.clear();
    });
  }

  private async _generatePdf(data: any) {
    if (data == null) {
      Log.error('Es sind keine Seiten vorhanden');
      return;
    }
    await this.loadPdfMaker();
    // pdfmake changes the
    this.pdfMake.createPdf(JSON.parse(JSON.stringify(data))).open();
  }

  private collectBase64Image(id: string): Observable<{ id: string, url: string }> {
    const req = new HttpRequest('GET', `assets/img/${id}.png`,
      null,
      {responseType: 'arraybuffer'});
    return this.http.request(req)
      .pipe(map(data => {
        return {id: id, url: `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array((data as any).body)))}`};
      }));
  }
}
