const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('./config/passport');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const User = require('./models/User');
const Message = require('./models/Message');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', async (req, res) => {
  const messages = await Message.findAll({ include: User });
  const userId = req.isAuthenticated() ? req.user.id : null;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Messages</title>
    </head>
    <body>
      <h1>Messages</h1>
      <div id="messages">
        ${messages.map(message => `
          <div>
            <strong>${message.User.username}:</strong> ${message.content}
            ${userId === message.userId ? `<button onclick="deleteMessage(${message.id})">Delete</button>` : ''}
          </div>
        `).join('')}
      </div>
      ${userId ? `<a href="/send">Send a new message</a>` : `
        <h2>Login</h2>
        <form action="/login" method="post">
          <input type="text" name="username" placeholder="Username" required>
          <input type="password" name="password" placeholder="Password" required>
          <button type="submit">Login</button>
        </form>
        <h2>Register</h2>
        <form action="/register" method="post">
          <input type="text" name="username" placeholder="Username" required>
          <input type="password" name="password" placeholder="Password" required>
          <button type="submit">Register</button>
        </form>
      `}
      ${userId ? `<a href="/logout">Logout</a>` : ''}
      <script>
        async function deleteMessage(id) {
          const res = await fetch('/message/' + id, {
            method: 'DELETE',
          });
          if (res.ok) {
            window.location.reload();
          } else {
            alert('Failed to delete message');
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await User.create({ username, password: hash });
  res.redirect('/');
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/'
}));

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.get('/send', (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(path.join(__dirname, 'views', 'send.html'));
  } else {
    res.redirect('/');
  }
});

app.post('/message', async (req, res) => {
  if (req.isAuthenticated()) {
    await Message.create({ content: req.body.content, userId: req.user.id });
    res.redirect('/');
  } else {
    res.status(401).send('You need to be logged in to post a message.');
  }
});

app.delete('/message/:id', async (req, res) => {
  if (req.isAuthenticated()) {
    const message = await Message.findByPk(req.params.id);
    if (message.userId === req.user.id) {
      await message.destroy();
      res.send('Message deleted.');
    } else {
      res.status(403).send('You can only delete your own messages.');
    }
  } else {
    res.status(401).send('You need to be logged in to delete a message.');
  }
});

app.get('/messages', async (req, res) => {
  const messages = await Message.findAll({ include: User });
  res.json(messages);
});

app.listen(3000, async () => {
  await sequelize.sync();
  console.log('Server is running on port 3000');
});

