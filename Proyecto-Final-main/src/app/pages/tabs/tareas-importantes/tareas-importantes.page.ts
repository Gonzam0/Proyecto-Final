import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from 'src/app/models/user.model';
import { Task } from 'src/app/models/task.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateTaskComponent } from 'src/app/shared/component/add-update-task/add-update-task.component';

@Component({
  selector: 'app-tareas-importantes',
  templateUrl: './tareas-importantes.page.html',
  styleUrls: ['./tareas-importantes.page.scss'],
})
export class TareasImportantesPage implements OnInit {

  tasks: Task[] = []
  user = {} as User
  loading: boolean = false
  searchText: string = ''
  rol: string
  
  constructor(
    private firebaseSvc: FirebaseService,
    private utilSvc: UtilsService,
    private db: AngularFirestore
  ) {}

  ngOnInit() {
  }

  getUser() {
    return this.user = this.utilSvc.getElementFromLocalStorage('user')
  }

  ionViewWillEnter() {
    this.getTasks()
    this.getUser()
    this.getUserRol();
  }

  getPercentage(task: Task) {
    return this.utilSvc.getPercentage(task)
  }

  async addOrUpdateTask(task?: Task) {
    let res = await this.utilSvc.presentModal({
      component: AddUpdateTaskComponent,
      componentProps: { task },
      cssClass: 'add-update-modal'
    })

    if (res && res.success) {
      this.getTasks()
    }
  }

  deleteFavorite(task: Task) {
    let path = `users/${this.user.uid}/tasks/${task.id}`

    this.utilSvc.presentLoading({ message: 'Añadiendo actividad a importante...' });

    this.db.doc(path).update({ type: "estandar" }).then(res => {

      this.utilSvc.presentToast({
        message: 'Tarea quitada de importante',
        duration: 2500,
        color: 'success',
        icon: 'checkmark-circle-outline'
      })

      this.getTasks()
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

  getTasks() {
    let user: User = this.utilSvc.getElementFromLocalStorage('user')
    let path = `users/${user.uid}`
    this.loading = true

    let sub = this.firebaseSvc.getSubCollection(path, 'tasks').subscribe({
      next: (res: Task[]) => {
        this.tasks = res
        sub.unsubscribe()
        this.loading = false
      }
    })
  }

  confirmDeleteTask(task: Task) {
    this.utilSvc.presentAlert({
      header: 'Eliminar tarea',
      message: '¿Quieres eliminar la tarea?',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        }, {
          text: 'Si, eliminar',
          handler: () => {
            this.deleteTask(task)
          }
        }
      ]
    })
  }

  deleteTask(task: Task) {
    let path = `users/${this.user.uid}/tasks/${task.id}`

    this.utilSvc.presentLoading({ message: 'Borrando actividad...' });

    this.firebaseSvc.updateDocument(path, { active: false }).then(res => {

      this.utilSvc.presentToast({
        message: 'Tarea eliminada',
        duration: 2500,
        color: 'success',
        icon: 'checkmark-circle-outline'
      })

      this.getTasks()
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

  filterTasks() {
    if (!this.searchText.trim()) {
      return this.tasks.filter(task => task.active && task.type == "importante");
    }
  
    return this.tasks.filter(task => 
    task.title.toLowerCase().startsWith(this.searchText.toLowerCase()) && task.active && task.type == "importante");
  }

  getUserRol(){
    this.firebaseSvc.getData2Collection('users', 'info', this.user.uid, this.user.name, 'rol').subscribe(res => {
      this.rol = res;
    });
  }

}
