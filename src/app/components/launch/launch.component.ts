import {Component} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {DataService} from '@/_services/data.service';
import {EnvironmentService} from '@/_services/environment.service';

@Component({
  selector: 'app-launch',
  templateUrl: './launch.component.html',
  styleUrl: './launch.component.scss'
})
export class LaunchComponent {
  svgCollection: SafeHtml;

  constructor(public ds: DataService,
              public env: EnvironmentService,
              public sanitizer: DomSanitizer) {
    env.settingsFilename = 'nightrep-settings-demo';
  }

  ngOnInit(): void {
    if (this.svgCollection == null) {
      this.svgCollection = {};
      this.ds.request('assets/img/owl.svg', {options: {responseType: 'text'}}).then(result => {
        this.svgCollection = this.sanitizer.bypassSecurityTrustHtml(result.body);
      });
    }
  }
}
