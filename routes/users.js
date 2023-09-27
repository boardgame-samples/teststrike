const express = require('express');
const router = express.Router();
const db = require('../models/index');


/* GET users listing. */
/*
router.get('/', function(req, res, next) {
  db.User.findAll().then(users =>{
    var data = {
      title:'Users/Index',
      content:users
    }
    res.render('users/index',data)
  });
}); */

router.get('/login',(req, res, next)=>{
  var data = {
    title:'Users/Login',
    content1:'名前を入力してください',
    content2:'※アカウント未登録の場合、',
    content3:'下のリンクから登録してください'
  }
  res.render('users/login', data);
})

router.post('/login',(req, res, next)=>{
  db.User.findOne({
    where:{
      name:req.body.name,
    }
                                                                                                                             
}).then(usr=>{
  if(usr != null){
    req.session.login = usr;

    let back = req.session.back;
    if (back == null){
      back = '/';
    }

    res.redirect(back);
  }else{
    var data = {
//      title:'Users/Login',
      content1:'名前に問題があります。再入力ください。',
      content2:'※アカウント未登録の場合、',
      content3:'下のリンクから登録してください'
    }
    res.render('users/login', data);
  }
})

})

router.get('/add',(req, res, next)=>{
  var data = {
//    title: 'Users/Add',
    form: new db.User(),
    err:null,
    msg:null
  }
  res.render('users/add', data);
});

router.post('/add', (req, res, next)=>{

  db.User.findOne({
    where:{
      name:req.body.name
    }
  }).then(usr=>{

    const form = {
      name: req.body.name
    };

    if(usr != null){       //追加できません
      var data = {
        title: 'Create account',
        form: form,
        err: null,
        msg: 'すでにそのアカウントは使われています。'
      }
      res.render('users/add', data);      
      console.log('miss')

    }else{
      ;
      ;
      db.sequelize.sync()
      .then(()=>db.User.create(form)
      .then(usr =>{
        res.render('users/register','')
      })
      .catch(err=>{
        var data = {
          title: 'Create account',
          form: form,
          err: err,
          msg: null
        }
        res.render('users/add', data);
      })
      )
      ;
    }
  })


});

module.exports = router;
