import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {SessionService} from '@/_services/session.service';
import {DataService, RequestParams} from '@/_services/data.service';
import {NightscoutService} from '@/_services/nightscout.service';
import {PeriodShift} from '@/_model/period-shift';
import {Utils} from '@/classes/utils';
import {StatusData} from '@/_model/nightscout/status-data';
import {PdfService} from '@/_services/pdf.service';
import {FormControl, FormGroup} from '@angular/forms';
import {DatepickerEntry} from '@/_model/datepicker-entry';
import {CloseButtonData} from '@/controls/close-button/close-button-data';

@Component({
  selector: 'app-output-params',
  templateUrl: './output-params.component.html',
  styleUrls: ['./output-params.component.scss'],
  standalone: false
})
export class OutputParamsComponent implements OnInit {
  listGlucMaxValues = [this.msgAutomatic];
  listBasalPrecision = [this.msgBasalPrecisionFromProfile];
  periodShift: PeriodShift;
  glucMaxIdx: number;
  basalPrecisionIdx: number;
  skipSensorChange: number;

  listPeriodShift: PeriodShift[] = [];
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  /*

    @Output('printparamsresult')
    Stream<UIEvent> get trigger => _trigger.stream;
    final _trigger = StreamController<UIEvent>.broadcast(sync: true);

    List<String> listGlucMaxValues = [msgAutomatic];
    List<String> listBasalPrecision = [msgBasalPrecisionFromProfile];

    PrintParamsComponent();

    @override
    Future<Null> ngOnInit() async {
    }

    void fire(String type) {
      const detail = 0;
      // make sure the value uses the correct factor
      g.user.adjustGluc = g.user.adjustGluc;
      switch (type) {
        case 'ok':
          g.currPeriodShift = periodShift;
          g.ppGlucMaxIdx = glucMaxIdx;
          g.ppBasalPrecisionIdx = basalPrecisionIdx;
          break;
      }
      _trigger.add(UIEvent(type, detail: detail));
    }
  */
  closeData: CloseButtonData = {
    colorKey: 'outputparams'
  };

  constructor(public ns: NightscoutService,
              public ds: DataService,
              public ss: SessionService,
              public pdf: PdfService) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  get msgBasalPrecisionFromProfile(): string {
    return $localize`Aus den Profilen ermitteln`;
  }

  get msgAutomatic(): string {
    return $localize`Automatisch`;
  }

  get msgLatestFirst(): string {
    return $localize`Neuester Tag zuerst`;
  }

  get msgStandardCGP(): string {
    return $localize`CGP immer mit Standard Zielbereich`;
  }

  async ngOnInit() {
    Utils.pushAll(this.listPeriodShift, GLOBALS.listPeriodShift.reverse());
    this.periodShift = this.listPeriodShift.find((e) => e.months === GLOBALS.currPeriodShift.months);
    const reqParams: RequestParams = {asJson: true};
    const url = GLOBALS.user.apiUrl(null, 'status.json', {reqParams: reqParams});
    const content = await this.ds.request(url, reqParams);
    const status = StatusData.fromJson(content);
    GLOBALS.setGlucMGDL(status);
    this.fillComboBoxes();
    this.glucMaxIdx = GLOBALS.ppGlucMaxIdx;
    this.basalPrecisionIdx = GLOBALS.ppBasalPrecisionIdx;
    this.skipSensorChange = GLOBALS.ppSkipSensorChange;
  }

  changeGlucUnits(value: number) {
    GLOBALS.glucMGDLIdx = value;
    this.fillComboBoxes();
  }

  fillComboBoxes(): void {
    this.listGlucMaxValues = [this.msgAutomatic];
    for (let i = 1; i < GLOBALS.glucMaxValues.length; i++) {
      this.listGlucMaxValues.push(
        `${GLOBALS.glucFromData(GLOBALS.glucMaxValues[i])} ${GLOBALS.getGlucInfo()['unit']}`);
    }
    this.listBasalPrecision = [this.msgBasalPrecisionFromProfile];
    for (let i = 1; i < GLOBALS.basalPrecisionValues.length; i++) {
      this.listBasalPrecision.push(`${this.basalPrecisionText(GLOBALS.basalPrecisionValues[i])}`);
    }
  }

  basalPrecisionText(value: number): string {
    return `${GLOBALS.fmtNumber(1, value)} ${GLOBALS.getGlucInfo().unit}`;
  }

  msgStandardLimits(low: string, high: string, unit: string): string {
    return $localize`Standard Zielbereich verwenden (${low}\u00A0${unit} - ${high}\u00A0${unit})`;
  }

  msgTestData(): string {
    return $localize`Testdaten generieren`;
  }

  clickExecute() {
    // make sure the value uses the correct factor
    GLOBALS.user.adjustGluc = GLOBALS.user.adjustGluc;
    GLOBALS.currPeriodShift = this.periodShift;
    GLOBALS.ppGlucMaxIdx = this.glucMaxIdx;
    GLOBALS.ppBasalPrecisionIdx = this.basalPrecisionIdx;
    if (this.skipSensorChange !== GLOBALS.ppSkipSensorChange) {
      // this.ns.reportData.isValid = false;
      GLOBALS.ppSkipSensorChange = 0;
      this.skipSensorChange = 0;
    }
    setTimeout(() => this.pdf.generatePdf().then(_ => {
      if (!this.ns.reportData?.isValid) {
        this.ss.showPopup('outputparams');
      }
    }));
  }

  onPeriodShortcutClick(_: DatepickerEntry) {

  }

  onPeriodShiftClick() {

  }

  onPeriodSaveClick() {

  }
}
