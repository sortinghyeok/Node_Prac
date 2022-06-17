// app.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var Cookie_parser = require('cookie-parser');
var Session = require('express-session');
var Store = require('session-file-store')(Session);

const app = express();

//post parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
//session
app.use(Session({
  httpOnly: true,	
  secure: true,	
  secret: 'secret key',	
  resave: false,	
  saveUninitialized: true,
  store: new Store(),
  cookie: {	
    httpOnly: true,
    Secure: true
  }
}));
//mongodb connection
mongoose.connect('mongodb+srv://sortinghyeok:ckatoqnfl1@cluster0.yifiu.mongodb.net/?retryWrites=true&w=majority');
var db = mongoose.connection;

db.on('error', () => {
  console.log('mongodb error');
});

db.on('open', () => {
  console.log('mongodb connected');
});
//make mongo schema
var User = mongoose.Schema({
  id: 'string',
  pw: 'string',
  nickname: 'string',
  snakegame_score: Number,
  blockgame_score: Number
});
var user = mongoose.model('User', User);

var Forum = mongoose.Schema(
  {
    id : 'string',
    title : 'string',
    date : {type : Date, default : Date.now},
    content : 'string'
  }
)
var forum = mongoose.model('Forum', Forum);


//mainpage
app.get('/', (req, res) => {
  res.sendFile("/ljh_12172133/public/templates/main/main.html");
})


//game
app.get('/gamepage', (req,res) => {
  res.sendFile("/ljh_12172133/public/templates/gamepage/gamepage.html");
})

app.get('/gamepage/snakegame', (req,res) => {
  res.sendFile("/ljh_12172133/public/templates/gamepage/snakegame.html");
})

app.get('/gamepage/blockgame', (req,res) => {
  res.sendFile("/ljh_12172133/public/templates/gamepage/blockgame.html");
})

//{game: "snake" or "block" <string>, score : <int>} ajax communication
app.post('/gamepage/scoreupdate', (req,res)=>{

  var game = req.body.game;
  var score = req.body.score;
  var id = req.body.id;
  //DB에 대입
  user.findOne({id : id}, function(err, result){
    if(err) return res.json({status: "error", message: "에러 발생"});
    console.log('result')
    console.log(result)
    if(game == "snake")
    {
      if(result.snakegame_score < score)
      {   
        console.log('score : ' +  score)
 
        const filter = { id : id };
        const updateDoc = {
            snakegame_score : score
        };
  
        user.updateOne(filter, updateDoc, (err, collection) =>{
          if(err) throw err;
          console.log(collection)
          return res.json({status: "OK", message: "뱀게임 최고 점수 저장 완료"}); 
        });

         }
      else{
        return res.json({status: "OK", message: "뱀 게임 최대 점수 돌파 실패"});
      }
    }
    else{ //블록게임
      if(result.blockgame_score < score)
      {
        console.log('score : ' +  score)
        
        const filter = { id : id };
        const updateDoc = {
            blockgame_score : score
        };
  
        user.updateOne(filter, updateDoc, (err, collection) =>{
          if(err) throw err;
          console.log(collection)
          return res.json({status: "OK", message: "블록게임 최고 점수 저장 완료"}); 
        });
         }
      else{
        return res.json({status: "OK", message: "블록게임 최대 점수 돌파 실패"});
      }
    }
  })/*
  var User_doc = user.findOne({id : id}).catch(err => {
    console.log("post/scoreupdate error");}
  );
  console.log(User_doc)
  if(game === "snake"){
    if(User_doc.snakegame_score < score)
      User_doc.snakegame_score = score;
  }
  else{
    if(User_doc.blockgame_score < score)
      User_doc.blockgame_score = score;
  }
  User_doc.save();*/
})

//login
app.get('/login', (req,res)=>{
  res.sendFile("/ljh_12172133/public/templates/Login/login.html");
})
//req: {id : id<string>, passwd:passwd<string>}
app.post('/login', (req, res) => {
  
  var id = req.body.id;
  var passwd = req.body.passwd;
  // DB확인
  console.log(id + " " + passwd)
  user.findOne({id : String(id)}, function(err, doc){
    if(err)
    {
      res.send(err);
    }
    else{
      if(doc == null)
      {
        console.log('no one')
      }
      else{
        console.log(doc)
        
        console.log("userdoc : " + doc)
        if(doc== null){
          res.json({ status: "error", message: 'No such user' });
        }
        else if(doc.pw == passwd){
          console.log("password right");
          req.session.logined = true;
          req.session.uid = doc.id;
          res.json({status: "OK",
            message : "Login Success"});        
        }
        else{
          res.json({status: "error",
            message  : "Password not matched"});
        }
      }

    }
  })
  
 

})

