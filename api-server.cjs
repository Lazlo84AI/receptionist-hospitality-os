const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

let latestQuestions = [];

app.use(cors());
app.use(express.json());

app.post('/api/receive-questions', (req, res) => {
  try {
    const { questions } = req.body;
    console.log('Questions recues de N8N:', questions ? questions.length : 0, 'questions');
    console.log('Premiere question:', questions ? questions[0].question : 'aucune');
    latestQuestions = questions || [];
    res.json({ 
      success: true, 
      message: 'Questions recues avec succes',
      count: questions ? questions.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, error: 'Erreur lors du traitement' });
  }
});

app.get('/api/get-latest-questions', (req, res) => {
  try {
    console.log('React demande les questions:', latestQuestions.length, 'disponibles');
    res.json({
      success: true,
      data: {
        questions: latestQuestions,
        count: latestQuestions.length,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la recuperation' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', questions_count: latestQuestions.length });
});

app.listen(PORT, () => {
  console.log('Serveur API lance sur http://localhost:' + PORT);
  console.log('Endpoints disponibles:');
  console.log('  POST http://localhost:' + PORT + '/api/receive-questions');
  console.log('  GET  http://localhost:' + PORT + '/api/get-latest-questions');
});