const mongoose = require("mongoose");


// common objects
const likedObj = {
    id: String,
    name: String,
    img: String,
    // liked: Boolean,
    email: String,
};

const comment = {
    name: String, // required
    comment: String, // required
    userId: String, // required
    id: String, // required
    img: String, // required
    likes: Number,
    totalReplies: Number,
    createOn: String,
    reply: [{
        name: String,
        id: String,
        img: String,
        email: String
        // likes: Number,
        // comments: String,
    }],
};

const postSchema = new mongoose.Schema({
    name: String,
    email: String,
    title: String,
    description: String,  // optional
    totalLikes: Number,  // default will be '0'
    comments: [comment],
    likedBy: [likedObj],
    hide: Boolean, // optional default will be false
    createOn: String, // Date field
    totalViews: Number, // default will be '0'
    ownerId: String, // required
});

const voteBy = {
    email: String,
    id: String,
    index:Number,
    date: String,
}

const pollSchema = new mongoose.Schema({
    name: String,
    email: String,
    title: String,
    options: [
        {
            field: String,
            count: Number
        }
    ], // [{},{},......]
    totalLikes: Number,
    totalVotes: Number,
    comments: [comment],
    likedBy: [likedObj],
    voters: [voteBy],
    hide: Boolean,
    createOn: String, // Date field
    ownerId: String,
    pollType: String
});

const Post = mongoose.model("Post", postSchema);
const Poll = mongoose.model("Poll", pollSchema);




module.exports = { Post, Poll };