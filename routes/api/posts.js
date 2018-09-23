const express = require("express");
const router = express();
const mongoose = require("mongoose");
const passport = require("passport");

//post model
const Post = require("../../models/Post");
//profile model
const Profile = require("../../models/Profile");
//Validation
const validatePostInput = require("../../validation/post");

router.get("/test", function(req, res) {
  res.status(200).json({ msg: "Posts Works" });
});

// @Route GET api/posts
// desc  Get post
// @Access public
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err =>
      res.status(404).json({ msg: "No post has been created yet" })
    );
});

// @Route GET api/posts/:id
// desc  Get post by id
// @Access public
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err => res.status(404).json({ msg: "Opps! something happend" }));
});

// @Route POST api/posts
// desc  create post
// @Access Procted
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    //check validation
    if (!isValid) {
      //if any errors send 400 with erros objext
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });
    newPost
      .save()
      .then(post => res.json(post))
      .catch(err => res.json({ msg: "failed to post comment" }));
  }
);

// @Route DELETE api/posts/:id
// desc  delete the  post
// @Access Procted

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          //check for post owner
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ msg: "user not authorized to delete this post" });
          }
          //Delete the post
          post
            .remove()
            .then(() => res.json({ success: true, msg: "Post deleted" }));
        })
        .catch(err => res.status(404).json({ msg: "Post not found" }));
    });
  }
);

// @Route POST api/posts/:id
// desc  delete the  post
// @Access Procted

// router.post(
//   "/:id",
//   passport.authenticate("jwt", { session: false }),
//   (req, res) => {
//     Profile.findOne({ user: req.user.id }).then(profile => {
//       Post.findById(req.params.id)
//         .then(post => {
//           //check for post owner
//           if (post.user.toString() !== req.user.id) {
//             return res
//               .status(401)
//               .json({ msg: "user not authorized to perform this task" });
//           }
//           //Update the post
//           post
//             .update()
//             .then(() => res.json({ success: true, msg: "Post upda" }));
//         })
//         .catch(err => res.status(404).json({ msg: "Post not found" }));
//     });
//   }
// );

// @Route POST api/posts/like/:id
// desc  like the  post
// @Access Procted

router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: "User already liked this post" });
          }

          //Add the user id to the likes array
          post.likes.unshift({ user: req.user.id });
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ msg: "Opps! something happend" }));
    });
  }
);

// @Route POST api/posts/unlike/:id
// desc  like the  post
// @Access Procted

router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notliked: "You have not yet liked this post" });
          }

          //get the remove index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);
          //Splice it out of array
          post.likes.splice(removeIndex, 1);

          //save it
          post.save().then(posts => res.json(posts));
        })
        .catch(err => res.status(404).json({ msg: "Opps! something happend" }));
    });
  }
);

// @Route POST api/posts/comment/:id
// desc  add comment to post
// @Access Procted
router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    //check validation
    if (!isValid) {
      //if any errors send 400 with erros objext
      return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };
        //add to comments array

        post.comments.unshift(newComment);
        //save
        post
          .save()
          .then(post => res.json(post))
          .catch(err =>
            res.status(404).json({ postnotfound: "no post found" })
          );
      })
      .catch(err => res.json({ nopost: "unable to find the post" }));
  }
);

// @Route DELETE api/posts/comment/:id/:comment_id
// desc  delete  comment from post
// @Access Procted
router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        //check t o see if comment exist
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexist: "Comment does not exist" });
        }

        //get the remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        //splice it out of the array
        post.comments.splice(removeIndex, 1);

        //save
        post
          .save()
          .then(post => res.json(post))
          .catch(err => res.json({ commentdelete: "error occured" }));
      })
      .catch(err => res.json({ nopost: "unable to find the post" }));
  }
);

module.exports = router;
