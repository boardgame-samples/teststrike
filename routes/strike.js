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
  rotate: "",
  value: "",
  origin: [],
  current: [],
  vector: []
}


class Player {
  constructor(name, id) {
    this.name = name
    this.id = id
    this.dice_number = 6
  }
}

class board_dice {
  constructor(value, current, rotate) {
    this.value = value
    this.nextvalue = 0
    this.current = current
    this.rotate = rotate
    this.move = 0
    this.next = []
    this.vector = []
  }
}


const io = require("socket.io")();
const socketapi = {
  io: io,
};

// Add your socket.io logic here!

io.on("connection", (socket) => {
  console.log("A user connectedxxxxx");

  socket.on('touchinfo', (msg) => {
    console.log(msg)
    var touch_start = msg.touch_start;
    var touch_end = msg.touch_end;
    var diff = msg.diff

    var newX = touch_start[0] + (touch_end[0] - touch_start[0]) * (1000 / diff)
    var newY = touch_start[1] + (touch_end[1] - touch_start[1]) * (1000 / diff)

    if (newY < 51) {
      if (newX < 500) {
        newX = 50;
        newY = 50;
      } else {
        newX = 950;
        newY = 50;
      }
    } else if (newY > 949) {
      if (newX < 500) {
        newX = 50;
        newY = 950;
      } else {
        newX = 950;
        newY = 950;
      }
    } else {
      if (newX < 51) {
        newX = 50;
        newY = 500;
      } else if (newX > 949) {
        newX = 950;
        newY = 500;
      }
    }




    var order = Math.floor(turn % playercount)
    var value = Math.floor(Math.random() * 6) + 1;
    var current = [newX, newY]
    var rotate = 9 * (Math.floor(Math.random() * 10) + 1);
    move_dice.rotate = rotate;
    move_dice.value = value
    move_dice.origin = [touch_start[0], touch_start[1]]
    move_dice.current = [newX, newY]
    move_dice.vector = [newX - touch_start[0], newY - touch_start[1]]
    var flip_distance = Math.sqrt((newX - touch_start[0]) ** 2 + (newY - touch_start[1]) ** 2) / 4

    //今、board_dicesは前の更新する前の状態で、move_diceだけ作成した状態。
    //このあと、今あるboard_dicesの.move .next .vector を更新する作業
    //その後、Move()で2回のアニメーションの処理をする
    for (var i in board_dices) {
      var min_distance2 = min_d2(board_dices[i].current[0], board_dices[i].current[1], touch_start[0], touch_start[1], newX, newY)
      console.log(min_distance2)
      if (min_distance2 < 11000) {
        board_dices[i].move = 1

        var random8 = Math.floor(Math.random() * 4) + 1;
        do {
          switch (random8) {
            case 1:
              board_dices[i].next[0] = board_dices[i].current[0];
              board_dices[i].next[1] = board_dices[i].current[1] + flip_distance
              break;
            case 2:
              board_dices[i].next[0] = board_dices[i].current[0] + flip_distance
              board_dices[i].next[1] = board_dices[i].current[1]
              break;
            case 3:
              board_dices[i].next[0] = board_dices[i].current[0]
              board_dices[i].next[1] = board_dices[i].current[1] - flip_distance
              break;
            case 4:
              board_dices[i].next[0] = board_dices[i].current[0] - flip_distance
              board_dices[i].next[1] = board_dices[i].current[1]
              break;
          }
          var flip_check = (500 - board_dices[i].next[0]) ** 2 + (500 - board_dices[i].next[1]) ** 2
          random8 += 1;

        } while (160000 < flip_check && flip_check < 230400)
        board_dices[i].vector = [board_dices[i].next[0] - board_dices[i].current[0], board_dices[i].next[1] - board_dices[i].current[1]]
        board_dices[i].nextvalue = Math.floor(Math.random() * 6) + 1;
      }
    }

    Move();

    //このあと、board_dicesにmove_diceを加える作業。
    const bd = new board_dice(value, current, rotate)
    board_dices.push(bd)
    players[order].dice_number -= 1;

    //board_dicesのmove = 1に対して、value に nextvalue　を代入する。moveが終わったら、board_dicesの値はすべて最新の状態に更新。
    //board_dicies.currentは古いままなのでnextに更新する。
    for(var i in board_dices){
      if(board_dices[i].move == 1){
        board_dices[i].value = board_dices[i].nextvalue;
        board_dices[i].current[0] = board_dices[i].next[0];
        board_dices[i].current[1] = board_dices[i].next[1];
        board_dices[i].move = 0;
      }
    }


    ///新しい座標が消えるかどうかのチェック。　座標が円の外なら、board_dicesから削除する。delete_dicesに加える。

    board_dices_temp = []
    delete_dices = []
    for (var i in board_dices) {
      var distance_n = Math.sqrt((500 - board_dices[i].current[0]) ** 2 + (500 - board_dices[i].current[1]) ** 2)

      if (distance_n < 400) {
        board_dices_temp.push(board_dices[i])
      } else {
        delete_dices.push(board_dices[i])
      }
    }
    board_dices = board_dices_temp.slice()

    /////add_dicesにいくやつ、delete_dicesにいくやつをチェック。移す。

    board_dices_temp = []
    add_dices = []
    var point
    var duplicate = [0, 0, 0, 0, 0, 0]
    var add_number = 0

    for (var i in board_dices) {
      point = board_dices[i].value
      duplicate[point - 1] += 1;
    }

    for (k = 1; k < 7; k++) {

      //k==2が重複しているとき場合を考える、、、
      if (duplicate[k - 1] > 1) {

        for (var i in board_dices) {
          if (board_dices[i].value == k) {
            if(k == 1){
              delete_dices.push(board_dices[i])
            }else{
              add_dices.push(board_dices[i])
              add_number += 1;
            }
          }
        }

      } else {
      //重複してない場合、、、
        for (var i in board_dices) {
          if (board_dices[i].value == k) {
            board_dices_temp.push(board_dices[i])
          }
        }
      }
    }
    board_dices = board_dices_temp.slice()

    /////////この時点で、board_dicesがboard, add, deleteに振り分けられた。
    ///Add_dicesの数だけプレイヤーに加える。
    players[order].dice_number += add_number;






  ///とりあえず、5秒後に、board, add , deleteを表示,　　実際は、
      ///players, delete_dicesに加えるやつを２秒点滅させたあとに、Renewで消す。
    //   setTimeout(function(){
    //    Add_Delete()}, 5000);
        setTimeout(function(){
          Add_Delete()}, 2000);  





    var dicevalues = []
    for (var i in board_dices) {
      dicevalues.push(board_dices[i].value)
    }
    console.log('出た目:' + value)
    console.log('datavalues:' + dicevalues)
    for (var i in board_dices) {
      console.log('move:' + board_dices[i].move)
      console.log('current:' + board_dices[i].current)
      console.log('next:' + board_dices[i].next)

    }

  });
});
// end of socket.io logic


