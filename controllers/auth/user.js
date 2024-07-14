const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { User, Profile, Followers_Followings } = require("../../model/user");

const CONSTANTS = require("../../helper/constant");

// const JWT = require('../../helper/jwtToken');
const { generateToken, verifyToken } = require("../../helper/jwtToken");
const { Poll, Post } = require("../../model/post");

const checkToken = async (req) => {
    const { email } = req.body;
    const token = req.headers.authorization;
    const user = await User.findOne({ email });
    if (!user) {
        return false;
    }
    const tokenList = user?.token;

    for (let index in tokenList) {
        if (tokenList[index] == token) {
            const res = verifyToken(token);
            if (email === res?.email) {
                return true;
            } else {
                return false;
            };
        };
    };
    return false;
};

const signupUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // Check if the email is already taken
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        };

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(201).json({ error: 'Username already taken' });
        };
        // Hash the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password, 10);
        const token = generateToken({ email });

        // Create a new user
        const newUser = new User({ email: email, username: username, password: hashedPassword, token: [token] });
        await newUser.save();

        // create default profile for new user.
        const dataObj = {
            name: username,
            username: username,
            email: email,
            // followers: 0,
            // followings: 0,
            totalPosts: 0,
            bio: "",
            description: "",
            emailVerified: false,
            // joinedOn: Date,
            gender: "",
            // age: Number,
            totalFollowers: 0,
            totalFollowings: 0,
        };
        const newProfile = new Profile(dataObj);
        await newProfile.save();

        const follwerObj = {
            username: username,
            email: email,
            name: username,
            followers: [],
            followings: [],
            totalFollowers: 0,
            totalFollowings: 0,
        }

        const newFoll = new Followers_Followings(follwerObj);
        await newFoll.save();

        res.status(200).json({ message: 'User created successfully', status: 200 });
    } catch (error) {
        console.log("Error", error)
        res.status(500).json({ error: error, message: 'Internal Server Error' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // check whether input are valid or not.
        if (!email) {
            res.status(201).json({ status: 401, message: 'Invalid email', data: req.body });
        };
        if (!password) {
            res.status(201).json({ status: 401, message: 'Password is invalid', data: req.body });
        };

        // Now, Find the user by email.
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(201).json({ status: 401, message: 'Invalid email or password' });
        }

        // Now, Compare the provided password with the hashed password in the database.
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(201).json({ status: 401, message: 'Invalid email or password' });
        };

        const token = generateToken({ email });
        const newTokenArray = user.token;
        newTokenArray.push(token);

        await User.findOneAndUpdate({ email }, { token: newTokenArray });

        res.status(200).json({ message: 'Login successfull', token: token, status: 200, data: user });
    } catch (error) {
        console.log("error -> ", error)
        res.status(500).json({ error: error, message: 'Internal Server Error' });
    }
};

const logout = async (req, res) => {

    try {

        const { email } = req.body;
        const token = req.headers["authorization"];

        if (!email) {
            res.status(201).json({ status: 401, message: 'Invalid email', email: email });
        };
        // if (!token) {
        //     res.status(200).json({ status: 401, message: 'Token is invalid', data: req.body });
        // }
        // Find the user by email
        const user = await User.findOne({ email });
        if (token && user) {
            let newTokenArray = user?.token?.filter(item => item !== token);
            await User.findOneAndUpdate({ email }, { token: newTokenArray ? newTokenArray : [] });
        }

        res.status(200).json({ status: 200, message: 'Logout successfull', data: user });

    } catch (error) {
        console.log("logout error-> ", error);
        res.status(500).json({ error: error, message: 'Internal Server Error' });
    }

};

const sendResetPasswordEmail = async (req, res) => {
    try {

        const { email } = req.body;

        if (!email) {
            return res.status(201).json({ status: 404, message: `Please enter email` });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(201).json({ status: 404, message: `User no found with ${email}` });
        };

        // generate the password from our predefined function
        const AutoPassword = CONSTANTS.autoGeneratePassword(12);

        // Hash the new password & and update the password in the user table.
        const hashedPassword = await bcrypt.hash(AutoPassword, 10);
        // await User.findOneAndUpdate({ email: email }, { password: hashedPassword });

        const mailOptions = {
            from: 'test@gmail.com',
            to: email,
            subject: 'Password Reset',
            text: `Please open the app and update your password with given password \nPassword : ${AutoPassword} \nThanks & Regards \nAnil Saini`,
        };

        await CONSTANTS.TRASNPORTER.sendMail(mailOptions);

        res.status(200).json({ message: 'Please check your mail', status: 200 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error, message: 'Internal Server Error' });
    }
};

