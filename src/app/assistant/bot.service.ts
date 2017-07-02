import { ApiAiClient, IServerResponse } from "api-ai-javascript";
import { Injectable, Inject, InjectionToken } from '@angular/core';

@Injectable()
export class BotService {

  client: ApiAiClient;

  constructor(@Inject('ApiAiAccessToken') accessToken) {
    this.client = new ApiAiClient({accessToken})
  }

  async ask(message: string) {
    try {
      const response = await this.client.textRequest(message) as any;
      const url = response.result.contexts && response.result.contexts[0] && response.result.contexts[0].parameters.url;
      return {
        speech: response.result.fulfillment.speech,
        url
      }
    }
    catch(error) {
      console.error(error);
    }
  }

}
