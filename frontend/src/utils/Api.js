import axios from 'axios';

const BASE_URL = "http://localhost:4000/api/";

export function apiFetchTickers(timeframes="daily,weekly,monthly,hourly", symbols="") { // TODO: Agregar market query
    const timeframes_query = timeframes ? "timeframes="+timeframes.replaceAll(" ", "")+"&": "";
    const symbols_query = symbols ? "symbols="+symbols.replaceAll(" ", "")+"&" : "";

    const QUERY = "candlesticks?"+timeframes_query+symbols_query

    return new Promise((resolve, reject) => {
        axios.get(BASE_URL+QUERY)
        .then(res => {
            //console.log("Received data: "+JSON.stringify(res.data));
            resolve(res.data);
        }).catch((error) => console.log(error.toString()))
    })
}