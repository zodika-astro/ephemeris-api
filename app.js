var express = require('express');
var logger = require('morgan');
var responseHandler = require('./common/responseHandlers');
var basicAuth = require('express-basic-auth');

var app = express();

// ✅ Middleware para interpretar JSON no corpo das requisições
app.use(express.json());

// ✅ Logger
app.use(logger('combined'));

// ✅ Autenticação básica
var USER = process.env.BASIC_USER;
var PASS = process.env.BASIC_PASS;
console.log('🔐 BASIC_USER:', USER);
console.log('🔐 BASIC_PASS:', PASS);

app.use(basicAuth({
  users: { [USER]: PASS },
  challenge: true
}));

// ✅ Inicia servidor na porta esperada pelo Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Rotas principais
app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));

// ✅ Tratamento global de respostas (res.locals)
app.use(responseHandler.handleResponse);
app.use(responseHandler.handleErrorResponse);

module.exports = app;

