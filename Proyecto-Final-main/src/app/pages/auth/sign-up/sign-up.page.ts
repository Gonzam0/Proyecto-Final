import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { getAuth } from 'firebase/auth';
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
    name: new FormControl('', [Validators.required, Validators.minLength(3), this.containsNumbers, this.noSpecialCharacters]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('', [Validators.required, Validators.minLength(6)]),
    rol: new FormControl('basico'),
    age: new FormControl('', [Validators.required, this.ageRangeValidator]),
    photo: new FormControl(''),
    city: new FormControl('', [Validators.required, Validators.minLength(3), this.containsNumbers, this.noSpecialCharacters]),
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

  ageRangeValidator(control: AbstractControl): ValidationErrors | null {
    const age = control.value;
    if (isNaN(age) || age < 8 || age > 120) {
      return { ageRangeValidator: true };
    }
    return null;
  }

  containsNumbers(control: FormControl): { [key: string]: any } | null {
    const value = control.value;
    if (/\d/.test(value)) { // Si el valor contiene números
      return { containsNumbers: true }; // Devuelve un error
    }
    return null; // De lo contrario, no hay error
  }

  noSpecialCharacters(control: FormControl): { [key: string]: any } | null {
    const value = control.value;
    if (/[^a-zA-Z\s]| {2,}/.test(value)) { // Verifica si hay caracteres especiales que no sean letras o más de un espacio consecutivo
      return { noSpecialCharacters: true }; // Devuelve un error
    }
    return null; // No hay error
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

          const age = parseInt(this.form.value.age, 10);

          const user: User = {
            uid: uid,
            name: this.form.value.name,
            email: this.form.value.email,
            rol: this.form.value.rol,
            city: this.form.value.city,
            age: age
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
        console.error(err);
        let errorMessage = 'Ocurrió un error al autenticar.';

        if (err.code === 'auth/email-already-in-use') {
          errorMessage = 'El correo electrónico ingresado ya está registrado.';
        }
        this.utilSvc.dismissLoading();
        this.utilSvc.presentToast({
          message: errorMessage,
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
        await this.firebaseSvc.addSubCollection(path, 'info', this.form.value, this.form.value.name);

        delete this.form.value.photo;

        await this.firebaseSvc.addDocument(path, this.form.value);
        console.log('Documento del usuario añadido correctamente');
      } catch (error) {
        console.error('Error al añadir documento del usuario:', error);
        throw error;
      }
    }
  }
}
