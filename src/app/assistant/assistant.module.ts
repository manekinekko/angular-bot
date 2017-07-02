import { LoginGuardService } from './login/login-guard.service';
import { AngularFireAuth } from 'angularfire2/auth';
import { AuthService } from './login/auth.service';
import { RouterModule } from "@angular/router";
import { NgModule, ModuleWithProviders } from "@angular/core";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from "@angular/common";
import {
  MdButtonModule,
  MdCardModule,
  MdInputModule,
  MdIconModule
} from "@angular/material";
import { FormsModule } from "@angular/forms";
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';

import { ChatInputComponent } from "./chat-input/chat-input.component";
import { ChatListComponent } from "./chat-list/chat-list.component";
import { ChatComponent } from "./chat/chat.component";
import { LoginComponent } from "./login/login.component";
import { ChatItemComponent } from './chat-item/chat-item.component';
import { AssistantComponent } from "./assistant/assistant.component";
import { ROUTES } from "./assistant.routes";
import { environment } from './../../environments/environment';
import { BotService } from "./bot.service";

@NgModule({
  imports: [
    CommonModule,
    MdButtonModule,
    MdCardModule,
    MdInputModule,
    MdIconModule,
    FormsModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(ROUTES),
    AngularFireModule.initializeApp(environment.firebase), 
    AngularFireDatabaseModule, 
    AngularFireAuthModule, 
  ],
  declarations: [
    AssistantComponent,
    LoginComponent,
    ChatComponent,
    ChatListComponent,
    ChatInputComponent,
    ChatItemComponent
  ],
  exports: [AssistantComponent]
})
export class AssistantModule {
  static configure(options): ModuleWithProviders {
    return {
      ngModule: AssistantModule,
      providers: [
        { provide: "ApiAiAccessToken", useValue: options.accessToken },
        BotService,
        AuthService,
        LoginGuardService
      ]
    };
  }
}
