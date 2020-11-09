import redis from "redis";

async function Connect(host,port,password,db)
{
    if(db==undefined)
        db=null;
    if(password==undefined)
        password=null;
    const client = await redis.createClient(port,host,password=password,db=db);
    return client;
}

async function flushAll(host,port ,password,db)
{
    const closeClient = await Connect(host,port,password,db);
    closeClient.flushdb(function(err,succeeded){
        return succeeded;
    });
}

export{
    Connect,
    flushAll
}