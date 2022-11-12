import {Component, Input, OnInit} from '@angular/core';
import {ParamInfo} from '@/_model/param-info';

@Component({
  selector: 'app-form-params',
  templateUrl: './form-params.component.html',
  styleUrls: ['./form-params.component.scss']
})
export class FormParamsComponent implements OnInit {

  @Input()
  paramList: ParamInfo[];

  constructor() {
  }

  ngOnInit(): void {
  }

  getClass(param: ParamInfo, def = ''): string {
    if (param.isLoopValue) {
      def = `${def} loop`;
    }
    return def;
  }

}
