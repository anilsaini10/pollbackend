const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    token: [String],
    expiryToken: String
});

const FollObj = {
    name:String,
    username:String,
    email:String,
    id:String,
    img: String,
    date:String,
    following: Boolean
};

const ProfileSchema = new mongoose.Schema({
    name:String,
    username:String,
    email:String,
    // totalPosts: Number,
    // totalPolls: Number,
    followers:[FollObj],
    followings:[FollObj],
    polls:Array,
    posts:Array,
    bio:String,
    description: String,
    emailVerified: Boolean,
    joinedOn: Date,
    gender: String,
    age: Number,
    totalFollowers:Number,
    totalFollowings:Number,
    // phoneNumber: Number,
    // image: String,
});

const Followers_Followings_Schema = new mongoose.Schema({
    username:String,
    email:String,
    name:String,
    id:String,
    followers: [FollObj],
    followings: [FollObj],
    totalFollowers:Number,
    totalFollowings:Number,
});

const User = mongoose.model("User", UserSchema);
const Profile = mongoose.model("Profile", ProfileSchema);
const Followers_Followings = mongoose.model("Followers_Followings", Followers_Followings_Schema);




module.exports = {User, Profile, Followers_Followings};