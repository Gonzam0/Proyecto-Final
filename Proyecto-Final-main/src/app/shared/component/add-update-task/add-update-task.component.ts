import { Component, Input, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ItemReorderEventDetail } from '@ionic/angular';
import { getAuth } from 'firebase/auth';
import { Item, Task } from 'src/app/models/task.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-add-update-task',
  templateUrl: './add-update-task.component.html',
  styleUrls: ['./add-update-task.component.scss'],
})
export class AddUpdateTaskComponent implements OnInit {

  @Input() task: Task;
  user = {} as User;
  groups = [
    { id: 1, name: 'cocina' },
    { id: 2, name: 'deporte' },
    { id: 3, name: 'trabajo' },
    { id: 4, name: 'otros' }
  ];

  //=====FECHA ACTUAL====
  today = new Date();
  year = this.today.getFullYear();
  month = String(this.today.getMonth() + 1).padStart(2, '0');
  day = String(this.today.getDate()).padStart(2, '0');

  currentDate = `${this.day}-${this.month}-${this.year}`;

  form = new FormGroup({
    id: new FormControl(''),
    title: new FormControl('', [Validators.required, Validators.minLength(3)]),
    description: new FormControl('', [Validators.required, Validators.minLength(3)]),
    items: new FormControl([], [Validators.required, Validators.minLength(1)]),
    date: new FormControl(this.currentDate),
    active: new FormControl(true),
    type: new FormControl('estandar'),
    group: new FormControl('', [Validators.required]),
    userEmail: new FormControl(''),
    userName: new FormControl(''),
    userId: new FormControl(''),
  })
  constructor(
    private firebaseSvc: FirebaseService,
    private utilSvc: UtilsService,
    private db: AngularFirestore
  ) {
  }

  ngOnInit() {
    this.user = this.utilSvc.getElementFromLocalStorage('user')

    if (this.task) {
      this.form.setValue(this.task);
      this.form.updateValueAndValidity()
    }
  }


  submit() {
    if (this.form.valid) {
      if (this.task) {
        this.updateTask()
      } else {

        this.createTask();
      }
    }
  }

  //=====CREAR TAREA=====
  createTask() {
    let path = `users/${this.user.uid}`
    const goodUser = getAuth();
    let userEmail = goodUser.currentUser.email

    this.utilSvc.presentLoading({ message: 'Guardando actividad...' });
    this.form.value.userEmail = userEmail
    this.form.value.userName = this.user.name
    this.form.value.userId = this.user.uid
    this.form.value.id = this.db.createId();

    this.firebaseSvc.addSubCollection(path, 'tasks', this.form.value, this.form.value.id).then(res => {
      this.utilSvc.dismissModal({ success: true })
      this.utilSvc.presentToast({
        message: 'Tarea guardada',
        duration: 2500,
        color: 'success',
        icon: 'checkmark-circle-outline'
      })
      this.db.collection('tasks').doc(this.form.value.id).set(this.form.value)
      this.utilSvc.dismissLoading()
    }, error => {

      this.utilSvc.presentToast({
        message: error,
        duration: 3500,
        color: 'warning',
        icon: 'alert-circle-outline'
      })

    })
  }

  //=====ACTUALIZAR TAREA=====
  updateTask() {
    let path = `users/${this.user.uid}/tasks/${this.task.id}`

    this.utilSvc.presentLoading({ message: 'Guardando actividad...' });
    delete this.form.value.id; // elimina el id para no enviarlo

    this.firebaseSvc.updateDocument(path, this.form.value).then(res => {

      this.utilSvc.dismissModal({ success: true })

      this.utilSvc.presentToast({
        message: 'Tarea actualizada',
        duration: 2500,
        color: 'success',
        icon: 'checkmark-circle-outline'
      })

      this.utilSvc.dismissLoading()
    }, error => {

      this.utilSvc.presentToast({
        message: error,
        duration: 3500,
        color: 'warning',
        icon: 'alert-circle-outline'
      })

    })
  }

  getPercentage() {
    return this.utilSvc.getPercentage(this.form.value as Task)
  }

  handleReorder(ev: CustomEvent<ItemReorderEventDetail>) {
    this.form.value.items = ev.detail.complete(this.form.value.items);
    this.form.updateValueAndValidity()
  }

  removeItem(index: number) {
    this.form.value.items.splice(index, 1);
    this.form.controls.items.updateValueAndValidity();
  }

  createItem() {
    this.utilSvc.presentAlert({
      header: 'Nueva actividad',
      backdropDismiss: false,
      inputs: [
        {
          name: 'name',
          type: 'textarea',
          placeholder: 'Hacer algo...'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        }, {
          text: 'Agregar',
          handler: (res) => {
            res.name

            let item: Item = { name: res.name, completed: false }
            this.form.value.items.push(item);
            this.form.controls.items.updateValueAndValidity();
          }
        }
      ]
    })
  }
}
