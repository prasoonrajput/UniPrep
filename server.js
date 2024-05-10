import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { GoogleGenerativeAI } from "@google/generative-ai";

import connectdb from "./config/db.js";
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI);

// try {
//   await connectdb();
//   console.log("db connectd");
// } catch (error) {
//   console.log("Database connection error" + error);
// }

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: {
    options: {
      polling: {
        // Specify the port here
        port: process.env.PORT || 5001,
      },
    },
  },
});

bot.start(async (ctx) => {
  const from = ctx.update.message.from;
  await ctx.reply(
    `Greetings! ${from.first_name} I'm UniPrep, your one-stop solution for university exam resources and support.`
  );
});

bot.on((message('text')),async (ctx) => {
  //   ctx.reply("Welcome to the UniPrep Bot");
  const from = await ctx.update.message.from;
  const message = await ctx.update.message.text;
  console.log(from);
  const { message_id: waitingMeassage } = await ctx.reply(
    `Hey! ${from.first_name}, Kindley wait for a moment.I am curating post for you`
  );
  const { message_id: stickerwaitingId } = await ctx.replyWithSticker(
    "CAACAgIAAxkBAAIBSWY13Nf0sFlR2LaiLmVPOJemSi7nAAIxAAMNttIZXdKISghjh-80BA"
  );

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: `i am giving you topic name for universty subject topic ${message}`,
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "Imagine you're a diligent student who consistently tops your class. You're known for your exceptional note-taking skills, which greatly contribute to your academic success. Describe how you prepare your notes for exams and the strategies you use to ensure they are comprehensive and effective.giving solution to the topic in 250 words to 300 words and in points wise like bullets points for topics and sub topics ",
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });
    const msg =
      "Create the answer for the topics in point wise with its types,advantage,disadvantage and example in concise and brief manner";

    const result = await chat.sendMessageStream(msg);
    console.log(result);

    let text = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      console.log("Chunk Text:", chunkText);
      text += chunkText;
    }

    const response = await result.response;
    console.log("Response:", response);

    console.log("Full Response:", text);
    await ctx.reply(text);
    // For multi-turn conversations (like chat)
    const history = await chat.getHistory();
    const msgContent = { role: "user", parts: [{ text: msg }] };
    const contents = [...history, msgContent];
    const { totalTokens } = await model.countTokens({ contents });
    console.log(totalTokens);
  } catch (e) {
    console.log("something went wrong.Plz try agsin later" + error);
  }
  await ctx.deleteMessage(waitingMeassage);
  await ctx.deleteMessage(stickerwaitingId);
});

bot.command("help", (ctx) => {
  ctx.reply("Plz contact admin @Rajput4218");
});
bot.command("admin", async (ctx) => {
  ctx.reply("For support plz contaact admin @Rajput4218");
  ctx.reply("Admin Instagram : www.instagram.com/rajput.prasoon");
  ctx.reply("Admin Twitter : www.x.com/0xrajput");
});

bot.command("quit", async (ctx) => {
  // Explicit usage
  await ctx.telegram.leaveChat(ctx.message.chat.id);

  // Using context shortcut
  await ctx.leaveChat();
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
