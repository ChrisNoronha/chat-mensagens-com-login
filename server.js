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

app.use(express.static('views'));  // Adicione esta linha para servir arquivos estáticos na pasta views

// Rota para a página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Rota para a página de comunidade
app.get('/comunidade', async (req, res) => {
  const messages = await Message.findAll({ include: User });
  const userId = req.isAuthenticated() ? req.user.id : null;

  const messagesHtml = messages.map(message => `
    <div>
      <strong>${message.User.username}:</strong> ${message.content}
      ${userId === message.userId ? `<button onclick="deleteMessage(${message.id})">Delete</button>` : ''}
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Wish ajuda humanitária</title>
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
      <link rel="stylesheet" href="style.css">
    </head>
    <body class="backgroundsite">
      <header>
        <a href="#" class="logoimage"><img src="imagens/logowish.png" alt="Wish Logo" style="max-width: 20%; height: auto;"></a>
        <nav class="nav">
          <a href="https://www.estado.rs.gov.br/midia/imagem/qrcode-sos-rio-grande-do-sul-maio24-png" class="logo">AJUDE!</a>
        </nav>
      </header>
      <div class="topnav">
        <a href="/">Início</a>
        <a href="entenda.html">Entenda</a>
        <a href="depoimentos.html">Depoimentos</a>
        <a href="duvidas.html">Dúvidas</a>
        <a href="/comunidade">Comunidade</a>
      </div>
      <div class="adjustable-container">
        <h1>Messages</h1>
        <div id="messages">
          ${messagesHtml}
        </div>
        ${userId ? `<a href="/send">Send a new message</a>` : ''}
        ${userId ? `<a href="/logout">Logout</a>` : `
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
      </div>
      <footer class="footer">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-md-8 text-center">
              <p>© 2024 Wish. Todos os direitos reservados.</p>
              <p>Desenvolvido pelo gaúcho Christian Noronha Picoli</p>
            </div>
          </div>
        </div>
      </footer>
      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.4/dist/umd/popper.min.js"></script>
      <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
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
  `;

  res.send(html);
});

// Rota para obter mensagens
app.get('/api/messages', async (req, res) => {
  const messages = await Message.findAll({ include: User });
  res.json(messages);
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await User.create({ username, password: hash });
  res.redirect('/comunidade');
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/comunidade',
  failureRedirect: '/'
}));

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/comunidade');
  });
});

app.get('/send', (req, res) => {
  if (req.isAuthenticated()) {
    res.sendFile(path.join(__dirname, 'views', 'send.html'));
  } else {
    res.redirect('/comunidade');
  }
});

app.post('/message', async (req, res) => {
  if (req.isAuthenticated()) {
    await Message.create({ content: req.body.content, userId: req.user.id });
    res.redirect('/comunidade');
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

