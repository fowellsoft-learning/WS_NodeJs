var fs = require('fs')
var express = require('express')
var bodyParser = require('body-parser')
var jwt = require('jsonwebtoken')

const APP_SECRET = 'mysecureapp'
const USERNAME = 'admin'
const PASSWORD = 'P@$$w0rd'

var app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Cross-origin resource sharing (CORS)
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  // res.header('Access-Control-Allow-Origin', 'http://localhost:4200')
  // res.header('Access-Control-Allow-Origin', 'http://localhost:9876')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, XSRF-TOKEN')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
})

app.options('/login', function (req, res) {
  res.status(200).end()
})
app.post('/login', function (req, res) {
  var rslt = { success: false }
  if (req.body != null && req.body.name == USERNAME
    && req.body.password == PASSWORD) {
    let token = jwt.sign({ data: USERNAME, expiresIn: '1h' }, APP_SECRET)
    rslt = { success: true, token: token }
  }
  res.status(200).end(JSON.stringify(rslt))
})
function isAutenticated(readonly, req, res) {
  if (readonly) {
    let token = req.headers['authorization']
    try {
      var decoded = jwt.verify(token, APP_SECRET)
    } catch (err) {}
    if (!decoded || decoded.data !== USERNAME) {
      res.status(401).end()
      return false
    }
  }
  return true
}

const lstServicio = [
  { url: '/personas', pk: 'id', fich: __dirname + '/data/personas.json', readonly: false },
  { url: '/vehiculos', pk: 'id', fich: __dirname + '/data/vehiculos.json', readonly: false },
  { url: '/marcas', pk: 'marca', fich: __dirname + '/data/marcas-modelos.json', readonly: false }
]

lstServicio.forEach(servicio => {
  app.get(servicio.url, function (req, res) {
    fs.readFile(servicio.fich, 'utf8', function (err, data) {
      console.log(data)
      res.cookie('XSRF-TOKEN', '123456790ABCDEF')
      res.end(data)
    })
  })
  app.get(servicio.url + '/:id', function (req, res) {
    fs.readFile(servicio.fich, 'utf8', function (err, data) {
      var lst = JSON.parse(data)
      var ele = lst.find(ele => ele[servicio.pk] == req.params.id)
      console.log(ele)
      res.cookie('XSRF-TOKEN', '123456790ABCDEF')
      res.end(JSON.stringify(ele))
    })
  })
  app.post(servicio.url, function (req, res) {
    if (!isAutenticated(servicio.readonly, req, res)) return
    fs.readFile(servicio.fich, 'utf8', function (err, data) {
      var lst = JSON.parse(data)
      var ele = req.body
      lst.push(ele)
      console.log(lst)
      fs.writeFile(servicio.fich, JSON.stringify(lst), 'utf8', function (err) {
        res.status(500).end()
      })
      res.status(200).end(JSON.stringify(lst))
    })
  })
  app.put(servicio.url, function (req, res) {
    if (!isAutenticated(servicio.readonly, req, res)) return
    fs.readFile(servicio.fich, 'utf8', function (err, data) {
      var lst = JSON.parse(data)
      var ele = req.body
      var ind = lst.findIndex(row => row[servicio.pk] == ele.id)
      lst[ind] = ele
      console.log(lst)
      fs.writeFile(servicio.fich, JSON.stringify(lst), 'utf8', function (err) {
        res.status(500).end()
      })
      res.status(200).end(JSON.stringify(lst))
    })
  })
  app.put(servicio.url + '/:id', function (req, res) {
    if (!isAutenticated(servicio.readonly, req, res)) return
    fs.readFile(servicio.fich, 'utf8', function (err, data) {
      var lst = JSON.parse(data)
      var ele = req.body
      var ind = lst.findIndex(row => row[servicio.pk] == req.params.id)
      lst[ind] = ele
      console.log(lst)
      fs.writeFile(servicio.fich, JSON.stringify(lst), 'utf8', function (err) {
        res.status(500).end()
      })
      res.status(200).end(JSON.stringify(lst))
    })
  })
  app.delete(servicio.url + '/:id', function (req, res) {
    if (!isAutenticated(servicio.readonly, req, res)) return
    fs.readFile(servicio.fich, 'utf8', function (err, data) {
      var lst = JSON.parse(data)
      var ind = lst.findIndex(row => row[servicio.pk] == req.params.id)
      lst.splice(ind, 1)
      console.log(lst)
      fs.writeFile(servicio.fich, JSON.stringify(lst), 'utf8', function (err) {
        res.status(500).end()
      })
      res.status(200).end(JSON.stringify(lst))
    })
  })
  app.options(servicio.url + '/:id', function (req, res) {
    res.status(200).end()
  })
})

var server = app.listen(43210, function () {
  var host = server.address().address
  if (host == '::') host = 'localhost'
  var port = server.address().port
  lstServicio.forEach(servicio => {
    console.log('Servicio REST http://%s:%s%s', host, port, servicio.url)
  })
})
