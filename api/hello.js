// CommonJS function – should return 200 JSON
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).end(JSON.stringify({ ok: true, msg: 'hello from functions' }));
};
