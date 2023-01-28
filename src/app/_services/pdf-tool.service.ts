import {Injectable} from '@angular/core';
import {TCreatedPdf} from 'pdfmake/build/pdfmake';
import {PdfService} from '@/_services/pdf.service';
import {LangData} from '@/_model/nightscout/lang-data';
import {DataService} from '@/_services/data.service';
import {GLOBALS} from '@/_model/globals-data';
import {Log} from '@/_services/log.service';
import * as JSZip from 'jszip';
import {saveAs} from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class PdfToolService {
  thumbLangIdx: number = -1;
  thumbLangSave: LangData = null;
  private _remaining = 1;
  private smallSide = 174;

  constructor(public pdf: PdfService,
              public ds: DataService) {
  }

  async createThumbs(lang: LangData) {
    await this.ds.setLanguage(lang);
    console.log(GLOBALS.language);
    await this.pdf.generatePdf(this.createThumb.bind(this));
    // console.log(this.thumbLangSave, this.thumbLangIdx);
    // if (this.thumbLangSave == null && GLOBALS.language.code !== 'de-DE') {
    //   this.thumbLangIdx = GLOBALS.languageList.length;
    //   this.thumbLangSave = GLOBALS.language;
    // } else {
    //   this.thumbLangSave ??= GLOBALS.language;
    //   this.thumbLangIdx++;
    //   await this.ds.setLanguage(GLOBALS.languageList[this.thumbLangIdx]);
    // }
    // this.pdf.generatePdf(true).then(() => {
    //   if (this.thumbLangIdx < GLOBALS.languageList.length - 1) {
    //     setTimeout(() => this.createThumbs(), 500);
    //   }
    // });
  }

  private createThumb(pdf: TCreatedPdf): void {
    const PDFJS = require('../../assets/scripts/pdf.js');
    // require('../../assets/scripts/pdf.worker.js');
    this._remaining = 1;
    try {
      // let pdfDoc: any = null;
      pdf.getDataUrl((outDoc) => {
        PDFJS.getDocument({url: outDoc}).promise.then((pdf_doc: any) => {
          const pdfDoc = pdf_doc;
          const pageDefs = [
            {i: 1, n: 'test'}
            , {i: 2, n: 'analysis'}
            , {i: 3, n: 'profile'}
            , {i: 4, n: 'percentile-0'}
            , {i: 5, n: 'percentile-1'}
            , {i: 6, n: 'percentile-3'}
            , {i: 7, n: 'daystats'}
            , {i: 8, n: 'daygraph'}
            , {i: 10, n: 'dayanalysis'}
            , {i: 11, n: 'dayanalysis-landscape'}
            , {i: 12, n: 'daylog'}
            , {i: 13, n: 'weekgraph'}
            , {i: 15, n: 'basal'}
            , {i: 16, n: 'cgp'}
            , {i: 17, n: 'cgp-landscape'}
            , {i: 18, n: 'dayprofile'}
            , {i: 19, n: 'daygluc-full'}
            , {i: 20, n: 'daygluc'}
            , {i: 21, n: 'dayhours'}
            , {i: 22, n: 'userdata'}
            , {i: 23, n: 'glucdist'}
          ];
          this._remaining = pageDefs.length + 3;
          for (const item of pageDefs) {
            this.loadPdfPage(pdfDoc, item.i, item);
          }
          this.combinePdfPages(pdfDoc, 4, 5, 'percentile-2');
          this.combinePdfPages(pdfDoc, 6, 5, 'percentile-4', false);
          this.combinePdfPages(pdfDoc, 8, 9, 'daygraph-cgp');
          this.combinePdfPages(pdfDoc, 13, 14, 'weekgraph-cgp');
          setTimeout(() => {
            this.checkReady(outDoc);
          }, 1000);

          // Show the first page
//              showPage(1);
        }).catch(function (error: any) {
          console.error(error);
        });
      });
    } catch (err) {
    }
  }

  private checkReady(outDoc: any): void {
    if (this._remaining > 0) {
      setTimeout(() => {
        this.checkReady(outDoc);
      }, 1000);
      return;
    }
    Log.info('Packe Bilder zusammen ...')
    const zip = new JSZip();
    const img = zip.folder('');
    const len = document.getElementById('pdfimg').children.length;
    img.folder(GLOBALS.language.img);
    for (let i = 0; i < len; i++) {
      const item = document.getElementById('pdfimg').children.item(i);
      let data = (item as any).toDataURL();
      data = data.substring(data.indexOf('base64') + 6);
      img.file(`${GLOBALS.language.img}/${item.getAttribute('title')}.png`, data, {base64: true});
    }

    zip.generateAsync({type: 'blob'}).then(function (content) {
      saveAs(content, `nr-images.${GLOBALS.language.img}.zip`);
      // $('#message').html($('<button>Fenster schliessen</button>').click(function () {
      // window.close();
    });
    //   $('#message').append($('<button id=\'btnPdf\'>PDF anzeigen</button>').click(function () {
    //     if ($('#output').is(':visible')) {
    //       $('#output').hide();
    //       $('#btnPdf').text('PDF anzeigen');
    //     } else {
    //       $('#output').show();
    //       $('#output').attr('src', outDoc);
    //       $('#btnPdf').text('PDF verbergen');
    //     }
    //   }));
    //   $('#message').append($('<button id=\'btnImg\'>Bilder anzeigen</button>').click(function () {
    //     if ($('#pdfimg').is(':visible')) {
    //       $('#pdfimg').hide();
    //       $('#btnImg').text('Bilder anzeigen');
    //     } else {
    //       $('#pdfimg').show();
    //       $('#btnImg').text('Bilder verbergen');
    //     }
    //   }));
    // });
  }

  private loadPdfPage(pdfDoc: any, idx: number, item: any, callback?: (c: any) => void): void {
    // Fetch the page
    pdfDoc.getPage(idx).then((page: any) => {
      // $("#message").text("Erzeuge " + item.n + ".png ...");
      const canvas = document.createElement('canvas');
      canvas.setAttribute('title', item.n);
      // const cvs = canvas.get(0);
      const orgWid = page.pageInfo.view[2] - page.pageInfo.view[0];
      const orgHig = page.pageInfo.view[3] - page.pageInfo.view[1];
      const ctx = canvas.getContext('2d');
      const isPortrait = orgWid < orgHig;
      // As the canvas is of a fixed width we need to set the scale of the viewport accordingly
      const scale_required = isPortrait ? this.smallSide / orgWid : this.smallSide / orgHig;

      // Get viewport of the page at required scale
      const viewport = page.getViewport(scale_required);
      canvas.width = this.smallSide;
      canvas.height = this.smallSide;
      if (isPortrait) {
        canvas.height = this.smallSide / orgWid * orgHig;
      } else {
        canvas.width = this.smallSide / orgHig * orgWid;
      }

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      // Render the page contents in the canvas
      page.render(renderContext).then(() => {
        if (callback !== undefined) {
          callback(canvas);
        } else {
          this._remaining--;
          document.getElementById('pdfimg').append(canvas);
        }
      });
    });
  }

  private combinePdfPages(pdfDoc: any, idx1: number, idx2: number, name: string, tileVert = true): void {
    var item = {i: idx1, n: ''};
    this.loadPdfPage(pdfDoc, item.i, item, (c1) => {
      var item = {i: idx2, n: name};
      this.loadPdfPage(pdfDoc, item.i, item, (c2) => {
        const canvas = document.createElement('canvas');
        canvas.setAttribute('title', item.n);
        const ctx = canvas.getContext('2d');
        const w1 = c1.width;
        const h1 = c1.height;
        const w2 = c2.width;
        const h2 = c2.height;
        if (tileVert) {
          canvas.width = w1;
          canvas.height = h1 + h2 + 2;
          canvas.width = this.smallSide;
          canvas.height = (h1 + h2 + 2) * canvas.width / w1;
          ctx.scale(this.smallSide / w1, this.smallSide / w1);
          ctx.drawImage(c1, 0, 0);
          ctx.drawImage(c2, (w1 - w2) / 2, h1 + 2);
        } else {
          canvas.height = h1;
          canvas.width = w1 + w2 + 2;
          canvas.height = this.smallSide;
          canvas.width = (w1 + w2 + 2) * canvas.height / h1;
          ctx.scale(this.smallSide / h1, this.smallSide / h1);
          ctx.drawImage(c1, 0, 0);
          ctx.drawImage(c2, w1 + 2, (h1 - h2) / 2);
        }
        this._remaining--;
        document.getElementById('pdfimg').append(canvas);
      });
    });
  }
}
