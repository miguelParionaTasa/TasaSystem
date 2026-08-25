const { EventEmitter } = require("node:events");
const axios = require("axios");

class TelegramBotClient extends EventEmitter {
  constructor(token) {
    super();
    this.http = axios.create({
      baseURL: `https://api.telegram.org/bot${token}`,
      timeout: 35000,
      maxBodyLength: 512 * 1024,
      maxContentLength: 2 * 1024 * 1024,
      proxy: false,
    });
    this.offset = 0;
    this.running = false;
    this.textHandlers = [];
  }

  dispatchAsync(event, ...args) {
    for (const listener of this.listeners(event)) {
      Promise.resolve(listener(...args)).catch((error) => this.emit("polling_error", error));
    }
  }

  onText(regex, handler) {
    this.textHandlers.push({ regex, handler });
    return this;
  }

  async call(method, payload = {}) {
    const { data } = await this.http.post(`/${method}`, payload);
    if (!data.ok) throw new Error(`Telegram rechazó ${method}`);
    return data.result;
  }

  sendMessage(chatId, text, options = {}) {
    return this.call("sendMessage", { chat_id: chatId, text, ...options });
  }

  answerCallbackQuery(callbackQueryId, options = {}) {
    return this.call("answerCallbackQuery", { callback_query_id: callbackQueryId, ...options });
  }

  dispatch(update) {
    if (update.message) {
      const message = update.message;
      for (const { regex, handler } of this.textHandlers) {
        regex.lastIndex = 0;
        const match = regex.exec(message.text || "");
        if (match) Promise.resolve(handler(message, match)).catch((error) => this.emit("polling_error", error));
      }
      this.dispatchAsync("message", message);
    }
    if (update.callback_query) this.dispatchAsync("callback_query", update.callback_query);
  }

  async start() {
    if (this.running) return;
    this.running = true;
    while (this.running) {
      try {
        const updates = await this.call("getUpdates", { offset: this.offset, timeout: 25, allowed_updates: ["message", "callback_query"] });
        for (const update of updates) {
          this.offset = update.update_id + 1;
          this.dispatch(update);
        }
      } catch (error) {
        if (this.running) {
          this.emit("polling_error", error);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }
  }

  async stop() {
    this.running = false;
  }
}

module.exports = TelegramBotClient;
