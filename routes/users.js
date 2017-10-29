var express = require('express');
var router = express.Router();
var User = require('../model/user')
var Post = require('../model/post')
var md5 = require('../vendor/md5')
var Comment = require('../model/comment');

router.get('/', function (req, res) {
  Post.getAll(null, function (err, posts) {
    if (err) {
      posts = [];
    }
    res.render('index', {
      title: '主页',
      user: req.session.user,
      posts: posts,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
})
router.get('/reg', checkNotLogin)
router.get('/reg', function (req, res) {
  res.render('reg', {
    title: '注册',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
})
router.post('/reg', checkNotLogin)
router.post('/reg', function (req, res) {
  let name = req.body.name
  let password = req.body.password
  let password_re = req.body['password-repeat']
  let email = req.body.email
  if (password_re != password) {
    req.flash('error', '两次输入的密码不一致！')
    return res.redirect('/reg')
  }
  password = md5(md5(password + 'jian'))
  User.findOne({ name }, (err, user) => {
    if (err) {
      req.flash('error', err)
      return res.redirect('/')
    }
    if (user) {
      req.flash('error', '用户名存在！')
      return res.redirect('/reg')
    }
    User.create({ name, password, email }, (err, user) => {
      if (err) {
        req.flash('error', err)
        return res.redirect('/reg')
      }
      req.session.user = user
      req.flash('success', '注册成功！')
      res.redirect('/')
    })
  })
})
router.get('/login', checkNotLogin)
router.get('/login', function (req, res) {
  res.render('login', {
    title: '登录',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
})
router.post('/login', checkNotLogin)
router.post('/login', function (req, res) {
  let name = req.body.name
  let password = req.body.password
  let password_re = req.body['password-repeat']
  password = md5(md5(password + 'jian'))
  User.findOne({ name }, (err, user) => {
    if (!user) {
      req.flash('error', '用户不存在')
      return res.redirect('/login')
    }
    if (user.password != password) {
      req.flash('error', '密码错误')
      return res.redirect('/login')
    }
    req.session.user = user
    req.flash('success', '登陆成功！')
    res.redirect('/')
  })
})
router.get('/post', checkLogin)
router.get('/post', function (req, res) {
  res.render('post', {
    title: '发表',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
})
router.post('/post', checkLogin)
router.post('/post', function (req, res) {
  var currentUser = req.session.user,
    post = new Post(currentUser.name, req.body.title, req.body.post);
  post.save(function (err) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    req.flash('success', '发布成功!');
    res.redirect('/');
  });
});
router.get('/logout', checkLogin);
router.get('/logout', function (req, res) {
  req.session.user = null;
  req.flash('success', '登出成功!');
  res.redirect('/');
});
router.get('/upload', function (req, res) {
  res.render('upload', {
    title: '文件上传',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
});
router.post('/upload', function (req, res) {
  req.flash('success', '文件上传成功!');
  res.redirect('/');
});
router.get('/u/:name', function (req, res) {
  let name = req.params.name
  User.findOne({name}, function (err, user) {
    if (!user) {
      req.flash('error', '用户不存在!');
      return res.redirect('/');
    }
    Post.getAll(user.name, function (err, posts) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('user', {
        title: user.name,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
});
router.get('/u/:name/:day/:title', function (req, res) {
  Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    res.render('article', {
      title: req.params.title,
      post: post,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
router.post('/u/:name/:day/:title', function (req, res) {
  var date = new Date(),
    time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
      date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
  var comment = {
    name: req.body.name,
    email: req.body.email,
    website: req.body.website,
    time: time,
    content: req.body.content
  };
  var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
  newComment.save(function (err) {
    if (err) {
      req.flash('error', err);
      return res.redirect('back');
    }
    req.flash('success', '留言成功!');
    res.redirect('back');
  });
});
router.get('/edit/:name/:day/:title', checkLogin);
router.get('/edit/:name/:day/:title', function (req, res) {
  var currentUser = req.session.user;
  Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
    if (err) {
      req.flash('error', err);
      return res.redirect('back');
    }
    res.render('edit', {
      title: '编辑',
      post: post,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
router.post('/edit/:name/:day/:title', checkLogin);
router.post('/edit/:name/:day/:title', function (req, res) {
  var currentUser = req.session.user;
  Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
    var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
    if (err) {
      req.flash('error', err);
      return res.redirect(url);
    }
    req.flash('success', '修改成功!');
    res.redirect(url);
  });
});
router.get('/remove/:name/:day/:title', checkLogin);
router.get('/remove/:name/:day/:title', function (req, res) {
  var currentUser = req.session.user;
  Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
    if (err) {
      req.flash('error', err);
      return res.redirect('back');
    }
    req.flash('success', '删除成功!');
    res.redirect('/');
  });
});
function checkLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', '未登录!');
    res.redirect('/login');
  }
  next();
}
function checkNotLogin(req, res, next) {
  if (req.session.user) {
    req.flash('error', '已登录!');
    res.redirect('back');
  }
  next();
}

module.exports = router;
