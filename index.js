import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { config } from 'dotenv';
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';

config();  // Initialize dotenv to use environment variables

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

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
    mongoose.set('maxTimeMS', 5000);  // 5 seconds timeout
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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
app.use(cors());

// Error handling for unhandled promises and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Wrap the main application logic in a try-catch block
try {
  await connectToDatabase();
  console.log("Connected to MongoDB");

  // Routes
  app.get("/", async (req, res) => {
    try {
      const blogs = await Blog.find({});
      res.render("index.ejs", { blogs });
    } catch (error) {
      console.error("Error fetching blogs:", error);
      res.status(500).send("An error occurred while fetching blogs");
    }
  });

  app.get("/create", (req, res) => {
    res.render("create.ejs", { signal: 'createpost' });
  });

  app.get("/view/:id", async (req, res) => {
    try {
      const blog = await Blog.findById(req.params.id);
      if (!blog) {
        return res.status(404).send("Blog not found");
      }
      res.render("blog.ejs", { blog });
    } catch (error) {
      console.error("Error fetching blog:", error);
      res.status(500).send("An error occurred while fetching the blog");
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
      res.status(500).send("An error occurred while creating the blog");
    }
  });

  app.get("/edit/:id", async (req, res) => {
    try {
      const blog = await Blog.findById(req.params.id);
      if (!blog) {
        return res.status(404).send("Blog not found");
      }
      res.render("create.ejs", { signal: 'editpost', blog });
    } catch (error) {
      console.error("Error fetching blog for edit:", error);
      res.status(500).send("An error occurred while fetching the blog for editing");
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
      res.status(500).send("An error occurred while updating the blog");
    }
  });

  app.post("/delete/:id", async (req, res) => {
    try {
      await Blog.findByIdAndDelete(req.params.id);
      res.redirect("/");
    } catch (error) {
      console.error("Error deleting blog:", error);
      res.status(500).send("An error occurred while deleting the blog");
    }
  });

  // Only start the server if we're not in a Vercel serverless environment
  if (process.env.VERCEL !== '1') {
    app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  }
} catch (error) {
  console.error("Application startup error:", error);
}

export default app;