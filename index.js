import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { config } from 'dotenv';

config();  // Initialize dotenv to use environment variables

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.error("Error connecting to MongoDB", err);
});

// Define Blog Schema and Model
const blogSchema = new mongoose.Schema({
  authorfname: String,
  authorlname: String,
  title: String,
  content: String
});

const Blog = mongoose.model('Blog', blogSchema);

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get("/", async (req, res) => {
  const blogs = await Blog.find({});
  res.render("index.ejs", { blogs });
});

app.get("/create", (req, res) => {
  res.render("create.ejs", { signal: 'createpost' });
});

app.get("/view/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  res.render("blog.ejs", { blog });
});

app.post("/submit", async (req, res) => {
  const newBlog = new Blog({
    authorfname: req.body.fname,
    authorlname: req.body.lname,
    title: req.body.title,
    content: req.body.content
  });
  await newBlog.save();
  res.redirect("/");
});

app.get("/edit/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  res.render("create.ejs", { signal: 'editpost', blog });
});

app.post("/edit/:id", async (req, res) => {
  await Blog.findByIdAndUpdate(req.params.id, {
    authorfname: req.body.fname,
    authorlname: req.body.lname,
    title: req.body.title,
    content: req.body.content
  });
  res.redirect("/");
});

app.post("/delete/:id", async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
