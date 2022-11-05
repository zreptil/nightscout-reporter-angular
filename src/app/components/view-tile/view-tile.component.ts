import {Component, OnInit} from '@angular/core';
import {GLOBALS, GlobalsData} from '@/_model/globals-data';
import {FormConfig} from '@/forms/form-config';
import {BasePrint} from '@/forms/base-print';
import {Log} from '@/_services/log.service';
import {SessionService} from '@/_services/session.service';
import {NightscoutService} from '@/_services/nightscout.service';
import {DataService} from '@/_services/data.service';

@Component({
  selector: 'app-view-tile',
  templateUrl: './view-tile.component.html',
  styleUrls: ['./view-tile.component.scss']
})
export class ViewTileComponent implements OnInit {

  constructor(public ss: SessionService,
              public ds: DataService,
              public ns: NightscoutService) {
  }

  get globals(): GlobalsData {
    return GLOBALS;
  }

  checkedIndex(cfg: FormConfig): number {
    let ret = 0;
    for (const check of GLOBALS.listConfig) {
      if (check.form.isDebugOnly && !GLOBALS.isDebug) {
        continue;
      }
      if (check.form.isLocalOnly && !GLOBALS.isLocal) {
        continue;
      }
      if (check.checked) {
        ret++;
      }
      if (check.id === cfg.id) {
        return ret;
      }
    }
    return ret;
  }

  ngOnInit(): void {
  }

  tileClass(cfg: FormConfig): string[] {
    const ret = ['tile', 'sortable'];
    if (cfg.form.isDebugOnly && GLOBALS.isDebug) {
      ret.push('is-debug');
    }
    if (cfg.checked) {
      ret.push('tilechecked');
    }
    if (cfg.form.isLocalOnly || (cfg.form.isBetaOrLocal && GLOBALS.isLocal)) {
      ret.push('is-local');
    }
    if (cfg.form.isBetaOrLocal) {
      ret.push('is-beta');
    }
    return ret;
  }

  clickTileMenu(evt: MouseEvent, _: FormConfig) {
    Log.todo('Idee für TileParams: komplette view auf Params ändern, alle Params der ausgewählten Tiles anzeigen.');
    Log.todo('Würde exakt so auch bei der Listenansicht zum Einsatz kommen.');
    this.ss.showPopup('tileParams');
    evt.stopPropagation();
  }

  tileClicked(evt: MouseEvent, cfg: FormConfig) {
    if (!cfg.opened) {
      Log.todo('Checken, ob der auskommentierte Code in ViewTileComponent.expansionPanelClicked noch benötigt wird.');
      Log.todo('Das hatte wohl was mit Drag-Drop zu tun.');
      //   if (evt.currentTarget.attributes['dontclick'] == 'true') {
      //     evt.currentTarget.removeAttribute('dontclick');
      //     return;
      //   }
      cfg.checked = !cfg.checked;
      this.ss.checkPrint();
    }
  }

  isFormVisible(form: BasePrint): boolean {
    if (form.isDebugOnly && !GLOBALS.isDebug) {
      return false;
    }
    if (form.isLocalOnly && !GLOBALS.isLocal) {
      return false;
    }
    // noinspection RedundantIfStatementJS
    if (form.isBetaOrLocal && !(GLOBALS.isBeta || GLOBALS.isLocal)) {
      return false;
    }

    return true;
  }

  mayCopy(cfg: FormConfig): boolean {
    return cfg.form.sortedParams.length > 0 &&
      cfg.checked &&
      cfg.form.suffix == '-' &&
      GLOBALS.listConfig.filter((c) => c.form.baseId === cfg.form.baseId).length < 3 &&
      GLOBALS.listConfig.filter((c) => c.form.suffix !== '-').length < 9;
  }

  clickTileCopy(evt: MouseEvent, cfg: FormConfig, idx: number) {
    const form = this.ss.formFromId(cfg.form.baseId, `${this.ss.getNextSuffix(cfg)}`);
    if (form != null) {
      const newCfg = new FormConfig(form, true);
      GLOBALS.listConfig.splice(idx + 1, 0, newCfg);
    }
    this.ds.savePdfOrder();
    evt.stopPropagation();
  }

  mayDelete(cfg: FormConfig): boolean {
    return cfg.form.sortedParams.length > 0 && cfg.checked && cfg.form.suffix != '-';
  }

  clickTileDelete(evt: MouseEvent, idx: number) {
    GLOBALS.listConfig.splice(idx, 1);
    this.ds.savePdfOrder();
    evt.stopPropagation();
  }

  clickTileHelp(evt: MouseEvent, cfg: FormConfig) {
    this.ss.showPopup('helpview', cfg)
    evt.stopPropagation();
  }
}
