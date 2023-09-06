var express = require('express');
const { render } = require('../app.js');
var router = express.Router();; // 作成したサーバー側Socketの外部関数を読み込み


var temp_status = [0,0,0,0,0,0,0,0,0,0,0]
var close_status = [0,0,0,0,0,0,0,0,0,0,0]
var winner = 0
var dice = [0,0,0,0]
var dice_array = []
var number1 = []
var number2 = []
var choice_set = [0,0,0]
var numbers = []
var gamestate = 0
var playerlist = []
var players = []
var turn = 0
var playercount = 0
var rollstatus = 1
var stopstatus = 0
var choicestatus = 0
var action_status = 0
var move_status = [0,0,0,0,0,0,0,0,0,0,0]
var difference_status
var burst_status = 0

class Player{
  constructor(name,id){
    this.name = name
    this.id = id
    this.status = [0,0,0,0,0,0,0,0,0,0,0]
 //   this.status = [2,4,6,8,10,12,10,8,6,4,2]
    this.win = 0
    this.point = []
  }
}


function Renew(login){
  var order = Math.floor(turn % playercount)

  msg = {
    temp_status: temp_status,
    close_status: close_status,
    dice: dice,
    dice_array: dice_array,
    choice_set: choice_set,  
    number1: number1,
    number2: number2,
    numbers: numbers,
    login: login,
    players:players,
    rollstatus:rollstatus,
    stopstatus:stopstatus,
    choicestatus:choicestatus,
    action_status:action_status,
    order:order,
    move_status:move_status,
    difference_status:difference_status,
    burst_status:burst_status

  }

  const io = require('../bin/www.js');
  io.emit("renew", msg);
}


function End(){

  var order = Math.floor(turn % playercount)
  msg = {
    players:players,
    order:order,
  }

temp_status = [0,0,0,0,0,0,0,0,0,0,0]
close_status = [0,0,0,0,0,0,0,0,0,0,0]
winner = 0
dice = [0,0,0,0]
dice_array = []
number1 = []
number2 = []
choice_set = [0,0,0]
numbers = []
gamestate = 0
playerlist = []
players = []
turn = 0
playercount = 0
rollstatus = 1
stopstatus = 0
choicestatus = 0
action_status = 0
move_status = [0,0,0,0,0,0,0,0,0,0,0]
difference_status = []

  const io = require('../bin/www.js');
  io.emit("end",msg);
}

function Reset(req){
temp_status = [0,0,0,0,0,0,0,0,0,0,0]
close_status = [0,0,0,0,0,0,0,0,0,0,0]
winner = 0
dice = [0,0,0,0]
dice_array = []
number1 = []
number2 = []
choice_set = [0,0,0]
numbers = []
gamestate = 0
playerlist = []
players = []
turn = 0
playercount = 0
rollstatus = 1
stopstatus = 0
choicestatus = 0
action_status = 0
move_status = [0,0,0,0,0,0,0,0,0,0,0]
difference_status = []
  ;
var resetplayer = req.session.login.name;

  msg = {
    resetplayer:resetplayer
  }

  const io = require('../bin/www.js');
  io.emit("reset",msg);
}

function Check(req,res){
  if (req.session.login == null){
    req.session.back = '/game';
    res.redirect('/users/login');
    return true;
  }else{
    return false;
  }
}

//function Start(){
//  gamestate = 1;
//}

function Join(playername,playerid){
 //このあと、入力された情報から、プレイヤークラスを作成
  const player = new Player(playername,playerid)
  players.push(player) 
  console.log(playerlist)
}


function Roll(){
  dice_array = []
  for(i=0; i<4; i++){
    dice[i] = Math.floor(Math.random() * 6) + 1;
  }
  var arr1 = [dice[0]+dice[1], dice[2]+dice[3]]
  var arr2 = [dice[0]+dice[2], dice[1]+dice[3]]
  var arr3 = [dice[0]+dice[3], dice[1]+dice[2]]
  dice_array.push(arr1)
  if(arr1[0] != arr2[0] && arr1[1] != arr2[0]){
    dice_array.push(arr2)
  }
  if(arr1[0] != arr3[0] && arr1[1] != arr3[0] && arr2[0] != arr3[0] && arr2[1] != arr3[0]){
    dice_array.push(arr3)
  }

}

