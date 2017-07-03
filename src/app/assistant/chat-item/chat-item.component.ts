import { Component, OnInit, Input } from '@angular/core';
import { Message } from '../chat/chat.component';

@Component({
  selector: 'app-chat-item',
  templateUrl: './chat-item.component.html',
  styleUrls: ['./chat-item.component.scss']
})
export class ChatItemComponent implements OnInit {

  @Input() model = {} as Message;
  @Input() display: string = 'row';
  
  constructor() {
  }

  ngOnInit() {
    this.model.message = this.model.message.replace(/\s?\(http.*?\)/, '');
  }

  ngOnChanges() {
  }

}
