import { BotService } from './../bot.service';
import { AuthService, User } from './../login/auth.service';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import {
  FirebaseListObservable,
  AngularFireDatabase
} from "angularfire2/database";

export class Message {
  constructor(
    public user: User,
    public date: number,
    public message: string,
    public url?: {title: string; description: string; img: string, href: string}
  ) {}
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewInit {

  @ViewChild('scrollerRef') scrollerRef: ElementRef;

  thread: FirebaseListObservable<Message[]>;
  user: User;

  constructor(
    private db: AngularFireDatabase,
    private bot: BotService,
    public authService: AuthService
  ) {
  }

  ngOnInit() {
    this.user = this.authService.getUser();
    if (this.user) {
      this.thread = this.db.list(`/history/user_uid_${this.user.uid}`, {
          query: {
            orderBy: 'date',
            limitToLast: 20
          }
        });
      // this.greetUser();
    }
    else {
      throw Error('User not found. Are you logged in?');
    }
  }

  ngAfterViewInit() {
    this.scrollDown(1000);
  }

  async sendMessage(message) {

    if (this.user) { 
      await this.thread.push(new Message(this.user, new Date().getTime(), message, {} as any));
      this.scrollDown(10);

      const response = await this.bot.ask(message);
      await this.thread.push(new Message(new User('ngBot', '', 'assets/angular-bot.png', this.user.uid), new Date().getTime(), response.speech, response.url || null));
      this.scrollDown(10);

    }
    else {
      throw Error('User is empty. Are you logged in?');
    }

    
  }

  private greetUser() {
    this.authService.afAuth.authState.subscribe(async (user) => {
      if (user) {
        const response = await this.bot.ask(`new session with ${user.displayName}`);
        await this.thread.push(new Message(new User('ngBot', '', 'assets/angular-bot.png', this.user.uid), new Date().getTime(), response.speech, response.url || null));
      }
    });
  }

  private scrollDown(delay) {
    setTimeout(_ => this.scrollerRef.nativeElement.scrollIntoView(), delay);
  }

}
