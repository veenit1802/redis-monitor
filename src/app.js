import express from "express";
import path from "path";
import bodyParser from "body-parser";
import md5 from "md5";

import { createResponse } from './utils/responseUtil.js'
import { logTime } from './middleware/timelog.js'
import { getList, addUser, deleteList, getServer } from "./model/query.js";
import { Connect, flushAll } from "./redis/monitor.js"
import { cacheMiddleware } from './middleware/cache.js'

const app = express();
const PORT = process.env.PORT || 3002;
const __dirname = path.resolve();

app.use(logTime)
app.use("/static", express.static("src/static"));
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

var connection;

//@ type  GET
//@ route /
//@ desc  Send the frontend 
app.get("/", (req, res) => {
    // console.log(__dirname);
    res.sendFile(path.join(__dirname + "/src/templates/index_page.html"));
});

//@ type  GET
//@ route /api/redis_list
//@ desc  Fetch list of server from SQLLite DataBase
app.get("/api/redis_list", async (req, res) => {
    var a = getList();
    a.then((d) => {
        res.json(createResponse(1, d, req.originalUrl || req.url));
    });
});

//@ type  GET
//@ route /api/add
//@ desc  Add server to monitor 
app.post("/api/add", async (req, res) => {
    connection = await Connect(req.body.host, parseInt(req.body.port),req.body.password)
    connection.on("error", function (error) {
        connection.end(true);
        res.json(createResponse(0, "Ping error!", req.originalUrl || req.url));
    });
    connection.on("ready", async function (error) {
        var a = await addUser({
            md5: md5(req.body.host + req.body.port.toString()),
            host: req.body.host,
            port: req.body.port,
            password: req.body.password,
        }).then(data => {
            connection.end(true);
            res.json(createResponse(1, data, req.originalUrl || req.url));
        }).catch(err => {
            connection.end(true);
            res.json(createResponse(0, "Ping error!", req.originalUrl || req.url));
        })

    });
});

//@ type  POST
//@ route /api/del
//@ desc  Delete server from the list of SQLLITE
app.post('/api/del', (req, res) => {
    try {
        deleteList(req.body.md5)
        res.json(createResponse(1, "Success!", req.originalUrl || req.url));
    } catch {
        res.json(createResponse(0, "Not Found!", req.originalUrl || req.url));
    }
})

//@ type  GET
//@ route /api/redis_info
//@ desc  Get Host Name and Password 
app.get('/api/redis_info', (req, res) => {
    var a = getServer(req.query.md5);
    a.then(data => {
        
            res.json(createResponse(1, data[0]['dataValues'], req.originalUrl || req.url));
        
    })
    .catch(err => {
        res.json(createResponse(0, "Not Found!", req.originalUrl || req.url));
    })
})

//@ type  GET
//@ route /api/redis_monitor
//@ desc  Get monitor data of the redis
app.get('/api/redis_monitor', cacheMiddleware(10), (req, res) => {
    var client = getServer(req.query.md5)
    client.then(data => {
        var start = Date.now();
        connection = Connect(data[0]['dataValues']['host'], parseInt(data[0]['dataValues']['port'],data[0]['dataValues']['password']));
        connection.then(connect => {
            connect.on("ready", async function () {
                connect['server_info']["get_time"] = (Date.now() - start);
                connect.end(true);
                res.json(createResponse(1, connect['server_info'], req.originalUrl || req.url));
            });
            connect.on("error", function (error) {
                connect.end(true);
                res.json(createResponse(0, "get redis realtime information error!", req.originalUrl || req.url));
            });
        })
        .catch(err=>{
            res.json(createResponse(0, "not exist redis informations!", req.originalUrl || req.url));
        })

    })
})

//@ type  GET
//@ route /api/ping
//@ desc  Ping the redis server
app.get('/api/ping', async (req, res) => {
    connection = await Connect(req.body.host, parseInt(req.body.port),req.body.password)
    connection.on("error", function (error) {
        connection.end(true);
        res.json(createResponse(0, "Ping error!", req.originalUrl || req.url));
    });
    connection.on("ready", async function (error) {
        connection.end(true);
        res.json(createResponse(1, "Ping success!", req.originalUrl || req.url));
    });
})

//@ type  GET
//@ route /api/redis/flushall
//@ desc  Flush the DB
app.all('/api/redis/flushall', (req, res) => {
    if(req.method=="GET"){
        DB_Param=req.query.db;
        MD5_Param=req.query.md5;
    }
    else if(req.method=="POST"){
        DB_Param=req.body.db;
        MD5_Param=req.body.md5;
    }
    else{
        res.json(createResponse(0, "Invalid Method!", req.originalUrl || req.url));
    }
    var a = getServer(MD5_Param)
    a.then(data => {
        if (data.length() == 0) {
            res.json(createResponse(0, "Not Found!", req.originalUrl || req.url));
        }
        else {
            flushAll(data[0]['dataValues']['host'], data[0]['dataValues']['port'], data[0]['dataValues']['password'], DB_Param).then(blob => {
                if (blob)
                    res.json(createResponse(1, "Success!", req.originalUrl || req.url));
                else
                    res.json(createResponse(0, "Flush db error!", req.originalUrl || req.url));
            }).catch(err => {
                res.json(createResponse(0, "Connect to redis error!", req.originalUrl || req.url));
            })
        }
    })
})

app.listen(PORT, () => {
    console.log("Server Listening 127.0.0.1:" + PORT);
});
