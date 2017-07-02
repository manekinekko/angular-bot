import { Router } from '@angular/router';
import { Injectable, NgZone } from '@angular/core';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from "angularfire2/auth";

export class User {
  constructor(
    public displayName: string,
    public email: string,
    public photoURL: string,
    public uid: string
  ) {}
}

@Injectable()
export class AuthService {

  constructor(
    public afAuth: AngularFireAuth, 
    private router: Router,
    private zone: NgZone) { }

  getUser(): User {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  async login(provider, userCred?) {
    let user = {} as User;
    let result: any = {};
    try {

      if (provider === 'email') {
        const response = await this.afAuth.auth.signInWithEmailAndPassword(userCred.email, userCred.password);
        user = {
          displayName: response.email,
          email: response.email,
          photoURL: 'assets/angular.png',
          uid: response.email
        };
      }
      else {
        result = await this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
        user = {
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
          uid: result.user.uid
        };
      }

      localStorage.setItem('user', JSON.stringify(user));
      this.router.navigate(['/assistant/chat']);
    }
    catch(e) {
      console.log(e);
    }
    return user;
  }

  async logout() {
    await this.afAuth.auth.signOut();
    localStorage.removeItem('user');
    this.router.navigate(['/assistant/login']);
  }

  isLoggedIn() {
    return localStorage.getItem('user') !== null;
  }

}
