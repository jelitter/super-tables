import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from 'src/components/about/about.component';
import { TablesComponent } from 'src/components/tables/tables.component';

const routes: Routes = [
  { path: '', component: TablesComponent },
  { path: 'about', component: AboutComponent },
  { path: 'tables', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
