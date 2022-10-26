import {TreatmentData} from '@/_model/nightscout/treatment-data';

export class CalcCOBData {
  constructor(public decayedBy: Date,
              public isDecaying: boolean,
              public carbs_hr: number,
              public rawCarbImpact: number,
              public cob: number,
              public lastCarbs: TreatmentData) {
  }
}

