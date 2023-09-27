var express = require('express');
const { render } = require('../app.js');
const { move } = require('./index.js');
var router = express.Router();; // 作成したサーバー側Socketの外部関数を読み込み


var gamestate = 0
var actionstate = 0
var namestate = 0
var playerlist = []
var players = []
var turn = 0
var playercount = 0
var board_dices = []
var board_dices_temp = []
var delete_dices = []
var add_dices = []
var move_dice = {
  rotate: "",
  value: "",
  origin: [],
  current: [],
  vector: []
}
var board_length = 0
var winner



class Player {
  constructor(name, id) {
    this.name = name
    this.id = id
    this.dice_number = 5;
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
    var stable_dices = []
    //今、board_dicesは前の更新する前の状態で、move_diceだけ作成した状態。
    //このあと、今あるboard_dicesの.move .next .vector を更新する作業
    //その後、Move()で2回のアニメーションの処理をする


    if (board_dices.length == 0) {
      board_length = 0
      //もし、board_dicesが0個だった場合、ここで、playerのダイス数-１個を、
      //board_dicesに加える。座標はすべてmove_diceとおなじ。
      //player.dice_numberから加えた分を引く。(＝1にする。)
      //その後の処理の違いは、おそらくmove()描画のみ。 
      if (players[order].dice_number > 1) {

        for (k = 1; k < players[order].dice_number; k++) {
          //追加
          var burst_value = Math.floor(Math.random() * 6) + 1;
          var burst_current = [newX, newY]
          var burst_rotate = 9 * (Math.floor(Math.random() * 10) + 1);
          const bd = new board_dice(burst_value, burst_current, burst_rotate)
          board_dices.push(bd)
        }
      }
      players[order].dice_number = 1;
    }else{
      board_length = 1;
    }


    for (var i in board_dices) {
      var flipX
      var flipY
      var min_distance2 = min_d2(board_dices[i].current[0], board_dices[i].current[1], touch_start[0], touch_start[1], newX, newY)
      console.log('min_distance2:')
      console.log(min_distance2)
      if (min_distance2 < 20000) {
        board_dices[i].move = 1

        var random8 = Math.floor(Math.random() * 8) + 1;
        do {
          switch (random8 % 8) {
            case 1:
              flipX = board_dices[i].current[0];
              flipY = board_dices[i].current[1] + flip_distance
              break;
            case 2:
              flipX = board_dices[i].current[0] + flip_distance
              flipY = board_dices[i].current[1]
              break;
            case 3:
              flipX = board_dices[i].current[0]
              flipY = board_dices[i].current[1] - flip_distance
              break;
            case 4:
              flipX = board_dices[i].current[0] - flip_distance
              flipY = board_dices[i].current[1]
              break;
            case 5:
              flipX = board_dices[i].current[0] + 0.7 * flip_distance
              flipY = board_dices[i].current[1] + 0.7 * flip_distance
              break;
            case 6:
              flipX = board_dices[i].current[0] + 0.7 * flip_distance
              flipY = board_dices[i].current[1] - 0.7 * flip_distance
              break;
            case 7:
              flipX = board_dices[i].current[0] - 0.7 * flip_distance
              flipY = board_dices[i].current[1] + 0.7 * flip_distance
              break;
            case 0:
              flipX = board_dices[i].current[0] - 0.7 * flip_distance
              flipY = board_dices[i].current[1] - 0.7 * flip_distance
              break;
          }
          var flip_check = (500 - flipX) ** 2 + (500 - flipY) ** 2
          random8 += 1;

        } while (160000 < flip_check && flip_check < 230400)
        board_dices[i].next[0] = flipX
        board_dices[i].next[1] = flipY

        //       board_dices[i].vector = [board_dices[i].next[0] - board_dices[i].current[0], board_dices[i].next[1] - board_dices[i].current[1]]
        //        board_dices[i].nextvalue = Math.floor(Math.random() * 6) + 1;
      } else {
        stable_dices.push(board_dices[i])
      }
    }
    //これで、board_dicesのmoveが設定された。
    //重ならない処理を追加。追加で動かす場合、.vectorも一緒に更新。
    console.log('stable:')
    for (var i in stable_dices) {
      console.log(stable_dices[i].current)
    }

    var spiral;
    var continue_count;
    var spiral_coordinate = 0;

    for (var i in board_dices) {
      if (board_dices[i].move == 1) {
        console.log('spiral処理,board_dices番号:, spiral:,continuecount;')
        console.log(i)
        console.log(spiral)
        console.log(continue_count);
        spiral = 0

        var stable_length = stable_dices.length

        do {
          //board[i]を少し動かしてSpiral()、すべてのstableに対して距離が離れているかをチェック。
          Spiral(spiral, i, spiral_coordinate);
          //spiral ==0なら動かない。１以上なら、board_dices[i]を右回転
          continue_count = 0


          for (k = 0; k < stable_length; k++) {
            //for (var k in stable_dices) {

            if (continue_count == 1) {
              continue;
            }
            var close_distance2 = (board_dices[i].next[0] - stable_dices[k].current[0]) ** 2
              + (board_dices[i].next[1] - stable_dices[k].current[1]) ** 2
            console.log('close_distance2:')
            console.log(close_distance2)

            if (close_distance2 < 40000) {
              continue_count = 1
            }
            console.log('kの時のcontinue_count' + k)
            console.log(continue_count)
          }
          //forが終わったあとに、continue_count == 1ならば、スパイラルで動かす
          ///continue_count == 0なら、dowhileを抜ける。次のboarddicd[i]へ。
          spiral += 1;
          spiral_coordinate += 1;

        } while (continue_count == 1 && spiral < 100)

        //do whileのループが終わったら、stable_dicesにboard_dices[i]をpushする。
        //board_dices[i+1]へ進。

        var temp_value = board_dices[i].value;
        var temp_current = [board_dices[i].next[0], board_dices[i].next[1]];
        var temp_rotate = board_dices[i].rotate;

        const bd = new board_dice(temp_value, temp_current, temp_rotate)
        stable_dices.push(bd)
      }
    }

    //nextが確定したら、vectorとnextvalueもきめる。
    for (var i in board_dices) {
      board_dices[i].vector = [board_dices[i].next[0] - board_dices[i].current[0], board_dices[i].next[1] - board_dices[i].current[1]]
      board_dices[i].nextvalue = Math.floor(Math.random() * 6) + 1;
    }
    players[order].dice_number -= 1;


    Move();

    //このあと、board_dicesにmove_diceを加える作業。
    const bd = new board_dice(value, current, rotate)
    board_dices.push(bd)

    //board_dicesのmove = 1に対して、value に nextvalue　を代入する。moveが終わったら、board_dicesの値はすべて最新の状態に更新。
    //board_dicies.currentは古いままなのでnextに更新する。
    for (var i in board_dices) {
      if (board_dices[i].move == 1) {
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
            if (k == 1) {
              delete_dices.push(board_dices[i])
            } else {
              add_dices.push(board_dices[i])
              add_number += 1;
            }
          }
        }

      } else {
        //重複してない場合、、、
        for (var i in board_dices) {
          if (board_dices[i].value == k) {
            if(k==1){
              delete_dices.push(board_dices[i])
            }else{
              board_dices_temp.push(board_dices[i])
            }

          }
        }
      }
    }
    board_dices = board_dices_temp.slice()

    /////////この時点で、board_dicesがboard, add, deleteに振り分けられた。
    ///Add_dicesの数だけプレイヤーに加える。
    players[order].dice_number += add_number;

    //Adddeleteのあと、renewで更新するため、actionstate=1に。
    actionstate = 1
    if(players[order].dice_number <1){
    actionstate = 2;
    } 
    //このプレイヤーはdeadになる。今後現れない。
    //actionstate == 2のとき、自動敵にstopし、次の人へ。

    //winnerのチェック　Winner()
    //勝者がいれば、とりあえずalert()で表示。
    Winner();

    function Winner(){
      var dice_sum = 0
      for(var i in players){
        if(players[i].dice_number > 0){
          dice_sum += 1;
          winner = playerlist[i];
        }
      }
      if(dice_sum == 1){
        actionstate = 3
      }
      ;
    }

    setTimeout(function () {
      Add_Delete()
    }, 2000);


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



  socket.on('start', () => {

    // STARTクリック 
    //  router.post('/start', function (req, res, next) {
    gamestate = 1;
    turn = 0
    playercount = players.length
    var initial_dices
    if (playercount == 2) {
      initial_dices = 8;
    } else if (playercount == 3) {
      initial_dices = 7
    } else if (playercount == 4) {
      initial_dices = 6;
    } else if (playercount == 5) {
      initial_dices = 5;
    } else {
      initial_dices = 6;
    }

    for (var i in players) {
      players[i].dice_number = initial_dices
    }

    var ini_value = Math.floor(Math.random() * 5) + 2;
    var ini_current = [500, 500]
    var ini_rotate = 30 * (Math.floor(Math.random() * 12) + 1);
    const bd = new board_dice(ini_value, ini_current, ini_rotate)
    board_dices.push(bd)
    Renew()
    namestate = 1;
  });


  // JOINクリック 
  socket.on("join", (data) => {
    if (playerlist.length > 4) {
      socketapi.io.emit("max", '');
    } else {
      var pn = data.myname
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
        socketapi.io.emit("startrenew", msg);
      }
    }
    ;
  })


  /*  /// EXITクリック */
  socket.on("exit", (data) => {

    var val = data.myname

    if (playerlist.includes(val)) {
      //trueならリストから削除
      var index = playerlist.indexOf(val)
      playerlist.splice(index, 1)

      msg = {
        playerlist: playerlist,
        word: "exit"
      }

      socketapi.io.emit("startrenew", msg);
    } else {
      ; //リストにないなら何もおこらない
    }
  })

  /*  /// continueクリック */
  socket.on("continue", (data) => {
    actionstate = 0;
    Renew()

  })

  /*  /// STOPクリック */
  socket.on("stop", (data) => {
    actionstate = 0;
    var tmax = 0
    //turncheckして、dice0ならとばす    players[order].dice_number
    do {
      turn += 1;
      tmax += 1;
      var order = Math.floor(turn % playercount)
    } while (players[order].dice_number < 1 && tmax < 6)
    Renew()
  })


});


