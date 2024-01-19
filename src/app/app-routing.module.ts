import {NgModule} from '@angular/core';
import {MainComponent} from '@/components/main/main.component';
import {RouterModule, Routes} from '@angular/router';
import {WatchComponent} from '@/components/watch/watch.component';
import {LocalToolsComponent} from '@/standalone/local-tools/local-tools.component';
import {TestComponent} from '@/components/test/test.component';
import {ShortcutComponent} from '@/components/shortcut/shortcut.component';
import {ExecuteComponent} from '@/components/execute/execute.component';

const routes: Routes = [
  {path: 'authorize', component: ExecuteComponent, data: {cmd: 'authorize'}},
  {path: 'test', component: TestComponent},
  {path: 'tools', component: LocalToolsComponent},
  {path: 'shortcut', component: ShortcutComponent},
  {path: 'watch', component: WatchComponent},
  {path: '', component: MainComponent},
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
