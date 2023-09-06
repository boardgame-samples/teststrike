var express = require('express');
const { render } = require('../app.js');
const { move } = require('./index.js');
var router = express.Router();; // 作成したサーバー側Socketの外部関数を読み込み



var gamestate = 0
var playerlist = []
var players = []
var turn = 0
var playercount = 0
var board_dices = []
var board_dices_temp = []
var delete_dices = []
var dead_dices = []
var add_dices = []
var move_dice = {
  value:"",
  origin:[],
  current:[],
  vector:[]
}


class Player{
  constructor(name,id){
    this.name = name
    this.id = id
    this.dice_number = 6
  }
}

class board_dice{
  constructor(value,current,rotate){
    this.value = value
    this.current = current
    this.rotate = rotate
  }
}


const io = require( "socket.io" )();
const socketapi = {
    io: io,
};

// Add your socket.io logic here!

io.on("connection", (socket)=>{
    console.log( "A user connectedxxxxx" );

    socket.on('touchinfo', (msg)=>{
      console.log(msg)
      var touch_start = msg.touch_start;
      var touch_end = msg.touch_end;
      var diff = msg.diff

      var newX = touch_start[0] + (touch_end[0]-touch_start[0])*(1000/diff)
      var newY = touch_start[1] + (touch_end[1]-touch_start[1])*(1000/diff)

      if(newY < 51){
        if(newX < 500){
          newX = 50;
          newY = 50;
        }else{
          newX = 950;
          newY = 50;
        }
      }else if(newY > 949){
        if(newX < 500){
          newX = 50;
          newY = 950;
        }else{
          newX = 950;
          newY = 950;
        }
      }else{
        if(newX < 51){
          newX = 50;
          newY = 500;
        }else if(newX > 949){
          newX = 950;
          newY = 500;
        }
      }




      var order = Math.floor(turn % playercount)
      var value = Math.floor(Math.random()*6) + 1;
      var current = [newX, newY]
      var rotate =  9*(Math.floor(Math.random()*10) + 1);
      move_dice.value = value
      move_dice.origin = [touch_start[0],touch_start[1]]
      move_dice.current = [newX, newY]
      move_dice.vector = [newX - touch_start[0], newY - touch_start[1]]
      Move();

      const bd = new board_dice(value, current,rotate)
      board_dices.push(bd)
      
      players[order].dice_number -= 1;

//     setTimeout(function(){
//       Renew()}, 2000);


      ///新しい座標が消えるかどうかのチェック。　座標が円の外なら、board_dicesから削除する。delete_dicesに加える。

      board_dices_temp = []
      delete_dices = []
      for(var i in  board_dices){
        var distance_n = Math.sqrt( (500 - board_dices[i].current[0])**2 + (500-board_dices[i].current[1])**2 )
        
        if(distance_n < 400){
          board_dices_temp.push(board_dices[i])
        }else{
          delete_dices.push(board_dices[i])
        }
      }

      board_dices = board_dices_temp.slice()

   //   console.log(board_dices)
   //   console.log(board_dices_temp)
   //   console.log(delete_dices)


   /////add_dicesにいくやつ、delete_dicesにいくやつをチェック。移す。

   board_dices_temp = []
   add_dices = []
   var point
   var duplicate = [0,0,0,0,0,0]

   for(var i in board_dices){
   point = board_dices[i].value
   duplicate[point - 1] += 1; 
   }


 

  for(k=1; k<7; k++){

      //k==2が重複しているとき場合を考える、、、
      if(duplicate[k-1] > 1 ){

        for(var i in board_dices){
        if(board_dices[i].value == k){
          add_dices.push(board_dices[i])
        }
      }

      }else{

        for(var i in board_dices){
        
        if(board_dices[i].value == k){
          board_dices_temp.push(board_dices[i])
        }
      }
      }
  }
  board_dices = board_dices_temp.slice()  

/*

     ///players, delete_dicesに加えるやつを点滅させたあとに、Renewで消す。
   setTimeout(function(){
    Add_Delete()}, 5000);
    setTimeout(function(){
      Renew()}, 10000);   */

    var dicevalues = []
      for(var i in board_dices){
        dicevalues.push(board_dices[i].value)
      }
    var player_posess = []
    for(var i in players){
      player_posess.push(players[i].dice_number)
    }

  
    console.log('datavalues:' + dicevalues)
    console.log('duplicate' + duplicate);
    console.log('player_dice_numbers' + player_posess)

    });




    });
