const mongoose = require("mongoose");
const { ObjectId } = require("mongoose");
const { Poll } = require("../../model/post");
const { checkToken } = require("../auth/user");
const { Profile } = require("../../model/user");


const getPoll = async (req, res) => {
    try {
        const poll = await Poll.find();
        if (!poll) {
            return res.status(401).json({ status: 401, message: "Invalid request !" });
        }
        return res.status(200).json({ status: 200, message: "Success !", data: poll });

    } catch (error) {

        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };

};

const getAllPoll = async (req, res) => {
    try {
        let { page, limit } = req.body;
        if (!limit) {
            limit = 10;
        }
        if (!page) {
            page = 1;
        }
        if (limit > 20 | limit < 0) {
            return res.status(200).json({ status: 400, error: "Invalid limit", message: "Please enter valid limit (>0 & limit<=20) number" })
        }
        if (page < 1) {
            return res.status(200).json({ status: 400, error: "Invalid page", message: "Please enter valid page (>0) number" })
        }
        const poll = await Poll.find().skip((page-1)*limit).limit(limit);
        
        if (!poll) {
            return res.status(401).json({ status: 401, message: "Invalid request !" });
        }

        for (let i in poll) {
            const ownerId = poll[i].ownerId;
            const profileData = await Profile.findById(ownerId);
            poll[i]["name"] = profileData?.name;
            poll[i]["username"] = profileData?.username;
        };
        
        let nextPage = true;
        if(poll.length < limit){
            nextPage = false
        }
        
        res.status(200).json({ status: 200, message: "Success !", data: poll, page:page, limit:limit, nextPage:nextPage});

    } catch (error) {

        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };

};

const createPoll = async (req, res) => {
    try {
        const data = req.body;
        const { title, ownerId, hide, options, pollType, email, name } = data;

        if (!email) return res.status(201).json({ status: 401, message: "Email is undefined", data: data })

        const isValidToken = await checkToken(req);
        if (!isValidToken) {
            return res.status(201).json({ message: "Token / Email is invalid", status: 404, data: req.body });
        };

        // if it is poll then there should be a title.
        // if (!name) return res.status(201).json({ status: 401, message: "Name is undefined", data: data });
        if (!title) return res.status(201).json({ status: 401, message: "Title is undefined", data: data });
        if (!options) return res.status(201).json({ status: 401, message: "options is undefined", data: data });
        if (options?.length < 2) return res.status(201).json({ status: 401, message: "Poll should contain minimum 2 options", data: data });
        if (!ownerId) return res.status(201).json({ status: 401, message: "OwnerId is undefined", data: data });

        let createdDate = (new Date()).toISOString();
        const pollObj = {
            name: "",
            email: email,
            title: title,
            options: options,
            totalLikes: 0,
            totalVotes: 0,
            comments: [],
            hide: (hide != undefined ? hide : false),
            createOn: createdDate, // Date field
            ownerId: ownerId,
            likedBy: [],
            voters: [],
            pollType: pollType,
        }
        const newPoll = new Poll(pollObj);
        await newPoll.save();

        return res.status(200).json({ status: 200, message: "Poll created successfully !", data: pollObj });

    } catch (error) {

        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };

};

const updatePoll = async (req, res) => {
    try {
        const data = req.body;
        const { title, hide, id, email } = req.body;

        if (!title || title?.length == 0) return res.status(201).json({ status: 401, message: "Title is undefined", data: data })
        if (!email) return res.status(201).json({ status: 401, message: "Email is undefined", data: data })

        const isValidToken = await checkToken(req);
        if (!isValidToken) {
            return res.status(201).json({ message: "Token / Email is invalid", status: 404, data: data });
        };

        const poll = await Poll.findById(id);
        if (!poll) {
            return res.status(201).json({ status: 401, message: "Poll already deleted / not found!!", data: data });
        };

        if (poll.title == title && poll.hide == hide) {
            return res.status(200).json({ status: 200, message: "Poll updated successfully !", data: data });
        }

        const updatedPoll = {};
        if (title) updatedPoll["title"] = title;
        if (hide) updatedPoll["hide"] = hide;

        await Poll.findByIdAndUpdate(id, updatedPoll);
        res.status(200).json({ status: 200, message: "Poll updated successfully !", data: data });

    } catch (error) {
        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };

};

