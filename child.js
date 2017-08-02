var static = require('node-static');
const http = require('http')
// process.on('message', function (m) {
//     console.log('message from parent: ' + JSON.stringify(m));

// });

let args = [].slice.call(process.argv, 0);
let dirs;
let arg = args.find(p => p.indexOf('dirs=') > -1);

if (arg) {
    let argv = arg.slice('dirs='.length).split(';');
    dirs = argv;
    if (!dirs) dirs = ['./']
}


function sendMessage(msg) {
    if (process.send && typeof process.send == 'function') {
        process.send(msg);
    }
}
sendMessage('child process starting ...')
const StartServer = function (publicDirs, port) {

    port = port || 20175;
    //
    // Create a node-static server instance to serve the './public' folder
    //
    let publics;
    if (typeof publicDirs == 'string')
        publics = [publicDirs]
    else publics = publicDirs;
    let fileserves = [];
    publics.forEach(function (publicDir) {
        var file = new static.Server(publicDir, { cache: 0, gzip: /^\/text/, serverInfo: "xes/its-static", headers: { 'X-XES-ITS': '1' }, indexFile: "index.html" });
        fileserves.push(file);
    });


    const server = http.createServer(function (request, response) {



        function serveFiles(files) {


            function lookup(i) {
                files[i].serve(request, response, (err, result) => {
                    if (!err) {
                        return;
                    }
                    i++
                    if (err && err.status === 404 && i < files.length) {
                        lookup(i)
                    } else {
                        process.send("Error serving " + request.url + " - " + err.message);
                        // Respond to the client
                        response.writeHead(err.status, err.headers);
                        response.end();
                        return;
                    }

                })
            }
            lookup(0);
        }
        response.addListener('finish', function () {
            request.profile.endTime = Date.now();
            request.profile.costTime = request.profile.endTime - request.profile.startTime;
            console.log('GET  ' + request.url + '  - ' + request.profile.costTime +' ms')
        })
        request.addListener('end', function () {
            //
            // Serve files!
            //
            request.profile = {
                startTime: Date.now()
            };
            serveFiles(fileserves);

            // file.serve(request, response, function (err, result) {
            //     if (err) { // There was an error serving the file
            //         console.error("Error serving " + request.url + " - " + err.message);

            //         // Respond to the client
            //         response.writeHead(err.status, err.headers);
            //         response.end();
            //     }
            // });
        }).resume();
    }).listen(port, function () {

        // 注册全局未捕获异常处理器
        process.on('uncaughtException', function (err) {
            sendMessage({ error: "Caught exception:" + err.toString() })
        });
        process.on('unhandledRejection', function (reason, p) {
            sendMessage({ error: "Unhandled Rejection at: Promise " + p + " reason: " + reason.stack });
        });
    });
    server.on('error', onError);
    server.on('listening', onListening);

    function onListening() {
        var bind = typeof port === 'string'
            ? 'pipe ' + port
            : 'port ' + port;
        sendMessage('Listening on ' + bind);
    }

    function onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                sendMessage({ error: bind + ' requires elevated privileges,process exit 1' });
                process.exit(1);
                break;
            case 'EADDRINUSE':
                sendMessage({ error: bind + ' is already in use, process exit 1' });
                process.exit(1);
                break;
            default:
                throw error;
        }
    }
}



StartServer(dirs, 20175);
