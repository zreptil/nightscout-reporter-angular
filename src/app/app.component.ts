import { Component } from '@angular/core';
import {PdfService} from './_services/pdf.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'nightscout-reporter';

  constructor(private pdfService: PdfService) {
  }

  generatePdf() {
    this.pdfService.generatePdf({ content: 'A sample PDF document generated using Angular and PDFMake' });
  }
}