function Confirm(i){
  number1 = dice_array[i][0]
  number2 = dice_array[i][1]

  if(choice_set[0] != 0 && choice_set[1] != 0 && choice_set[2] == 0 && number1 != number2 && 
    choice_set[0] != number1 && choice_set[0] != number2 && choice_set[1] != number1 && choice_set[1] != number2 ){
//    numbers = [number1 + 'を選ぶ', number2 + 'を選ぶ']
      numbers = [number1, number2]

    rollstatus = 0;
    stopstatus = 0;
    choicestatus = 0;
    action_status = 3;
  }
  else{
    Choice()
  }
}

function Choice(){
  var temp_status_copy = temp_status.slice();
  var close_status_copy = close_status.slice();
  var order = Math.floor(turn % playercount)

  for(j=1; j<3; j++){
    if(j == 1){
      var number = number1
    }
    if(j == 2){
      var number = number2
    }

    if(close_status[number - 2] == 0){
      if(choice_set[0] != 0 && choice_set[1] != 0 && choice_set[2] != 0){
        for(i=0; i<3; i++){
          if(choice_set[i] == number){
            temp_status[number - 2] += 1
            if(temp_status[number - 2]>(12-(2*Math.abs(number-7)))){
              close_status[number - 2] +=1;
              players[order].point.push(number);
            }
            break;
          }
        }
      }else{
        for(i=0; i<3; i++){
          if(choice_set[i] == 0){
            choice_set[i] = number
            temp_status[number - 2] += 1
            if(temp_status[number - 2] > (12-(2*Math.abs(number-7)))){
              close_status[number - 2] +=1
              players[order].point.push(number);
            }
            break;        
          }
          else if(choice_set[i] == number){
            temp_status[number - 2] += 1
            if(temp_status[number - 2] > (12-(2*Math.abs(number-7)))){
              close_status[number - 2] +=1
              players[order].point.push(number);
            }
            break;
          }
          else{
            ;
          }
        }
      }
    }
  }

  var difference = 0
  difference_status =[]
  for(i=0; i<11; i++){
    if(temp_status_copy[i] != temp_status[i]){
      difference += 1
      difference_status.push(i+2)
      move_status[i] = temp_status[i]
    }
  }

  if(difference  == 0){
    close_status = close_status_copy.slice()
    burst_status = 1;
    return;
 
 //   temp_status = [0,0,0,0,0,0,0,0,0,0,0]
 //   choice_set = [0,0,0]
  }

  dice_array = [];
  numbers = []
  action_status = 1;

  Win();
}

function Burst(){

//すでに変更済み
//  dice_array = [];
//  numbers = []
//  action_status = 1;

temp_status = [0,0,0,0,0,0,0,0,0,0,0]
choice_set = [0,0,0]
 rollstatus = 1;
 stopstatus = 0;
 action_status = 0;
  dice = [0,0,0,0]
  move_status = [0,0,0,0,0,0,0,0,0,0,0]
  number1 = 0
  number2 = 0

}




function Win(){
  var counter = 0
  for( i = 0;  i < 11;  i++ ) {
      if(temp_status[i] > (12-(2*Math.abs(i-5)))){
          counter += 1
      }
  } 
  if (counter > 2){
    winner = 1
    var order = Math.floor(turn % playercount)
    players[order].win = 1 
}};

function Stop(i){

  players[i].status =temp_status.slice()
  move_status = [0,0,0,0,0,0,0,0,0,0,0]
  dice = [0,0,0,0]
  number1 = 0
  number2 = 0
  choice_set = [0,0,0]
  numbers = []

}


