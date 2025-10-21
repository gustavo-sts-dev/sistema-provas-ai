const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const router = express.Router();

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limite
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'), false);
    }
  }
});

// Rota para extrair texto de PDF
router.post('/extract-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nenhum arquivo PDF foi enviado' 
      });
    }

    // Extrair texto do PDF
    const pdfData = await pdfParse(req.file.buffer);
    
    // Retornar todo o texto extraído (sem limite individual)
    const extractedText = pdfData.text;
    
    res.json({ 
      success: true, 
      text: extractedText,
      pages: pdfData.numpages,
      info: pdfData.info
    });
    
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao processar o arquivo PDF' 
    });
  }
});

module.exports = router;
