import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../models/user.model';
import { getAuth, updateProfile } from "firebase/auth";
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(
    private auth: AngularFireAuth,
    private db: AngularFirestore,
    private utilSvc: UtilsService
  ) { }

  //=====AUTENTIFICAR USUARIO=====
  login(user: User) {
    return this.auth.signInWithEmailAndPassword(user.email, user.password);
  }

  //=====REGISTRAR USUARIO=====
  signup(user: User) {
    return this.auth.createUserWithEmailAndPassword(user.email, user.password);
  }

  updateUser(user: any) {
    const auth = getAuth();
    return updateProfile(auth.currentUser, user);
  }

  getAuthState(){
    return this.auth.authState;
  }

  //=====DESLOGUEAR USUARIO=====
  async singOut() {
    await this.auth.signOut();
    this.utilSvc.routerLink('/auth');
    localStorage.removeItem('user');
  }


  //=====FIRESTORE(BBDD)=====
  //=====Obtener tareas de un usuario=====
  getSubCollection(path: string, subCollectionName: string) {
    return this.db.doc(path).collection(subCollectionName).valueChanges( {idField: 'id'} );
  }

  //=====Añadir tareas de un usuario=====
  addSubCollection(path: string, subCollectionName: string, object: any) {
    return this.db.doc(path).collection(subCollectionName).add(object);
  }

  //=====Actualizar tareas de un usuario=====
  updateDocument(path: string, object: any) {
    return this.db.doc(path).update(object);
  }

  //=====Eliminar tareas de un usuario=====
  deleteDocument(path: string) {
    return this.db.doc(path).delete();
  }
}
