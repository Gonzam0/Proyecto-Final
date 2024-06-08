import { Component, OnInit } from '@angular/core';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage implements OnInit {

  constructor(
    private utilSvc: UtilsService
  ) {}

  isAdmin: boolean = false;

  ngOnInit() {
    this.checkUserRole()
  }

  checkUserRole() {
    const user = this.utilSvc.getElementFromLocalStorage('user');
    if (user && user.rol === 'admin') {
      this.isAdmin = true;
    } else {
      this.isAdmin = false;
    }
  }

}