//////////////////////////////////////////
function min_d2(x0, y0, x1, y1, x2, y2) {
  var a = x2 - x1;
  var b = y2 - y1;
  var a2 = a * a;
  var b2 = b * b;
  var r2 = a2 + b2;
  var tt = -(a * (x1 - x0) + b * (y1 - y0));
  if (tt < 0) {
    return (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
  }
  if (tt > r2) {
    return (x2 - x0) * (x2 - x0) + (y2 - y0) * (y2 - y0);
  }
  var f1 = a * (y1 - y0) - b * (x1 - x0);
  return (f1 * f1) / r2;
}


//////////////////////////////////////////
function Renew() {
  msg = {
    gamestate: gamestate,
    //    login: login,
    players: players,
    board_dices: board_dices
  }

  // const io = require('../bin/www.js');
  //  const socketapi = require("../socketapi");
  socketapi.io.emit("renew", msg);
}

function Move() {
  msg = {
    gamestate: gamestate,
    players: players,
    board_dices: board_dices,
    move_dice: move_dice
  }
    ;
  socketapi.io.emit("move", msg);
}

function Add_Delete() {
  msg = {
    gamestate: gamestate,
    players: players,
    board_dices: board_dices,
    delete_dices: delete_dices,
    add_dices: add_dices
  }

  // const io = require('../bin/www.js');
  //  const socketapi = require("../socketapi");
  socketapi.io.emit("Add_Delete", msg);
}


function Check(req, res) {
  if (req.session.login == null) {
    req.session.back = '/strike';
    res.redirect('/users/login');
    return true;
  } else {
    return false;
  }
}


function Join(playername, playerid) {
  //このあと、入力された情報から、プレイヤークラスを作成
  const player = new Player(playername, playerid)
  players.push(player)
  console.log(playerlist)
}



/* GET home page. */
router.get('/', function (req, res, next) {
  if (Check(req, res)) { return }

  var data = {
    gamestate: gamestate,
    login: req.session.login,
    playerlist: playerlist
  }
  res.render('strike/index', data);
});


/* STARTクリック */
router.post('/start', function (req, res, next) {
  gamestate = 1;
  turn = 0
  playercount = players.length

  var ini_value = Math.floor(Math.random() * 6) + 1;
  var ini_current = [500, 500]
  var ini_rotate = 30 * (Math.floor(Math.random() * 12) + 1);
  const bd = new board_dice(ini_value, ini_current, ini_rotate)
  board_dices.push(bd)

  //  var login = req.session.login
  Renew()

  res.writeHead(204, { 'Content-Length': '0' });
  res.end();


});


/* JOINクリック */
router.post('/join', function (req, res, next) {
  if (playerlist.length > 3) {
    //   const io = require('../bin/www.js');
    //   io.emit("max",'');

    //   const socketapi = require("../socketapi");
    socketapi.io.emit("max", '');
  } else {
    var pn = req.session.login.name
    console.log(pn)

    if (playerlist.includes(pn)) {
      ; //trueならなにもしない
    } else {
      playerlist.push(pn)
      var pi = playerlist.length - 1;

      Join(pn, pi)

      msg = {
        playerlist: playerlist,
        word: "join"
      }
      //      const io = require('../bin/www.js');
      //      const socketapi = require("../socketapi");
      socketapi.io.emit("startrenew", msg);
    }
  }

})

/* EXITクリック */
router.post('/exit', function (req, res, next) {
  var val = req.session.login.name

  if (playerlist.includes(val)) {
    //trueならリストから削除
    var index = playerlist.indexOf(val)
    playerlist.splice(index, 1)

    msg = {
      playerlist: playerlist,
      word: "exit"
    }
    //  const io = require('../bin/www.js');
    //  const socketapi = require("../socketapi");
    socketapi.io.emit("startrenew", msg);

  } else {
    ; //リストにないなら何もおこらない
  }

})




/* ReSetを クリック */
router.post('/reset', function (req, res, next) {
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







module.exports = { router, socketapi }
