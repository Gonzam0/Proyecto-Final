import { Injectable, inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../models/user.model';
import { getAuth, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { UtilsService } from './utils.service';
import { Observable, catchError, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(
    private auth: AngularFireAuth,
    private db: AngularFirestore,
    private utilSvc: UtilsService
  ) { }

  user = {} as User

  auths = inject(AngularFireAuth);

  //=====AUTENTIFICAR USUARIO=====
  login(user: User) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  //=====REGISTRAR USUARIO=====
  signup(user: User) {
    return this.auth.createUserWithEmailAndPassword(user.email, user.password);
  }

  getUidUser() {
    return getAuth().currentUser.uid
  }

  getNameUser() {
    return getAuth().currentUser.displayName
  }

  /*=====RECUPERAR DATOS USUARIO DE FIREBASE=====*/
  async getInfo() {
    let path = `users/${this.user.uid}/info/${this.user.name}`

    const userDoc = await this.db.doc<User>(path).ref.get();
    if (!userDoc.exists) {
      throw new Error('No se encontraron datos del usuario');
    }
    this.utilSvc.setElementInLocalStorage('user', userDoc.data() as User)
  }

  //=====OBTENER DATOS DE FIREBASE=====
  getData1Collection(collection: string, Id: string, data: string): Observable<string> {
    return this.db.collection(collection).doc(Id).get().pipe(
      map(doc => {
        if (doc.exists) {
          return doc.data()[data].toString();
        } else {
          console.log('No se encontraron datos');
        }
      })
    );
  }

  getData2Collection(collection: string, collection2: string, Id1: string, Id2: string, data: string): Observable<string> {
    return this.db.collection(collection).doc(Id1).collection(collection2).doc(Id2).get().pipe(
      map(doc => {
        if (doc.exists) {
            const docData = doc.data();
            if (docData && docData[data] !== undefined) {
                return docData[data].toString();
            } else {
                console.error(`Field '${data}' not found in document ${Id2}`);
                return 'No data found';
            }
        } else {
            console.error(`Document ${Id2} not found in collection ${collection2}`);
            return 'No data found';
        }
    }),
    catchError(error => {
        console.error(`Error fetching document: ${error}`);
        return of('Error fetching data');
    })
    );
}

  updateUser(user: any) {
    const auth = getAuth();
    return updateProfile(auth.currentUser, user);
  }

  getAuthState() {
    return this.auth.authState;
  }

  //=====DESLOGUEAR USUARIO=====
  async singOut() {
    await this.auth.signOut();
    this.utilSvc.routerLink('/auth');
    localStorage.removeItem('user');
  }


  //=====FIRESTORE(BBDD)=====
  //=====Obtener coleccion de un usuario=====
  getSubCollection(path: string, subCollectionName: string) {
    return this.db.doc(path).collection(subCollectionName).valueChanges({ idField: 'id' });
  }

  //=====Obtiene los reminders=====
  getSubCol(path: string): Observable<any[]> {
    return this.db.collection(path).snapshotChanges();
  }

  //=====Obtener todos los usuarios=====
  getAllUsers(): Observable<User[]> {
    return this.db.collection<User>('users').valueChanges();
  }

  getCollection(path: string) {
    return this.db.collection(path).valueChanges();
  }

  //=====Eliminar coleccion de un usuario=====
  deleteSubCollection(path: string, subCollectionName: string) {
    return this.db.doc(path).collection(subCollectionName).doc().delete();
  }

  //=====Añadir coleccion de un usuario con ID específico=====
  addSubCollection(path: string, subCollectionName: string, object: any, docId?: string) {
    const collectionRef = this.db.doc(path).collection(subCollectionName);
    if (docId) {
      return collectionRef.doc(docId).set(object);
    } else {
      return collectionRef.add(object);
    }
  }

  //=====Añadir un documento=====
  addDocument(path: string, object: any) {
    return this.db.doc(path).set(object);
  }

  //=====Actualizar documento de un usuario=====
  updateDocument(path: string, object: any) {
    return this.db.doc(path).update(object);
  }

  //=====Obtener recordatorios de un usuario=====
  fetchReminders(userId: string) {
    return this.db.collection('users').doc(userId).collection('reminders').valueChanges();
  }

  //=====Obtener logros=====
  getAchievements(path: string): Observable<any[]> {
    return this.db.collection(path).get().pipe(
      map(snapshot => snapshot.docs.map(doc => doc.data())),
      catchError(err => {
        console.error('Error al obtener los logros:', err);
        return of([]);
      })
    );
  }

}
