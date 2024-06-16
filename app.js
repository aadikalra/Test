const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

let competitors = [];
let tempPassword = null;

app.get('/', (req, res) => {
    res.render('index', { competitors: competitors, tempPassword: tempPassword });
    tempPassword = null; // Clear the temporary password after rendering
});

app.post('/add-competitor', (req, res) => {
    const name = req.body.name;
    if (name) {
        const password = Math.floor(100 + Math.random() * 900).toString(); // Generate a three-digit password
        competitors.push({ name: name, totalWater: 0, password: password });
        tempPassword = password; // Store the password temporarily
    }
    res.redirect('/');
});

app.post('/log-water', (req, res) => {
    const name = req.body.name;
    const amount = parseInt(req.body.amount);
    const password = req.body.password;
    const competitor = competitors.find(c => c.name === name);
    if (competitor && competitor.password === password) {
        competitor.totalWater += amount;
    }
    res.redirect('/');
});

app.post('/delete-competitor', (req, res) => {
    const name = req.body.name;
    const password = req.body.password;
    const index = competitors.findIndex(c => c.name === name && c.password === password);
    if (index !== -1) {
        competitors.splice(index, 1);
    }
    res.redirect('/');
});

app.get('/leaderboard', (req, res) => {
    // Sort competitors by totalWater in descending order
    const sortedCompetitors = competitors.slice().sort((a, b) => b.totalWater - a.totalWater);
    res.render('leaderboard', { competitors: sortedCompetitors });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
