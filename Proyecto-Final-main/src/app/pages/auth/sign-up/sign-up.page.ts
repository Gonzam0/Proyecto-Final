import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
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
    edad: new FormControl(''),
    photo: new FormControl(''),
    ciudad: new FormControl(''),
  })

  user = {} as User;

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

  async submit() {
    if (this.form.valid) {
      this.utilSvc.presentLoading({ message: 'Registrando usuario...' });
      try {
        const res = await this.firebaseSvc.signup(this.form.value as unknown as User);

        if (res.user?.uid) {
          await this.firebaseSvc.updateUser({ displayName: this.form.value.name });

          // Asignar UID
          const uid = res.user.uid;
          this.form.controls.uid.setValue(uid); // Asegúrate de que el UID se establece en el formulario

          const user: User = {
            uid: uid,
            name: this.form.value.name,
            email: this.form.value.email,
            rol: this.form.value.rol
          };

          this.utilSvc.setElementInLocalStorage('user', user);

          await this.setUserInfo(uid); // Asegúrate de que el UID se pasa a setUserInfo

          this.utilSvc.routerLink('/tabs/home');
          this.utilSvc.dismissLoading();

          this.utilSvc.presentToast({
            message: `Bienvenido ${user.name}`,
            duration: 2000,
            color: 'success',
            icon: 'person-outline'
          });

          this.form.reset();
        }
      } catch (err) {
        this.utilSvc.dismissLoading();
        this.utilSvc.presentToast({
          message: err.message,
          duration: 4000,
          color: 'warning',
          icon: 'alert-circle-outline',
        });
      }
    }
  }

  async setUserInfo(uid: string) {
    if (this.form.valid) {
      const path = `users/${uid}`;
      delete this.form.value.confirmPassword;
      delete this.form.value.password;

      try {
        await this.firebaseSvc.addDocument(path, this.form.value);
        console.log('Documento del usuario añadido correctamente');
      } catch (error) {
        console.error('Error al añadir documento del usuario:', error);
        throw error;
      }
    }
  }
}
