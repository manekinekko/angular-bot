import { RouterModule } from '@angular/router';
import { BrowserModule } from "@angular/platform-browser";
import { NgModule, InjectionToken } from "@angular/core";
import {
  MdToolbarModule,
  MdButtonModule,
  MdIconModule,
  MdMenuModule
} from "@angular/material";
import { AssistantModule } from "./assistant/assistant.module";
import { environment } from './../environments/environment.prod';
import { AppComponent } from "./app.component";

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    MdToolbarModule,
    MdIconModule,
    MdButtonModule,
    MdMenuModule,
    RouterModule.forRoot([{path: '', redirectTo: 'assistant', pathMatch: 'full'}], {useHash: true}),
    AssistantModule.configure(environment.apiAi)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
