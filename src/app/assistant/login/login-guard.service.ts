import { AuthService } from './auth.service';
import { Injectable } from '@angular/core';
import { CanActivate, Router } from "@angular/router";

@Injectable()
export class LoginGuardService implements CanActivate {

  constructor(
    public router: Router,
    public authService: AuthService) { }

  canActivate() {
    if (this.authService.isLoggedIn()) {
      return true;
    }
    else {
      this.router.navigate(['/assistant/login']);
      return false;
    }
  }

}
