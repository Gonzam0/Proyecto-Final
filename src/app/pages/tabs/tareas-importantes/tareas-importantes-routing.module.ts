import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TareasImportantesPage } from './tareas-importantes.page';

const routes: Routes = [
  {
    path: '',
    component: TareasImportantesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TareasImportantesPageRoutingModule {}
