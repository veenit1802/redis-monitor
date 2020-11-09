import {printTime} from "../middleware/timelog.js";


function createResponse(code,data,url)
{
    printTime(url);
    return {success:code,data:data};
}

export{
    createResponse
}