//signup
app.get('/signup', (req,res) => {
  res.sendFile("/ljh_12172133/public/templates/signup/signup.html");
})

//req: {id<string>, passwd<string>, nickname<string>} 
app.post('/signup', (req, res)=>{
  console.log('reqbody')
  console.log(req.body);
  var id = req.body.id;
  var pw = req.body.passwd;
  var nickname = req.body.nickname;
  console.log(id +" " + pw + " " +nickname)
  var dup = false;
  user.exists({id : id}, function (err, doc) {
    if (err){
        console.log(err)
    }else{
        console.log("Result :", doc) // false
        if(doc != null)
        {
          return res.json({status: "error", message: "중복된 아이디"});
        }
        else{
          user.exists({nickname : nickname}, function (err, doc) {
            if (err){
                console.log(err)
            }else{
                console.log("Result :", doc) // false
                if(doc != null)
                {
                  return res.json({status: "error", message: "중복된 별명"});
                
                }
                else{
                  var newuser = new user({id:id, pw: pw, nickname: nickname, snakegame_score : 0, blockgame_score : 0});
                  newuser.save((error, data)=>{
                    if(error){
                      console.log(error);
                      return res.json({status: "error", message : "DB error"});
                    }
                    else{
                      console.log(data);
                      return res.json({status: "OK", message: "Sign up success!"});
                    }
                  })
                }
            }
          });
         
        }
    }
  });

  }
)

//forum
app.get('/forum', (req, res)=>{
  res.sendFile("/ljh_12172133/public/templates/forum/forum.html");
})

app.post('/forum', (req, res) => {
  forum.find({}, null, {sort: '-date'}, function(err, docs) {
    if(err) return res.json({status : 'error', message : '글 로드 불가'})
    return res.json({statis : "Ok", message : "글 로드", data : docs})
  });
 
})

// writing forum
app.get('/forum/writing', (req,res)=>{
  res.sendFile(("/ljh_12172133/public/templates/forum/writing.html"));
})

app.post('/forum/writing', (req,res)=>{
  var content = req.body.content;
  var id = req.body.id;
  var title = req.body.title;

  console.log(id +" " + title + " " +content)

  var newuser = new forum({id:id, content:content, title : title});
  newuser.save((error, data)=>{
    if(error){
      console.log(error);
      return res.json({status: "error", message : "DB error"});
    }
    else{
      console.log(data);
      return res.json({status: "OK", message: "글 업로드완료"});
    }
  })
})

app.get('/admin', (req,res)=>{
  res.sendFile(("/ljh_12172133/public/templates/admin/admin.html"));
})

app.post('/admin', (req, res)=>{
  
  forum.find({}, null, {sort: '-date'}, function(err, docs) {
    if(err) return res.json({status : 'error', message : '글 로드 불가'})
    else {
      let forumlen = docs.length;

      forum.find({}, null, {sort: 'id'}, function(err, docs) {
        if(err) return res.json({status : 'error', message : '유저수 불가'})
        else {
          let userlen = docs.length; 

          user.find({}, null, {sort: '-snakegame_score'}, function(err, docs) {
            if(err) return res.json({status : 'error', message : '뱀게임 불가'})
            else {
              let snakemax = docs[0].snakegame_score; 
              let snakeranker =docs[0].nickname
              user.find({}, null, {sort: '-blockgame_score'}, function(err, docs) {
                if(err) return res.json({status : 'error', message : '블록게임 불가'})
                else {
                  let blockmax = docs[0].blockgame_score; 
                  let blockranker =docs[0].nickname
                  user.find({}, null, {sort: '-blockgame_score'}, function(err, docs) {
                    if(err) return res.json({status : 'error', message : '블록게임 불가'})
                    else {
                      let blockmax = docs[0].blockgame_score; 
                      let blockranker =docs[0].nickname
                      
                      return res.json({status :'OK', message : 'json전송', data : {
                        'forumlen' : forumlen,
                        'userlen' : userlen,
                        'snakemax' : snakemax,
                        'blockmax' : blockmax,
                        'snakeranker' : snakeranker,
                        'blockranker' : blockranker
                      }})
                      
                    }
                  })
           
                  
                }
              })
    
              
            }
          })



        }
      })
    }
  })
});



app.listen(8080, () => console.log('port #8080 running'));