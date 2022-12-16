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
import {TCreatedPdf} from 'pdfmake/build/pdfmake';

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
    this.ps.max = 1;
    this.ps.value = 0;
    this.ps.text = this.msgPreparingPDF;
    const repData = await this.ns.loadData(isForThumbs);
    if (!repData?.isValid) {
      return;
    }
    GLOBALS.isCreatingPDF = true;
    try {
      this.ps.max = 1;
      this.ps.value = 0;
      this.ps.text = this.msgCreatingPDF;
      if (repData.error != null) {
        if (GLOBALS.isDebug) {
          Log.error(this.msgLoadingData(repData.error.toString(), repData.error.stack.toString()));
        } else {
          Log.error(this.msgLoadingDataError);
        }
        GLOBALS.isCreatingPDF = false;
        return;
      }
      this.ps.value = this.ps.max + 1;
      // let docLen = 0;
      // let prevPage: PageData = null;
      let listConfig: FormConfig[] = [];
      if (isForThumbs) {
        for (let cfg of GLOBALS.listConfigOrg) {
          listConfig.push(cfg);
          switch (cfg.id) {
            case 'cgp':
//                              cfg = new FormConfig(PrintCGP(), false);
              cfg.form.params[0].thumbValue = 1;
              listConfig.push(cfg);
              break;
            case 'dayanalysis':
//                              cfg = new FormConfig(PrintDailyAnalysis(), false);
              cfg.form.params[2].thumbValue = 1;
              listConfig.push(cfg);
              break;
            case 'percentile':
//                              cfg = new FormConfig(PrintPercentile(), false);
              cfg.form.params[0].thumbValue = 0;
              cfg.form.params[2].thumbValue = true;
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
      forkJoin(cfgList).subscribe({
        next: (dataList: { idx: number, docList: any[] }[]) => {
          // pdfMake.Styles styles = pdfMake.Styles();
          // pdfMake.PDFContent pdf = pdfMake.PDFContent(content: [doc], styles: styles);
          // pdfMake.create(pdf).open();
          // .getDataUrl(function(outDoc)
          // {
          // $("#output").text(outDoc);
          // });
          dataList = dataList.filter(entry => entry != null);
          dataList.sort((a, b) => Utils.compare(a.idx, b.idx));
          console.log(dataList);
          const docList: any[] = []
          for (const data of dataList) {
            Utils.pushAll(docList, data.docList);
          }
          if (docList.length > 1) {
            const pdfData: any = docList[0];
            for (let i = 1; i < docList.length; i++) {
              /*
                            const content = [{
                              text: '',
                              pageBreak: 'after',
                              pageSize: 'a4',
                              pageOrientation: listConfig[i]?.form.isPortrait ? 'portrait' : 'landscape',
                              images: docList[i].images
                            }, docList[i].content];
              */
              docList[i].content.splice(0, 0, {
                text: '',
                pageBreak: 'after',
                pageSize: docList[i].pageSize,
                pageOrientation: docList[i].pageOrientation,
              });
              for (const key of Object.keys(docList[i].images)) {
                pdfData.images[key] = docList[i].images[key];
              }
              pdfData.content.push(docList[i].content);
            }
            this.makePdf(pdfData, isForThumbs);
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
          this.makePdf(this.pdfDoc, isForThumbs);
        }, error: (error) => {
          Log.devError(error, 'Fehler im PdfService');
        }
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
    } catch (ex) {
      Log.devError(ex, 'Fehler im PdfService');
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
    this._generatePdf(data, false);
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
            delete (entry.pageBreak);
            fileList[fileList.length - 1].push(page);
            fileList.push([]);
          } else {
            if (entry.pageBreak === 'newFile') {
              delete (entry.pageBreak);
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

  private makePdf(data: any, isForThumbs: boolean) {
    if (GLOBALS.isDebug) {
      Log.displayLink(this.msgShowPDF, `showPdf`, {btnClass: 'action', icon: 'description', data: data});
      Log.displayLink('Playground', `showPlayground`, {btnClass: 'action', icon: 'description', data: data});
      this.ps.clear();
      return;
    }
    this._generatePdf(data, isForThumbs).then(_ => {
      this.ps.clear();
    });
  }

  async createThumbs() {
    console.log(this.thumbLangSave, this.thumbLangIdx);
    if (this.thumbLangSave == null && GLOBALS.language.code !== 'de-DE') {
      this.thumbLangIdx = GLOBALS.languageList.length;
      this.thumbLangSave = GLOBALS.language;
    } else {
      this.thumbLangSave ??= GLOBALS.language;
      this.thumbLangIdx++;
      await this.ds.setLanguage(GLOBALS.languageList[this.thumbLangIdx]);
    }
    this.generatePdf(true).then( () => {
      if ( this.thumbLangIdx < GLOBALS.languageList.length-1) {
        setTimeout(() => this.createThumbs(), 500);
      }
    });
  }

  private async _generatePdf(data: any, isForThumbs: boolean) {
    if (data == null) {
      Log.error('Es sind keine Seiten vorhanden');
      return;
    }
    await this.loadPdfMaker();
    // pdfmake changes the
    this.http.get('assets/fonts/pdfmake-font.ja.json').subscribe(vfs => {
      let fonts = null;
      if (GLOBALS.language.code === 'ja-JP') {
        fonts = {
          Roboto: {
            normal: 'ipagp.ttf',
            bold: 'ipagp.ttf',
            italics: 'ipagp.ttf',
            bolditalics: 'ipagp.ttf',
          }
        }
      } else {
        vfs = null;
      }
      const pdf: TCreatedPdf = this.pdfMake.createPdf(JSON.parse(JSON.stringify(data)), null, fonts, vfs);
      if (isForThumbs) {
        pdf.open();
        // pdf.getBase64(base64 => {
        //   localStorage.setItem(`thumbs.${GLOBALS.language.code}`, base64);
        // });
      } else if (GLOBALS.ppPdfSameWindow) {
        pdf.getDataUrl((base64URL) => {
          document.write(`<iframe src="${base64URL}" style="border:0;top:0;left:0;bottom:0;right:0;width:100%;height:100%;" allowFullScreen></iframe>`);
        });
      } else if (GLOBALS.ppPdfDownload) {
        pdf.download();
      } else {
        try {
          pdf.open();
        } catch (ex) {
          Log.error($localize`Das PDF konnte nicht angezeigt werden. Ist ein Popup-Blocker aktiv?`);
          pdf.download();
        }
      }
    });
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
  /*
<?php
$vfs = 'vfs';
$isdebug = false;
$filename = '';
$createImages = '';
$exportCfg = '';

if(array_key_exists('vfs', $_REQUEST))
  $vfs = $_REQUEST['vfs'];
if(array_key_exists('debug', $_REQUEST))
  $isdebug = true;
if(array_key_exists('filename', $_REQUEST))
  $filename = $_REQUEST['filename'];
if(array_key_exists('images', $_REQUEST))
  $createImages = $_REQUEST['images'];
if(array_key_exists('exportCfg', $_REQUEST))
  $exportCfg = $_REQUEST['exportCfg'];
?>
<!DOCTYPE html>
<html>
<head>
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
  <title>Pdf</title>
  <script src="pdfmake.min.js"></script>
  <script src="<?=$vfs?>_fonts.js"></script>
  <script src="index.js"></script>
<?php
if($createImages!='')
{
?>
  <script src="pdf.js"></script>
  <script src="pdf.worker.js"></script>
  <script src="jszip.min.js"></script>
  <script src="filesaver.min.js"></script>
<?php
}
?>
  <script type="text/javascript">
    var _remaining = 1;
    function mm(pt)
    {
      return pt/0.35277;
    }
    function cm(pt)
    {
      return pt/0.035277;
    }
    $(document).ready(function()
    {
      $("#message").hide();
      $("#debug").hide();
      $("#pdfimg").hide();
      var src = "<?=$_REQUEST['data']?>";
  src = Utf8.decode(atob(src));
  if('<?=$exportCfg?>' != '')
{
  var blob = new Blob([src], {type: "text/json;charset=utf-8"});
  saveAs(blob,"nightscout-reporter-cfg.txt");
  $("#output").hide();
  $("#message").show();
  $("#message").text("<?=$exportCfg?>");
  return;
}
if('<?=$isdebug?>' == '1')
  $("#debug").text(src);
try
{
  eval("var form=" + src);
  if("<?=$vfs?>" == "ja")
  {
    pdfMake.fonts = {
      Roboto: {
        normal: "ipagp.ttf",
        bold: "ipagp.ttf",
        italics: "ipagp.ttf",
        bolditalics: "ipagp.ttf"
      }
    };
  }
  if("<?=$filename?>" != "")
  {
    pdfMake.createPdf(form,null,fonts).download("<?=$filename?>");
  }
  else
  {
    <?php
    if($createImages!='')
    {
        ?>
      var pdfDoc;
      pdfMake.createPdf(form,null,fonts).getDataUrl(function(outDoc)
      {
        PDFJS.getDocument({ url: outDoc }).then(function(pdf_doc)
        {
          pdfDoc = pdf_doc;

          // Hide the pdf loader and show pdf container in HTML
          $("#output").hide();
          $("#message").show();
          var pageDefs = [{i:1,n:"test"}
            ,{i:2,n:"analysis"}
            ,{i:3,n:"profile"}
            ,{i:4,n:"percentile-0"}
            ,{i:5,n:"percentile-1"}
            ,{i:6,n:"percentile-3"}
            ,{i:7,n:"daystats"}
            ,{i:8,n:"daygraph"}
            ,{i:10,n:"dayanalysis"}
            ,{i:11,n:"dayanalysis-landscape"}
            ,{i:12,n:"daylog"}
            ,{i:13,n:"weekgraph"}
            ,{i:15,n:"basal"}
            ,{i:16,n:"cgp"}
            ,{i:17,n:"cgp-landscape"}
            ,{i:18,n:"dayprofile"}
            ,{i:19,n:"daygluc-full"}
            ,{i:20,n:"daygluc"}
            ,{i:21,n:"dayhours"}
            ,{i:22,n:"userdata"}
            ,{i:23,n:"glucdist"}
          ];
          _remaining = pageDefs.length + 3;
          pageDefs.forEach(function(item){
            loadPdfPage(pdfDoc,item.i,item);
          });
          combinePdfPages(pdfDoc,4,5,"percentile-2");
          combinePdfPages(pdfDoc,6,5,"percentile-4",false);
          combinePdfPages(pdfDoc,8,9,"daygraph-cgp");
          combinePdfPages(pdfDoc,13,14,"weekgraph-cgp");
          setTimeout(function(){checkReady(outDoc);},1000);

          // Show the first page
//              showPage(1);
        }).catch(function(error)
        {
          alert(error.message);
        });
      });
      <?php
    }
    else
    {
        ?>
      pdfMake.createPdf(form,null,fonts).getDataUrl(function(outDoc)
      {
        $("#output").attr("src", outDoc);
      });
      <?php
    }
      ?>
  }
}
catch(err)
{
}
});
<?php
if($createImages!='')
{
    ?>
  var smallSide = 174;

  function checkReady(outDoc)
  {
    if(_remaining > 0)
    {
      setTimeout(function(){checkReady(outDoc);},1000);
      return;
    }
    $("body").css("background","#e0ffe0");
    $("#message").text("Packe Bilder zusammen ...");
    var zip = new JSZip();
    var img = zip.folder("");
    $("#pdfimg").children().each(function(){
      var data = this.toDataURL();
      data = data.substr(data.indexOf("base64")+6);
      img.file($(this).attr("title")+".png", data, {base64:true});
    });
    zip.generateAsync({type:"blob"}).then(function(content){
      saveAs(content,"nr-images.<?=$createImages?>.zip");
      $("#message").html($("<button>Fenster schliessen</button>").click(function(){window.close();}));
      $("#message").append($("<button id='btnPdf'>PDF anzeigen</button>").click(function()
      {
        if($("#output").is(":visible"))
        {
          $("#output").hide();
          $("#btnPdf").text("PDF anzeigen");
        }
        else
        {
          $("#output").show();
          $("#output").attr("src", outDoc);
          $("#btnPdf").text("PDF verbergen");
        }
      }));
      $("#message").append($("<button id='btnImg'>Bilder anzeigen</button>").click(function()
      {
        if($("#pdfimg").is(":visible"))
        {
          $("#pdfimg").hide();
          $("#btnImg").text("Bilder anzeigen");
        }
        else
        {
          $("#pdfimg").show();
          $("#btnImg").text("Bilder verbergen");
        }
      }));
    });
  }
  function loadPdfPage(pdfDoc,idx,item,callback=undefined)
  {
    // Fetch the page
    pdfDoc.getPage(idx).then(function(page) {
      $("#message").text("Erzeuge " + item.n + ".png ...");
      var canvas = $("<canvas></canvas>");
      canvas.attr("title", item.n);
      var cvs = canvas.get(0);
      var orgWid = page.pageInfo.view[2] - page.pageInfo.view[0];
      var orgHig = page.pageInfo.view[3] - page.pageInfo.view[1];
      var ctx = cvs.getContext("2d");
      var isPortrait = orgWid < orgHig;
      // As the canvas is of a fixed width we need to set the scale of the viewport accordingly
      var scale_required = isPortrait ? smallSide/orgWid : smallSide/orgHig;

      // Get viewport of the page at required scale
      var viewport = page.getViewport(scale_required);
      cvs.width = smallSide;
      cvs.height = smallSide;
      if(isPortrait)
        cvs.height = smallSide/orgWid*orgHig;
      else
        cvs.width = smallSide/orgHig*orgWid;

      var renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      // Render the page contents in the canvas
      page.render(renderContext).then(function() {
        if(callback !== undefined)
        {
          callback(canvas);
        }
        else
        {
          _remaining--;
          $("#pdfimg").append(canvas);
        }
      });
    });
  }
  function combinePdfPages(pdfDoc,idx1,idx2,name,tileVert=true)
  {
    var item = {i:idx1,n:""};
    loadPdfPage(pdfDoc,item.i,item,function(c1)
    {
      var item = {i:idx2,n:name};
      loadPdfPage(pdfDoc,item.i,item,function(c2)
      {
        $("#message").text("Erzeuge " + item.n + ".png ...");
        var canvas = $("<canvas></canvas>");
        canvas.attr("title", item.n);
        var cvs = canvas.get(0);
        var ctx = cvs.getContext("2d");
        var w1 = c1.get(0).width;
        var h1 = c1.get(0).height;
        var w2 = c2.get(0).width;
        var h2 = c2.get(0).height;
        if(tileVert)
        {
          cvs.width = w1;
          cvs.height = h1+h2+2;
          cvs.width = smallSide;
          cvs.height = (h1+h2+2)*cvs.width/w1;
          ctx.scale(smallSide/w1,smallSide/w1);
          ctx.drawImage(c1.get(0),0,0);
          ctx.drawImage(c2.get(0),(w1-w2)/2,h1+2);
        }
        else
        {
          cvs.height = h1;
          cvs.width = w1+w2+2;
          cvs.height = smallSide;
          cvs.width = (w1+w2+2)*cvs.height/h1;
          ctx.scale(smallSide/h1,smallSide/h1);
          ctx.drawImage(c1.get(0),0,0);
          ctx.drawImage(c2.get(0),w1+2,(h1-h2)/2);
        }
        _remaining--;
        $("#pdfimg").append(canvas);
      });
    });
  }
  <?php
}
  ?>
</script>
<style type="text/css">
  body
{
  font-family: tahoma,verdana,arial;
  margin: 0;
  padding: 0;
  display: flex;
}
iframe,#message
{
  width: 100vw;
  height: 100vh;
  border: none;
}
#message
{
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
canvas
{
  border: 1px solid black;
}
#pdfimg
{
  display: none;
  height: 100vh;
  overflow-y: scroll;
}
button
{
  border: 0;
  padding: 1em;
  cursor: pointer;
  background-color: transparent;
}
button:hover
{
  background-color: #40ff40;
  box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19);
}
</style>
</head>
<body>
<iframe id="output"></iframe>
  <div id="message"></div>
  <div id="debug"></div>
  <div id="pdfimg"></div>
  </body>
  </html>
  */
}
