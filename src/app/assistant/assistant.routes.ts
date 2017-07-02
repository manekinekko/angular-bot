import { AssistantComponent } from './assistant/assistant.component';
import { LoginGuardService } from './login/login-guard.service';
import { LoginComponent } from './login/login.component';
import { RouterModule, Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';

export const ROUTES: Routes = [
  {path: 'assistant', component: AssistantComponent, children: [
    {path: '', redirectTo: 'chat', pathMatch: 'full'},
    {path: 'chat', component: ChatComponent, canActivate: [LoginGuardService]},
    {path: 'login', component: LoginComponent}
  ]}
];
