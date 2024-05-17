import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Users } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { CustomValidators } from 'src/app/utils/custom.validators';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage implements OnInit {
  form = new FormGroup({
    uid: new FormControl(''),
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    confirmPassword: new FormControl('', [Validators.required]),
    rol: new FormControl('básico'),
  })

  
  user = {} as Users;

  constructor(
    private firebaseSvc: FirebaseService,
    private utilSvc: UtilsService
  ) { }

  ngOnInit() {
    this.confirmPassword();
  }

  confirmPassword() {
    this.form.controls.confirmPassword.setValidators([
      Validators.required,
      CustomValidators.matchValues(this.form.controls.password)
    ]);

    this.form.controls.confirmPassword.updateValueAndValidity();
  }

  submit() {
    if (this.form.valid) {
      this.utilSvc.presentLoading({message: 'Registrando usuario...'});
      this.firebaseSvc.signup(this.form.value as Users).then(async res => {
        await this.firebaseSvc.updateUser({displayName: this.form.value.name})
  
        //Asignar UID
        let uid = res.user.uid
        this.form.controls.uid.setValue(uid)
  
        let user: Users = {
          uid: res.user.uid,
          name: res.user.displayName,
          email: res.user.email,
          rol: this.form.value.rol
        }
  
        this.utilSvc.setElementInLocalStorage('user', user);
        this.user = this.utilSvc.getElementFromLocalStorage('user')
        // Llama a setUserInfo después de signup
        this.setUserInfo(uid).then(() => {
          // Una vez que se haya completado la operación de usuario, redirige y muestra un mensaje
          this.utilSvc.routerLink('/tabs/home');
          this.utilSvc.dismissLoading();
          this.utilSvc.presentToast({
            message: `Bienvenido ${user.name}`, 
            duration: 2000, 
            color: 'success', 
            icon: 'person-outline'
          });
          this.form.reset();
        }).catch(err => {
          // Manejar errores de setUserInfo
          this.utilSvc.dismissLoading();
          this.utilSvc.presentToast({
            message: err, 
            duration: 4000, 
            color: 'warning', 
            icon: 'alert-circle-outline',
          });
        });
  
      }).catch(err => {
        // Manejar errores de signup
        this.utilSvc.dismissLoading();
        this.utilSvc.presentToast({
          message: err, 
          duration: 4000, 
          color: 'warning', 
          icon: 'alert-circle-outline',
        });
      })
    }
  }
  

  async setUserInfo(uid: string) {
    if (this.form.valid) {
      
      let path = `users/${uid}`;
      delete this.form.value.confirmPassword;
      delete this.form.value.password;

      console.log(this.form.value)

      this.firebaseSvc.addSubCollection(path, "info", this.form.value).then(() => {
        console.log('Subcolección añadida correctamente');
      }).catch(error => {
        console.error('Error al añadir subcolección:', error);
      });
      console.log('Usuario guardado')
    }
  }
}
