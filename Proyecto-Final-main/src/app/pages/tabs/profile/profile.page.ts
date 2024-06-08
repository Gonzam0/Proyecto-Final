import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { deleteUser, getAuth } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { Achievement } from 'src/app/models/achievements.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  user = {} as User
  userForm: FormGroup;
  editing: boolean = false;
  name: string
  email: string
  city: string
  photo: string
  age: number
  achievements: Achievement[] = []


  constructor(
    private firebaseSvc: FirebaseService,
    private utilSvc: UtilsService,
    private db: AngularFirestore,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.getUser()
    this.getDataUser()

    this.userForm = this.formBuilder.group({
      age: ['', [Validators.required, Validators.min(8), Validators.max(120)]],
      city: ['', [Validators.required, Validators.pattern(/^[a-zA-Z ]+$/)]], // Expresión regular para permitir solo letras y espacios en blanco
    });
  }

  edit() {
    this.editing = true;
    this.initializeForm();
  }

  //=====SE EJECUTA CUANDO SE INICIA LA PAGINA=====
  ionViewWillEnter() {
    this.getUser()
    this.getDataUser()
    this.loadAchievements()
  }

  getUser() {
    return this.user = this.utilSvc.getElementFromLocalStorage('user')
  }

  //=====OBTENER DATOS DE USUARIO=====
  getDataUser() {
    this.firebaseSvc.getData2Collection('users', 'info', this.user.uid, this.user.name, 'age').subscribe(res => {
      this.age = parseInt(res)
    })

    this.firebaseSvc.getData2Collection('users', 'info', this.user.uid, this.user.name, 'city').subscribe(res => {
      this.city = res
    })

    this.firebaseSvc.getData2Collection('users', 'info', this.user.uid, this.user.name, 'email').subscribe(res => {
      this.email = res
    })

    this.firebaseSvc.getData2Collection('users', 'info', this.user.uid, this.user.name, 'photo').subscribe(res => {
      this.photo = res
    })

    this.firebaseSvc.getData2Collection('users', 'info', this.user.uid, this.user.name, 'name').subscribe(res => {
      this.name = res
    })
  }



  //=====TOMAR O SELECCIONAR IMAGEN=====
  async takePicture() {
    const dataUrl = (await this.utilSvc.takePicture('Foto de Perfil')).dataUrl;
    this.db.doc(`users/${this.user.uid}/info/${this.user.name}`).update({ photo: dataUrl }).then(() => {
      this.utilSvc.presentToast({
        message: 'Imagen actualizada',
        duration: 2500,
        color: 'success',
        icon: 'checkmark-circle-outline'
      })

      this.user.photo = dataUrl;
      this.utilSvc.setElementInLocalStorage('user', this.user)
      this.getDataUser()
    })
  }

  initializeForm() {
    this.userForm = new FormGroup({
      age: new FormControl(this.user.age, [Validators.required]),
      city: new FormControl(this.user.city, [Validators.required]),
    });
  }

  async saveChanges() {
    if (this.userForm.valid) {
      let path = `users/${this.user.uid}/info/${this.user.name}`;

      this.db.doc(path).update({
        age: this.userForm.value.age,
        city: this.userForm.value.city
      }).then(() => {

        this.utilSvc.presentToast({
          message: 'Usuario actualizado',
          duration: 2500,
          color: 'success',
          icon: 'checkmark-circle-outline'
        })

        this.user.age = this.userForm.value.age;
        this.user.city = this.userForm.value.city;

        this.utilSvc.setElementInLocalStorage('user', this.user)
        this.editing = false;

        this.getDataUser()
      })
    }
  }

  cancel() {
    // Restaurar los valores originales del usuario
    this.userForm.patchValue({
      name: this.user.name,
      age: this.user.age,
      email: this.user.email,
      city: this.user.city
    });
    this.editing = false;
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

  async loadAchievements() {
    const path = `users/${this.user.uid}/info/${this.user.name}`;

    try {
      const docRef = doc(this.db.firestore, path);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData && userData['achievements']) {
          this.achievements = userData['achievements'];
        }
      } else {
        console.log("No such document!");
      }
    } catch (e) {
      console.error("Error fetching document: ", e);
    }

    console.log(this.achievements);
  }

  confirmDeleteUser() {
    this.utilSvc.presentAlert({
      header: 'Eliminar usuario',
      message: '¿Deseas eliminar tu usuario?',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        }, {
          text: 'Si, eliminar',
          handler: () => {
            this.deleteAccount()
          }
        }
      ]
    })
  }

  deleteAccount() {
    const auth = getAuth();
    const userAuth = auth.currentUser;
    console.log(userAuth)
    const path = `users/${this.user.uid}/`

    //Borrar usuario de Auth
    //deleteUser(userAuth)

    //Borrar usuario de Firestore
    const userDoc = doc(this.db.firestore, path);
    deleteDoc(userDoc).then(() => {
      this.utilSvc.presentToast({
        message: 'Cuenta eliminada',
        duration: 2500,
        color: 'success',
        icon: 'checkmark-circle-outline'
      })

      this.firebaseSvc.deleteSubCollection(path, 'tasks')
      this.firebaseSvc.deleteSubCollection(path, 'info')
      this.firebaseSvc.deleteSubCollection(path, 'reminders')
      
      this.utilSvc.routerLink('/sign-up');
    })

    //localStorage.removeItem('user');

  }

}
