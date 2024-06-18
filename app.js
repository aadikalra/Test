const express = require('express')
const bodyParser = require('body-parser')
const { MongoClient } = require('mongodb')
const app = express()

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

const uri = 'mongodb+srv://sherrysaini0:yUlm77ne5BfqsLhv@cluster0.cggc2t0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

async function connectToDatabase () {
  const client = new MongoClient(uri, {
    useUnifiedTopology: true,
  })
  try {
    await client.connect()
    console.log('Connected to the database')
    return client.db('water_tracker').collection('competitors')
  } catch (err) {
    console.error(err)
    return null
  }
}

let tempPassword = null // Define tempPassword at the beginning

app.get('/', async (req, res) => {
  res.render('render', { tempPassword: tempPassword }) // Pass tempPassword to the index page
  tempPassword = null // Reset tempPassword after rendering the page
})

app.get('/manage', async (req, res) => {
  res.render('manage', { tempPassword: null })
})

app.get('/addCompetitor', (req, res) => {
  res.render('addCompetitor', { tempPassword: null })
})

app.get('/motivation', (req, res) => {
  res.render('motivation', { tempPassword: null })
})

app.get('/deleteCompetitor', async (req, res) => {
  const collection = await connectToDatabase()
  if (!collection) {
    return res.status(500).send('Failed to connect to the database')
  }

  const competitors = await collection.find().toArray()
  console.log(competitors)
  res.render('deleteCompetitor', { competitors });
});

app.post('/add-competitor', async (req, res) => {
  const name = req.body.name
  if (name) {
    const password = Math.floor(100 + Math.random() * 900).toString() // Generate a three-digit password
    const collection = await connectToDatabase()
    if (!collection) {
      return res.status(500).send('Failed to connect to the database')
    }

    await collection.insertOne({
      name: name,
      totalWater: 0,
      password: password
    })
    tempPassword = password // Store the password temporarily
  }
  res.redirect('/')
})

app.post('/log-water', async (req, res) => {
  const name = req.body.name
  const amount = parseInt(req.body.amount)
  const password = req.body.password
  const date = new Date().toLocaleString()

  const collection = await connectToDatabase()
  if (!collection) {
    return res.status(500).send('Failed to connect to the database')
  }

  const competitor = await collection.findOne({ name: name })
  if (competitor && competitor.password === password) {
    await collection.updateOne(
      { name: name },
      {
        $inc: { totalWater: amount },
        $push: { waterLog: { date: date, amount: amount } }
      }
    )
  }
  res.redirect('/')
})

app.post('/deleteCompetitor', async (req, res) => {
  const name = req.body.name.trim(); // Trim whitespace
  const password = req.body.password.trim(); // Trim whitespace
  console.log('-----Inside deleteCompetitor-----')
  console.log('Input Name:', name);
  console.log('Input Password:', password);

  const collection = await connectToDatabase();
  if (!collection) {
    return res.status(500).send('Failed to connect to the database');
  }

  // Additional log to check the existing records
  const existingCompetitor = await collection.findOne({ name: name });
  if (!existingCompetitor) {
    console.log('No competitor found with the provided name');
  } else {
    console.log('Found competitor with provided name');
  }

  const result = await collection.deleteOne({ name: name, password: password });
  if (result.deletedCount === 0) {
    console.log('No competitor found with the provided credentials');
  } else {
    console.log('Competitor deleted successfully');
  }

  res.redirect('/');
});


app.get('/leaderboard', async (req, res) => {
  const collection = await connectToDatabase()
  if (!collection) {
    return res.status(500).send('Failed to connect to the database')
  }

  const competitors = await collection.find().toArray()
  const sortedCompetitors = competitors.sort(
    (a, b) => b.totalWater - a.totalWater
  )
  res.render('leaderboard', { competitors: sortedCompetitors })
})

app.get('/myWaterIntake', async (req, res) => {
  const collection = await connectToDatabase()
  if (!collection) {
    return res.status(500).send('Failed to connect to the database')
  }

  const competitors = await collection.find().toArray()
  res.render('myWaterIntake', { competitors: competitors })
})

app.post('/myWaterIntake', async (req, res) => {
  const name = req.body.name
  const collection = await connectToDatabase()
  if (!collection) {
    return res.status(500).send('Failed to connect to the database')
  }

  const competitor = await collection.findOne({ name: name })
  res.render('waterIntake', { competitor: competitor })
})

app.get('/logWater', async (req, res) => {
  const collection = await connectToDatabase()
  if (!collection) {
    return res.status(500).send('Failed to connect to the database')
  }

  const competitors = await collection.find().toArray()
  res.render('logWater', { competitors: competitors })
})

app.post('/logWater', async (req, res) => {
  const name = req.body.name
  const amount = parseInt(req.body.amount)
  const password = req.body.password
  const date = new Date().toLocaleString()

  const collection = await connectToDatabase()
  if (!collection) {
    return res.status(500).send('Failed to connect to the database')
  }

  const competitor = await collection.findOne({ name: name })
  if (competitor && competitor.password === password) {
    await collection.updateOne(
      { name: name },
      {
        $inc: { totalWater: amount },
        $push: { waterLog: { date: date, amount: amount } }
      }
    )
  }
  res.redirect('/')
})

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
