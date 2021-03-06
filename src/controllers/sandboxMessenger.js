/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the GPL v2.0+ license found in the
 * LICENSE file in the root directory of this source tree.
 */
import MessengerController from "./messenger";
import Participants from "../utils/participants";

export default class extends MessengerController {
  constructor(name, main, className = null) {
    super(name, main, className);
  }

  async appendConversationsMessages(conversations, since = 0) {
    const convs = [];
    /* eslint-disable no-restricted-syntax */
    /* eslint-disable no-await-in-loop */
    for (const conversation of conversations) {
      const messages = await this.getConversationMessages(
        conversation.id,
        since,
      );
      const c = { messages, ...conversation };
      convs.push(c);
    }
    /* eslint-enable no-restricted-syntax */
    /* eslint-enable no-await-in-loop */
    return convs;
  }

  async buildBotConversation(user, botId) {
    const bot = await this.main.getBots().getBot(botId, user.id);
    // logger.info("bot=", bot);
    if (bot) {
      const participants = Participants([
        user,
        { name: bot.name, id: bot.id, type: "bot" },
      ]);
      const conversation = await this.createConversation(user, {
        participants,
        origin: botId,
      });
      return conversation;
    }
    return null;
  }

  async getBotUserConversation(user, botId) {
    const conversations = await this.getConversations(user, 0, botId, false);
    let conversation = null;
    if (conversations.length === 0) {
      conversation = await this.buildBotConversation(user, botId);
    } else {
      [conversation] = conversations;
    }
    return conversation;
  }

  async getFullBotConversations(user, botId, isAdmin = false) {
    const conversations = await this.getConversations(user, 0, botId, isAdmin);
    // logger.info("getFullBotConv", user.username, conversations);
    if (conversations.length === 0) {
      const conversation = await this.buildBotConversation(user, botId);
      if (conversation) {
        conversations.push(conversation);
      } else {
        return { error: "Can't get messages" };
      }
    }
    return this.appendConversationsMessages(conversations);
  }

  async resetConversations(user, botId, isAdmin = false) {
    await this.deleteConversations(user, botId, isAdmin);
    const conversations = await this.getFullBotConversations(
      user,
      botId,
      isAdmin,
    );
    if (!conversations.error) {
      const conversation = conversations[0];
      const conversationId = conversation.id;
      if (this.className) {
        await this.dispatch(this.className, {
          origin: conversation.origin,
          author: conversation.author,
          conversationId,
          action: "resetConversation",
        });
      }
      return { result: "ok" };
    }
    return conversations;
  }
}