// end of socket.io logic


//////////////////////////////////////////
function Renew(){
  msg = {
    gamestate:gamestate,
//    login: login,
    players:players,
    board_dices:board_dices
  }

 // const io = require('../bin/www.js');
//  const socketapi = require("../socketapi");
  socketapi.io.emit("renew", msg);
}

function Move(){
  msg = {
    gamestate:gamestate,
    players:players,
    board_dices:board_dices,
    move_dice:move_dice
  }
  ;
  socketapi.io.emit("move", msg);
}

function Add_Delete(){
  msg = {
    gamestate:gamestate,
    players:players,
    board_dices:board_dices,
    delete_dices:delete_dices
  }

 // const io = require('../bin/www.js');
//  const socketapi = require("../socketapi");
  socketapi.io.emit("Add_Delete", msg);
}


function Check(req,res){
  if (req.session.login == null){
    req.session.back = '/strike';
    res.redirect('/users/login');
    return true;
  }else{
    return false;
  }
}


function Join(playername,playerid){
 //このあと、入力された情報から、プレイヤークラスを作成
  const player = new Player(playername,playerid)
  players.push(player) 
  console.log(playerlist)
}



/* GET home page. */
router.get('/', function(req, res, next) {
  if(Check(req,res) ){return}

    var data = {
      gamestate:gamestate,
      login:req.session.login,
      playerlist:playerlist
    }
    res.render('strike/index', data);
});


/* STARTクリック */
router.post('/start', function(req, res, next){
  gamestate = 1;
  turn = 0
  playercount = players.length

  var ini_value = Math.floor(Math.random() * 6) + 1;
  var ini_current = [500, 500]
  var ini_rotate = 30*(Math.floor(Math.random()*12) + 1);
  const bd = new board_dice(ini_value, ini_current, ini_rotate)
  board_dices.push(bd)

//  var login = req.session.login
  Renew()

  res.writeHead(204, { 'Content-Length': '0' });
  res.end();


});


/* JOINクリック */
router.post('/join', function(req,res,next){
  if(playerlist.length > 3){
 //   const io = require('../bin/www.js');
 //   io.emit("max",'');

 //   const socketapi = require("../socketapi");
    socketapi.io.emit("max", '');
  }else{
    var pn = req.session.login.name
    console.log(pn)

    if(playerlist.includes(pn)){
      ; //trueならなにもしない
    }else{
      playerlist.push(pn)
      var pi = playerlist.length - 1;
  
      Join(pn,pi)

      msg = {
        playerlist:playerlist,
        word: "join"
      }
//      const io = require('../bin/www.js');
//      const socketapi = require("../socketapi");
      socketapi.io.emit("startrenew", msg);
    }
  }

})

/* EXITクリック */
router.post('/exit', function(req,res,next){
  var val = req.session.login.name

  if(playerlist.includes(val)){
    //trueならリストから削除
    var index = playerlist.indexOf(val)
    playerlist.splice(index, 1)

    msg = {
      playerlist:playerlist,
      word: "exit"
    }
  //  const io = require('../bin/www.js');
  //  const socketapi = require("../socketapi");
    socketapi.io.emit("startrenew", msg);

  }else{
    ; //リストにないなら何もおこらない
  }

})




/* ReSetを クリック */
router.post('/reset', function(req, res, next){
  gamestate = 0;
  playerlist = []
  players = []
  turn = 0
  playercount = 0
 board_dices = []
 board_dices_temp = []
 delete_dices = []


//const io = require('../bin/www.js');
//const socketapi = require("../socketapi");
socketapi.io.emit("reset", '');

});







module.exports = { router, socketapi}
