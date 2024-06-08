import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { map } from 'rxjs/operators';
import { Reminder } from 'src/app/models/reminder.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-add-update-reminder',
  templateUrl: './add-update-reminder.component.html',
  styleUrls: ['./add-update-reminder.component.scss'],
})
export class AddUpdateReminderComponent implements OnInit {

  @Input() reminder: Reminder
  reminders: Reminder[] = []
  user: User = {} as User

  //=====FECHA ACTUAL====
  date = new Date();
  year = this.date.getFullYear();
  month = String(this.date.getMonth() + 1).padStart(2, '0');
  day = String(this.date.getDate()).padStart(2, '0');

  today = `${this.year}-${this.month}-${this.day}`;

  form = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(3), this.noSpecialCharacters]),
    description: new FormControl('', [Validators.required, Validators.minLength(3), this.noSpecialCharacters]),
    remindTime: new FormControl('', [Validators.required, Validators.minLength(9), this.dateFormatValidator()]),
    remindHour: new FormControl('', [Validators.required,  this.timeValidator()]),
  });

  // =====VALIDAR FECHA=====
  dateFormatValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      const validFormat = /^\d{2}-\d{2}-\d{4}$/.test(value);
      if (!validFormat) {
        return { invalidDateFormat: { value } };
      }

      const [day, month, year] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      const validDate = date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;

      const validDay = day >= 1 && day <= 31;
      const validMonth = month >= 1 && month <= 12;
      const validYear = year >= 2024 && year <= 2100;

      if (!validDate || !validDay || !validMonth || !validYear) {
        return { invalidDateValue: { value } };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);  // Establecer la hora a 00:00:00.000 para comparar solo las fechas

      if (date < today) {
        return { pastDate: { value } };
      }

      return null;
    };
  }

  // =====VALIDAR HORA=====
  timeValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const timeValue = control.value;
      const validTimeFormat = /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeValue);
      if (!validTimeFormat) {
        return { invalidTimeFormat: { value: timeValue } };
      }

      const remindTimeControl = control.parent?.get('remindTime');
      if (!remindTimeControl) {
        return null;
      }

      const remindTimeValue = remindTimeControl.value;
      const [day, month, year] = remindTimeValue.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      const [hours, minutes] = timeValue.split(':').map(Number);
      const remindDate = new Date(year, month - 1, day, hours, minutes);

      const now = new Date();

      if (date.getTime() === now.setHours(0, 0, 0, 0) && remindDate < new Date()) {
        return { pastHour: { value: timeValue } };
      }

      return null;
    };
  }

  noSpecialCharacters(control: FormControl): { [key: string]: any } | null {
    const value = control.value;
    if (/[^a-zA-Z\s]| {2,}/.test(value)) { // Verifica si hay caracteres especiales que no sean letras o más de un espacio consecutivo
      return { noSpecialCharacters: true }; // Devuelve un error
    }
    return null; // No hay error
  }

  constructor(
    private firebaseSvc: FirebaseService,
    private utilSvc: UtilsService
  ) { }

  ngOnInit() {
    this.user = this.utilSvc.getElementFromLocalStorage('user')

    if (this.reminder) {
      this.form.setValue(this.reminder);
      this.form.updateValueAndValidity()
    }
  }

  submit() {
    if (this.form.valid) {
        this.createReminder();
    }
  }

  // Crear recordatorio
  createReminder() {
    const path = `users/${this.user.uid}`;
    
    this.utilSvc.presentAlert({
      header: '¡ATENCIÓN!',
      message: 'Una vez creado el recordatorio, no podrás modificarlo.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        }, {
          text: 'Crear',
          handler: () => {
            this.utilSvc.presentLoading({ message: 'Creando recordatorio...' });
            this.firebaseSvc.addSubCollection(path, 'reminders', this.form.value).then(() => {
              this.utilSvc.dismissModal({ success: true })
              this.utilSvc.presentToast({
                message: 'Recordatorio guardado',
                duration: 2500,
                color: 'success',
                icon: 'checkmark-circle-outline'
              })

              this.utilSvc.dismissLoading()
            }, error => {

              this.utilSvc.presentToast({
                message: error.message,
                duration: 5000,
                color: 'warning',
                icon: 'alert-circle-outline'
              })

            })
          }
        }
      ]
    })
  }

}