/* GET home page. */
router.get('/', function(req, res, next) {
  if(Check(req,res) ){return}

  if(gamestate == 0){
    var data = {
      login:req.session.login,
      playerlist:playerlist
    }
    res.render('game/start', data);
  }else{
  var data = {
    numbers: numbers,
    login:req.session.login,
    playerlist:playerlist
  }
  res.render('game/index', data);
}
});


/* STARTクリック */
router.post('/start', function(req, res, next){
  gamestate = 1;
  turn = 0
  playercount = players.length
  console.log(playercount)

//  res.redirect('/game')
  const io = require('../bin/www.js');
  io.emit("transfer", '');

  
  var login = req.session.login;
  setTimeout(function(){
    Renew(login)}, 2000);

});


/* JOINクリック */
router.post('/join', function(req,res,next){
  if(playerlist.length > 3){
    const io = require('../bin/www.js');
    io.emit("max",'');
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
      const io = require('../bin/www.js');
      io.emit("startrenew", msg);
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
    const io = require('../bin/www.js');
    io.emit("startrenew", msg);

  }else{
    ; //リストにないなら何もおこらない
  }

})


/* ROLLクリック */
router.post('/roll', function(req, res, next){
  Roll()
  rollstatus = 0;
  stopstatus = 0;
  choicestatus = 1;
  action_status = 2;
  var login = req.session.login;
  Renew(login); 
});

/* array i クリック */
router.post('/confirm', function(req, res, next){
  rollstatus = 1;
  stopstatus = 1;
  choicestatus = 0;
  confirm_key = Object.keys(req.body)

  var key0 = 'array0';
  var key1 = 'array1';
  if(confirm_key.includes(key0)){

    console.log(confirm_key)
    Confirm(0)
  }else if(confirm_key.includes(key1)){

    console.log(confirm_key)
    Confirm(1)
  }else{

    console.log(confirm_key)
    Confirm(2)
  }

if(burst_status == 1){
    ;console.log('バースト')  //
    Burst()
    var login = req.session.login;
    turn += 1;
    var order = Math.floor(turn % playercount)
    temp_status = players[order].status.slice();
    Renew(login);
  

    burst_status = 0;

}else{

  if(winner == 1){
    //res.redirect('/')
    End()
    //実際は全員を/game/winへとばす
  }else{
//    res.redirect('/game');   
    dice = [0,0,0,0]
    var login = req.session.login;
    Renew(login); 
  }

}
});



/* Xを選ぶを クリック */
router.post('/choice', function(req, res, next){

  choice_key = Object.keys(req.body)
  var key0 = 'numbers0'
  if(choice_key.includes(key0)){
    Choice()
  }else{
    /* numbers入れ替え */
    [number1, number2] = [number2, number1]
    Choice();
  }

if(burst_status == 1){
    ;console.log('バースト')  //
    Burst()

    var login = req.session.login;
    turn += 1;
    var order = Math.floor(turn % playercount)
    temp_status = players[order].status.slice();
    Renew(login);
  

    burst_status = 0;
}else{

  if(winner == 1){
    //res.redirect('/')
    End()
  }else{
//   res.redirect('/game');  
   rollstatus = 1;
   stopstatus = 1; 
   var login = req.session.login; 
   Renew(login);  
  }

}
});

/* STOPを クリック */
router.post('/stop', function(req, res, next){
  action_status = 4;
  //
  //一度、ここでrenew
  var login = req.session.login;
  Renew(login); 
  
  var order = Math.floor(turn % playercount)
  Stop(order)
  turn += 1;
  var order = Math.floor(turn % playercount)
  temp_status = players[order].status.slice();
  rollstatus = 1;
  stopstatus = 0;
  action_status = 0;

  //1.5secしてから、もう一度renewする。
  setTimeout(function(){
    Renew(login)}, 1600);

//  Renew(req);
});


/* ReSetを クリック */
router.post('/reset', function(req, res, next){
  Reset(req)
//  Renew(req);
});

module.exports = router;
