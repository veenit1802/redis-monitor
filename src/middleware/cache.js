import cache from 'memory-cache';
import {printTime} from "./timelog.js";

let memCache = new cache.Cache();

let cacheMiddleware = (duration) =>{
    return(req,res,next)=>{
        let key='__express__'+req.originalUrl||req.url;
        let cacheContent = memCache.get(key);
        if(cacheContent){
            printTime(req.originalUrl||req.url);
            res.send(cacheContent);
            return;
        }
        else{
            res.sendResponse=res.send;
            res.send =(body)=>{
                memCache.put(key,body,duration*1000);
                res.sendResponse(body);
            }
            next();
        }
    }
}

export {
    cacheMiddleware
}