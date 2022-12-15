import {Component, OnInit} from '@angular/core';
import {DataService} from '@/_services/data.service';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {LangData} from '@/_model/nightscout/lang-data';
import {Log} from '@/_services/log.service';
import {Utils} from '@/classes/utils';
import {SessionService} from '@/_services/session.service';
import {MaterialColorService} from '@/_services/material-color.service';
import {saveAs} from 'file-saver';

@Component({
  selector: 'app-dart-importer',
  templateUrl: './dart-importer.component.html',
  styleUrls: ['./dart-importer.component.scss']
})
export class DartImporterComponent implements OnInit {

  intlARB: any;
  intlJSON: any;
  messages: any;
  xlfJSON: any;
  code: string;
  colorstyle: string;

  constructor(public ds: DataService,
              public ms: MaterialColorService,
              public ss: SessionService) {
    this.extractColorJson();
  }

  // get messagesJSON(): any {
  //   return this.messages?.[0].data;
  // }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  async ngOnInit() {
    let url = `assets/messages.json`;
    this.messages = await this.ds.request(url, {asJson: true});
    url = `assets/old-dart/json/de_DE.json`;
    this.xlfJSON = await this.ds.request(url, {asJson: true});
  }

  async clickLanguage(lang: LangData) {
    const filename = `${lang.code.replace(/-/g, '_')}.json`;
    const url = `assets/old-dart/json/${filename}`;
    this.intlJSON = await this.ds.request(url, {asJson: true});
    Log.clear();
    GLOBALS.isDebug = true;
    const output = [
      '<?xml version="1.0" encoding="UTF-8" ?>',
      '<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">',
      `<file source-language="${this.intlJSON.file['@source-language']}"`,
      ` target-language="${this.intlJSON.file['@target-language']}"`,
      ` datatype="plaintext" original="ng2.template">`,
      '<body>'];
    const msgKey = this.intlJSON.file['@source-language'] === 'de' ? 'de-DE' : 'en-GB';
    const messagesJSON = this.messages.find((e: any) => e.id === msgKey)?.data;
    for (const key of Object.keys(messagesJSON)) {
      const parts = messagesJSON[key].trim().split('\n');
      const list = this.intlJSON.file.body['trans-unit'];
      let check: any = null;
      let unit = list.find((e: any) => e['@id'] === key);
      if (unit == null) {
        check = this.cvtKnownKeys(key);
        if (check != null) {
          unit = list.find((e: any) => e['@id'] === check.id);
        }
        if (unit == null) {
          let cvtKey = Utils.join(parts, '\\n', text => {
            return text?.trim().replace(/<br>/g, '\n');
          });
          if (unit == null) {
            unit = list.find((e: any) => e['source'].replace(/–/g, '-') === cvtKey);
          }
          if (unit == null) {
            unit = list.find((e: any) => e['@resname'].replace(/–/g, '-') === cvtKey);
          }
          if (unit == null) {
            Log.warn(`${key} [${cvtKey}]`);
          }
        }
      }
      let showError = false;
      if (unit != null) {
        let trans = unit.target?.['#text'];
        if (trans != null) {
          if (check != null) {
            if (check.regex != null) {
              if (check.regex !== 'full') {
                try {
                  trans = trans.match(check.regex).groups?.['trans'] ?? trans;
                } catch (ex) {
                  Log.error(`check ${key} failed: ${check.id} - ${trans}`);
                }
              }
              if (check.replaceAfter != null) {
                trans = Utils.replace(trans, check.replaceAfter.src, check.replaceAfter.dst);
              }
            } else if (check.pattern != null) {
              trans = check.pattern.replace('@trans@', trans);
            }
          }
          // Log.info(`${key} ${trans}`);
          output.push(`<trans-unit id="${key}" datatype="html">`);
          output.push(`<source>${this.cvt4XML(messagesJSON[key])}</source>`);
          output.push(`<target state="final">${this.cvt4XML(trans)}</target>`);
          output.push(`</trans-unit>`);
        }
        showError = trans == null;
      }
      if (showError) {
        Log.error(`${key} ${messagesJSON[key]}`);
      }
    }
    output.push('</body>');
    output.push('</file>');
    output.push('</xliff>');
    saveAs(new Blob([Utils.join(output, '\n')]), `messages.${this.intlJSON.file['@target-language']}.xliff`);
  }

  cvtKnownKeys(key: string): any {
    return {
      '2312689462569807321': {id: '7049'},
      '4657328650853061238': {id: '13000', regex: /(.*)=0{(?<trans>.*)}=1(.*)/},
      '8653385405278371687': {id: '13000', regex: /(.*)=1{(?<trans>.*)}other(.*)/, replaceAfter: {src: '{time}', dst: '{$PH}'}},
      '2487173854002315363': {id: '13000', regex: /(.*)other{(?<trans>.*)}}/, replaceAfter: {src: '{time}', dst: '{$PH}'}},
      'msgTOR': {id: '6504', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      'msgCV': {id: '6506', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      'msgHYPO': {id: '4956', regex: 'full', replaceAfter: {src: '{unit}', dst: '{$PH}'}},
      'msgHYPER': {id: '4958', regex: 'full', replaceAfter: {src: '{unit}', dst: '{$PH}'}},
      'msgMEAN': {id: '4960', regex: 'full', replaceAfter: {src: '{unit}', dst: '{$PH}'}},
      'msgTORInfo': {id: '4968', regex: 'full', replaceAfter: {src: ['{min}', '{max}'], dst: ['{$PH}', '{$PH_1}']}},
      'msgHYPOInfo': {id: '4972', regex: 'full', replaceAfter: {src: '{unit}', dst: '{$PH}'}},
      'msgHYPERInfo': {id: '4974', regex: 'full', replaceAfter: {src: '{unit}', dst: '{$PH}'}},
      '7716816989054584047': {id: '7884'},
      '8912953969714276103': {id: '7886', regex: 'full', replaceAfter: {src: '{maxCount}', dst: '{$PH}'}},
      '3802873172037186880': {id: '7888', regex: /(.*)=1{(?<trans>.*)}other(.*)/, replaceAfter: {src: '{text}', dst: '{$PH}'}},
      '7979899145647988883': {id: '7888', regex: /(.*)other{(?<trans>.*)}}/, replaceAfter: {src: '{text}', dst: '{$PH}'}},
      '3927439908064576549': {id: '734', regex: 'full', replaceAfter: {src: '{date}', dst: '{$PH}'}},
      '6530668891861059555': {id: '730', regex: 'full', replaceAfter: {src: ['{error}', '{stacktrace}'], dst: ['{$PH}', '${PH_1}']}},
      '3976173699076358131': {id: '7200', regex: 'full', replaceAfter: {src: ':', dst: ''}},
      '1278432863271212107': {id: '7122', regex: 'full', replaceAfter: {src: ['{low}', '{unit}', '{high}', '{unit}'], dst: ['{$PH}', '{$PH_1}', '{$PH_2}', '{$PH_3}']}},
      '4662145775420138869': {id: '698', pattern: `{$START_TAG_MAT_ICON}settings{$CLOSE_TAG_MAT_ICON} @trans@`},
      '2522417553765949487': {id: '950', regex: 'full', replaceAfter: {src: 'herokuapp.com', dst: 'ns.10be.de'}},
      '4562561451144140468': {id: '7896'},
      'msgCheckUser': {id: '956', regex: 'full', replaceAfter: {src: '{url}', dst: '${PH}'}},
      '2014733470790569227': {id: '7444', regex: /(.*)=1{(?<trans>.*)}other(.*)/},
      '6184761557716292861': {id: '7444', regex: /(.*)other{(?<trans>.*)}}/, replaceAfter: {src: '{count}', dst: '{$PH}'}},
      '7906820745486253849': {id: '828'},
      '6302070337805031317': {id: '826'},
      '4195240722921774740': {id: '1972'},
      '3674308659547457904': {id: '6650'},
      '2360508661070570624': {id: '1772'},
      '4027913842661346247': {
        id: '13180', regex: 'full', replaceAfter: {
          src: ['{startTag0}', '{endTag0}', '{startTag1}', '{endTag1}', '{startTag2}', '{endTag2}'],
          dst: ['{$START_ITALIC_TEXT}', '{$CLOSE_ITALIC_TEXT}', '{$START_LINK}', '{$CLOSE_LINK}', '{$START_ITALIC_TEXT}', '{$CLOSE_ITALIC_TEXT}']
        }
      },
      '5947493486939609850': {
        id: '13180', regex: 'full', replaceAfter: {src: ['{startTag0}', '{endTag0}'], dst: ['{$START_ITALIC_TEXT}', '{$CLOSE_ITALIC_TEXT}']}
      },
      '5719790065377190370': {id: '13184', regex: 'full', replaceAfter: {src: ['{startTag0}', '{endTag0}'], dst: ['{$START_BOLD_TEXT}', '{$CLOSE_BOLD_TEXT}']}},
      '_msgAdjustTarget': {id: '13072', regex: 'full', replaceAfter: {src: '{factor}', dst: '{$PH}'}},
      '_msgAdjustCalc': {id: '12990', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '_msgAdjustLab': {id: '12992', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      'msgMealBolus': {id: '6857'},
      'msgBolusWizard': {id: '6859'},
      '4370541832116997140': {id: '864'},
      '5716956580689550728': {id: '648'},
      '7814380740217085349': {id: '652'},
      '4091766776237352490': {id: '878'},
      '6054305971182360492': {id: '896'},
      '954997609648411319': {id: '898'},
      '7612401945163585274': {id: '676'},
      '3085022192590638473': {id: '900'},
      '2633729073167909034': {id: '2112', regex: 'full', replaceAfter: {src: '{time}', dst: '{$PH}'}},
      '194157074469443413': {id: '2114', regex: 'full', replaceAfter: {src: '{time}', dst: '{$PH}'}},
      '7975293901451211912': {id: '2116', regex: 'full', replaceAfter: {src: '{time}', dst: '{$PH}'}},
      '658509511596516220': {id: '6861', regex: 'full', replaceAfter: {src: ['{scale}', '{intercept}', '{slope}'], dst: ['{$PH}', '{$PH_1}', '{$PH_2}']}},
      '6901562133099764608': {id: '6388', regex: /(.*)=1\s*{(?<trans>.*)}\s*other(.*)/},
      '1149582344080641990': {id: '6388', regex: /(.*)other\s*{(?<trans>.*)}}/, replaceAfter: {src: '{count}', dst: '{$PH}'}},
      '6506885859968423722': {id: '6390', regex: /(.*)=1\s*{(?<trans>.*)}\s*other(.*)/},
      '1857951656960027099': {id: '6390', regex: /(.*)other\s*{(?<trans>.*)}}/, replaceAfter: {src: '{count}', dst: '{$PH}'}},
      'msgKW': {id: '12970', regex: 'full', replaceAfter: {src: '{date}', dst: '{$PH}'}},
      'msgValidRange': {id: '642', regex: 'full', replaceAfter: {src: ['{begDate}', '{endDate}'], dst: ['{$PH}', '{$PH_1}']}},
      'msgValidFrom': {id: '644', regex: 'full', replaceAfter: {src: '{begDate}', dst: '{$PH}'}},
      'msgValidTo': {id: '810', regex: 'full', replaceAfter: {src: '{endDate}', dst: '{$PH}'}},
      'msgDuration': {id: '6776', regex: 'full', replaceAfter: {src: ['{hours}', '{minutes}'], dst: ['{$PH}', '{$PH_1}']}},
      'msgTargetArea': {id: '812', regex: 'full', replaceAfter: {src: ['{min}', '{max}', '{units}'], dst: ['{$PH}', '{$PH_1}', '{$PH_2}']}},
      '_msgLowerGlucHint': {id: '13074', regex: 'full', replaceAfter: {src: '{factor}', dst: '{$PH}'}},
      '_msgRaiseGlucHint': {id: '13076', regex: 'full', replaceAfter: {src: '{factor}', dst: '{$PH}'}},
      'msgCarbs': {id: '1970', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      'msgBolusInsulin': {id: '818', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      'msgCorrectBolusInsulin': {id: '4674', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      'help-dayprofile': {id: '7806'},
      'help-daystats': {id: '7810'},
      'help-glucdist': {id: '10190'},
      'help-percentile': {id: '7812'},
      'help-profile': {id: '7814'},
      'help-weekgraph': {id: '7816'},
      'help-daylog': {id: '7804'},
      'help-dayhours': {id: '9324'},
      'help-daygraph': {id: '7800'},
      'help-daygluc': {id: '12833'},
      'help-daily-analysis': {id: '9286'},
      'help-cgp': {id: '7796'},
      'help-basal': {id: '7824'},
      'help-analysis': {id: '10186'},
      '2206933345783710470': {id: '12889', regex: 'full', replaceAfter: {src: ['{name}', '{name}'], dst: ['{$PH}', '{$PH_1}']}},
      'msgBasalInfo': {id: '6993'},
      'msgLogTempTarget': {id: '6362', regex: 'full', replaceAfter: {src: ['{target}', '{duration}', '{reason}'], dst: ['{$PH}', '{$PH_1}', '{$PH_2}']}},
      'msgLogTempBasal': {id: '6364', regex: 'full', replaceAfter: {src: ['{percent}', '{duration}'], dst: ['{$PH}', '{$PH_1}']}},
      'msgLogTempBasalAbsolute': {id: '7342', regex: 'full', replaceAfter: {src: ['{value}', '{duration}'], dst: ['{$PH}', '{$PH_1}']}},
      'msgLogSMB': {id: '6366', regex: 'full', replaceAfter: {src: ['{insulin}', '{unit}'], dst: ['{$PH}', '{$PH_1}']}},
      'msgLogMicroBolus': {id: '7344', regex: 'full', replaceAfter: {src: ['{insulin}', '{unit}'], dst: ['{$PH}', '{$PH_1}']}},
      'msgMBG': {id: '6430', regex: 'full', replaceAfter: {src: ['{gluc}', '{unit}'], dst: ['{$PH}', '{$PH_1}']}},
      'msgLogOverride': {id: '7726', regex: 'full', replaceAfter: {src: ['{duration}', '{reason}', '{range}', '{scale}'], dst: ['{$PH}', '{$PH_1}', '{$PH_2}', '{$PH_3}']}},
      'msgBasalInfo1': {id: '7214', regex: 'full', replaceAfter: {src: '{unit}', dst: '{$PH}'}},
      '151955983675362130': {id: '4898', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '1935073897932930018': {id: '12871', regex: /(.*)=0{(?<trans>.*)}=1(.*)/},
      '3334517318339819734': {id: '12871', regex: /(.*)=1{(?<trans>.*)}other(.*)/},
      '2476631956251729930': {id: '12871', regex: /(.*)other{(?<trans>.*)}}/, replaceAfter: {src: '{count}', dst: '{$PH}'}},
      '2630105366061918724': {id: '4676', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '6548316943536498969': {id: '4698', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '3909704910396085444': {id: '820', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '4286587832391329338': {id: '822', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '5570859919727012443': {id: '1750', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '5078435853672992591': {id: '1742', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '310135135909995723': {id: '584', regex: /(.*)=0\s*{(?<trans>.*)}\s*=1(.*)/},
      '4642711167787568908': {id: '584', regex: /(.*)=1\s*{(?<trans>.*)}\s*other(.*)/},
      '9100627874396355833': {id: '584', regex: /(.*)other\s*{(?<trans>.*)}}/, replaceAfter: {src: '{fmt}', dst: '{$PH}'}},
      '5046449995628369445': {id: '586', regex: /(.*)=1\s*{(?<trans>.*)}\s*other(.*)/},
      '2690513100444212741': {id: '586', regex: /(.*)other\s*{(?<trans>.*)}}/, replaceAfter: {src: '{fmt}', dst: '{$PH}'}},
      '7131139370526216674': {id: '588', regex: /(.*)=1\s*{(?<trans>.*)}\s*other(.*)/},
      '8334446718946772191': {id: '588', regex: /(.*)other\s*{(?<trans>.*)}}/, replaceAfter: {src: '{fmt}', dst: '{$PH}'}},
      '4341500156747589894': {id: '832', regex: 'full', replaceAfter: {src: ['{low}', '{high}'], dst: ['{$PH}', '{$PH_1}']}},
      '7258244579318280186': {id: '834', regex: 'full', replaceAfter: {src: '{low}', dst: '{$PH}'}},
      '1561702909227178336': {id: '836', regex: 'full', replaceAfter: {src: '{high}', dst: '{$PH}'}},
      '3146896021015651634': {id: '5150', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '5643627311954309822': {id: '5152', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '5281244940059566908': {id: '6330', regex: 'full', replaceAfter: {src: ['{low}', '{high}'], dst: ['{$PH}', '{$PH_1}']}},
      '6356747117170967509': {id: '5154', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '8465282339211094633': {id: '5156', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '7032229894851079271': {id: '596', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '1479891049004238768': {id: '838', regex: /(.*)=1\s*{(?<trans>.*)}\s*other(.*)/, replaceAfter: {src: '{txt}', dst: '{$PH}'}},
      '5947608586796983691': {id: '838', regex: /(.*)other\s*{(?<trans>.*)}}/, replaceAfter: {src: '{txt}', dst: '{$PH}'}},
      '4127636796372029708': {id: '840', regex: /(.*)=1\s*{(?<trans>.*)}\s*other(.*)/, replaceAfter: {src: '{txt}', dst: '{$PH}'}},
      '6739967434924345460': {id: '840', regex: /(.*)other\s*{(?<trans>.*)}}/, replaceAfter: {src: '{txt}', dst: '{$PH}'}},
      '5306121135087520090': {id: '842', regex: /(.*)=1\s*{(?<trans>.*)}\s*other(.*)/, replaceAfter: {src: '{txt}', dst: '{$PH}'}},
      '5615330300156559861': {id: '842', regex: /(.*)other\s*{(?<trans>.*)}}/, replaceAfter: {src: '{txt}', dst: '{$PH}'}},
      '1382429000553069395': {id: '658', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '5351459095868569938': {id: '4864', regex: /(.*)=0\s*{(?<trans>.*)}\s*=1(.*)/},
      '7070333232316529621': {id: '4864', regex: /(.*)=1\s*{(?<trans>.*)}\s*other(.*)/},
      '4834711968050618724': {id: '4864', regex: /(.*)other\s*{(?<trans>.*)}}/, replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '6842756027191066886': {id: '2130', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '6573896715468220408': {id: '660', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '2819034921980842641': {id: '880', regex: 'full', replaceAfter: {src: '{unit}', dst: '{$PH}'}},
      '4415704711981908542': {id: '882', regex: 'full', replaceAfter: {src: '{unit}', dst: '{$PH}'}},
      '8436223332064456837': {id: '884', regex: 'full', replaceAfter: {src: ['{beg}', '{end}'], dst: ['{$PH}', '{$PH_1}']}},
      '3960347178741939388': {id: '2138', regex: 'full', replaceAfter: {src: '{min}', dst: '{$PH}'}},
      '7784776148483401026': {id: '6502'},
      '5649152052903402207': {id: '5016', regex: 'full', replaceAfter: {src: '5', dst: '{$PH}'}},
      '6787170888491959005': {id: '890', regex: 'full', replaceAfter: {src: /^/, dst: '{$PH} '}},
      '896232652852247226': {id: '890', regex: 'full', replaceAfter: {src: /^/, dst: '{$PH} '}},
      '5715822374601764396': {id: '894', regex: 'full', replaceAfter: {src: /.*\/ /, dst: '{$PH} '}},
      '106915923521054589': {id: '6426', regex: 'full', replaceAfter: {src: /^1 /, dst: '{$PH} '}},
      '3499176050291189451': {id: '902', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
      '2243853424457768965': {id: '7072', regex: 'full', replaceAfter: {src: [/ \(.*\)/, /^/], dst: ['', '{$PH} ']}},
      '610068718017122607': {id: '5022', regex: 'full', replaceAfter: {src: /^1 /, dst: '{$PH} '}},
      '4039828375117343729': {id: '2140', regex: 'full', replaceAfter: {src: ['{min}', '{max}'], dst: ['{$PH}', '{$PH_1}']}},
      '8014171383833842560': {id: '2142', regex: 'full', replaceAfter: {src: ['{min}', '{max}'], dst: ['{$PH}', '{$PH_1}']}},
      '2186320724771371544': {id: '2144', regex: 'full', replaceAfter: {src: '{max}', dst: '{$PH}'}},
      '3049594061037724196': {id: '2146', regex: 'full', replaceAfter: {src: '{min}', dst: '{$PH}'}},
      '7127621015227459339': {id: '2150', regex: 'full', replaceAfter: {src: ['{min}', '{max}'], dst: ['{$PH}', '{$PH_1}']}},
      '9038529253462906018': {id: '2152', regex: 'full', replaceAfter: {src: '{max}', dst: '{$PH}'}},
      '8299939202081804590': {id: '12887', regex: 'full', replaceAfter: {src: '{name}', dst: '{$PH}'}},
      '6410546578813470883': {id: '2158', regex: 'full', replaceAfter: {src: ['{oldName}', '{newName}'], dst: ['{$PH}', '{$PH_1}']}},
      '396109618115340249': {id: '6540', regex: 'full', replaceAfter: {src: ['{oldName}', '{newName}', '{duration}'], dst: ['{$PH}', '{$PH_1}', '{$PH_2}']}},
      '4898050799154424568': {id: '4950', regex: 'full', replaceAfter: {src: ['{name}', '{from}', '{to}'], dst: ['{$PH}', '{$PH_1}', '{$PH_2}']}},
      '4324982987263927268': {id: '6897', regex: 'full', replaceAfter: {src: '{value}', dst: '{$PH}'}},
    }[key];
  }

//   async clickLanguage_old(lang: LangData) {
//     const filename = `intl_${lang.code.replace(/-/g, '_')}.arb`;
//     const url = `assets/old-dart/${filename}`;
//     console.log(url);
//     this.intlARB = await this.ds.request(url, {asJson: true});
//     console.log(lang.code, this.intlARB);
//     Log.clear();
//     GLOBALS.isDebug = true;
//     for (const key of Object.keys(this.messagesJSON)) {
//       const parts = this.messagesJSON[key].trim().split('\n');
//       if (this.intlARB[key] != null) {
//         const trans = this.intlARB[key];
//         Log.info(`${key} ${trans}`);
//         continue;
//       }
//       const cvtKey = Utils.join(parts, '\\n', text => {
//         return text?.trim().replace(/<br>/g, '\n');
//       });
//       const trans = this.intlARB[cvtKey];
//       if (key === 'help-cgp') {
//         console.log(key, cvtKey, trans);
//       }
//       if (trans == null) {
//         const src = this.xlfJSON.file.body['trans-unit'] ?? [];
//         let entry = src.find((e: any) => e['@id'] === key && e.note?.['@from'] === 'description');
//         let showError = true;
//         if (entry == null) {
//           let check = this.messagesJSON[key];
// //            .replace(/</g, '&lt;');
// //          check = check.replace(/>/g, '&gt;');
//           entry = src.find((e: any) => e['source'] === check);
//           if (entry != null) {
//             const keyList = Object.keys(this.intlARB);
//             let found: string = null;
//             for (let i = 0; i < keyList.length && found == null; i++) {
//               if (keyList[i] === entry.source) {
//                 found = keyList[i];
//               }
//             }
//             if (found != null) {
//               const id = found;
//               console.log('nix', check, id, entry);
//               if (this.intlARB[id] != null) {
//                 Log.warn(`${id} => ${this.intlARB[id]}`);
//                 showError = false;
//               }
//             }
//           }
//           entry = null;
//         }
//         if (entry != null) {
//           const keyList = Object.keys(this.intlARB);
//           let found: string = null;
//           for (let i = 0; i < keyList.length && found == null; i++) {
//             if (this.intlARB[keyList[i]].description === entry.note?.['#text']) {
//               found = keyList[i];
//             }
//           }
//           if (found != null) {
//             const id = found.substring(1);
//             if (this.intlARB[id] != null) {
//               Log.warn(`${key} => ${this.intlARB[id]}`);
//               showError = false;
//             }
//           }
//         }
//         if (showError) {
//           Log.error(`${key} ${this.messagesJSON[key]}`);
//         }
//       } else {
//         Log.info(`${key} ${trans}`);
//       }
//     }
//   }

  cvt4XML(src: string): string {
    src = src.replace(/&/g, '&amp;');
    src = src.replace(/</g, '&lt;');
    src = src.replace(/>/g, '&gt;');
    return src;
  }

  replaceCode() {
    this.code = this.code.replace(/([\s{(\[])g\./g, '$1GLOBALS.');
    this.code = this.code.replace(/([\s{(])var(.*) in /g, '$1const$2 of ');
    this.code = this.code.replace(/([\s{(])var(\s)/g, '$1const$2');
    this.code = this.code.replace(/@override/g, 'override');
    this.code = this.code.replace(/Intl\.message/g, '\$localize');
    this.code = this.code.replace(/(\b)bool(\b)/g, '$1boolean$2');
    this.code = this.code.replace(/(\b)String(\b)/g, '$1string$2');
    this.code = this.code.replace(/(\b)double(\b)/g, '$1number$2');
    this.code = this.code.replace(/(\b)int(\b)/g, '$1number$2');
    this.code = this.code.replace(/(\b)num(\b)/g, '$1number$2');
    this.code = this.code.replace(/(\b)dynamic(\b)/g, '$1any$2');
    this.code = this.code.replace(/(\b)math(\b)/g, '$1Math$2');
    this.code = this.code.replace(/(\b)Globals(\b)/g, '$1GlobalsData$2');
    // this.code = this.code.replace(/(\b)cm(\b)/g, '$1this.cm$2');
    // this.code = this.code.replace(/(\b)cmx(\b)/g, '$1this.cmx$2');
    // this.code = this.code.replace(/(\b)cmy(\b)/g, '$1this.cmy$2');
    let repList = ['x', 'y', 'color', 'colSpan', 'lineWidth', 'type', 'points', 'closePath',
      'relativePosition', 'absolutePosition', 'columns', 'width', 'text', 'fontSize', 'alignment', 'stack', 'canvas',
      'x1', 'x2', 'y1', 'y2', 'lineColor', 'margin', 'w', 'h', 'lineHeight', 'bold', 'layout',
      'table', 'widths', 'headerRows', 'body', 'style', 'fillOpacity', 'fillColor'];
    for (const entry of repList) {
      const re = new RegExp(`'${entry}':`, 'g');
      this.code = this.code.replace(re, `${entry}:`);
    }
    repList = ['cm', 'cmx', 'cmy', 'xorg', 'yorg', 'lcFrame', 'fs', 'lw', 'lc'];
    for (const entry of repList) {
      const re = new RegExp(`(\\b)${entry}(\\b)`, 'g');
      this.code = this.code.replace(re, `$1this.${entry}$2`);
    }
    repList = ['ParamInfo'];
    for (const entry of repList) {
      const re = new RegExp(`(\\b)${entry}(\\b)`, 'g');
      this.code = this.code.replace(re, `$1new ${entry}$2`);
    }
  }

  async extractColorJson() {
    const json = await this.ds.requestJson(`/assets/themes/standard/colors.json`);
    const ret: string[] = [];
    for (const key of Object.keys(json)) {
      let value = json[key];
      if (this.ms.colors[value] != null) {
        value = this.ms.colors[value];
      }
      ret.push(`--${key}: ${value};`);
    }
    this.colorstyle = Utils.join(ret, '\n');
  }
}
