import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  })

  constructor(
    private firebaseSvc: FirebaseService,
    private utilSvc: UtilsService
  ) { }

  ngOnInit() {
  }

  submit() {
    if (this.form.valid) {
      this.utilSvc.presentLoading({ message: 'Autenticando...' });
      this.firebaseSvc.login(this.form.value as User).then(async res => {

        let user: User = {
          uid: res.user.uid,
          name: res.user.displayName,
          email: res.user.email
        }

        this.firebaseSvc.getData2Collection('users', 'info', res.user.uid, res.user.displayName, 'rol').subscribe(res => {
          console.log(res)
          if (res != 'admin') {
            this.utilSvc.routerLink('/tabs/home');
          } else {
            this.utilSvc.routerLink('/tabs/admin');
          }
        })


        this.utilSvc.setElementInLocalStorage('user', user);

        this.utilSvc.dismissLoading();

        this.utilSvc.presentToast({
          message: `Bienvenido ${user.name}`,
          duration: 2000,
          color: 'success',
          icon: 'person-outline'
        });

        this.form.reset();
      }, err => {
        this.utilSvc.dismissLoading();
        console.error(err);
        let errorMessage = 'Ocurrió un error al autenticar.';

        if (err.code === 'auth/invalid-credential') {
          errorMessage = 'El correo electrónico ingresado no está registrado.';
        } else if (err.code === 'auth/invalid-credential') {
          errorMessage = 'La contraseña o el correo electrónico ingresados son incorrectos.';
        }

        this.utilSvc.presentToast({
          message: errorMessage,
          duration: 4000,
          color: 'warning',
          icon: 'alert-circle-outline',
        });
      });
    }
  }

}