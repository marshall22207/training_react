const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { auth } = require('./middleware/auth')
const { User } = require('./models/User')

const config = require('./config/key')

//application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}))

//application/json
app.use(bodyParser.json())

app.use(cookieParser())

const mongoose = require('mongoose')
const { application } = require('express')
mongoose.connect(config.mongoURI)
.then(() => console.log('MongoDB connected...'))
.catch(err => console.log(err))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/api/users/register', (req, res) => {
  // 회원 가입 정보
  const user = new User(req.body)
  user.save((err, userInfo) => {
    if (err) return res.json({ success: false, err})
    return res.status(200).json({
      success: true
    })
  })
})

app.post('/api/users/login', (req, res) => {
  User.findOne({email: req.body.email}, (err, userInfo) => {
    if (!userInfo) {
      return res.json({
        loginSuccess: false,
        message: "User not found"
      })
    }

    userInfo.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch) 
        return res.json({ loginSuccess: false, message: "Wrong password"})
      userInfo.generateToken((err, use) => {
        if (err) return res.status(400).send(err)
        res.cookie("x_auth", userInfo.token)
        .status(200)
        .json({ loginSuccess: true, userId: userInfo._id })        
      })
    })
  })
})

app.get('/api/users/auth', auth, (req, res) => {
  req.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false: true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image
  })
})

app.get('/api/users/logout', auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, 
    { token: "" },
    (err, user) => {
      if (err) return res.json({ success: false, err })
      return res.status(200).send({ success: true })
    })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