const updatePassword = async (req, res) => {

    const isValidToken = await checkToken(req);
    if (!isValidToken) {
        res.status(201).json({ staus: 400, message: "Token is invalid." });
    };

    try {
        const { email, newPassword, oldPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(201).json({ status: 401, message: 'Invalid email or password' });
        };

        const passwordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!passwordMatch) {
            return res.status(201).json({ status: 204, message: 'Invalid old password' });
        };
        if (!newPassword) {
            return res.status(201).json({ status: 204, message: 'Invalid new password' });
        };

        if (oldPassword == newPassword) {
            return res.status(201).json({ status: 204, message: 'New Password and Old Password cannot be same' });
        };

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findOneAndUpdate({ email }, { password: hashedPassword });

        res.status(200).json({ message: 'Password reset successfully', status: 200 });
    } catch (error) {
        console.error("update password error -> ", error);
        res.status(500).json({ status: 500, error: error, message: 'Internal Server Error' });
    }
};

const profile = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(201).json({ message: "Email is invalid.", status: 401, });
    };

    const isValidToken = await checkToken(req);
    if (!isValidToken) {
        return res.status(201).json({ message: "Token is invalid.", status: 404, });
    };

    try {
        const profile = await Profile.findOne({ email });
        const polls = await Poll.find({ email });
        const posts = await Post.find({ email });
        const follow_following = await Followers_Followings.findOne({ email });
        if (follow_following) {
            profile["followers"] = follow_following?.followers;
            profile["followings"] = follow_following?.followings;
            profile["totalFollowers"] = follow_following?.followers?.length;
            profile["totalFollowings"] = follow_following?.followings?.length;
        }
        profile["polls"] = polls;
        profile["posts"] = posts;
        profile["totalPosts"] = polls?.length;
        profile["totalPolls"] = posts?.length;
        if (!profile) {
            return res.status(201).json({ message: "User not found", status: 401, data: profile, email: email });
        }
        return res.status(200).json({ message: "Success", status: 200, data: profile });
    } catch (error) {
        console.log("profile error ", error);
        return res.status(500).json({ error: error, message: "Internal server error" });
    };

};

const updateProfile = async (req, res) => {

    const { email } = req.body;
    if (!email) {
        return res.status(201).json({ message: "Email is invalid.", status: 401, });
    };
    const isValidToken = await checkToken(req);
    if (!isValidToken) {
        return res.status(201).json({ message: "Token is invalid.", status: 404, });
    };

    try {
        const data = req.body;
        const userProfile = await Profile.findOne({ email: email });
        const user = await User.findOne({ email: email });
        const userFollowers_Following = await Followers_Followings.findOne({ email: email });
        if (!userProfile) {
            return res.status(201).json({ message: "Invalid user / user not found" });
        }
        await Profile.findOneAndUpdate({ email: email }, data);
        await User.findOneAndUpdate({ email: email }, { username: data?.username });
        await Followers_Followings.findOneAndUpdate({ email: email }, { name: data?.name });

        for (let i in data) {
            userProfile[i] = data[i];
        }

        return res.status(200).json({ message: 'Profile updated successfully', status: 200, data: user });

    } catch (error) {
        console.log("update profile error -> ", error)
        return res.status(500).json({ error: error, message: "Internal server error" });
    };

};

const followersAndFollowings = async (req, res) => {
    const { email } = req.body;
    const data = req.body;
    if (!email) {
        return res.status(201).json({ message: "Email is invalid.", status: 401, data: data });
    };
    const isValidToken = await checkToken(req);
    if (!isValidToken) {
        return res.status(201).json({ message: "Token is invalid.", status: 404, data: data });
    };

    try {
        const list = await Followers_Followings.findOne({ email });
        if (!list) {
            return res.status(201).json({ message: "User not found", status: 401, data: list, email: email });
        }
        return res.status(200).json({ message: "Success", status: 200, data: list });
    } catch (error) {
        return res.status(500).json({ error: error, message: "Internal server error" });
    };
};

