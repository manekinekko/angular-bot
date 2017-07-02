import { BotService } from './../bot.service';
import { AuthService, User } from './auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'sfeir-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  userCred: { email: string | null; password: string | null };
  user: User;

  constructor(
    public authService: AuthService,
    public bot: BotService,
    public router: Router) {

    this.user = {} as User;
    this.userCred = { email: null, password: null};  
  }

  ngOnInit() {
    this.authService.afAuth.authState.subscribe(user => {
      if (user) {
        this.user = user as User;
      }
    });
  }
}
