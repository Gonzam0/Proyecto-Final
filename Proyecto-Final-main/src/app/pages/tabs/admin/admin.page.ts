import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/models/user.model';
import { User as FirebaseAuthUser } from '@firebase/auth-types';
import { Task } from 'src/app/models/task.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit {

  users: User[] = [];
  tasks: Task[] = [];
  searchText: string = ''
  loading: boolean = false

  // Variables para controlar la visibilidad y el estado activo de las tarjetas
  usersVisible: boolean = true;
  usersActive: boolean = false;
  tasksVisible: boolean = true;
  tasksActive: boolean = false;
  mostrarBotonSesion: boolean = true;

  constructor(
    private firebaseSvc: FirebaseService,
    private utilSvc: UtilsService,
    private db: AngularFirestore
  ) { }

  ngOnInit() {

    this.usersVisible = true;
    this.usersActive = false;
    this.tasksVisible = true;
    this.tasksActive = false;
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

  //=========USUARIOS=========
  async mostrarUsuarios() {
    this.loading = true;
    this.users = [];

    const querySnapshot = await getDocs(collection(this.db.firestore, "users"));
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData['name'] !== 'ADMIN') {
        this.users.push(userData as User);
      }
    });

    this.usersActive = !this.usersActive;
    this.tasksVisible = !this.tasksVisible;
    this.loading = false;
    this.mostrarBotonSesion = !this.mostrarBotonSesion;
  }

  confirmBlockUser(user: User) {
    if (user.rol === 'bloqueado') {
      this.utilSvc.presentAlert({
        header: 'Desbloquear usuario',
        message: '¿Quieres desbloquear el usuario?',
        mode: 'ios',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
          }, {
            text: 'Si, desbloquear',
            handler: () => {
              this.unblockUser(user)
            }
          }
        ]
      })
    } else {
      this.utilSvc.presentAlert({
        header: 'Bloquear usuario',
        message: '¿Quieres bloquear el usuario?',
        mode: 'ios',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
          }, {
            text: 'Si, bloquear',
            handler: () => {
              this.blockUser(user)
            }
          }
        ]
      })
    }
  }

  blockUser(user: User) {
    let path1 = `users/${user.uid}/info/${user.name}`
    let path2 = `users/${user.uid}`

    this.utilSvc.presentLoading({ message: 'Bloqueando usuario...' });

    this.db.doc(path1).update({ rol: "bloqueado" }).then(res => {

      this.utilSvc.presentToast({
        message: 'Usuario ' + "" + user.name + " " + ' bloqueado',
        duration: 2500,
        color: 'success',
        icon: 'checkmark-circle-outline'
      })

      this.db.doc(path2).update({ rol: "bloqueado" })
      this.mostrarUsuarios()
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

  unblockUser(user: User) {
    let path1 = `users/${user.uid}/info/${user.name}`
    let path2 = `users/${user.uid}`

    this.utilSvc.presentLoading({ message: 'Desbloqueando usuario...' });

    this.db.doc(path1).update({ rol: "basico" }).then(res => {

      this.utilSvc.presentToast({
        message: 'Usuario ' + "" + user.name + " " + ' desbloqueado',
        duration: 2500,
        color: 'success',
        icon: 'checkmark-circle-outline'
      })

      this.db.doc(path2).update({ rol: "basico" })
      this.mostrarUsuarios()
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

  //=========TAREAS=========
  async mostrarTareas() {
    this.loading = true;
    this.tasks = [];

    const querySnapshot = await getDocs(collection(this.db.firestore, "tasks"));
    querySnapshot.forEach((doc) => {
      const userTasks = doc.data() as Task;
       this.tasks.push(userTasks as Task);
    });

    this.tasksActive = !this.tasksActive;
    this.usersVisible = !this.usersVisible;
    this.loading = false;
    this.mostrarBotonSesion = !this.mostrarBotonSesion;
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
    const path = `users/${task.userId}/tasks/`
    
    deleteDoc(doc(this.db.firestore, 'tasks', task.id));
    deleteDoc(doc(this.db.firestore, path, task.id));
    this.utilSvc.presentToast({
      message: 'Tarea eliminada',
      duration: 2500,
      color: 'success',
      icon: 'checkmark-circle-outline'
    })
    this.mostrarTareas()
  }

  filterTasks() {
    if (!this.searchText.trim()) {
      return this.tasks;
    }

    const lowerSearchText = this.searchText.toLowerCase();
    return this.tasks.filter(task =>
      task.title.toLowerCase().includes(lowerSearchText) ||
      task.userEmail.toLowerCase().includes(lowerSearchText)
    );
  }

  filterUsers() {
    if (!this.searchText.trim()) {
      return this.users;
    }

    const lowerSearchText = this.searchText.toLowerCase();
    return this.users.filter(user =>
      user.name.toLowerCase().includes(lowerSearchText)
    );
  }
}