const addToFollowing = async (req, res) => {
    const { id, email, username, name, otherEmail, otherUsername, otherName, otherUserId } = req.body;
    const data = req.body;
    if (!email) {
        return res.status(201).json({ message: "Email is invalid.", status: 401, data: data });
    };
    const isValidToken = await checkToken(req);
    if (!isValidToken) {
        return res.status(201).json({ message: "Token is invalid.", status: 404, data: data });
    };

    if (!otherEmail) return res.status(201).json({ message: "Other user email is invalid.", status: 404, data: data });
    if (!username) return res.status(201).json({ message: "Username is invalid.", status: 404, data: data });
    if (!otherUsername) return res.status(201).json({ message: "Other username is invalid.", status: 404, data: data });
    if (!otherUserId) return res.status(201).json({ message: "Other user id is invalid.", status: 404, data: data });
    if (!id) return res.status(201).json({ message: "id is invalid.", status: 404, data: data });
    if (!name) return res.status(201).json({ message: "Name is invalid.", status: 404, data: data });
    if (!otherName) return res.status(201).json({ message: "Name is invalid.", status: 404, data: data });

    let createdDate = (new Date()).toISOString();

    try {
        const list = await Followers_Followings.findOne({ email });
        const otherUserList = await Followers_Followings.findOne({ email: otherEmail });

        if (!list) {
            return res.status(201).json({ message: "User not found", status: 401, data: list, email: email });
        };

        // Now update the current (owner) user follwing
        let currentUserFollowings = [];
        let otherUserFollowers = [];
        if (list?.followings) {
            currentUserFollowings = list?.followings;
            const check = currentUserFollowings.filter(item => item.email === otherEmail + "d");
            if (!check?.length) {
                return res.status(201).json({ message: `Already following ${data?.otherUsername}`, status: 401, data: list, email: email });
            }
        };
        if (otherUserList?.followers) {
            otherUserFollowers = otherUserList?.followers;
        };
        const dataObj = {
            name: otherName,
            username: otherUsername,
            email: otherEmail,
            id: otherUserId,
            date: createdDate,
            // img: String,
            totalFollowings: (list?.totalFollowings ? list.totalFollowings : 0) + 1,
            following: true,
        };
        const otherDataObj = {
            name: name,
            username: username,
            email: email,
            id: id,
            date: createdDate,
            // img: String,
            totalFollowers: (otherUserList?.totalFollowers ? otherUserList.totalFollowers : 0) + 1,
            following: true,
        };

        otherUserFollowers.push(otherDataObj);
        currentUserFollowings.push(dataObj);

        await Followers_Followings.findOneAndUpdate({ email: email }, { followings: currentUserFollowings });
        await Followers_Followings.findOneAndUpdate({ email: otherEmail }, { followers: otherUserFollowers });


        return res.status(200).json({ message: "Followers update", status: 200, data: dataObj });
    } catch (error) {
        return res.status(500).json({ error: error, message: "Internal server error" });
    };
};

const removeFromFollowing = async (req, res) => {
    const { id, email, username, otherEmail, otherUsername, otherUserId } = req.body;
    const data = req.body;
    if (!email) {
        return res.status(201).json({ message: "Email is invalid.", status: 401, data: data });
    };
    const isValidToken = await checkToken(req);
    if (!isValidToken) {
        return res.status(201).json({ message: "Token is invalid.", status: 404, data: data });
    };

    if (!otherEmail) return res.status(201).json({ message: "Other user email is invalid.", status: 404, data: data });
    if (!username) return res.status(201).json({ message: "Username is invalid.", status: 404, data: data });
    if (!otherUsername) return res.status(201).json({ message: "Other username is invalid.", status: 404, data: data });
    if (!otherUserId) return res.status(201).json({ message: "Other user id is invalid.", status: 404, data: data });
    if (!id) return res.status(201).json({ message: "id is invalid.", status: 404, data: data });

    try {
        const list = await Followers_Followings.findOne({ email });
        const otherUserList = await Followers_Followings.findOne({ email: otherEmail });

        if (!list) {
            return res.status(201).json({ message: "User not found", status: 401, data: list, email: email });
        };

        if (!otherUserList) {
            return res.status(201).json({ message: "User not found", status: 401, data: list, email: email });
        };

        await Followers_Followings.findByIdAndUpdate(id, { totalFollowings: list?.totalFollowings - 1, $pull: { 'followings': { email: otherEmail } } }, { new: true });
        await Followers_Followings.findByIdAndUpdate({ _id: otherUserId }, { totalFollowers: otherUserList?.totalFollowers - 1, $pull: { 'followers': { email: email } } }, { new: true });


        res.status(200).json({ message: "Followers update", status: 200, data: dataObj });
    } catch (error) {
        return res.status(500).json({ error: error, message: "Internal server error" });
    };
};

