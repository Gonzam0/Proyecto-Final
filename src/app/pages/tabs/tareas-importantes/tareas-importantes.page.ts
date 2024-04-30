import { Component, OnInit } from '@angular/core';
import { User } from 'firebase/auth';
import { Task } from 'src/app/models/task.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-tareas-importantes',
  templateUrl: './tareas-importantes.page.html',
  styleUrls: ['./tareas-importantes.page.scss'],
})
export class TareasImportantesPage implements OnInit {

  tasks: Task[] = []
  user = {} as User
  loading: boolean = false
  
  constructor(
    private firebaseSvc: FirebaseService,
    private utilSvc: UtilsService
  ) {}

  ngOnInit() {
  }

  getUser() {
    return this.user = this.utilSvc.getElementFromLocalStorage('user')
  }

}
