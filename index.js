const Slimbot = require("slimbot")
const slimbot = new Slimbot(process.env["KEY"])
//using this to host on heroku
const express = require("express")
const app = express()

app.get("/", (req, res) => res.send("Hello World!"))

app.listen(process.env["PORT"], () => console.log(""))

const firebase = require("firebase")

// Initialize Firebase
var config = {
  apiKey: process.env["API_KEY"],
  authDomain: "mentionbot-fa86b.firebaseapp.com",
  databaseURL: "https://mentionbot-fa86b.firebaseio.com",
  projectId: "mentionbot-fa86b",
  storageBucket: "mentionbot-fa86b.appspot.com",
  messagingSenderId: "271181642792"
}
console.log(config)
const fireApp = firebase.initializeApp(config)

let mentions = {}

newMention = function(mention, username) {
  if (mentions[mention] !== undefined) return false
  mentions[mention] = [username]
  return true
}

assignToMention = function(mention, username) {
  if (mentions[mention] === undefined) return false

  if (!mentions[mention].find(u => u == username)) {
    mentions[mention].push(username)
  }
  return true
}

deleteMention = function(mention) {
  console.log("deleted " + mention + " " + mentions[mention])
  delete mentions[mention]
}

getMention = function(mention) {
  if (mentions[mention] === undefined || mentions[mention].length == 0)
    return ""
  return mentions[mention].map(id => "@" + id).join(" ")
}

// Register listeners

slimbot.on("message", message => {
  if (!message.text) return
  mention = firebase
    .database()
    .ref("/groups/" + message.chat.id)
    .once("value")
    .then(function(snapshot) {
      mentions = snapshot.val() || {}
      console.log(mentions)

      if (message.text.startsWith("/newMention ")) {
        let mention = message.text.split(" ")[1]
        let user = message.from.username
        if (newMention(mention, user)) {
          slimbot.sendMessage(
            message.chat.id,
            "Mention @" + mention + " created."
          )
        } else {
          slimbot.sendMessage(
            message.chat.id,
            "Mention @" + mention + " already exists."
          )
        }
      } else if (message.text.startsWith("/assignTo ")) {
        let mention = message.text.split(" ")[1]
        let user = message.from.username
        if (assignToMention(mention, user)) {
          slimbot.sendMessage(
            message.chat.id,
            "user @" + user + " assigned to @" + mention + "."
          )
        } else {
          slimbot.sendMessage(
            message.chat.id,
            "Mention @" +
              mention +
              " does not exists. Use /newMention to create."
          )
        }
      } else if (message.text.startsWith("/deleteMention ")) {
        let mention = message.text.split(" ")[1]
        deleteMention(mention)
        slimbot.sendMessage(
          message.chat.id,
          "Mention @" + mention + " deleted."
        )
      } else if (message.text[0] === "@") {
        let mention = message.text.split(" ")[0].replace("@", "")
        let response = getMention(mention)
        if (response !== "")
          slimbot.sendMessage(message.chat.id, response, {
            reply_to_message_id: message.message_id
          })
      }
      console.log(mentions)
      firebase
        .database()
        .ref("/groups/" + message.chat.id)
        .set(mentions)
    })
})

// Call API

slimbot.startPolling()