const viewOtherProfile = async (req, res) => {
    const { email, otherEmail } = req.body;
    if (!email) {
        return res.status(201).json({ message: "Email is invalid.", status: 401, data: req.body });
    };

    const isValidToken = await checkToken(req);
    if (!isValidToken) {
        return res.status(201).json({ message: "Token / Email is invalid.", status: 404, data: req.body });
    };

    try {
        const profile = await Profile.findOne({ email: otherEmail });
        if (!profile) {
            return res.status(201).json({ message: "User not found", status: 401, data: profile, email: otherEmail });
        }
        const polls = await Poll.find({ email: otherEmail });
        const posts = await Post.find({ email: otherEmail });
        const follow_following = await Followers_Followings.findOne({ email: otherEmail });

        console.log("follow_following ", follow_following)
        if (follow_following) {
            profile["followers"] = follow_following?.followers;
            profile["followings"] = follow_following?.followings;
            profile["totalFollowers"] = follow_following?.followers?.length;
            profile["totalFollowings"] = follow_following?.followings?.length;
        };
        if (polls) {
            profile["polls"] = polls;
            profile["totalPosts"] = polls?.length;
        };
        if (posts) {
            profile["posts"] = posts;
            profile["totalPolls"] = posts?.length;
        };
        return res.status(200).json({ message: "Success", status: 200, data: profile });
    } catch (error) {
        console.log("profile error ", error);
        return res.status(500).json({ error: error, message: "Internal server error" });
    };

};

const getFeed = async (req, res) => {

    const { email, userId } = req.body;
    const data = req.body;

    if (!email) {
        return res.status(201).json({ message: "Email is invalid.", status: 401, });
    };

    const isValidToken = await checkToken(req);
    if (!isValidToken) {
        return res.status(201).json({ message: "Token is invalid.", status: 404, });
    };

    try {

        let polls = await Poll.find();
        let posts = await Post.find();

        for(let i in polls){
            const ownerId = polls[i].ownerId;
            const profileData = await Profile.findById(ownerId);
            polls[i]["name"] = profileData?.name;
            polls[i]["username"] = profileData?.username;
        }
        for(let i in posts){
            const ownerId = posts[i].ownerId;
            const profileData = await Profile.findById(ownerId);
            posts[i]["name"] = profileData?.name;
            posts[i]["username"] = profileData?.username;
        }
        
        return res.status(200).json({ message: "Success", status: 200, data: { polls: polls, posts: posts } });

    } catch (error) {
        return res.status(500).json({ error: error, message: "Internal server error" });
    };

};

const search = async (req, res) => {
    const { email, searchField } = req.body;
    const data = req.body;

    if (!email) {
        return res.status(201).json({ message: "Email is invalid.", status: 401, });
    };

    const isValidToken = await checkToken(req);
    if (!isValidToken) {
        return res.status(201).json({ message: "Token is invalid.", status: 404, });
    };

    try {
        const filter = {
            username: searchField,
            // name: searchField
        }
        const profile = await Profile.find({
            username: { $regex: new RegExp(searchField, 'i') },
        })

        if (!profile) {
            return res.status(201).json({ status: 404, message: "No user found" });
        };

        res.status(200).json({ status: 200, message: "found", data: profile });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: error, message: "Internal server error" });
    }
}

module.exports = {
    signupUser,
    loginUser,
    logout,
    updatePassword,
    sendResetPasswordEmail,
    profile,
    updateProfile,
    followersAndFollowings,
    addToFollowing,
    removeFromFollowing,
    checkToken,
    viewOtherProfile,
    getFeed,
    search
};

