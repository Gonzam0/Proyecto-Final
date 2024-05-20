import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TareasImportantesPageRoutingModule } from './tareas-importantes-routing.module';

import { TareasImportantesPage } from './tareas-importantes.page';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TareasImportantesPageRoutingModule,
    SharedModule
  ],
  declarations: [TareasImportantesPage]
})
export class TareasImportantesPageModule {}
