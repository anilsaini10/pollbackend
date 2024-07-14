// app.js
const express = require('express');
const http = require("http")
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const route = require('./routes/index');
const { Poll, Post } = require('./model/post');

const TEST = mongoose.model("TEST", { name: String });

const URL = "mongodb+srv://anilsaini:anilsaini@cluster0.4bvjjyj.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB Atlas');
});


let corsOptions = {
  origin: ['http://192.168.192.209:8081', 'http://192.168.192.57:8081', 'http://127.0.0.1:8081', 'http://localhost:8081', 'http://192.168.1.35:8081', 'http://localhost:3000'],
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: '*',
  optionsSuccessStatus: 200,
};

app.use(express.json()); // for json
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("", route);

const server = http.createServer(app);

const io = new Server(server);



io.on('connection', (socket) => {

  socket.on('send_message', async (data, callback) => {
    console.log('a user connected', data);

    const newTest = new TEST(data);
    await newTest.save();
    const list = await TEST.find();
    io.emit('received_message', list.length, callback)
  });


  socket.on('send_like', async (data, callback) => {
    console.log('a user connected', data);
    const type = data?.type;
    const id = data?.id;
    const email = data?.email;
    let likeObj = {};
    try {

      if (type == "poll") {
        likeObj = await Poll.findById(id);
      } else {
        likeObj = await Post.findById(id);
      };
      const arr = likeObj?.likedBy?.filter((item) => item?.email === email);
      const LIKED = arr?.[0] ? true : false;
      console.log("arr1", likeObj?.likedBy)
      io.emit('received_like', { likedBy: likeObj?.likedBy, liked: LIKED }, callback);
    } catch (error) {
      io.emit('received_like', { message: "Something went wrong", status: 404 });
      console.log("ERROR LIKES -> ", error);
    }
  })

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

});



server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

