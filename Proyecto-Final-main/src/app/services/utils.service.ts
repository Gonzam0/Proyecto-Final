import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, AlertOptions, LoadingController, LoadingOptions, ModalController, ModalOptions, ToastController, ToastOptions } from '@ionic/angular';
import { Task } from 'src/app/models/task.model';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { User } from '../models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  tasks: Task[] = []
  achievements: any[] = []
  description: string
  title: string
  photoAchievement: string

  constructor(
    private loadingController: LoadingController,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController,
    private db: AngularFirestore
  ) { }

  async takePicture(promptLabelHeader: string) {
    return await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      promptLabelHeader,
      promptLabelPhoto: 'Escoge una imagen',
      promptLabelPicture: 'Haz una foto',
    });
  };

  async presentLoading(opts: LoadingOptions) {
    const loading = await this.loadingController.create(opts);
    await loading.present();
  }

  async dismissLoading() {
    return await this.loadingController.dismiss();
  }

  //===INSERTAR USUARIO EN LOCAL STORAGE===
  setElementInLocalStorage(key: string, element: any) {
    return localStorage.setItem(key, JSON.stringify(element))
  }

  //===OBTENER USUARIO DE LOCAL STORAGE===
  getElementFromLocalStorage(key: string) {
    return JSON.parse(localStorage.getItem(key))
  }


  async presentToast(opts: ToastOptions) {
    const toast = await this.toastController.create(opts);
    toast.present();
  }

  async presentAchievementToast(opts: ToastOptions) {
    const toast = await this.toastController.create(opts);
    toast.present();
  }

  //===REDIRECCIONAR===
  routerLink(link: string) {
    return this.router.navigate([link])
  }

  //===ALERT===
  async presentAlert(opts: AlertOptions) {
    const alert = await this.alertController.create(opts);

    await alert.present();
  }

  //===MODAL===
  //===PRESENTAR MODAL===
  async presentModal(opts: ModalOptions) {
    const modal = await this.modalController.create(opts);
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      return data;
    }
  }

  //===OCULTAR MODAL===
  dismissModal(data?: any) {
    this.modalController.dismiss(data);
  }

  getPercentage(task: Task) {
    let completedItems = task.items.filter(item => item.completed).length;
    let totalItems = task.items.length;
    let percentage = (100 / totalItems) * completedItems;
    return parseInt(percentage.toString());
  }
}
