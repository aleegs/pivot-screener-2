const express = require('express');
const bodyParser = require('body-parser');
const datamanager = require('./data_manager');
const cors = require('cors');
var compression = require('compression')
var jsonpack = require('jsonpack/main')
const { validate, ValidationError, Joi } = require('express-validation')

// TODO: LIMITAR REQUESTS ANTI DOS

require('./binance_futures');

const app = express();

// Middlewares
app.use(compression())
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
const sockets = require('./sockets.js');
sockets.initialize(app, port);

console.log("Socket Initialized on port "+port)

// Validations
const candlesticksValidation = {
    query: Joi.object({
        symbols: Joi.string().optional(),
        markets: Joi.string().optional(),
        timeframes: Joi.string().optional(),
    }),
}

const symbolListValidation = {
    query: Joi.object({
        markets: Joi.string().optional()
    })
}

app.get('*', (req, res, next) => {
    if (!datamanager.data.isReady) {
        const error = new Error('Not ready');
        error.status = 404;
        next(error);
    }
    else next();
});

app.get('/', (req, res) => {
    res.send("OK");
});

// /api/candlesticks. Query parameters acepted: tickers, markets, timeframes (daily, monthly, weekly, hourly).
// TODO: Mejorar documentacion de la API
app.get('/api/candlesticks', validate(candlesticksValidation, {}, {}), (req, res, next) => {
    try {
        let { symbols, markets, timeframes } = req.query;
        const filtered = datamanager.getFilteredTickers( symbols, markets, timeframes);
    
        res.send(jsonpack.pack(filtered));
    }
    catch (e) {
        const error = new Error(e.toString());
        error.msg = e.toString();
        error.status = 404;
        next(error);
    }
});

app.get('/api/symbols-list', validate(symbolListValidation, {}, {}), (req, res, next) => {
    try {
        let { markets } = req.query;
    
        res.json(datamanager.getSymbolsList(markets));
    }
    catch (e) {
        const error = new Error(e.toString());
        error.msg = e.toString();
        error.status = 404;
        next(error);
    }
});

app.use(function(err, req, res, next) {
    if (err instanceof ValidationError) {
      return res.status(err.statusCode).json(err)
    }
  
    return res.status(500).json(err)
})

app.listen(port, () => console.log(`Backend listening on port ${port}`))