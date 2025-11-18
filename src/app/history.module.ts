import {NgModule} from '@angular/core';
import {V130} from '@/components/whats-new/history/v130';
import {V444} from '@/components/whats-new/history/v444';
import {V440} from '@/components/whats-new/history/v440';
import {V441} from '@/components/whats-new/history/v441';
import {V442} from '@/components/whats-new/history/v442';
import {V443} from '@/components/whats-new/history/v443';
import {V445} from '@/components/whats-new/history/v445';

@NgModule({
  imports: [
    V130, V444, V445, V443, V442, V441, V440],
  exports: [
    V130, V444, V445, V443, V442, V441, V440],
  providers: []
})
export class HistoryModule {
}
