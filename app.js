var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var passport = require("passport");
const path = require("path");

var users = require("./routes/api/users");
var profile = require("./routes/api/profile");
var posts = require("./routes/api/posts");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//DBconfig
var db = require("./config/keys").mongoURI;
//connect to mongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true }
  )
  .then(() => console.log("Database Successfully Connected"))
  .catch(err => console.log(err));

//passport middleware
app.use(passport.initialize());

//passport config
require("./config/passport")(passport);

//User Routes
app.use("/api/users", users);
app.use("/api/profile", profile);
app.use("/api/posts", posts);

// Server static assets if in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

app.listen(process.env.PORT, process.env.IP, function() {
  console.log("NSMCONNECT Server is running");
});