const deletePoll = async (req, res) => {
    try {

        const { id, email } = req.body;
        const data = req.body;
        if (!email) return res.status(201).json({ status: 401, message: "Email is undefined", data: data })

        const isValidToken = await checkToken(req);
        if (!isValidToken) {
            return res.status(201).json({ message: "Token / Email is invalid", status: 404, data: data });
        };

        const poll = await Poll.findByIdAndDelete(id);
        if (!poll) {
            return res.status(201).json({ message: "Poll already deleted / not found!!", status: 401, data: data });
        };

        res.status(200).json({ status: 200, message: "Poll deleted successfully !", data: poll });

    } catch (error) {
        console.log("delete poll error -> ", error);
        return res.status(500).json({ status: 500, error: error, message: "Something went wrong!" });
    };

};

const updatePollLikes = async (req, res) => {

    try {
        const { pollId, userId, name, liked, email } = req.body;
        if (!email) {
            return res.status(201).json({ message: "Email is invalid.", status: 401, data: req.body });
        };

        const isValidToken = await checkToken(req);
        if (!isValidToken) {
            return res.status(201).json({ message: "Token / Email is invalid.", status: 404, data: req.body });
        };
        let poll = await Poll.findOne({ '_id': pollId, 'likedBy.id': userId });

        // If already liked this poll then update it's value
        if (poll) {
            await Poll.findByIdAndUpdate(
                pollId,
                { $pull: { 'likedBy': { id: userId } } },
                { new: true });

            const count = poll.totalLikes;
            await Poll.findByIdAndUpdate(
                { '_id': pollId },
                { totalLikes: (count - 1) },
                { new: true }
            );
            return res.status(200).json({ status: 200, message: "poll dislike successfully !", data: poll });
        };

        poll = await Poll.findById(pollId);
        const totalLikes = poll?.totalLikes;
        const likedObj = {
            name: name,
            email: email,
            id: userId,
            img: ""
        };
        const newLike = await Poll.findByIdAndUpdate(pollId, { totalLikes: totalLikes + 1, $push: { likedBy: likedObj } });

        if (!newLike) {
            console.log(likedObj, newLike)
            return res.status(201).json({ status: 404, message: "Poll not found or deleted !", data: poll });
        };
        res.status(200).json({ status: 200, message: "Liked the poll successfully !", data: poll });

    } catch (error) {
        console.log("Liked Poll Error -> ", error);
        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };

};

const createPollComment = async (req, res) => {
    try {
        const { name, comment, userId, pollId, email } = req.body;

        if (!email) {
            return res.status(201).json({ message: "Email is invalid.", status: 401, data: req.body });
        };

        const isValidToken = await checkToken(req);
        if (!isValidToken) {
            return res.status(201).json({ message: "Token / Email is invalid.", status: 404, data: req.body });
        };

        if (comment == undefined || comment.length === 0) return res.status(201).json({ status: 402, message: "Comment field is undefined or empty !", data: req.body });
        if (name == undefined) return res.status(201).json({ status: 402, message: "Name is undefined !", data: req.body });
        if (userId == undefined) return res.status(201).json({ status: 402, message: "User ID is undefined !", data: req.body });
        if (pollId == undefined) return res.status(201).json({ status: 402, message: "Poll ID is undefined !", data: req.body });

        let createdDate = (new Date()).toISOString();

        const commentObj = {
            email: email,
            name: name,
            comment: comment,
            userId: userId,
            // img: img,
            likes: 0,
            totalReplies: 0,
            reply: [],
            createOn: createdDate,
        };
        const poll = await Poll.findByIdAndUpdate(pollId, { $push: { comments: commentObj } }, { new: true });
        if (!poll) {
            return res.status(201).json({ status: 404, message: "Poll not found or deleted !", data: req.body });
        };

        return res.status(200).json({ status: 200, message: "Comment poll successfully !" });

    } catch (error) {
        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };

};

