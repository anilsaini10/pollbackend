const mongoose = require("mongoose");
const { Post } = require("../../model/post");
const { checkToken } = require("../auth/user");
const { Profile } = require("../../model/user");

const getPost = async (req, res) => {
    try {
        const post = await Post.find();
        if (!post) {
            return res.status(201).json({ status: 401, message: "Invalid request !" });
        }
        res.status(200).json({ status: 200, message: "Success !", data: post });

    } catch (error) {
        console.log("Error -> ", error);
        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };

};

const getAllPost = async (req, res) => {
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
        const post = await Post.find().skip((page-1)*limit).limit(limit);
        if (!post) {
            return res.status(201).json({ status: 401, message: "Invalid request !" });
        }

        for (let i in post) {
            const ownerId = post[i].ownerId;
            const profileData = await Profile.findById(ownerId);
            post[i]["name"] = profileData?.name;
            post[i]["username"] = profileData?.username;
        }

        let nextPage = true;
        if(post.length < limit){
            nextPage = false
        }

        res.status(200).json({ status: 200, message: "Success !", data: post, page: page, limit: limit, nextPage: nextPage });

    } catch (error) {
        console.log("Error -> ", error);
        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };

};

const createPost = async (req, res) => {
    try {
        const data = req.body;
        const { title, ownerId, hide, email, name } = data;

        if (!email) return res.status(201).json({ status: 401, message: "Email is undefined", data: data })
        const isValidToken = await checkToken(req);
        if (!isValidToken) {
            return res.status(201).json({ message: "Token / Email is invalid", status: 404, data: data });
        };


        // if it is post post then there should be a title.
        if (ownerId == undefined) return res.status(201).json({ status: 401, message: "OwnerId is undefined", data: data })
        if (title == undefined) return res.status(201).json({ status: 401, message: "Title is undefined", data: data })

        let createOn = (new Date()).toISOString();
        const postObj = {
            name: "",
            email: email,
            title: title,
            totalLikes: 0,
            comments: [],
            hide: (hide != undefined ? hide : false),
            createOn: createOn, // Date field
            totalViews: 0,
            ownerId: ownerId,
            likedBy: []
        };
        const newPost = new Post(postObj);
        await newPost.save();

        return res.status(200).json({ status: 200, message: "Post created successfully !" });

    } catch (error) {

        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };

};

const updatePost = async (req, res) => {
    try {


        const { title, description, hide, id, email } = req.body;
        const data = req.body;
        if (!email) return res.status(201).json({ status: 401, message: "Email is undefined", data: data })
        const isValidToken = await checkToken(req);
        if (!isValidToken) {
            return res.status(201).json({ message: "Token / Email is invalid", status: 404, data: data });
        };

        if (post.title == title && post.hide == hide) return; // no need to update the post.

        const updatedPost = {};
        if (title) updatedPost["title"] = title;
        if (hide) updatedPost["hide"] = hide;

        const post = await Post.findByIdAndUpdate(data?.id, updatedPost);
        if (!post) {
            return res.status(201).json({ status: 401, message: "Post not found or deleted !", data: req.body });
        };
        return res.status(200).json({ status: 200, message: "Post updated successfully !" });

    } catch (error) {
        console.log(error, "error")
        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };

};

const deletePost = async (req, res) => {
    try {

        const { id, email } = req.body;
        const data = req.body;

        if (!email) return res.status(201).json({ status: 401, message: "Email is undefined", data: data })
        const isValidToken = await checkToken(req);
        if (!isValidToken) {
            return res.status(201).json({ message: "Token / Email is invalid", status: 404, data: data });
        };

        const post = await Post.findByIdAndDelete(id);
        if (!post) {
            return res.status(201).json({ message: "Post already deleted / not found!!", status: 404, data: data });
        };

        res.status(200).json({ status: 200, message: "Post deleted successfully !", data: post });

    } catch (error) {

        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };

};

