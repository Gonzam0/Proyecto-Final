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
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    confirmPassword: new FormControl('', [Validators.required]),
  })

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
      this.firebaseSvc.signup(this.form.value as User).then(async res => {

        await this.firebaseSvc.updateUser({displayName: this.form.value.name})

        let user: User = {
          uid: res.user.uid,
          name: res.user.displayName,
          email: res.user.email
        }

        this.utilSvc.setElementInLocalStorage('user', user);
        this.utilSvc.routerLink('/tabs/home');

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
        this.utilSvc.presentToast({
          message: err, 
          duration: 4000, 
          color: 'warning', 
          icon: 'alert-circle-outline',
        });
      })
    }
  }
}
