import {TreatmentData} from '@/_model/nightscout/treatment-data';

export class CalcIOBData {
  constructor(public iob: number,
              public activity: number,
              public lastBolus: TreatmentData) {
  }
}

