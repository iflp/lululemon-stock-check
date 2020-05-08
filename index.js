const http = require('http');
const findMyWay = require('find-my-way');
const router = findMyWay();

const { lllmController } = require('./lululemon');
const { uggController } = require('./ugg');

const hostname = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || 8080;

router.on('GET', '/', async (req, res) => {
  res.end('<div><a href="/lululemon">lululemon</a></div><div><a href="/ugg">ugg</a></div>');
});
router.on('GET', '/lululemon', lllmController);
router.on('GET', '/ugg', uggController);

const server = http.createServer(async (req, res) => {
  if (req.url === '/favicon.ico') {
    //get rid of annoying favicon call from browsers
    res.writeHead(200, { 'Content-Type': 'image/x-icon' });
    res.end();
    return;
  }

  router.lookup(req, res);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
