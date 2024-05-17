import { Component, OnInit } from '@angular/core';
import { Users } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

user = {} as Users

  constructor(
    private firebaseSvc: FirebaseService,
    private utilSvc: UtilsService
  ) { }

  ngOnInit() {
  }

  //=====SE EJECUTA CUANDO SE INICIA LA PAGINA=====
  ionViewWillEnter() {
    this.getUser()
  }

  getUser(){
    return this.user = this.utilSvc.getElementFromLocalStorage('user')
  }

  async signOut() {
   this.utilSvc.presentAlert({
    header: 'Cerrar Sesión',
    message: '¿Deseas cerrar la sesión?',
    mode: 'ios',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel',
      }, {
        text: 'Si, cerrar',
        handler: () => {
          this.firebaseSvc.singOut();
        }
      }
    ]
  })
  }

}
