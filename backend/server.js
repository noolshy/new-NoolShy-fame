const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Маршруты API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/members', require('./routes/members'));
app.use('/api/admin', require('./routes/admin'));

// Обслуживание фронтенда
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Доступ по адресу: http://localhost:${PORT}`);
});