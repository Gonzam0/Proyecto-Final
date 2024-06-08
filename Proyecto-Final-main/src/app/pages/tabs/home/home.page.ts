import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from 'src/app/models/user.model';
import { Reminder } from 'src/app/models/reminder.model';
import { Task } from 'src/app/models/task.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateReminderComponent } from 'src/app/shared/component/add-update-reminder/add-update-reminder.component';
import { AddUpdateTaskComponent } from 'src/app/shared/component/add-update-task/add-update-task.component';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  tasks: Task[] = []
  reminders: Reminder[] = [];
  currentReminder: Reminder | null = null;
  user = {} as User
  loading: boolean = false
  searchText: string = ''
  totalCreateTasks: number;
  achievements: any[] = []
  userInfos: any[] = [];
  description: string
  title: string
  photoAchievement: string
  rol: string

  constructor(
    private firebaseSvc: FirebaseService,
    private utilSvc: UtilsService,
    private db: AngularFirestore
  ) { }

  ngOnInit() {
    this.user = this.utilSvc.getElementFromLocalStorage('user')
    this.getUserRol();
    this.loadReminders();
    this.scheduleReminderCheck(); // Comienza la comprobación de recordatorios
  }

  scheduleReminderCheck() {
    const now = new Date();
    const secondsUntilNextMinute = 60 - now.getSeconds();
    setTimeout(() => {
      this.showReminder(); // Ejecuta showReminder() en el próximo minuto
      this.scheduleReminderCheck(); // Programa la siguiente comprobación para el próximo minuto
    }, secondsUntilNextMinute * 1000);
  }


  getUser() {
    return this.user = this.utilSvc.getElementFromLocalStorage('user')
  }

  ionViewWillEnter() {
    this.getTasks()
    this.getUser()
    this.getUserRol()
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

    if (this.tasks.length == 1) {

      //Obtiene los datos del logro
      this.firebaseSvc.getData1Collection('achievements ', '1', 'title').subscribe(res => {
        this.title = res;
      }).add(() => {
        this.firebaseSvc.getData1Collection('achievements ', '1', 'description').subscribe(res => {
          this.description = res
        }).add(() => {
          this.firebaseSvc.getData1Collection('achievements ', '1', 'photo').subscribe(res => {
            this.photoAchievement = res
          }).add(() => {
            this.utilSvc.presentToast({
              message: '¡HAS GANADO UN LOGRO! ' + "" + this.title + "" + '----->   ' + this.description,
              duration: 4500,
              color: 'dark',
              icon: 'trending-up',
              position: 'middle',
              cssClass: 'toast-achievement'
            })

            this.achievements.push({ title: this.title, description: this.description, photo: this.photoAchievement })
            console.log(this.achievements)
            this.db.doc(`users/${this.user.uid}/info/${this.user.name}`).update({ achievements: this.achievements }).then(() => {
              console.log('Logro guardado')
              this.achievements = []
            })
          })
        })
      })
    }
  }

  addFavorite(task: Task) {
    let path = `users/${this.user.uid}/tasks/${task.id}`

    this.utilSvc.presentLoading({ message: 'Añadiendo actividad a importante...' });

    this.db.doc(path).update({ type: "importante" }).then(res => {

      this.utilSvc.presentToast({
        message: 'Tarea añadida a importante',
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
        console.log(res)
        this.tasks = res
        sub.unsubscribe()
        this.loading = false
      }
    })
  }

  async addReminder(reminder?: Reminder) {
    const res = await this.utilSvc.presentModal({
      component: AddUpdateReminderComponent,
      componentProps: { reminder },
      cssClass: 'add-update-modal'
    });
    this.ngOnInit()
  }

  async loadReminders() {
    const path = `users/${this.user.uid}/reminders`;
    const querySnapshot = await getDocs(collection(this.db.firestore, path));
    this.reminders = [];
    querySnapshot.forEach((doc) => {
      this.reminders.push(doc.data() as Reminder);
    })

    console.log(this.reminders)
  }

  showReminder() {

    const now = new Date();
    const currentDay = String(now.getDate()).padStart(2, '0');
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = now.getFullYear();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');

    const currentDate = `${currentDay}-${currentMonth}-${currentYear}`;
    const currentTime = `${currentHours}:${currentMinutes}`;

    this.currentReminder = this.reminders.find(reminder => {
      const reminderDate = reminder.remindTime;
      const reminderTime = reminder.remindHour;

      return reminderDate === currentDate && reminderTime === currentTime;
    });

    if (this.currentReminder) {
      console.log('Recordatorio actual:', this.currentReminder);
      this.utilSvc.presentAlert({
        header: 'Recordatorio',
        message: `${this.currentReminder.title} - ${this.currentReminder.description}`,
        mode: 'ios',
        buttons: [
          {
            text: 'Ok',
            role: 'cancel',
          }
        ]
      });
    } else {
      console.log('No hay recordatorios para la fecha y hora actual.');
    }
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

  async deleteTask(task: Task) {
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

    const achievPath = `users/${this.user.uid}/info/${this.user.name}`
    const docRef = doc(this.db.firestore, achievPath);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      if (userData && userData['achievements']) {

        const achievementsLength = userData['achievements'].length;

        if (achievementsLength === 1) {
          this.firebaseSvc.getData2Collection('users', 'info', this.user.uid, this.user.name, 'achievements').subscribe(() => {
              //Obtiene los datos del logro
              this.firebaseSvc.getData1Collection('achievements ', '2', 'title').subscribe(res => {
                this.title = res;
              }).add(() => {
                this.firebaseSvc.getData1Collection('achievements ', '2', 'description').subscribe(res => {
                  this.description = res
                }).add(() => {
                  this.firebaseSvc.getData1Collection('achievements ', '2', 'photo').subscribe(res => {
                    this.photoAchievement = res
                  }).add(() => {
                    this.utilSvc.presentToast({
                      message: '¡HAS GANADO UN LOGRO! ' + "" + this.title + "" + '----->   ' + this.description,
                      duration: 4500,
                      color: 'dark',
                      icon: 'trash-outline',
                      position: 'middle',
                      cssClass: 'toast-achievement'
                    })
                    const docRef = this.db.collection('users')
                      .doc(this.user.uid)
                      .collection('info')
                      .doc(this.user.name);
      
                    // Actualiza el campo 'achievements' con el nuevo logro
                    docRef.update({
                      achievements: firebase.firestore.FieldValue.arrayUnion({
                        title: this.title,
                        description: this.description,
                        photo: this.photoAchievement
                      })
                    }).then(() => {
                      console.log('Logro guardado');
                      this.achievements = [];  // Limpia el array local
                    }).catch((error) => {
                      console.error('Error al guardar el logro: ', error);
                    });
                  })
                })
              })
            
          })
        }
      }
    } else {
      console.log("No such document!");
    }
  }

  filterTasks() {
    if (!this.searchText.trim()) {
      return this.tasks.filter(task => task.active && task.type != "importante");
    }

    return this.tasks.filter(task =>
      task.title.toLowerCase().startsWith(this.searchText.toLowerCase()) && task.active && task.type != "importante");
  }

  getUserRol() {
    this.firebaseSvc.getData2Collection('users', 'info', this.user.uid, this.user.name, 'rol').subscribe(res => {
      this.rol = res;
    });
  }
}