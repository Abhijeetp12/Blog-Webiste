import express from "express";
import bodyParser from "body-parser";
import {nanoid} from 'nanoid';

const app=express();
const port=3000;
let blogpost=[];
let bid;
let signal;



app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));



app.get("/",(req,res) =>{
 res.render("index.ejs",{blogs:blogpost});

});

app.get("/create",(req,res) => {
signal='createpost';
res.render("create.ejs",{signal});
});

app.get("/view/:id",(req,res) =>{
  const currid=req.params.id;
  const currblog=blogpost.find((blog) => blog.id === currid);
  res.render("blog.ejs",{blog:currblog});
});

app.post("/submit",(req,res) =>{
  bid=nanoid();      
      let blog={
        id:bid,
        authorfname:req.body.fname,
        authorlname:req.body.lname,
        title: req.body.title,
        content: req.body.content
      }
      blogpost.push(blog);
      console.log(blog);
      res.redirect("/");
});
app.get("/edit/:id",(req,res) => {
  signal='editpost'
  const currid=req.params.id;
  const currblog=blogpost.find((blog) => blog.id === currid);
  console.log(currblog);
  res.render("create.ejs",{signal,blog:currblog});
});
app.post("/edit/:id",(req,res) => {
const cid=req.params.id;
const currblog=blogpost.find((blog) => blog.id === cid);
console.log(currblog);
const newblog={
  id:cid,
  authorfname:currblog.authorfname,
  authorlname:currblog.authorlname,
  title:req.body.title || currblog.title,
  content:req.body.content || currblog.content,
}
console.log(newblog);
const searchindex=blogpost.findIndex((blog) => blog.id === cid);
blogpost[searchindex]=newblog;
res.redirect("/");
});

app.post("/delete/:id",(req,res)=>{
  const currid=req.params.id;
  const currblog=blogpost.find((blog) => blog.id === currid);
  const searchIndex=blogpost.findIndex((blog) => blog.id === currblog.id);
  if(searchIndex >-1){
    blogpost.splice(searchIndex,1);
    res.redirect("/");
  }
  else{
    res.sendStatus(404).send("No such blog found");
  }
});





app.listen(port,() => {
 console.log(`Listening on port ${port}`);
});