// const functions = require("firebase-functions");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
// import { Configuration, OpenAIApi } from "openai";
const {conversation} = require("@assistant/conversation");
const functions = require("firebase-functions");
const app = conversation();


const {Configuration, OpenAIApi} = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});


const admin = require("firebase-admin");

// const serviceAccount = require("/Users/jwwei2/Desktop/Random Bot/"+
// "actpro-xypifv-firebase-adminsdk-fhkys-99ac9bbff9.json");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://actpro-xypifv.firebaseio.com",
});

const db = admin.firestore();
const openai = new OpenAIApi(configuration);
// const response = await openai.retrieveEngine("text-davinci-002");


// const admin = require("firebase-admin");
// const {user} = require("firebase-functions/lib/providers/auth");

// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
//   databaseURL: "https://actpro-xypifv.firebaseio.com",
// });

app.handle("getResponse", (conv) => {
  // Implement your code here
//   food = conv.intent.params['food_entity'].original;
  conv.add("Hello");
});


app.handle("sendGreeting", async (conv) => {
  const sessionID = conv.session.id.slice(-6, -1);
  // const docRef = db.collection("user").doc(session_ID);
  const response = await openai.createCompletion("text-davinci-002", {
    prompt: "Write a funny greeting in a question form.",
    temperature: 0.7,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  conv.add(response.data.choices[0].text);
  const origin = {conv: "The following is a conversation with an AI assistant."+
  " The assistant is sarcastic but very friendly, "+
  "and it asks questions about sleep." +
  "\nHuman: Hi, who are you?\nAI: I'm a robot and I'm feeling great."+
  " How about you?\nHuman:"};
  await db.collection("user").doc(sessionID).set(origin);
});

app.handle("startTester", async (conv) => {
  // const docRef = db.collection("user");
  const sessionID = conv.session.id.slice(-6, -1);
  const any = conv.intent.query;
  const history = await db.collection("user").doc(sessionID).get();
  const curConvInput = history.data().conv.toString() + "\nHuman:" + any;
  console.log(history.data().conv.toString());
  const response = await openai.createCompletion("text-davinci-002", {
    prompt: curConvInput +"\nAI:",
    temperature: 0.8,
    max_tokens: 75,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0.6,
    stop: [" AI:"],
  });
  // conv.add(any);
  const res = response.data.choices[0].text;
  conv.add(res);
  const nextConvHistory = {conv: curConvInput + "\nAI:" + res};
  await db.collection("user").doc(sessionID).update(nextConvHistory);
  // conv.add("Hi there! It's good to see you!");
});

exports.ActionsOnGoogleFulfillment = functions.https.onRequest(app);