const updatePollComment = async (req, res) => {
    try {
        const { comment, userId, pollId, id, email } = req.body;
        if (!email) {
            return res.status(201).json({ message: "Email is invalid.", status: 401, data: req.body });
        };

        const isValidToken = await checkToken(req);
        if (!isValidToken) {
            return res.status(201).json({ message: "Token / Email is invalid.", status: 404, data: req.body });
        };

        if (id == undefined) return res.status(201).json({ status: 402, message: "id is undefined !", data: req.body });
        if (userId == undefined) return res.status(201).json({ status: 402, message: "User ID is undefined !", data: req.body });
        if (pollId == undefined) return res.status(201).json({ status: 402, message: "Poll ID is undefined !", data: req.body });

        const poll = await Poll.findOneAndUpdate(
            { '_id': pollId, 'comments._id': id },
            { $set: { 'comments.$.comment': comment } },
            { new: true }
        );

        if (!poll) {
            return res.status(201).json({ status: 200, message: "Poll / comment is deleted or not exits !", data: poll });
        }

        res.status(200).json({ status: 200, message: "Comment updated successfully !", data: poll });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };


};

const deletePollComment = async (req, res) => {
    try {

        const { pollId, id, email, userId, createOn } = req.body;
        if (!email) {
            return res.status(201).json({ message: "Email is invalid.", status: 401, data: req.body });
        };

        const isValidToken = await checkToken(req);
        if (!isValidToken) {
            return res.status(201).json({ message: "Token / Email is invalid.", status: 404, data: req.body });
        };

        if (id == undefined) return res.status(201).json({ status: 402, message: "id is undefined !", data: req.body });
        if (userId == undefined) return res.status(201).json({ status: 402, message: "id is undefined !", data: req.body });
        if (createOn == undefined) return res.status(201).json({ status: 402, message: "createOn is undefined !", data: req.body });
        if (pollId == undefined) return res.status(201).json({ status: 402, message: "Poll ID is undefined !", data: req.body });

        // const poll = await Poll.findOneAndDelete({ '_id': pollId, 'comments._id': id });
        const poll = await Poll.findByIdAndUpdate(
            pollId,
            { $pull: { 'comments': { userId: userId, createOn: createOn } } },
            { new: true });
        if (!poll) {
            return res.status(201).json({ status: 200, message: "Poll / comment already deleted or not exists !" });
        };
        return res.status(200).json({ status: 200, message: "Comment deleted successfully !" });

    } catch (error) {
        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };

};

const addVote = async (req, res) => {
    try {

        const { userId, pollId, email, index } = req.body;
        if (!email) {
            return res.status(201).json({ message: "Email is invalid.", status: 401, data: req.body });
        };

        const isValidToken = await checkToken(req);
        if (!isValidToken) {
            return res.status(201).json({ message: "Token / Email is invalid.", status: 404, data: req.body });
        };

        if (index == null || index == undefined) return res.status(201).json({ status: 402, message: "Invalid option !", data: req.body });
        if (!userId) return res.status(201).json({ status: 402, message: "User ID is undefined !", data: req.body });
        if (!pollId) return res.status(201).json({ status: 402, message: "Poll ID is undefined !", data: req.body });

        const currentPoll = await Poll.findById(pollId);
        if (!currentPoll) {
            return res.status(201).json({ status: 201, message: "Poll / comment already deleted or not exists !" });
        };

        // getting all the options in currentOptions Variable
        let currentOptions = currentPoll?.options;
        const currentVoters = currentPoll?.voters;
        
        const isVoterExists = currentVoters.filter(item => item?.id == userId);
        if (isVoterExists?.length > 0) {
            return res.status(201).json({ status: 201, message: "You already voted on this poll !", data: req.body });
        }
        
        currentOptions[index].count = currentOptions[index].count + 1;

        const totalVotes = currentPoll?.totalVotes;
 
        const pollObj = {
            options: currentOptions,
            totalVotes: totalVotes + 1,
        };

        let date = (new Date()).toISOString();
        const voteObj = {
            email: email,
            id: userId,
            index: index,
            date: date
        };

        currentPoll.options = currentOptions;
        currentPoll.totalVotes = totalVotes + 1;
        currentPoll?.voters?.push(voteObj);
    
        const poll = await Poll.findByIdAndUpdate(pollId, { options: currentOptions, totalVotes: totalVotes + 1, $push: { voters: voteObj } }, { new: true });
        // await Poll.findByIdAndUpdate(pollId, { $push: { voters: voteObj } }, { new: true });
        res.status(200).json({ status: 200, message: "Vote added successfully !", data: currentPoll });

    } catch (error) {
        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };
};

module.exports = {
    getPoll,
    getAllPoll,
    createPoll,
    updatePoll,
    deletePoll,
    updatePollLikes,
    createPollComment,
    updatePollComment,
    deletePollComment,
    addVote
};