// end of socket.io logic

//////////////////////////////////////////
//////////////////////////////////////////
function Spiral(n, i, spiral_coordinate) {
  if (n == 0) {
    return;
  } else {

    var nminus = n;
    var grounp
    var spiral_first = spiral_coordinate % 4

    for (var x = 0; x < 11; x++) {
      nminus -= (6 + 8 * x)
      if (nminus < 1) {
        group = x
        break;
      }
    }

    if (nminus + 2 * (grounp + 1) > 0) {
      //spin_move = 4のとき,, 
      if (spiral_first == 0) {
        //x軸が左に
        board_dices[i].next[0] = board_dices[i].next[0] - 100;
      } else if (spiral_first == 1) {
        //ｘ軸が右
        board_dices[i].next[0] = board_dices[i].next[0] + 100;
      } else if (spiral_first == 2) {
        //y軸上
        board_dices[i].next[1] = board_dices[i].next[1] - 100;
      } else {
        ;//y軸下
        board_dices[i].next[1] = board_dices[i].next[1] + 100;
      }

    } else if (nminus + 4 * (grounp + 1) > 0) {
      //spin_move = 3,,
      if (spiral_first == 0) {
        //y軸が下に
        board_dices[i].next[1] = board_dices[i].next[1] + 100;
      } else if (spiral_first == 1) {
        //ｙ軸が上に
        board_dices[i].next[1] = board_dices[i].next[1] - 100;
      } else if (spiral_first == 2) {
        //ｘ軸左に
        board_dices[i].next[0] = board_dices[i].next[0] - 100;
      } else {
        ;//x軸右に
        board_dices[i].next[0] = board_dices[i].next[0] + 100;
      }


    } else if (nminus + 6 * (grounp + 1) - 1 > 0) {
      //spin_move = 2,,
      if (spiral_first == 0) {
        //x軸が右に
        board_dices[i].next[0] = board_dices[i].next[0] + 100;
      } else if (spiral_first == 1) {
        //ｘ軸が左に
        board_dices[i].next[0] = board_dices[i].next[0] - 100;
      } else if (spiral_first == 2) {
        //y軸下に
        board_dices[i].next[1] = board_dices[i].next[1] + 100;
      } else {
        ;//y軸上に
        board_dices[i].next[1] = board_dices[i].next[1] - 100;
      }

    } else {
      //spin_move = 1,
      if (spiral_first == 0) {
        //y軸が上に
        board_dices[i].next[1] = board_dices[i].next[1] - 100;
      } else if (spiral_first == 1) {
        //ｙ軸が下に
        board_dices[i].next[1] = board_dices[i].next[1] + 100;
      } else if (spiral_first == 2) {
        //ｘ軸右に
        board_dices[i].next[0] = board_dices[i].next[0] + 100;
      } else {
        ;//x軸左に
        board_dices[i].next[0] = board_dices[i].next[0] - 100;
      }
    }

  }

}


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
    actionstate: actionstate,
    playerlist: playerlist,
    //    login: login,
    players: players,
    board_dices: board_dices,
    namestate: namestate,
    turn: turn,
    playercount: playercount,
    winner:winner
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
    move_dice: move_dice,
    playerlist: playerlist,
    turn: turn,
    playercount: playercount,
    board_length:board_length,
    winner:winner
  }
    ;
  socketapi.io.emit("move", msg);
}

function Add_Delete() {
  msg = {
    gamestate: gamestate,
    actionstate: actionstate,
    namestate: namestate,
    players: players,
    playerlist: playerlist,
    board_dices: board_dices,
    delete_dices: delete_dices,
    add_dices: add_dices,
    turn: turn,
    playercount: playercount,
    winner:winner
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
  console.log(req.session.login)
  res.render('strike/index', data);

  //とりあえず、だれか入ったら全員が更新するシステム。
  if (gamestate == 1) {
    setTimeout(function () {
      Renew()
    }, 1000)
  }

});


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
  namestate = 0;
  winner = ''



  //const io = require('../bin/www.js');
  //const socketapi = require("../socketapi");
  socketapi.io.emit("reset", '');

});







module.exports = { router, socketapi }
