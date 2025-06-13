const express = require('express');
const router = express.Router();
const EphemerisCntlr = require('../controllers/ephemeris');

// Rota principal da API de efemérides
router.post('/ephemeris', async (req, res) => {
  try {
    console.log('✅ /ephemeris route called');

    // Chamada do controlador com os dados do corpo da requisição
    const result = await EphemerisCntlr.compute(req.body);

    // Retorno bem-sucedido
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error in /ephemeris route:', error);

    // Retorno de erro com mensagem clara
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      error: error?.message || 'Erro desconhecido'
    });
  }
});

module.exports = router;
