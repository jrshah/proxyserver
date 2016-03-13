'use strict';
let http = require('http')
let request = require('request')

let argv = require('yargs')
    .default('host', '127.0.0.1')
    .argv
let scheme = 'http://'


let path = require('path')
let fs = require('fs')
let logPath = argv.log && path.join(__dirname, argv.log)
let getLogStream = ()=> logPath ? fs.createWriteStream(logPath) : process.stdout
let logStream = logPath ? fs.createWriteStream(logPath) : process.stdout

http.createServer(function (req, res) {
    console.log(`Request received at: ${req.url}`)
    for (let header in req.headers) {
    	res.setHeader(header, req.headers[header])
	}
	// Log the req headers and content in the **server callback**
	//process.stdout.write('\n\n\n' + JSON.stringify(req.headers))
	logStream.write('Request headers: ' + JSON.stringify(req.headers))
	req.pipe(res).pipe(logStream)

}).listen(8000)

let port = argv.port || (argv.host === '127.0.0.1' ? 8000 : 80)
let destinationUrl = argv.url || scheme +  argv.host + ':' + port

http.createServer(function (req, res) {
  	console.log(`Proxying request to: ${destinationUrl + req.url}`)
  	// Proxy code here

  	if (req.headers['x-destination-url']) {
  		destinationUrl = req.headers['x-destination-url'];
  	}

  	let options = {
        headers: req.headers,
        url: `${destinationUrl}${req.url}`
    }
    options.method = req.method
  	//req.pipe(request(options)).pipe(res)

  	let downstreamResponse = req.pipe(request(options))
	//process.stdout.write(JSON.stringify(downstreamResponse.headers))
	logStream.write('Request headers: ' + JSON.stringify(downstreamResponse.headers))
	downstreamResponse.pipe(res).pipe(logStream)
	
}).listen(8001)