const updateLikes = async (req, res) => {
    try {
        const { postId, userId, name, liked, email, findByIdAndUpdate } = req.body;

        if (!email) {
            return res.status(201).json({ message: "Email is invalid.", status: 401, data: req.body });
        };

        const isValidToken = await checkToken(req);
        if (!isValidToken) {
            return res.status(201).json({ message: "Token / Email is invalid.", status: 404, data: req.body });
        };

        let post = await Post.findOne({ '_id': postId, 'likedBy.id': userId });

        // If already liked this post then update it's value
        if (post) {
            const test = await Post.findByIdAndUpdate(
                postId,
                { $pull: { 'likedBy': { id: userId } } },
                { new: true });
            console.log("POST[0] id ", test);
            const count = post.totalLikes;
            await Post.findByIdAndUpdate(
                { '_id': postId },
                { totalLikes: count == 0 ? 0 : (count - 1) },
                { new: true }
            );
            return res.status(200).json({ status: 200, message: "post dislike successfully !", data: post });

        };
        post = await Post.findById(postId);
        let totalLikes = post?.totalLikes;
        if (!totalLikes) {
            totalLikes = 0;
        }
        const likedObj = {
            name: name,
            email: email,
            id: userId,
            img: ""
        }

        const newLike = await Post.findByIdAndUpdate(postId, { totalLikes: totalLikes + 1, $push: { likedBy: likedObj } });

        if (!newLike) {
            console.log(likedObj, newLike)
            return res.status(201).json({ status: 404, message: "post not found or deleted !", data: post });
        };
        res.status(200).json({ status: 200, message: "Liked the post successfully !" });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };

};

const createComment = async (req, res) => {
    try {
        const { name, comment, userId, postId, email } = req.body;

        if (comment == undefined || comment.length === 0) return res.status(201).json({ status: 402, message: "Comment is undefined or empty !", data: req.body });
        if (name == undefined) return res.status(201).json({ status: 402, message: "Name is undefined !", data: req.body });
        if (userId == undefined) return res.status(201).json({ status: 402, message: "User ID is undefined !", data: req.body });
        if (postId == undefined) return res.status(201).json({ status: 402, message: "Post ID is undefined !", data: req.body });

        let createdDate = (new Date()).toISOString();
        const commentObj = {
            name: name,
            email: email,
            comment: comment,
            userId: userId,
            // img: img,
            likes: 0,
            totalReplies: 0,
            reply: [],
            createOn: createdDate,
        };

        const post = await Post.findByIdAndUpdate(postId, { $push: { comments: commentObj } }, { new: true });
        if (!post) {
            return res.status(201).json({ status: 404, message: "Post not found or deleted !", data: req.body });
        }
        res.status(200).json({ status: 200, message: "Comment post successfully !", data: post });

    } catch (error) {

        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };

};

const updateComment = async (req, res) => {
    try {
        const { comment, userId, postId, id } = req.body;

        if (id == undefined) return res.status(201).json({ status: 402, message: "id is undefined !", data: req.body });
        if (userId == undefined) return res.status(201).json({ status: 402, message: "User ID is undefined !", data: req.body });
        if (postId == undefined) return res.status(201).json({ status: 402, message: "Post ID is undefined !", data: req.body });

        const post = await Post.findOneAndUpdate(
            { '_id': postId, 'comments._id': id },
            { $set: { 'comments.$.comment': comment } },
            { new: true }
        );
        if (!post) {
            return res.status(201).json({ status: 201, message: "Post / comment is deleted or not exits.", data: post });
        };
        res.status(200).json({ status: 200, message: "Comment updated successfully !" });

    } catch (error) {

        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };


};

const deleteComment = async (req, res) => {
    try {
        const { postId, id, email, userId, createOn } = req.body;
        if (!email) {
            return res.status(201).json({ message: "Email is invalid.", status: 401, data: req.body });
        };

        const isValidToken = await checkToken(req);
        if (!isValidToken) {
            return res.status(201).json({ message: "Token / Email is invalid.", status: 404, data: req.body });
        };
        if (id == undefined) return res.status(201).json({ status: 402, message: "id is undefined !", data: req.body });
        if (userId == undefined) return res.status(201).json({ status: 402, message: "userId is undefined !", data: req.body });
        if (createOn == undefined) return res.status(201).json({ status: 402, message: "createOn is undefined !", data: req.body });
        if (postId == undefined) return res.status(201).json({ status: 402, message: "Post ID is undefined !", data: req.body });

        // const post = await Post.findOneAndDelete({ '_id': postId, 'comments._id': id });
        const post = await Post.findByIdAndUpdate(
            postId,
            { $pull: { 'comments': { userId: userId, createOn: createOn } } },
            { new: true });
        if (!post) {
            return res.status(201).json({ status: 200, message: "Post / comment already deleted or not exists !" });
        };
        res.status(200).json({ status: 200, message: "Comment deleted successfully !" });
    } catch (error) {
        return res.status(500).json({ error: error, message: "Something went wrong!" });
    };
};

module.exports = {
    getPost,
    getAllPost,
    createPost,
    updatePost,
    deletePost,
    updateLikes,
    createComment,
    updateComment,
    deleteComment
};