import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

mongoose.set('strictQuery', false);

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    cachedDb = db;
    console.log("Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

const blogSchema = new mongoose.Schema({
  authorfname: String,
  authorlname: String,
  title: String,
  content: String
});

const Blog = mongoose.model('Blog', blogSchema);

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).send("Database connection error");
  }
});

app.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().lean().exec();
    res.render("index.ejs", { blogs });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).send("Error fetching blogs");
  }
});

app.get("/create", (req, res) => {
  res.render("create.ejs", { signal: 'createpost' });
});

app.get("/view/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).lean().exec();
    if (!blog) {
      return res.status(404).send("Blog not found");
    }
    res.render("blog.ejs", { blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).send("Error fetching blog");
  }
});

app.post("/submit", async (req, res) => {
  try {
    const newBlog = new Blog({
      authorfname: req.body.fname,
      authorlname: req.body.lname,
      title: req.body.title,
      content: req.body.content
    });
    await newBlog.save();
    res.redirect("/");
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).send("Error creating blog");
  }
});

app.get("/edit/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).lean().exec();
    if (!blog) {
      return res.status(404).send("Blog not found");
    }
    res.render("create.ejs", { signal: 'editpost', blog });
  } catch (error) {
    console.error("Error fetching blog for edit:", error);
    res.status(500).send("Error fetching blog for edit");
  }
});

app.post("/edit/:id", async (req, res) => {
  try {
    await Blog.findByIdAndUpdate(req.params.id, {
      authorfname: req.body.fname,
      authorlname: req.body.lname,
      title: req.body.title,
      content: req.body.content
    });
    res.redirect("/");
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).send("Error updating blog");
  }
});

app.post("/delete/:id", async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).send("Error deleting blog");
  }
});

if (process.env.VERCEL !== '1') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
