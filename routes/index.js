const express = require("express");

const route = express.Router();

const user_path = require("../controllers/auth/user");
const post_path = require("../controllers/posts/post");
const poll_path = require("../controllers/posts/poll");

const home = async (req, res) => {
    try {
        return res.status(200).json({ status: 200, message: "Server is running :)" });

    }
    catch (error) {
        return res.status(500).json({ error: error, message: "Internal server error !", status: 500 });

    }
}
// GET REQUEST
route.get("/", home);
// route.get("/profile", read_path.PROFILE);



// AUTH / USER
route.post("/profile", user_path.profile);
route.post("/feeds", user_path.getFeed);
route.post("/search", user_path.search);
route.post("/view-other-profile", user_path.viewOtherProfile);
route.post("/update-profile", user_path.updateProfile);
route.post("/get-followers-followings", user_path.followersAndFollowings);
route.post("/add-followings", user_path.addToFollowing);
route.post("/remove-followings", user_path.removeFromFollowing);
route.post("/signup", user_path.signupUser);
route.post("/login", user_path.loginUser);
route.post("/logout", user_path.logout);
route.post("/update-password", user_path.updatePassword);
route.post("/send-reset-password-email", user_path.sendResetPasswordEmail);

// POST
route.post("/post", post_path.getPost);
route.post("/getAllPost", post_path.getAllPost);
route.post("/create-post", post_path.createPost);
route.post("/update-post", post_path.updatePost);
route.post("/delete-post", post_path.deletePost);
route.post("/update-likes", post_path.updateLikes);
route.post("/create-comment", post_path.createComment);
route.post("/update-comment", post_path.updateComment);
route.post("/delete-comment", post_path.deleteComment);

// POLL
route.post("/poll", poll_path.getPoll);
route.post("/getAllPoll", poll_path.getAllPoll);
route.post("/create-poll", poll_path.createPoll);
route.post("/update-poll", poll_path.updatePoll);
route.post("/delete-poll", poll_path.deletePoll);
route.post("/update-poll-likes", poll_path.updatePollLikes);
route.post("/create-poll-comment", poll_path.createPollComment);
route.post("/update-poll-comment", poll_path.updatePollComment);
route.post("/delete-poll-comment", poll_path.deletePollComment);
route.post("/add-poll-vote", poll_path.addVote);


module.exports = route;
