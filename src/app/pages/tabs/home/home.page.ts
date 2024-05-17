import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User} from 'firebase/auth';
import { Users } from 'src/app/models/user.model';
import { Task } from 'src/app/models/task.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateTaskComponent } from 'src/app/shared/component/add-update-task/add-update-task.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  
  tasks: Task[] = []
  user = {} as User
  loading: boolean = false
  searchText: string = ''
  
  constructor(
    private firebaseSvc: FirebaseService,
    private utilSvc: UtilsService,
    private db: AngularFirestore
  ) { }

  ngOnInit() {
  }

  getUser() {
    return this.user = this.utilSvc.getElementFromLocalStorage('user')
  }

  ionViewWillEnter() {
    this.getTasks()
    this.getUser()
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

  getTasks() {
    let user: User = this.utilSvc.getElementFromLocalStorage('user')
    let path = `users/${user.uid}`
    this.loading = true

    let sub = this.firebaseSvc.getSubCollection(path, 'tasks').subscribe({
      next: (res: Task[]) => {
        console.log(res)
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

    this.db.doc(path).update({ active: false }).then(res => {

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

  addFavorite(task: Task) {
    let path = `users/${this.user.uid}/tasks/${task.id}`

    this.utilSvc.presentLoading({ message: 'Añadiendo actividad a favorita...' });

    this.db.doc(path).update({ tipo: "favorite" }).then(res => {

      this.utilSvc.presentToast({
        message: 'Tarea añadida a favorita',
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
      return this.tasks.filter(task => task.active/*&&task.tipo!="favorite"*/);
    }
  
    return this.tasks.filter(task => 
      task.title.toLowerCase().startsWith(this.searchText.toLowerCase()) && task.active/* && task.tipo!="favorite"*/
    );
  }
  
}
