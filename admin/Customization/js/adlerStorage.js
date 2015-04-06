adler = {};
adler.log = function(msg,e)
{
    if (e) {msg = msg + "\r\n error message - "+e.message+"\r\n stack trace - "+e.stack;}
    if (AdlerStorage.containerType === 1)
        Android.device_log(msg);
    else if (AdlerStorage.containerType === 2)
        device_log(msg);
    else console.log(msg);
}
adler.debugLog = function(msg)
{
    adler.log(msg);
}
adler.alert = function(msg)
{
    if (AdlerStorage.containerType === 1)
        Android.alert(msg);
    else if (AdlerStorage.containerType === 2)
        ios_alert(msg);
    else {
        alert(msg);
    }
}
AdlerStorage = {"containerType":0}; // 0 - web, 1 - android, 2- ios
AdlerStorage.tip = null;
AdlerStorage.modificationArray = new Array();// retain all ids + operations that are not synced with the server
AdlerStorage.local = {saveLocal:true};
AdlerStorage.dbconfig = {"schema":"","dbUrl":"http://www.dishatrends.com/dt/php/dm.php","queryUrl":"ac=4","syncUrl":"ac=1","pingUrl":"ac=2"};
AdlerStorage.syncData = false; // begin with false
AdlerStorage.pingData = false;
AdlerStorage.pingSeq = 0;
AdlerStorage.lastPing = 0;
AdlerStorage.loading = 0;
AdlerStorage.waitTime = 20000;
AdlerStorage.ajaxPingTimer = 0;
AdlerStorage.ajaxTimer = 0;
AdlerStorage.transid = 0;
AdlerStorage.DBDef = null;
(function() { setTimeout(function() {AdlerStorage.sync();},AdlerStorage.waitTime) })();
AdlerStorage.setItem = function(name,value)
{
    if (typeof(value) == "object")
        value = "~j~"+JSON.stringify(value);
    
    if (AdlerStorage.containerType === 1)
        Android.setItem(name,value);
    else
        localStorage[name] = value;
}

AdlerStorage.getItem = function(name)
{
    var value = "";
    if (AdlerStorage.containerType === 1)
        value =  Android.getItem(name);
    else value =  localStorage[name];
    if (value && value[0] === "~") {value = value.substring(3); value = JSON.parse(value);}
    
    return value;
}

AdlerStorage.DBClass = function (def,fill)
{
    this.dataArray = new Array();
    //this.modificationArray = new Array();
    this.noMod = false;
    this.length = 0;
    this.def = null;
    
    this.table = "";
    
    this.init = function(def,fill)
    {
        // read the definition and figure out
        // -primary key and foreign keys
        // all the column Def
        
        this.def = def;
        this.table = def.storeName;
        
        if (typeof(def) === "string")
        {
            return; // just a shell is needed;
        }
        
        var parent = def.parent;
        if (parent)
        {
            parent = AdlerStorage.sanitizeStoreName(parent);
            this.def.parent = parent;
        }
        
        
        var table = this;
        
        if (AdlerStorage.local.saveLocal  )
        {
            
            if (this.length === 0)
            {
                //
                var tb = AdlerStorage.getItem("AdlerTable-"+def.storeName);
                if (tb)
                    tb = JSON.parse(tb);
                else
                    tb = new Array();
                this.dataArray = tb;
                this.length = tb.length;
                //
            }
            
            if (this.length === 0 ) // length still zero then go check table exists
            {
                var tables = AdlerStorage.getItem("AdlerTables");
                if (tables)
                    tables = JSON.parse(tables);
                else
                    tables = new Array();
                
                // find if table already exist
                var table = null; var foundTable = false; var foundParent = false; var foundChild = false;
                for (var i = tables.length - 1;i > -1;i--)
                {
                    table = tables[i];
                    if (table.storeName === parent)
                    {
                        foundParent = true;
                        // check if parent has children and if the children match
                        var children = table.children;
                        if (children)
                        {
                            for (var c = children.length - 1; c > -1;c--)
                            {
                                var child = children[c];
                                if (child === def.storeName)
                                {
                                    foundChild = true;
                                    c = -1;
                                    break;
                                }
                            }
                            if (!foundChild)
                                children.push(def.storeName);
                        } else
                            table.children = [def.storeName]; // add child
                    } else if (table.storeName === def.storeName)
                    {
                        tables.splice(i,1); // delete and add a new one
                        // actually need to version it if def is different// will do later
                        found = true;
                        break;
                    }
                }
                
                tables.push(def);
                AdlerStorage.setItem("AdlerTables",JSON.stringify(tables));
            }
            
        }
        
        if (fill)
        {
            AdlerStorage.dbSyncAction.schema = ADLER_SCHEMA+"db";
            var db = AdlerStorage.dbSyncAction;
            var table = this;
            // go to server and fill it
            
            db.actionList[0].object = def.storeName;
            db.actionList[0].ops = "S";
            db.actionList[0] = AdlerStorage.splitJSON(def.primaryKey,def.columns,db.actionList[0]);
            
            AdlerStorage.jsonPost("fill",JSON.stringify(AdlerStorage.dbSyncAction),"/sync/1",true);
        }
        
        //setTimeout(function() {sync(table);},AdlerStorage.waitTime);
    }
    
    
    
    this.setPrimaryKey = function(record)
    {
        
        var id = record[this.def.keyPath];
        if (id == null)
            id = AdlerStorage.getId();
        
        record[this.def.keyPath] = id;
        return record;
    }
    
    this.getPrimaryKey = function(index)
    {
        var record = this.get(index);
        if (record)
            return record[this.def.keyPath];
        else
            return null;
    }
    
    this.getPrimaryKeyName = function(index)
    {
        if (!this.def.keyPath) return this.def.columns[0];
        else return this.def.keyPath;
    }
    
    this.getStoreName = function()
    {
        return this.def.storeName;
    }
    
    this.getLength = function()
    {
        return this.dataArray.length;
    }
    
    this.get = function(index)
    {
        return this.dataArray[index];
    }
    
    /*
     * options = {
     * filter:[{"column":"memberId","cond":"=","val":"124"},{"column":"income","cond":">","val":124,"type":"numeric"}],
     * column:["product_id","pdetails"],
     * sort:[{"column":"product_id","order":1},{"column":"-income":"order":-1}],    //order  1 asc, -1 desc
     * limit:100 // send first 100 rows only
     * }
     */
    this.find = function(options)
    {
        if (!options.filter && !options.columns && !options.limit)
        {
            if (!options.sort)
                return this.dataArray;
        }
        this.length = this.dataArray.length;
        var columns = options.column;  var filters = options.filter; var limits = options.limit;
        var colLen,filterLen; colLen = (columns) ? columns.length : 0; filterLen = (filters) ? filters.length : 0;
        var returnData = new Array(); var rowCount = 0;
        
        var match = function(record)
        {
            for (var i = 0; i < filterLen; i++)
            {
                var filter = filters[i]; var val = filter["val"];
                var data = record[filter["column"]];
                if (filter.cond === "=")
                {
                    if (data !=val)
                        return null;
                    else continue;
                }
                else if (filter.cond === ">")
                {
                    if (data > val)
                        continue;
                    else return null;
                }
                else if (filter.cond === "<")
                {
                    if (data < val)
                        continue;
                    else return null;
                }
                else if (filter.cond === "<=")
                {
                    if (data < val || data == val)
                        continue;
                    else return null;
                }
                else if (filter.cond === ">=")
                {
                    if (data > val || data == val)
                        continue;
                    else return null;
                }
                else if (filter.cond === "!=")
                {
                    if (data != val )
                        continue;
                    else return null;
                }
                else if (filter.cond.toLowerCase() === "like")
                {   val = val.replace("%","");
                    if (data.indexOf(val) === 0)
                        continue;
                    else return null;
                } else if (filter.cond.toLowerCase() === "contains")
                {   val = val.replace("%","");
                    if (data.indexOf(val) > -1)
                        continue;
                    else return null;
                }
                
            }
            return record;
        }
        
        var trim = function(record)
        {
            if (!colLen) return JSON.parse(JSON.stringify(record)); // return a clone
            var data = {};
            for (var i = 0; i < colLen; i++)
            {
                var col = columns[i];
                data[col] = record[col];
            }
            return data;
        }
        
        for (var i = 0 ; i < this.length;i++)
        {
            var record = match(this.dataArray[i]);
            if (record) { rowCount++; if (limits && limits < rowCount) break; returnData.push(trim(record));}
        }
        
        if (options.sort)
        {
            var sorts = options.sort; sortLen = sorts.length;
            returnData.sort(function(a,b)
                            {
                            for (var i = 0; i < sortLen ;i++)
                            {
                            var sortParm = sorts[i];var col = sortParm.column;var sortOrder = sortParm.order;var result = 0;
                            if (a[col] > b[col] ) result = 1;
                            else if (a[col] < b[col] ) result = -1;
                            else continue;
                            return result*sortOrder;
                            }
                            });
            //People.sort(dynamicSortMultiple("Name", "-Surname"));
        }
        return returnData;
    }
    
    this.fetch = function(options,queryCode)
    {
        var record = {"*":"*"};
        var userId = AdlerStorage.getItem("Adler-UserId");
        var config = AdlerStorage.getItem("Adler-dbconfig"); // this is set on the first page, schema is different so has to be done outside
        if (config) {config = JSON.parse(config);AdlerStorage.dbSyncAction.schema =  config.schema;}
        else AdlerStorage.dbSyncAction.schema = ADLER_SCHEMA+"db";
        var db = AdlerStorage.dbSyncAction;
        var table = this;
        // go to server and fill it
        var storeName = this.def.storeName;
        if (storeName.indexOf(".") > -1) storeName = storeName.split(".")[1];
        db.actionList[0].object = storeName;
        var overrideURL = config.dbUrl+"?"+config.queryUrl;
        if (queryCode)
        {db.actionList[0].querycode = queryCode;}
        else
            overrideURL = config.dbUrl+"?"+config.syncUrl;
        if (options.filter)
            db.actionList[0].sfilter = options.filter;
        if (!record)
            record = {};
        
        db.actionList[0] = AdlerStorage.splitJSON(this.def.primaryKey,record,db.actionList[0]); //key,record,actionList,sfilter
        
        //jsonPost(primaryKey,jsonString,path,asyncCall,callback,useOriginalPath
        //www.dishatrends.com/dt/php /dm.php?ac=1
        var respObj ;
        var sd = AdlerStorage.syncData;AdlerStorage.syncData = true;
        if (config)
            respObj = AdlerStorage.jsonPost(this.def.storeName,JSON.stringify(db),"/dm.php?ac=4",false,null,overrideURL);
        else
            respObj = AdlerStorage.jsonPost(this.def.storeName,JSON.stringify(db),"/dm.php?ac=4",false);
        AdlerStorage.syncData = sd;
        if (respObj)
        {
            
            if (respObj.actionList)
                respObj = respObj.actionList[0];
            
            // check status
            if (respObj.statusArray && respObj.statusArray[0][0] != 0)
            {
                console.log(JSON.stringify(respObj));
                return null;
            }
            
            var len = 0;
            if (respObj.fieldValue)
                len = respObj.fieldValue.length ;
            if (len> 0)
            {
                var dArray = new Array();
                this.dataArray = dArray;
                
                var colLen = respObj.fieldList.length;
                for (var j = 0; j < len;j++)
                {
                    var data = {};
                    
                    for (var i = 0; i < colLen; i++ )
                    {
                        var key = respObj.fieldList[i];
                        var val = respObj.fieldValue[j][i];
                        data[key] = val;
                    }
                    dArray.push(data);
                }
                try {
                    if (dataStores)
                    {
                        dataStores[this.def.storeName] = this;
                        AdlerDom.assign(this.def.storeName,true);
                        AdlerDom.repeat(this.def.storeName,true);
                    }
                } catch(e) {}
                
                return dArray;
            }
            else
                return null;
        } else return null;
        
        
    }
    /**
     **  Delete the last object
     **/
    this.pop = function()
    {
        var record = this.dataArray[this.dataArray.length - 1];
        
        this.dataArray.pop();
        this.length = this.length - 1;
        if (this.length < 0)
            this.length = 0;
        //AdlerStorage.modificationArray.push({keyName:this.def.primaryKey,primaryKey:record[this.def.primaryKey],record:record,ops:"D",table:this.def.table});
        if (this.noMod)
            return {code:0,msg:"deleted"};
        
        var delRec = {};delRec[key] = _record[key];
        AdlerStorage.add2ModifiedData("D",this,delRec,key);
        
        // cancel AdlerStorage.ajaxTimer and call sync
        clearTimeout(AdlerStorage.ajaxTimer);
        AdlerStorage.ajaxTimer =  setTimeout(function() {AdlerStorage.sync()},1);
        
        var resultJson = {code:0,msg:"deleted"};
        return resultJson;
    }
    
    /**
     **  Delete the indexed object
     **/
    this.splice = function(index,count)
    {
        // for now assume count === 1;
        var record = this.dataArray[index];
        
        
        this.dataArray.splice(index,count);
        this.length = this.length - 1;
        if (this.length < 0)
            this.length = 0;
        
        
        if (this.noMod)
            return {code:0,msg:"deleted"};
        
        var delRec = {};delRec[key] = _record[key];
        AdlerStorage.add2ModifiedData("D",this,delRec,key);
        
        
        // cancel AdlerStorage.ajaxTimer and call sync
        clearTimeout(AdlerStorage.ajaxTimer);
        AdlerStorage.ajaxTimer =  setTimeout(function() {AdlerStorage.sync()},1);
        
        var resultJson = {code:0,msg:"deleted"};
        return resultJson;
    }
    
    this.delete = function(_record)
    {
        var key = this.def.keyPath; if (!key) key = this.def.primaryKey;
        var idData = _record[key];
        for (var index = this.dataArray.length -1; index > -1;index-- )
        {
            var record = this.dataArray[index];
            if (record[key] == idData)
            {
                this.dataArray.splice(index,1);
                this.length--;
            }
        }
        
        
        if (this.noMod)
            return {code:0,msg:"deleted"};
        
        var delRec = {};delRec[key] = _record[key];
        AdlerStorage.add2ModifiedData("D",this,delRec,key);
        
        AdlerStorage.setLoading();
        // cancel AdlerStorage.ajaxTimer and call sync
        clearTimeout(AdlerStorage.ajaxTimer);
        AdlerStorage.ajaxTimer =  setTimeout(function() {AdlerStorage.sync()},1);
        return {code:0,msg:"deleted"};
    }
    
    this.update = function(_record)
    {
        var key = this.def.keyPath; if (!key) key = this.def.primaryKey;
        var idData = _record[key];
        
        var found = false;
        for (var index = this.dataArray.length -1; index > -1;index-- )
        {
            var record = this.dataArray[index];
            if (record[key] == idData)
            {
                for (var k in _record)
                {
                    var val = _record[k];
                    record[k] = val;
                }
                found = true;
                break;
            }
        }
        if (!found) return {code:1,"msg":"not found"};
        if (this.noMod)
            return {code:0,msg:"updated"};
        
        AdlerStorage.add2ModifiedData("U",this,_record,key);
        
        // cancel AdlerStorage.ajaxTimer and call sync
        AdlerStorage.setLoading();
        clearTimeout(AdlerStorage.ajaxTimer);
        AdlerStorage.ajaxTimer =  setTimeout(function() {AdlerStorage.sync()},1);
        
        var resultJson = {code:0,msg:"updated"};
        return resultJson;
    }
    
    /**
     **  Insert as the last object
     **/
    this.push = function(jsonData)
    {
        var key = this.def.keyPath; if (!key) key = this.def.primaryKey;
        var keyVal = jsonData[key];
        if (keyVal)
        {
            // check for duplicate
            for (var i = this.dataArray.length -1;i> -1;i--)
                if (this.dataArray[i][key] == keyVal)
                {
                    this.dataArray[i] = jsonData; // replace with the latest, treated as update
                    return;}
        }
        jsonData = this.setPrimaryKey(jsonData);
        this.dataArray.push(jsonData);
        this.length = this.dataArray.length;
        
        if (this.noMod)
            return jsonData;
        
        AdlerStorage.add2ModifiedData("I",this,jsonData,key);
        AdlerStorage.setLoading();
        // cancel AdlerStorage.ajaxTimer and call sync
        clearTimeout(AdlerStorage.ajaxTimer);
        AdlerStorage.ajaxTimer =  setTimeout(function() {AdlerStorage.sync()},1);
        return jsonData;
    }
    
    this.init(def,fill);
    
    
}

AdlerStorage.firstTimeSetup = function(qualifier,syncWithServer,syncInterval,dbConfig)
{   var initSetup = true;
    if (!syncWithServer) {syncInterval = -1;dbconfig = {} ;}
    var config = AdlerStorage.getItem("Adler-dbconfig"); // this is set on the first page, schema is different so has to be done outside
    if (config) {
        config = JSON.parse(config);
        if (config.schema === dbConfig.schema) initSetup = false;
    }
    if (initSetup) {//1. Empty STATEDB.ADLER
        //2. run DBDef definition
        //3. update dbconfig
        //4. save everything
        STATEDB.ADLER = {"ids":null,pageStack:[],"ping":syncWithServer,"pingSeq":0,"pingInterval":syncInterval,"dbDefVer":0};
        for (var k in dbConfig)
        {
            AdlerStorage.dbconfig[k] = dbConfig[k];
            //{"schema":"","dbUrl":"http://www.dishatrends.com/dt/php/dm.php","queryUrl":"ac=4","syncUrl":"ac=1","pingUrl":"ac=2"};
        }
        defineDBDef();
        AdlerStorage.setItem("ADLER-STATEDB",JSON.stringify(STATEDB));
        AdlerStorage.setItem("Adler-dbconfig",JSON.stringify(AdlerStorage.dbconfig));
    }
    ADLER_SCHEMA = qualifier;
}

AdlerStorage.getId = function()
{
    return new Date().getTime() - Math.floor((Math.random()*10000)+1);
}

AdlerStorage.dbSyncAction = {
    "schema":"",
    "actionList" : [{  "object"      : "","ops"         : "S", "fieldList"   : [ "USER_ID"],"fieldValue"  : [['a'] ]  } ]
};

AdlerStorage.pingAction = {
    "schema":"",
    "actionList" : [{"transid":1, "ops": "E","sfilter":[{"column":"USER_ID", "cond":"=", "val":null},{"column":"SYNC_ID", "cond":"=", "val":0}]  } ]
};
AdlerStorage.getNewActionDetail = function()
{
    AdlerStorage.transid++;
    return { "transid":AdlerStorage.transid, "object": "","ops": "S","fieldList"   : [ ],"fieldValue"  : [ ]  };
}
AdlerStorage.syncCallBack = function(resp)
{
    if (resp && resp.actionList)
    {
        for (var a = resp.actionList.length - 1;a > -1;a-- )
        {
            var actionList = resp.actionList[a];
            var statusArray = actionList.statusArray;
            if (statusArray[0][0] === "0")
            {
                // change progressQ status
                var object =  storeName =AdlerStorage.sanitizeStoreName(actionList.object);
                var keyValue = actionList.fieldValue[0][0];
                progress = STATEDB.progressQ[object];
                if (progress && progress.keyValue)
                {
                    for (var k = progress.keyValues.length - 1;k > -1;k--)
                        if (progress.keyValues[k] == keyValue) {progress.status[k] = "sent";continue;}
                }
                
            }
            
        }
        // call the ping again to update the next seq number
        AdlerStorage.keepPingTimerAlive(1);
        
    } else
    {
        for (var storeName in mod)
        {
            AdlerStorage.resync(storeName,STATEDB.progressQ[storeName]);
        }
    }
    while (AdlerStorage.loading) AdlerStorage.unsetLoading();
}

AdlerStorage.jsonPost = function(primaryKey,jsonString,path,asyncCall,callback,overrideURL)
{
    if (!AdlerStorage.syncData)
        return;
    if (!overrideURL)
    {
        var pathArray = window.location.pathname.split( '/' );
        path = "/"+pathArray[1] + path;
    }
    
    var async = true;
    var finalResponse = null;
    
    //console.log(document.cookie);
    if (asyncCall === false)
        async = asyncCall;
    
    var xmlhttp = new AdlerNet.XMLHttpRequest();
    /*
     if (window.XMLHttpRequest)
     {// code for IE7+, Firefox, Chrome, Opera, Safari
     xmlhttp=new XMLHttpRequest();
     }
     */
    
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState===4 && xmlhttp.status===200)
        {
            var resp = xmlhttp.responseText;
            var id = xmlhttp.getResponseHeader("x-adler");
            
            var respObj = JSON.parse(resp);
            if (async && callback)
            {
                callback(respObj);
            }
            else
                finalResponse = respObj;
            
            
        }
    }
    var file;
    if (overrideURL) file = overrideURL;
    else
    {
        if (!window.location.origin)
            window.location.origin = window.location.protocol+"//"+window.location.host;
        
        if (AdlerStorage.containerType === 0 )
            AdlerNet.originURL = window.location.origin;
        
        file = AdlerNet.originURL+path; // "/login/1"
    }
    //
    try {
        xmlhttp.open("POST", file,async);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.setRequestHeader("x-adler", primaryKey+"");
        xmlhttp.send(jsonString);
        //console.log(jsonString);
    } catch (e) {
        // do something for error
        //console.log("error");
    }
    
    return finalResponse;
}

AdlerStorage.jsonGet = function(url,asyncCall,callback)
{
    var async = true;
    if (asyncCall)
        async = asyncCall;
    
    var finalResponse = null;
    
    //console.log(document.cookie);
    if (asyncCall === false)
        async = asyncCall;
    
    var xmlhttp = new AdlerNet.XMLHttpRequest();
    /*
     if (window.XMLHttpRequest)
     {// code for IE7+, Firefox, Chrome, Opera, Safari
     xmlhttp=new XMLHttpRequest();
     }
     */
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState===4 && xmlhttp.status===200)
        {
            var resp = xmlhttp.responseText;
            var id = xmlhttp.getResponseHeader("x-adler");
            
            // var respObj = JSON.parse(resp);
            // finalResponse = respObj;
            finalResponse = resp;
            if (callback)
                callback.apply(null,[finalResponse]);
        }
    }
    //
    try {
        xmlhttp.open("GET", url,async);
        //xmlhttp.setRequestHeader("Access-Control-Request-Method","GET");
        xmlhttp.send(null);
        if (!async)
        {
            finalResponse = xmlhttp.responseText;
        }
        //console.log(jsonString);
    } catch (e) {
        // do something for error
        console.log("error ",e);
    }
    
    return finalResponse;
}


AdlerStorage.add2ModifiedData = function(ops,db,record,key)
{
    var mod = STATEDB.modifiedData[db.def.storeName];
    if (!mod) {
        STATEDB.modifiedData[db.def.storeName] = {"I":[],"U":[],"D":[]};
        mod = STATEDB.modifiedData[db.def.storeName];
    }
    
    var  columns = {};
    if (ops !== "D")
    {
        for (var k in record)
        {
            if (k !== key)
                columns[k] = true;
        }
    }
    
    
    mod[ops].push({keyName:key,primaryKey:record[key],columns:columns,record:record});
    STATEDB.modifiedLen++;
}


AdlerStorage.resync = function(storeName,progress,db)
{
    if (!db)
        db = AdlerStorage.findStorage(storeName);
    var key = db.def.keyPath; if (!key) key = db.def.primaryKey;
    var keyValues = progress.keyValues; var keyLen = keyValues.length;
    
    for (var i = 0;i < keyLen;i++)
    {
        var status = progress.status[i];
        if (status === "notSent") // if not sent add it back to modified data queue
        {
            var keyVal = keyValues[i];
            var dataArray = db.dataArray;
            var dlen = dataArray.length;
            for (var d = 0; d < dlen;d++)
            {
                var k = dataArray[d][key];
                if (k === keyVal) {
                    var ops = (progress.other[i])["ops"];
                    AdlerStorage.add2ModifiedData(ops,db,dataArray[d],key);
                    break;
                }
            }
        }
    }
    
    delete STATEDB.progressQ[storeName];
}

AdlerStorage.sync = function()
{
    if (!AdlerStorage.syncData && !AdlerStorage.local.saveLocal)
        return;
    
    var threshold = 0;
    var len = STATEDB.modifiedLen;
    if (len > threshold )
    {  var mod = STATEDB.modifiedData;var action = {"actionList":[]}; action.schema = AdlerStorage.dbconfig.schema;var mRecord = null;
        for (var storeName in mod)
        {
            if (AdlerStorage.syncData)
            {
                var need2Save = false;
                for (var ops in mod[storeName])
                {
                    var updateRec = false; if (ops === "U") updateRec = true;
                    
                    mArray = mod[storeName][ops]; var mLen = mArray.length; var detail =null;
                    var primaryKey = "";var columns = null; var keyName = null;
                    // then define action details
                    
                    // fill in fieldValues
                    for (var i = 0; i < mLen ;i++)
                    {
                        var mRecord = mArray[i]; var rec = mRecord.record;
                        if (updateRec || i === 0)
                        {
                            detail = AdlerStorage.getNewActionDetail()
                            detail.ops = ops; detail.object = storeName.split(".")[1].toUpperCase();
                            keyName = mRecord["keyName"]; detail.fieldList.push(keyName); columns =  mRecord["columns"];
                            for (var column in columns) detail.fieldList.push(column);
                            action.actionList.push(detail);
                        }
                        var values = new Array();detail.fieldValue.push(values);
                        values.push(rec[keyName]);
                        for (var column in columns)
                        {
                            var val = rec[column];
                            if (val == null)
                                values.push(null);
                            else
                                values.push(val);
                        }
                        var progress = STATEDB.progressQ[storeName];
                        if (!progress) {STATEDB.progressQ[storeName] = {"keyValues":[],"func":"AdlerStorage.resync","wait":false,"status":[],"other":[]};
                            progress = STATEDB.progressQ[storeName];
                        }
                        progress.keyValues.push(rec[keyName]);progress.status.push("notSent");progress.other.push({"ops":ops});
                        STATEDB.modifiedLen--;need2Save = true;
                    } // end of for
                    mod[storeName][ops] = new Array(); // for now
                }
            } else
            {
                STATEDB.modifiedLen--;need2Save = true;
            }
            if (need2Save)
            {
                AdlerStorage.saveToLocal(AdlerStorage.findStorage(storeName));
                AdlerDom.dataBinder(storeName);
            }
        }
        STATEDB.modifiedLen = 0;
        //	console.log(action);
        if (AdlerStorage.syncData)
        {
            var overrideURL = AdlerStorage.dbconfig.dbUrl+"?"+AdlerStorage.dbconfig.syncUrl;
            var resp = AdlerStorage.jsonPost("sync",JSON.stringify(action),"/dbSync/dtMysqlAssistSync",true,AdlerStorage.syncCallBack,overrideURL);
            /*
             if (resp && resp.actionList)
             {
             for (var a = resp.actionList.length - 1;a > -1;a-- )
             {
             var actionList = resp.actionList[a];
             var statusArray = actionList.statusArray;
             if (statusArray[0][0] === "0")
             {
             // change progressQ status
             var object =  storeName =AdlerStorage.sanitizeStoreName(actionList.object);
             var keyValue = actionList.fieldValue[0][0];
             progress = STATEDB.progressQ[object];
             for (var k = progress.keyValues.length - 1;k > -1;k--)
             if (progress.keyValues[k] == keyValue) {progress.status[k] = "sent";continue;}
             
             }
             }
             // call the ping again to update the next seq number
             AdlerStorage.keepPingTimerAlive(1);
             
             } else
             {
             for (var storeName in mod)
             {
             AdlerStorage.resync(storeName,STATEDB.progressQ[storeName]);
             }
             }
             
             AdlerStorage.unsetLoading();
             */
        }
    }
    
    AdlerStorage.ajaxTimer =  setTimeout(function() {AdlerStorage.sync()},AdlerStorage.waitTime);
}


AdlerStorage.ping = function(noBinding)
{
    if (!AdlerStorage.pingData)
        return;
    
    var userId = AdlerStorage.getItem("LOGIN_USER_ID");
    if (!userId) userId = 0;
    var sessionId = AdlerStorage.getItem("LOGIN_USER_SESSION");
    
    var action = AdlerStorage.pingAction;
    try {
        action.schema = AdlerStorage.dbconfig.schema;
    } catch (e) {
        ADLER_SCHEMA = AdlerStorage.getItem("Adler-User");
        action.schema = ADLER_SCHEMA.toLowerCase()+"db";
    }
    
    action.actionList[0].sfilter[0].val = userId; //userId;
    AdlerStorage.transid++;
    action.actionList[0].transid = AdlerStorage.transid;
    action.actionList[0].sessionId = sessionId;
    action.actionList[0].object = "*";
    action.actionList[0].sfilter[1].val = AdlerStorage.pingSeq;
    var originalPingSeq = AdlerStorage.pingSeq;
    if (originalPingSeq > 0)  action.actionList[0].ops = "P";// Ping or Partial
    else action.actionList[0].ops = "E"; //Get everything
    var overrideURL = AdlerStorage.dbconfig.dbUrl+"?"+AdlerStorage.dbconfig.pingUrl;
    var async = true; var callback = AdlerStorage.pingCallback;
    //if (noBinding) {async = false;callback = null;}
    var resp = AdlerStorage.jsonPost("ping",JSON.stringify(action),"/dbSync/dtGetPushData",async,callback,overrideURL);
    if (!async) {
        AdlerStorage.pingCallback(resp);
    }
    AdlerStorage.keepPingTimerAlive();
}
AdlerStorage.pingFollowup = null;
AdlerStorage.pingCallback = function(resp)
{
    if (!resp || !resp.actionList)
    {
        AdlerStorage.keepPingTimerAlive();
        return;
    }
    
    var respActionList = resp.actionList; var len = respActionList.length;
    
    for (var i = 0 ; i < len;i++)
    {
        var rAction = respActionList[i];
        if (i === 0 )
        {
            if (typeof(rAction.sync_id) === "string")
                rAction.sync_id = parseInt(rAction.sync_id);
            AdlerStorage.pingSeq = rAction.sync_id;
            STATEDB.ADLER.pingSeq = AdlerStorage.pingSeq;
            // save it
            AdlerStorage.setItem("ADLER-STATEDB",JSON.stringify(STATEDB));
        }
        
        var statusArray = rAction.statusArray;
        var rc = statusArray[0];var msg = statusArray[1];
        try {
            rc = parseInt(rc);
            if (rc != "NaN" && rc < 0)
            {
                console.log(" error during ping "+msg);
                continue;
            } else
            {
                AdlerStorage.processPingData(rAction,AdlerStorage.pingSeq,false);
                // adler.log("table "+rAction.object+" ops "+rAction.ops+" dbTime "+rAction.dbTime);
                action.actionList[0].ops = "P";// Ping or Partial
            }
            
        }catch(e){ ;}
    }
    
    if (AdlerStorage.pingFollowup)
    {
        AdlerStorage.pingFollowup();
        AdlerStorage.pingFollowup  = null;
    }
}

AdlerStorage.processPingData = function(action,originalPingSeq,noBinding)
{
    var fieldList = action.fieldList; var fLen = fieldList.length;
    if (fLen === 0) return;
    
    var storeName = action.object;
    //adler.log(" store "+storeName+" records "+action.fieldValue.length);
    var tableDef = {"storeName":AdlerStorage.sanitizeStoreName(storeName),"columns":fieldList,"keyPath":fieldList[0]};
    var opsType = action.ops;
    var db = AdlerStorage.findStorage(tableDef);
    if (!db.def.columns || db.def.columns.length === 0 )
    { db.def.columns = fieldList; db.def.primaryKey = fieldList[0];db.def.keyPath = fieldList[0];
        
    }
    
    if (opsType === "E")
    {
        if (!originalPingSeq)
            db.noMod = true;
        db.dataArray = new Array();
        for (var i = action.fieldValue.length -1;i > -1;i--)
        {
            var rec = {};
            for (var j = 0;j < fLen;j++)
            {
                if ( j === 1) continue; // this ops, skip it
                var col = fieldList[j];
                rec[col] = action.fieldValue[i][j];
            }
            db.dataArray.push(rec);
        }
        
        AdlerStorage.saveToLocal(db);
        // only bind it if seq is not zero
        if (originalPingSeq && !noBinding)
            AdlerDom.dataBinder(db.def.storeName);
        else
            db.noMod = false;
        return;
    }
    db.noMod = true; var need2Save = false;
    var progress = STATEDB.progressQ[AdlerStorage.sanitizeStoreName(storeName)];
    // for each row in the db, update/insert or delete based on fieldValue
    for (var i = action.fieldValue.length -1;i > -1;i--)
    {
        need2Save = true;
        var id = action.fieldValue[i][0];
        
        //
        if (progress)
        {
            for (var k = progress.keyValues.length - 1;k > -1;k--)
                if (progress.keyValues[k] == id) {progress.keyValues.splice(k,1);progress.status.splice(k,1);progress.other.splice(k,1);need2Save = false;continue;}
            if (progress.keyValues.length === 0) delete STATEDB.progressQ[AdlerStorage.sanitizeStoreName(storeName)]; // remove it from the queue
            if (!need2Save) continue;
        }
        //
        
        var ops = action.fieldValue[i][1];
        if (ops === "D")
        { var rec = {}; rec[fieldList[0]] = id;
            db.delete(rec);
            continue;
        } else if (ops === "I")
        {
            var rec = {}; rec[fieldList[0]] = id;
            for (var j = 2;j < fLen;j++)
            {
                var col = fieldList[j];
                rec[col] = action.fieldValue[i][j];
            }
            db.push(rec);
            continue;
        }
        
        var rec = {};
        // update the values
        for (var j = 2;j < fLen;j++)
        {
            var col = fieldList[j];
            rec[col] = action.fieldValue[i][j];
        }
        rec[fieldList[0]] = id;
        var resp = db.update(rec);
        if (resp.code == 1) {
            // not found insert it
            db.push(rec);
        }
    }
    if (need2Save)
    {
        AdlerStorage.saveToLocal(db);
        if (!noBinding)
            AdlerDom.dataBinder(db.def.storeName);
    }
    db.noMod = false; // reset it back
}

AdlerStorage.keepPingTimerAlive = function(interval)
{
    var currentTime = (new Date()).getTime();
    var diff = currentTime - AdlerStorage.lastPing + 10; // just add 10 milliseconds
    if (diff < STATEDB.ADLER.pingInterval) return;
    // just make sure the ping timer is alive;
    clearTimeout(AdlerStorage.ajaxPingTimer);
    AdlerStorage.lastPing = currentTime;
    if (!interval) interval = STATEDB.ADLER.pingInterval;
    
    AdlerStorage.ajaxPingTimer =  setTimeout(function() {AdlerStorage.ping()},interval);
}

AdlerStorage.splitJSON = function(key,record,actionList,sfilter)
{
    var fieldList = new Array();
    var fieldValue = new Array();
    var valArray = new Array();
    
    
    if (!record["*"])
        fieldList.push(key);
    
    var keyData = record[key];
    if (keyData)
        valArray.push(keyData);
    
    
    for (var k in record)
    {
        if (k === key)
            continue;
        
        var val = record[k];
        
        if (val)
        {
            fieldList.push(k);
            valArray.push(val);
        } else
        {
            if (actionList.ops === "S")
            {
                fieldList.push(k); // push the field for select
            }
        }
        
    }
    fieldValue.push(valArray);
    
    actionList.fieldList = fieldList;
    actionList.fieldValue = fieldValue;
    
    return actionList;
}

AdlerStorage.sanitizeStoreName = function(storeName)
{
    if (storeName.indexOf(".") > -1)
        return storeName;
    try {
        if (!ADLER_SCHEMA)
        {
            ADLER_SCHEMA = AdlerStorage.getItem("Adler-User");
        }
    } catch (e) {
        ADLER_SCHEMA = "sample";
    }
    
    storeName = ADLER_SCHEMA+"."+storeName;
    return storeName;
}

//
AdlerDBStorages = []; // holds DBClass

/**
 *  AdlerStorage.getItem("AdlerTables"] contains storeDefinitions
 *  [ {"storeName":"abc","keyPath":"id","columns":["col1","col2"]} , ...]
 *
 *  localStorage["AdlerTable-abc"] where abc is store name holds the dataArray
 */

AdlerStorage.getStoreList = function(schema)
{
    var len = AdlerDBStorages.length;
    if (len === 0 && AdlerStorage.local.saveLocal)
    {
        // upload the tables from the local storage
        var defs = AdlerStorage.getItem("AdlerTables");
        if (defs)
        {
            defs = JSON.parse(defs);
            var defLen = defs.length;
            for (var i = 0;i < defLen;i++)
            {
                var d = new AdlerStorage.DBClass(defs[i]);
                if (d && d.def && d.def.storeName)
                    AdlerDBStorages.push(d);
            }
            len = AdlerDBStorages.length;
        } else
            return [];
    }
    
    var tableList = new Array()
    for (var i = 0; i < len;i++)
    {
        var def = AdlerDBStorages[i].def;
        if (schema && def.storeName.indexOf(schema) === -1)
            continue;
        
        tableList.push(def);
    }
    
    return tableList;
}

AdlerStorage.reloadRebind = function()
{
    
    var db = null; var tables = null;
    //
    for (st in dataStores)
    {
        var storage = dataStores[st];
        table = AdlerStorage.getItem("AdlerTable-"+storage.def.storeName);
        if (table)
        {
            try {storage.dataArray = JSON.parse(table);storage.length = storage.dataArray.length;
            }catch(e){}
            
        }
    }
    // copy over any STATE DB Info as well
    var sdb = AdlerStorage.getItem("ADLER-STATEDB");
    if (sdb)
    {
        if (sdb.modifiedData)
        {
            STATEDB.modifiedData = sdb.modifiedData;
            sdb.modifiedData = null;
        }
        if (sdb.progressQ)
        {
            STATEDB.progressQ = sdb.progressQ;
            sdb.progressQ = null;
            sdb = null;
        }
        
    }
    //
    AdlerStorage.lastPing = 0;
    AdlerStorage.ajaxPingTimer =  setTimeout(function() {AdlerStorage.ping()},1);
    try {if (preInit) preInit();} catch(e){}
    // assign all the objects
    for (var st in assignObject)
        AdlerDom.assign(st);
    
    for (var st in repeatObject)
    {
        
        AdlerDom.repeat(st,false);}
    
    try {if (init) init();} catch(e){}
    
    AdlerMemory.restoreFormFromMemory(); // restore any form fields
    
}

AdlerStorage.deleteDB = function(storeName)
{
    storeName = AdlerStorage.sanitizeStoreName(storeName);
    
    if (AdlerStorage.local.saveLocal && AdlerDBStorages.length === 0)
    {
        // let us populate it
        var tables = AdlerStorage.getItem("AdlerTables");
        if (tables)
            tables = JSON.parse(tables);
        else
            tables = new Array();
        
        for (var i = tables.length - 1; i > -1;i--)
        {
            var d = new AdlerStorage.DBClass(tables[i]);
            AdlerDBStorages.push(d);
        }
    }
    
    var db = null; var tables = new Array();
    for (var i = AdlerDBStorages.length - 1;i > -1;i--)
    {
        var storage = AdlerDBStorages[i];
        if (!storage)
        {
            AdlerDBStorages.splice(i,1);
            continue;
        }
        if (storage.def.storeName === storeName)
        {
            db = storage;
            AdlerDBStorages.splice(i,1);
        } else
            tables.push(storage.def);
    }
    
    if (db)
    {
        AdlerStorage.setItem("AdlerTable-"+storeName,"[]");
        AdlerStorage.setItem("AdlerTables",JSON.stringify(tables));
    }
    
}


/***
 * param
 * @tableDef - definition of the store - {"storeName":"abc","version":1,"keyPath":"id","columns":["col1","col2"]}
 * @data - optional - is array of data objects [ {"col1":"value"},{"col1":"value"} ]
 * @deleteIfExist - if true, delete existing tableDef and recreate it // will code later
 */

AdlerStorage.saveData = function(tableDef,data,deleteIfExist)
{
    var db = null;
    
    if (deleteIfExist)
    {
        tableDef.storeName = AdlerStorage.sanitizeStoreName(tableDef.storeName);
        db = new AdlerStorage.DBClass(tableDef);
        AdlerDBStorages.push(db);
        
        var defArray = new Array();
        var defLen = AdlerDBStorages.length;
        var found = -1;
        for (var i = 0; i < defLen;i++)
        {
            var db1 = AdlerDBStorages[i];
            
            if (!db1)
                continue;
            
            if (db1.def.storeName === tableDef.storeName)
            {
                db = new AdlerStorage.DBClass(tableDef);
                db.dataArray = new Array();
                found = i;
                db1 = db;
            }
            
            
            defArray.push(db1.def);
        }
        
        if (found > -1)
        { AdlerDBStorages.splice(found,1);   AdlerDBStorages.push(db);} // remove and insert
        
        if (AdlerStorage.local.saveLocal)
            AdlerStorage.setItem("AdlerTables",JSON.stringify(defArray));
    }
    else
        db = AdlerStorage.findStorage(tableDef);
    
    if (typeof(tableDef) === "string")
        tableDef = db.def;
    var dataTypes = tableDef.dataTypes;
    var columns = tableDef.columns;
    var colLength = columns.length;
    var validation = tableDef.validation;
    if (!validation)
    {
        validation = new Array();
        validation.push([1]); // make the first field mandatory
        for (var i = 1;i < colLength;i++)
        {
            validation.push([0]); // make rest all optional
        }
    }
    var parentId = null;
    if (tableDef.parent)
    {
        parent = AdlerStorage.sanitizeStoreName(tableDef.parent)
        // check the state DB
        var ids = STATEDB.getId();
        
        parentId = ids[parent];
        if (!db.def.parentKey)
        {
            // get the parent table and add the key
            var parentDB = AdlerStorage.findStorage(parent);
            if (parentDB.def.keyPath)
                db.def.parentKey = parentDB.def.keyPath;
            else
                db.def.parentKey = parentDB.def.primaryKey;
        }
        if (!parentId)
            throw "Must select "+tableDef.parent+" before getting "+tableDef.storeName;
    }
    
    var obj = {};var objPushed= false;
    var isArray = false;
    if (data)
    {
        
        var len = data.length;
        // (object.constructor === Array)
        //Object.prototype.toString.call( data[0] ) === '[object Array]'
        if (len > 0  )
        {
            if (data[0].constructor === Array)
                isArray = true;
            
        } else
        { data.synced = "N";
            if (parentId)
                data[db.def.parentKey] = parentId;
            db.push(data);
        }
        for (var i = 0; i < len;i++)
        {
            obj = new Object();
            if (isArray)
            {
                //convert to an object
                for (var j = 0; j < colLength;j++)
                {
                    obj[columns[j]] = data[i][j];
                }
            }
            else
                obj = data[i];
            obj.synced = "N";
            if (parentId)
                obj[db.def.parentKey] = parentId;
            
            db.push(obj);
        }
        
    } else
    {
        for (var i = 0; i < colLength; i++)
        {
            var column = columns[i];
            var dataType = dataTypes[i];
            var val = "";
            var dom = document.getElementById(column);
            if (!dom)
            {
                if (i === 0)
                {
                    // this must be id
                    val = AdlerStorage.getId();
                } else if (column === "USER_ID")
                {
                    // get the current user and set it
                    
                }
            } else
            {
                switch (dataType)
                {
                    case 0: // Input
                    case 1: // TextArea
                        val = dom.value;
                        break;
                    case 2: // Dropdown
                        val = dom.options[dom.selectedIndex].text;
                        break;
                    case 3: // Image
                        val = dom.getAttribute("data-adler-file");
                        break;
                }
                var rc = AdlerStorage.validate(i,columns,validation,val);
                if (!rc)
                    return null;
            }
            
            
            obj[column] = val;
            
        }
        obj.synced = "N";
        if (parentId)
            obj[db.def.parentKey] = parentId;
        
        db.push(obj);objPushed = true;
        
        for (var i = 0; i < colLength; i++)
        {
            var column = columns[i];
            var dataType = dataTypes[i];
            var dom = document.getElementById(column);
            if (dom)
            {
                switch (dataType)
                {
                    case 0: // Input
                    case 1: // TextArea
                        dom.value = "";
                        break;
                    case 2: // Dropdown
                        dom.selectedIndex = 0;
                        break;
                    case 3: // Image
                        dom.innerHTML = "Drop image here";
                        break;
                }
            }
            
        }
    }
    
    
    
    // if local storage is needed, then save it there
    if (!data)
    {
        if (!objPushed)
            db.dataArray.push(obj);
    }
    
    AdlerStorage.saveToLocal(db);
    
    var local = {}; local.data = data;local.db = db;local.obj = obj; // keep the local variables in the scope
    // triggerEvents
    for (var i = AdlerEvents.length - 1;i > -1;i--)
    {
        var evnt = AdlerEvents[i];
        if (evnt.type === "dataTable" && evnt.details.storeName === tableDef.storeName)
        {
            var func = evnt.func;
            var paramStringArray = evnt.parameter;var pLen = paramStringArray.length;
            var param = new Array();
            for (var p = 0; p < pLen;p++)
            {
                var val = paramStringArray[p];
                if (typeof(val) === "string")
                {
                    val = window[val]; // look global
                    if (!val)
                        val = local[paramStringArray[p]]; // look local
                    if (!val)
                        val = paramStringArray[p]; // use as is
                }
                
                param.push(val); // convert parameter string to real parameters
            }
            
            func.apply(null,param);
        }
        
    }
    
    return obj;
    
}

AdlerStorage.saveDefToLocal = function()
{
    var tables = new Array();var tableList = {};
    for (var i = AdlerDBStorages.length - 1;i > -1;i--)
    {
        var storage = AdlerDBStorages[i];
        if (!storage)
        {
            AdlerDBStorages.splice(i,1);
            continue;
        }
        if (tableList[storage.def.storeName])
            continue;
        tables.push(storage.def);
        tableList[storage.def.storeName] = storage.def.storeName; // this makes sure there is no dups
    }
    
    // sort it
    
    
    //Usage
    tables.sort( function(a,b){
                if( a["storeName"] > b["storeName"]){
                return 1;
                }else if( a["storeName"] < b["storeName"] ){
                return -1;
                }
                return 0;
                } );
    
    AdlerStorage.setItem("AdlerTables",JSON.stringify(tables));
}

AdlerStorage.saveToLocal = function(db)
{
    if (AdlerStorage.local.saveLocal)
    {
        
        var table = AdlerStorage.getItem("AdlerTable-"+db.def.storeName);
        if (table)
            table = JSON.parse(table);
        else
            table = new Array();
        
        table = db.dataArray;
        //adler.log("save to local before save length "+table.length+" for store "+db.def.storeName);
        
        AdlerStorage.setItem("AdlerTable-"+db.def.storeName,JSON.stringify(table)); // save it back
        
        // read it back
        {
            table = AdlerStorage.getItem("AdlerTable-"+db.def.storeName);
            
            table = JSON.parse(table);
            
            //adler.log("save to local after save length "+table.length+" for store "+db.def.storeName);
        }
    }
}

AdlerStorage.validate = function(i,columns,validation,val)
{
    var validationArray = validation[i];
    for (var j = validationArray.length -1;j> -1;j--)
    {
        var code = validationArray[j];
        switch (code)
        {
            case 1:
                if (!val)
                {
                    adler.alert(columns[i]+" is mandatory field");
                    return 0; // invalid
                }
        }
    }
    
    return 1; // valid
}

AdlerStorage.getData = function(tableDef,format,id) // format could be array or json
{
    var db = AdlerStorage.findStorage(tableDef);
    var dataRow = new Array();
    var dataHeader = new Array();
    var idArray = new Array();
    var dLen = db.dataArray.length;
    var parentId = 0;
    try {
        if (db.def.parent)
            parentId = STATEDB[db.def.parent];
    } catch (e) {}
    
    if (format && format.indexOf("Array") > -1)
    {
        var data = null;
        if (dLen === 0)
        {
            dataHeader = db.def.columns.slice(0);
        }
        for (var i = 0; i < dLen;i++)
        {
            var skipData = false;
            data = [];
            if (i === 0)
            {
                for (var k in db.dataArray[i])
                {
                    if (k === "id" || k === "synced" || k === "parentId")
                        continue;
                    data.push(k); // only push headers
                }
                if (format === "3Arrays")
                    dataHeader = data;
                else
                    dataRow.push(data); // add the array to data row
                data = [];
            }
            
            // push the values
            for (var k in db.dataArray[i])
            {
                if ( k === "synced")
                    continue;
                if (k === "id")
                {
                    if (id)
                    {
                        if (id === db.dataArray[i][k])
                        {
                            idArray.push(db.dataArray[i][k]);
                            i = dLen + 1; // get out of all the loops
                            break; // this will get out of inner most loop
                        } else
                            skipData = true;
                        
                    } else
                        idArray.push(db.dataArray[i][k]);
                    continue;
                }
                if (k === "parentId")
                {
                    if (parentId)
                    {
                        if (parentId !== db.dataArray[i][k])
                        {
                            skipData = true;
                            break;
                        } else
                        {
                            continue;
                        }
                        
                    }
                }
                
                data.push(db.dataArray[i][k]);
            }
            
            if (skipData)
                continue;
            
            dataRow.push(data); // add the array to data row
        }
        
    } else
    {
        dataRow.push(db.def.columns);
        
        for (var i = 0; i < dLen;i++)
        {
            var data = new Array();
            
            for (var k in db.dataArray[i])
            {
                if (k === "id" || k === "synced")
                    continue;
                
                data.push(db.dataArray[i][k]);
            }
            
            dataRow.push(data);
        }
    }
    
    if (format && format === "3Arrays")
        return [dataHeader,dataRow,idArray];
    else
        return dataRow;
}

AdlerStorage.removeData = function(tableDef,index,id)
{
    var storeName ;
    if (typeof(tableDef) === "string")
    {storeName = AdlerStorage.sanitizeStoreName(tableDef);}
    else
    {storeName = AdlerStorage.sanitizeStoreName(tableDef.storeName);
        tableDef.storeName = storeName;
    }
    
    var db = AdlerStorage.findStorage(tableDef);
    if (id)
    {
        // find id and delete then delete
        var _record = {};
        _record[db.def.keyPath] = id;
        db.delete(_record);
        
    } else
        db.splice(index,1);
    
    // if local storage is needed, then save it there
    if (AdlerStorage.local.saveLocal)
    {
        AdlerStorage.setItem("AdlerTable-"+storeName,JSON.stringify(db.dataArray)); // save it back
    }
    
    // triggerEvents
    for (var i = AdlerEvents.length - 1;i > -1;i--)
    {
        var evnt = AdlerEvents[i];
        if (evnt.type === "dataTable" && evnt.details.storeName === storeName)
        {
            var func = evnt.func;
            var param = evnt.parameter;
            func.apply(null,param);
        }
        
    }
}

AdlerStorage.updateData = function(storeName,record)
{
    storeName = AdlerStorage.sanitizeStoreName(storeName);
    var db = AdlerStorage.findStorage(storeName);
    db.update(record);
    
    // if local storage is needed, then save it there
    if (AdlerStorage.local.saveLocal)
    {
        AdlerStorage.setItem("AdlerTable-"+storeName,JSON.stringify(db.dataArray)); // save it back
    }
    
    // triggerEvents
    for (var i = AdlerEvents.length - 1;i > -1;i--)
    {
        var evnt = AdlerEvents[i];
        if (evnt.type === "dataTable" && evnt.details.storeName === storeName)
        {
            var func = evnt.func;
            var param = evnt.parameter;
            func.apply(null,param);
        }
        
    }
}

AdlerStorage.findStorage = function(tableDef,deleteIfExist)
{
    var db = null;
    var storeName = "";
    var createNew = true;
    if (typeof(tableDef) === "string")
    {
        storeName = tableDef;
        storeName =AdlerStorage.sanitizeStoreName(storeName);
        createNew = false;
    }
    else
    {storeName = tableDef.storeName;
        storeName = AdlerStorage.sanitizeStoreName(storeName);
        tableDef.storeName = storeName;}
    
    if (!storeName)
        return null; // not allowed
    
    
    if (AdlerDBStorages.length === 0)
    {
        //AdlerStorage.GetDBDef();
        if (AdlerStorage.local.saveLocal)
        {
            // let us populate it
            var tables = AdlerStorage.getItem("AdlerTables");
            
            if (tables)
                tables = JSON.parse(tables);
            else
                tables = new Array();
            
            
            for (var i = tables.length - 1; i > -1;i--)
            {
                var d = new AdlerStorage.DBClass(tables[i]);
                
                var table = AdlerStorage.getItem("AdlerTable-"+d.def.storeName);
                if (table)
                {
                    try {d.dataArray = JSON.parse(table);d.length = d.dataArray.length;
                        //adler.log("local # of rows "+d.length+" for "+d.def.storeName);
                    }catch(e){}
                }
                if (d.def && !d.def.columns && d.def.storeName.indexOf("Memory") > -1 ) AdlerMemory.defineMemoryStores(d);
                
                AdlerDBStorages.push(d);
                
            }
            
        }
        
    }
    
    for (var i = AdlerDBStorages.length - 1;i > -1;i--)
    {
        var storage = AdlerDBStorages[i];
        if (!storage)
        {
            AdlerDBStorages.splice(i,1);
            continue;
        }
        if (storage.def.storeName === storeName)
        {
            db = storage;
            if ((!db.def.columns && typeof(tableDef) !== "string") || deleteIfExist)
            {
                //AdlerStorage.deleteDB(db.def.storeName); // commented on 8/17/2014
                //createNew = true;
                createNew = false; // added on 8/17/2014
                // added 10/13/2014
                db.def.columns = tableDef.columns;
                db.def.keyPath = tableDef.keyPath;
                db.def.primaryKey = tableDef.keyPath;
            }
            else
                createNew = false;
            
            break;
        }
    }
    
    if (createNew)
    {
        //adler.log("saving store to local ");
        if (typeof(tableDef) === "string")
            db = new AdlerStorage.DBClass({"storeName":storeName,"primaryKey":"id"});
        else
            db = new AdlerStorage.DBClass(tableDef);
        
        AdlerDBStorages.push(db);
        
        var defArray = new Array();
        var defLen = AdlerDBStorages.length;
        for (var i = 0; i < defLen;i++)
        {
            var db = AdlerDBStorages[i];
            defArray.push(db.def);
        }
        if (AdlerStorage.local.saveLocal)
            AdlerStorage.setItem("AdlerTables",JSON.stringify(defArray));
    }
    
    if (!db)
    {
        // check local storage
        if (AdlerStorage.local.saveLocal)
        {
            //adler.log("reading store from local ");
            var table = AdlerStorage.getItem("AdlerTable-"+storeName);
            if (table)
                table = JSON.parse(table);
            else
            {
                table = new Array();
                AdlerStorage.setItem("AdlerTable-"+tableDef.storeName,JSON.stringify(table)); // save it back
            }
            
            if (typeof(tableDef) === "string")
            {
                db = new AdlerStorage.DBClass({"storeName":storeName,"keyPath":"id"}); // should not do it
                if (storeName.indexOf("Memory") > -1 ) AdlerMemory.defineMemoryStores(db);
            }
            else
                db = new AdlerStorage.DBClass(tableDef);
            db.dataArray = table;
            db.length = table.length;
            
        }	else
        {
            if (typeof(tableDef) === "string")
            {
                db = new AdlerStorage.DBClass({"storeName":storeName,"keyPath":"id"}); // should not do it
                if (storeName.indexOf("Memory") > -1 ) AdlerMemory.defineMemoryStores(db);
            }
            else
                db = new AdlerStorage.DBClass(tableDef);
        }
        AdlerDBStorages.push(db);
        
        
    } else if (deleteIfExist)
    {
        db.dataArray = [];
        AdlerStorage.setItem("AdlerTable-"+db.def.storeName,"[]");
    }
    
    
    return db;
    
}

AdlerEvents = new Array();
/*
 * pass in type of event, actual function object, parameters (array), details (object)
 */
AdlerStorage.registerEvent = function(type,func,param,details)
{
    details.storeName = AdlerStorage.sanitizeStoreName(details.storeName);
    AdlerEvents.push({"type":type,"func":func,"parameter":param,"details":details});
}

/**
 *  Every array becomes a table
 */
AdlerStorage.json2DB = function(json)
{
    if (typeof(json) === "string")
        json = JSON.parse(json);
    
    var stores = {};
    var tableDefs = {};
    /**
     *
     * @param {Object} arr
     * @param {Object} key
     */
    var handleArray = function(arr,key,table)
    {
        var J = arr[0];
        if (J.constructor === Array)
        {
            handleArray(J,"");
        } else if (typeof(J) === "object")
        {
            if (key)
            {
                tableDefs[key] = {"storeName":key,"columns":[],"dataTypes":[]};
                if (table)
                {
                    tableDefs[key].parent = table;
                    if (!tableDefs[table].children)
                        tableDefs[table].children = new Array();
                    tableDefs[table].children.push(key);
                    
                }
            }
            handleObject(J,"",key);
            // we are done handling the table, now let us define the table
            if (key)
            {
                var deleteIfExist = true;
                if (!stores[key])
                    stores[key] = true;
                else
                    deleteIfExist = false;
                
                var db = AdlerStorage.findStorage(tableDefs[key],deleteIfExist); // delete if exist
                insertRow(db,arr);
            }
            // insert rows
        }
    }
    
    // end of handleArray
    
    /**
     *
     * @param {Object} obj - JSON Object
     * @param {Object} key - indicates parent-child relation exist
     * @param {Object} table - AdlerTable
     */
    var handleObject = function(obj,key,table)
    {
        for (var k in obj)
        {
            var val = obj[k];
            if (!val)
            {
                if (table)
                {
                    tableDefs[table].columns.push(k);
                    tableDefs[table].dataTypes.push(0);
                }
                continue;
            }
            if (val.constructor === Array)
                handleArray(val,k,table);
            else if (typeof(val) === "object")
                display = handleObject(val,k,table);
            else if (table)
            {
                tableDefs[table].columns.push(k);
                tableDefs[table].dataTypes.push(0);
            }
        }
        
        if (table && tableDefs[table].columns.length > 0)
            tableDefs[table].keyPath = tableDefs[table].columns[0];
    }
    
    
    var insertRow = function(db,arry,deleteIfExist)
    {
        var columns = db.def.columns;var columnLength = columns.length;
        var dataArray = db.dataArray;
        var arrayLen = arry.length;
        var children = db.def.children; var cLen = 0; if (children) cLen = children.length;
        for (var i = 0; i < arrayLen;i++)
        {
            var data = {};
            var dataObj = arry[i];
            for (var j = 0; j < columnLength;j++)
            {
                column = columns[j];
                data[column] = dataObj[column];
            }
            data.synced = "Y"; // since this is coming from the server it is considered synced
            dataArray.push(data);
            for (var c = 0; c < cLen;c++)
            {
                var childStore = children[c]; if (childStore.indexOf(".") > -1) childStore = childStore.split(".")[1];
                var childArray = dataObj[childStore];
                var childDB = AdlerStorage.findStorage(tableDefs[childStore],false);;
                if (i === 0) childDB.dataArray = new Array(); // if it is first time then start a fresh
                insertRow(childDB,childArray,false);
            }
            
        }
        
        AdlerStorage.saveToLocal(db);
    }
    // end of handleObject
    ADLER_SCHEMA = AdlerStorage.getItem("Adler-User") ;
    
    if (json.constructor === Array)
        handleArray(json,"");
    else if (typeof(json) === "object")
        handleObject(json,"");
    
    
}

AdlerStorage.GetDBDef = function()
{
    if (AdlerStorage.DBDef == null)
    {
        AdlerStorage.DBDef= {
            "storeName":"ADR_DBDEF",
            "columns":[
                       'dbId',
                       'defData'
                       ],
            "primaryKey": 'dbId',
            "keyPath":'dbId'
        };
        AdlerStorage.DBData = new AdlerStorage.DBClass(AdlerStorage.DBDef);
    }
    
    var user = AdlerStorage.getItem("Adler-User"); var userId = AdlerStorage.getItem("Adler-UserId");
    var tables = AdlerStorage.getItem("AdlerTables");
    try { tables = JSON.parse(tables);} catch(e) {tables= new Array()};
    for (var i = tables.length - 1; i > -1;i--)
    {
        var table = tables[i];
        if (table.storeName && table.storeName.indexOf(user+".") === 0)
            continue;
        
        tables.splice(i,1);
    }
    
    var addToLocal = function(dbDef,tables)
    {
        for (var i = tables.length - 1; i > -1;i--)
        {
            var table = tables[i];
            if (table.storeName === dbDef.storeName)
            {
                tables[i] = dbDef;
                return;
            }
        }
        
        if (dbDef.storeName.indexOf(user+".") === 0)
            tables.push(dbDef);
        
    }
    var options = {
        "filter":[{"column":"userId","cond":"=","val":userId}]
    }
    //var sd = AdlerStorage.syncData; AdlerStorage.syncData = true;
    var dData = AdlerStorage.DBData.fetch(options,{"dbId":null,"defData":null});
    if (dData)
    {
        for (var i= dData.length - 1;i > -1;i--)
        {
            var dbDef = dData[i];
            try {
                var defData = JSON.parse(dbDef.defData); var dbId = dbDef.dbId;
                addToLocal(defData,tables);
            } catch (e) {}
        }
    }
    //AdlerStorage.syncData = sd;
    AdlerStorage.setItem("AdlerTables",JSON.stringify(tables));
}

AdlerStorage.SaveDBDef = function(def)
{			AdlerStorage.dbSyncAction.schema = ADLER_SCHEMA+"db";
    var dbSync = AdlerStorage.dbSyncAction.actionList[0];
    var table = this;
    // go to server and fill it
    
    dbSync.object = "ADR_DBDEF";
    dbSync.ops = "A"; // FOR Insert when not exist and delete+insert when exist
    dbSync.fieldList = ["dbId","defData","USER_ID"];
    dbSync.fieldValue = new Array();
    var dbId = def.dbId; if (!dbId) {dbId = AdlerStorage.getId(); def.dbId = dbId;}
    var val = [dbId,JSON.stringify(def),0];
    dbSync.fieldValue.push(val);
    var sd = AdlerStorage.syncData; AdlerStorage.syncData = true;
    var respObj = AdlerStorage.jsonPost(def.storeName,JSON.stringify(AdlerStorage.dbSyncAction),"/dbSync/"+def.storeName,false);
    if (respObj)
    {
        // check the success or failure
        if (respObj.actionList)
            respObj = respObj.actionList[0];
        
        if (respObj && respObj.statusArray)
        {
            var statusArray = respObj.statusArray; var sLen = respObj.statusArray.length;
            for (var i = 0; i < sLen ;i++)
            {
                var status = statusArray[i];
                var rc = parseInt(status[0]); var msg = status[2];
                if (rc !== 0)
                    console.log("record "+i+" "+msg);
            }
        }
        
    }
    AdlerStorage.syncData = sd;
}
AdlerStorage.setLoading = function()
{
    if (AdlerStorage.containerType === 0)
    {
        if (AdlerStorage.loadingGif)
        {
            AdlerStorage.loadingGif.style.display = "block"; // temporary code
        }
    } else if (AdlerStorage.containerType === 1)
    {
        
    } else if (AdlerStorage.containerType === 2)
    {
        ios_loading();
    }
    
    AdlerStorage.loading++;
}

AdlerStorage.unsetLoading = function()
{
    if (AdlerStorage.loading)
    {
        
        AdlerStorage.loading--;
        if (AdlerStorage.loading === 0)
        {
            if (AdlerStorage.containerType === 0)
            {
                if (AdlerStorage.loadingGif && AdlerStorage.loading < 1)
                {
                    AdlerStorage.loadingGif.style.display = "none";
                }
            } else if (AdlerStorage.containerType === 1)
            {
                
            } else if (AdlerStorage.containerType === 2)
            {
                ios_loaded();
            }
        }
    }
    
}
AdlerForm = {};
AdlerForm.reset = function(tableDef)
{
    var db = AdlerStorage.findStorage(tableDef);
    var columns = db.def.columns; var colLength = columns.length;
    for (var i = 0; i < colLength; i++)
    {
        var column = columns[i];
        var dataType = db.def.dataTypes[i];
        var dom = document.getElementById(column);
        switch (dataType)
        {
            case 0: // Input
            case 1: // TextArea
                dom.value = "";
                break;
            case 2: // Dropdown
                dom.selectedIndex = 0;
                break;
            case 3: // Image
                // will work on it later;
                break;
        }
        
    }
}

AdlerForm.saveData = function(tableDef,data,deleteIfExist)
{
    // slowly deprecate AdlerStorage.save
    return AdlerStorage.saveData(tableDef,data,deleteIfExist);
}

Authentication = {};
Authentication.login = function(userId,password)
{
    var t =  Math.round(new Date().getTime() / 10000000);
    if (password)
    {
        var pHash = MD5(userId.toLowerCase()+password);
        password = MD5(t+pHash);
    }
    var schema = "";
    try {
        schema = ADLER_SCHEMA;
    } catch(e){
        ADLER_SCHEMA = AdlerStorage.getItem("Adler-User");
        schema = ADLER_SCHEMA;
    }
    
    var host = "http://adler.dishatrends.com";
    var resp = AdlerStorage.jsonGet(host+"/AdlerGen/login/"+schema+"/"+encodeURI(userId)+"/"+password,false);
    // gets back db def file if authenticated
    if (resp)
    {
        // this is dbdefition, save it to the local
        var j = JSON.parse(resp);
        if (!j.rc)
        {
            AdlerStorage.setItem("AdlerTables",JSON.stringify(j.dbDefs));
            AdlerStorage.getStoreList(schema);
            AdlerStorage.setItem("Logged-User-Id",j.USER_ID);
            j.rc = 0;
        }
    }
    
    return j;
}

AdlerNet = {"objectList":[]};
AdlerNet.originURL = "http://www.dishatrends.com/dt/php";
AdlerNet.XMLHttpRequest = function()
{
    this.id = "i";
    this.url = "";
    this.async = true;
    this.requestObject = null;
    this.requestHeaders  = [];
    this.onreadystatechange = null;
    this.responseText = null;
    this.readyState = 0; // 0- not initalized, 1-server connection established 2 request received 3. processing 4 request finished
    this.status = 200; // 200 - ok, 404 - page not found, 500 - severe error
    this.open = function(method,url,async)
    {
        this.url = url;
        this.method = method;
        if (async === false)
            this.async = false;
        else
            this.async = true;
        if (AdlerStorage.containerType === 0)
            this.requestObject.open(method,url,async);
    }
    this.setRequestHeader = function(headerName,headerValue)
    {
        if (AdlerStorage.containerType === 0)
            this.requestObject.setRequestHeader(headerName,headerValue);
        else
            this.requestHeaders.push({"name":headerName,"value":headerValue});
    }
    this.getResponseHeader = function(headerName)
    {
        if (AdlerStorage.containerType === 0)
            return this.requestObject.getResponseHeader(headerName);
        return "";
    }
    this.send = function(data)
    {
        this.data = data;
        if (AdlerStorage.containerType === 2)
        {
            var inputs = {};
            for (var k in this)
                if (typeof(this[k]) === "string" || typeof(this[k]) === "boolean" || typeof(this[k]) === "number")
                    inputs[k] = this[k];
            
            if (this.requestHeaders.length > 0)
                inputs.requestHeaders = this.requestHeaders;
            
            var resp = ios_xmlhttp(inputs);
            
            if (!this.async)
            {
                this.readyState = resp.readyState;
                this.status = resp.status;
                this.responseText =  resp.data;
                if (this.onreadystatechange)
                    this.onreadystatechange.apply(null,[]);
                
                return this.responseText;
            }
            
        } else if (AdlerStorage.containerType === 1)
        {
            var async = "TRUE";
            if (!this.async)
                async = "FALSE";
            var requestHeaders = JSON.stringify(this.requestHeaders);
            var resp = Android.android_xmlhttp(this.id+"",this.method,this.url,async,requestHeaders,this.data);
            if (!this.async)
            {
                
                resp = JSON.parse(resp);
                this.readyState = resp.readyState;
                this.status = resp.status;
                this.responseText =  resp.data;
                if (this.onreadystatechange)
                    this.onreadystatechange.apply(null,[]);
                
                return this.responseText;
            }
        }
        else
            this.requestObject.send(data);
    }
    
    var init = function(XMLHTTP)
    {
        if (AdlerStorage.containerType === 0)
        {
            XMLHTTP.requestObject = new XMLHttpRequest();
            var xmlhttp = XMLHTTP.requestObject;
            
            for (var k in xmlhttp)
                if (typeof(xmlhttp[k]) === "string" || typeof(xmlhttp[k]) === "boolean" || typeof(xmlhttp[k]) === "number")
                    XMLHTTP[k] = xmlhttp[k];
                else if (typeof xmlhttp[k] == "function")
                {
                }
            
            
            xmlhttp.onreadystatechange=function()
            {
                for (var k in xmlhttp)
                    if (typeof(xmlhttp[k]) === "string" || typeof(xmlhttp[k]) === "boolean" || typeof(xmlhttp[k]) === "number")
                        XMLHTTP[k] = xmlhttp[k];
                if (XMLHTTP.onreadystatechange)
                    XMLHTTP.onreadystatechange.apply(null,[]);
            }
        }
        else
        {
            XMLHTTP.id = "i"+AdlerStorage.getId();
            
            AdlerNet.objectList.push(XMLHTTP);
            if (XMLHTTP.onreadystatechange)
                XMLHTTP.onreadystatechange.apply(null,[]);
            
            XMLHTTP.requestObject = {}; //self reference
            // ios/android related code
        }
    }
    
    init(this);
}


AdlerNet.device_callback = function(id,status,data)
{
    var xmlhttp = null;
    for (var i = AdlerNet.objectList.length - 1;i > -1;i--)
    {
        xmlhttp = AdlerNet.objectList[i];
        if (id === xmlhttp.id)
        { break;AdlerNet.objectList.splice(i,1); }
    }
    if (!xmlhttp)
    {
        adler.debugLog("xmlhttp not found in AdlerNet.objectList");
        return;
    }
    xmlhttp.readyState = 4;
    xmlhttp.status = parseInt(status);
    xmlhttp.responseText =  window.atob(data);
    
    xmlhttp.onreadystatechange.apply(null,[]);
}

AdlerNet.callback = null;
AdlerNet.jsonPost = function(primaryKey,jsonString,path,asyncCall,callback)
{
    
    var pathArray = window.location.pathname.split( '/' );
    path = "/"+pathArray[1] + path;
    var async = true;
    var finalResponse = null;
    
    //console.log(document.cookie);
    //  if (asyncCall === false)
    //    async = asyncCall;
    
    var xmlhttp;
    if (window.XMLHttpRequest)
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new AdlerNet.XMLHttpRequest();
    }
    
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState===4 && xmlhttp.status===200)
        {
            var resp = xmlhttp.responseText;
            
            var respObj = JSON.parse(resp);
            if (async && callback)
            {
                callback(respObj);
            }
            else
                finalResponse = respObj;
            
            
        }
    }
    if (!window.location.origin)
        window.location.origin = window.location.protocol+"//"+window.location.host;
    var file = window.location.origin+path; // "/login/1"
    //
    try {
        xmlhttp.open("POST", file,async);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.setRequestHeader("x-adler", primaryKey+"");
        xmlhttp.send(jsonString);
        //console.log(jsonString);
    } catch (e) {
        // do something for error
        //console.log("error");
    }
    
    return finalResponse;
}

AdlerNet.getJSONP = function(url,data,success)
{
    AdlerStorage.setLoading(); setTimeout(function(){if (AdlerStorage.loading) {adler.alert("Json call failed ");AdlerStorage.unsetLoading();AdlerStorage.loading = 0} ;},8000);
    setTimeout(function(){
               if (AdlerStorage.loading) {AdlerStorage.unsetLoading();;AdlerStorage.loading = 0;}
               },3000); // unload after 3 seconds.
    
    var head = document.getElementsByTagName("head")[0] || document.documentElement;
    var script = document.createElement("script");
    var prefix = "?";
    if (data)
    {
        if (typeof(data) === "string")
            data = JSON.parse(data);
        
        for (var k in data)
        {
            url += prefix+k+"="+data[k];
            if (prefix === "?")
                prefix = "&";
        }
    }
    
    url += prefix+"callback=AdlerNet.success";
    
    if (url.indexOf("http") === -1)
        url = "http://"+url;
    script.src =url;
    script.setAttribute("type","text/javascript");
    script.setAttribute("id","jsonscript");
    if (success)
        AdlerNet.callback = success;
    else
        AdlerNet.callback = null;
    // Handle Script loading
    
    var done = false;
    
    // Attach handlers for all browsers
    script.onload = script.onreadystatechange = function() {
        if ( !done && (!this.readyState ||
                       this.readyState === "loaded" || this.readyState === "complete") ) {
            done = true;
            //success();
            // Handle memory leak in IE
            
            script.onload = script.onreadystatechange = null;
            if ( head && script.parentNode ) {
                head.removeChild( script );
            }
            
        }
    };
    
    
    // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
    // This arises when a base node is used (#2709 and #4378).
    head.insertBefore( script, head.firstChild );
    
    // We handle everything using the script element injection
    return;
    
}


AdlerNet.success = function(json)
{
    
    if (AdlerNet.callback)
        AdlerNet.callback(json);
    else
        AdlerStorage.json2DB(json);
    
    AdlerStorage.unsetLoading();
}
STATEDB = {"ADLER":{"ids":null,pageStack:[],"ping":false,"pingInterval":30000},"initialized":false,"transferred":false,"progressQ":{},"modifiedData":{},"modifiedLen":0};
// e.g. STATEDB.progressQ:{“USER_CATEGORY”:{“keyValues”:[1],”func”:xx,”wait”:false,"status":["notSent"]}
STATEDB.setId = function(id,storeName)
{
    if (storeName)
    {
        if (!this.ADLER.ids)
            this.ADLER.ids = {};
        
        this.ADLER.ids[storeName] = id;
    } else this.id = id; // legacy
    AdlerStorage.setItem("ADLER-STATEDB",JSON.stringify(STATEDB));
}
STATEDB.resetId = function(storeName)
{
    if (storeName)
    {
        if (!this.ADLER.ids)
            return;
        
        delete this.ADLER.ids[storeName];
        AdlerStorage.setItem("ADLER-STATEDB",JSON.stringify(STATEDB));
    }
}
STATEDB.setPing = function(pingAllowed)
{
    if (pingAllowed)
    {
        var config = AdlerStorage.getItem("Adler-dbconfig"); // this is set in the first page schema needs to be set there
        if (config) {config = JSON.parse(config);AdlerStorage.dbconfig =  config;}
        
        STATEDB.ADLER.ping = true;
        if (STATEDB.ADLER.pingSeq) AdlerStorage.pingSeq = STATEDB.ADLER.pingSeq;
        AdlerStorage.pingData = true;
        AdlerStorage.syncData = true;
        AdlerStorage.ping(true);
    }
    else
        STATEDB.ADLER.ping = false;
    
}
STATEDB.init = function(entry)
{
    
    if (!STATEDB.initialized)
    {
        if (!entry)
        {
            var pages = STATEDB.pages;
            var sdb = AdlerStorage.getItem("ADLER-STATEDB");
            if (sdb)
            {	sdb = JSON.parse(sdb);
                for (var k in sdb)
                {
                    if (!this[k])
                        this[k] = sdb[k];
                }
                if (sdb.progressQ) {var q = JSON.stringify(sdb.progressQ);this.progressQ = JSON.parse(q);}
                if (sdb.modifiedData)
                {
                    STATEDB.modifiedData = sdb.modifiedData;
                    sdb.modifiedData = null;
                }
                
                for (var k in sdb.ADLER)
                {
                    if (!this.ADLER[k])
                        this.ADLER[k] = sdb.ADLER[k];
                    else if (k === "pageStack") this.ADLER[k] = sdb.ADLER[k]; // force set pageStack
                }
                if (AdlerStorage.containerType === 0)
                {
                    if (!AdlerStorage.loadingGif)
                    {
                        var dv = document.createElement("div"); dv.setAttribute("id","adlerLoading");
                        dv.setAttribute("style","position:fixed;top:0px;left:0px;width:100%;height:100%;z-index:50000;display:none;");
                        dv.innerHTML = "<img src ='AdlerGen/js/loading.gif' style='position:absolute;left:45%;top:35%;width:35px;height:35px;background-color:rgba(150,150,150,0.3)' />";
                        
                        AdlerStorage.loadingGif = dv;
                        document.body.appendChild(dv);
                    }
                }
                STATEDB.setPing(STATEDB.ADLER.ping); // STATEDB.ADLER.ping was originally set on the first page AdlerStorage.firstTimeSetup()
            }
            this.pages = pages;
            try {
                if (!STATEDB.ADLER.user || STATEDB.ADLER.user != ADLER_SCHEMA) defineDBDef();
            } catch(e) {}
        }
        
        STATEDB.initialized = true;
        AdlerStorage.setItem("ADLER-STATEDB",JSON.stringify(STATEDB));
        AdlerStorage.setItem("ADLER-SESSION-href",window.location.href);
        
        var path = window.location.pathname;var pathArray = path.split("/");
        STATEDB.setPageStack(pathArray[pathArray.length - 1]);
        
        if (AdlerStorage.containerType === 0)
        {
            if (!AdlerStorage.loadingGif)
            {
                var lod = document.createElement("IMG");
                lod.src = "AdlerGen/js/loading.gif";
                lod.setAttribute("style","display:none");
                lod.setAttribute("id","adlerLoading");
                AdlerStorage.loadingGif = lod;
                document.body.appendChild(lod);
            }
            AdlerNet.originURL = window.location.origin;
        }
        
        for (var k in STATEDB.progressQ)
        {
            // add them back to sync queue
            var progress = STATEDB.progressQ[k];
            if (progress.func) {
                var funcArray = progress.func.split(".");
                var obj = window;
                for (var f = 0; f < funcArray.length;f++) if (funcArray[f]) obj = obj[funcArray[f]];
                obj.call(null,k,progress);
            }
        }
        
        clearTimeout(AdlerStorage.ajaxTimer);
        AdlerStorage.ajaxTimer =  setTimeout(function() {AdlerStorage.sync()},100);
    }
}
STATEDB.getId = function(storeName)
{
    if (storeName)
    {
        if (this.ADLER.ids)
            return this.ADLER.ids[storeName];
        else
            return null;
    }
    return this.ADLER.ids;
    
}

STATEDB.put = function(name,value,type)
{
    STATEDB.ADLER[name] = value;
}

STATEDB.get = function(name)
{
    return STATEDB.ADLER[name];
}

STATEDB.getCurrentPage = function()
{
    var path = window.location.pathname; var pathArray = path.split("/");
    return pathArray[pathArray.length - 1];
}

STATEDB.setPageStack = function(pg)
{
    var pArray = pg.split("."); var pageName = pArray[0]; var extension = pArray[1];
    
    for (var i = STATEDB.ADLER.pageStack.length - 1;i > -1;i--)
    {
        var page = STATEDB.ADLER.pageStack[i];
        if (page.pageName === pageName)
        {
            // pop everything till here and get out
            for (var j = STATEDB.ADLER.pageStack.length - 1;j > i;j--)
                STATEDB.ADLER.pageStack.pop();
            
            return;
        }
    }
    
    STATEDB.ADLER.pageStack.push({"pageName":pageName,"extension":extension});
    
}
STATEDB.saveState = function()
{
    AdlerStorage.setItem("ADLER-STATEDB",JSON.stringify(STATEDB));
    taskRemaining = false;
    for (var k in STATEDB.progressQ) {if ( (STATEDB.progressQ[k]).wait) taskRemaining = true;}
    
    if (taskRemaining) return "Tasks in progress";
    else return null;
}

STATEDB.getPrevPage = function()
{
    var last = STATEDB.ADLER.pageStack.length - 2;
    
    if (last < 0)
        return "";
    
    return STATEDB.ADLER.pageStack[last];
}

STATEDB.findPage = function(pageName)
{
    var pages = this.ADLER.pages;
    if (!pages)
        return pageName+".html";
    
    for (var i = pages.length -1;i > -1;i--)
    {
        if (pages[i].pageName === pageName)
            return pages[i];
    }
}
Navigation = {};
Navigation.getLocation = function(seq)
{
    //AdlerStorage.loading++;
    
    /*
     setTimeout(function(){
     if (AdlerStorage.loading) AdlerStorage.loading = 0;
     },3000); // unload after 3 seconds.
     */
    var afterFunction = null;
    var act = actionArray[seq];
    if (act.afterFunction) afterFunction = window[act.afterFunction];
    
    var success = function(position) {
        //AdlerStorage.loading--;
        STATEDB.ADLER.position = position;
        var db = AdlerStorage.findStorage("Memory.GPS");
        db.def.columns = ["timestamp","latitude","longitude","altitude","accuracy","heading","speed"];
        db.def.primaryKey = "timestamp";
        db.def.keyPath = "timestamp";
        db.push(position.coords);
        if (afterFunction) afterFunction.call(null,{"db":db,"record":position.coords});
        /*
         coords	objects
         Specifies the geographic location of the device. The location is expressed as a set of geographic coordinates together with information about heading and speed.
         
         coords.latitude	Number
         Specifies the latitude estimate in decimal degrees. The value range is [-90.00, +90.00].
         
         coords.longitude	Number
         Specifies the longitude estimate in decimal degrees. The value range is [-180.00, +180.00].
         
         coords.altitude	Number
         [Optional] Specifies the altitude estimate in meters above the WGS 84 ellipsoid.
         
         coords.accuracy	Number
         [Optional] Specifies the accuracy of the latitude and longitude estimates in meters.
         
         coords.altitudeAccuracy	Number
         [Optional] Specifies the accuracy of the altitude estimate in meters.
         
         coords.heading	Number
         [Optional] Specifies the device's current direction of movement in degrees counting clockwise relative to true north.
         
         coords.speed	Number
         [Optional] Specifies the device's current ground speed in meters per second.
         
         timestamp	date
         Specifies the time when the location information was retrieved and the Position object created.
         */
    };
    var fail = function(){
        //AdlerStorage.loading--;
        adler.alert("unable to find GPS Location")
    };
    navigator.geolocation.getCurrentPosition( success, fail );
}


PageNavigate = {"waitCounter":0,"currentPage":null,"page":""};

PageNavigate.wait4Load = function()
{
    PageNavigate.waitCounter++;
    if (AdlerStorage.loading)
    {
        if (PageNavigate.waitCounter > 5)
        {AdlerStorage.unsetLoading();AdlerStorage.loading = 0;PageNavigate.waitCounter = 0;PageNavigate.goToPage(PageNavigate.page,PageNavigate.currentPage);}
        else
        {
            setTimeout(PageNavigate.wait4Load,500);
        }
        return;
    } else {
        PageNavigate.waitCounter = 0;PageNavigate.goToPage(PageNavigate.page,PageNavigate.currentPage);
        PageNavigate.page = "";
        return;
    }
}

PageNavigate.goToPage = function(page,currentPage)
{
    if (STATEDB.transferred)
        return;
    //
    //  check for loading
    //
    var pg = page;
    if (!pg)
        pg = STATEDB.ADLER.pages[0];
    
    if (AdlerStorage.loading)
    {
        PageNavigate.page = page; PageNavigate.currentPage = currentPage;
        // progress bar here
        //adler.alert("Still loading data.. Please wait a minutes and try again");
        setTimeout(PageNavigate.wait4Load,500); // Navigate after 3 seconds.
        return;
    }
    STATEDB.saveState();
    // cancel any ping timer, this is especially for ios;
    clearTimeout(AdlerStorage.ajaxPingTimer);
    
    STATEDB.transferred = true; // this is to make sure the double click is not causing two calls to devices
    setTimeout(function(){STATEDB.transferred = false;},1100);
    if (AdlerStorage.containerType === 1)
    {Android.goToPage(page,currentPage); return;}
    else if (AdlerStorage.containerType === 2)
    {ios_goToPage(page,currentPage);return;}
    
    if (!window.location.origin)
        window.location.origin = window.location.protocol+ "//" +  window.location.host
        var path = window.location.pathname;var pathArray = path.split("/");pathArray.pop();
    
    var nextPage, nextPageName;
    if (page === "#goBack")
    {
        nextPage = STATEDB.getPrevPage();
        window.history.back();
        return;
    }
    else
        nextPage = STATEDB.findPage(page);
    
    if (!nextPage) return;
    
    nextPageName = nextPage.pageName+"."+nextPage.extension;
    // also check path
    if (nextPage.path)
    {
        // replace the path elements in pathArray
        var newPathArray = nextPage.path.split("/");
        // compare and replace;
        if (newPathArray.length > pathArray.length)
            ; // oh oh.. we got a problem
        else
        {
            var i,j;
            for ( i = pathArray.length - 1, j = newPathArray.length - 1;j > -1;j--,i--)
            {
                if (encodeURI(newPathArray[j]) === pathArray[i])
                    break;
                pathArray[i] = newPathArray[j];
            }
        }
    }
    pathArray.push(nextPageName);
    
    var newpath = pathArray.join("/");
    path = newpath;
    
    window.location = window.location.origin+path;
    
}
COMM = {"dial":function(phone){
    if (AdlerStorage.containerType === 1)
        Android.dial(phone);
    else if (AdlerStorage.containerType === 2)
        ios_dial(phone);
    
    
},"SMS":function(phone){
    if (AdlerStorage.containerType === 1)
        Android.sms(phone);
    else if (AdlerStorage.containerType === 2)
        ios_sms(phone);
},"email":function(email){
    if (AdlerStorage.containerType === 1)
        Android.email(email);
    else if (AdlerStorage.containerType === 2)
        ios_email(email);
}};

AdlerDom = {};
AdlerDom.cancelBubble = function(e)
{
    var evt = e ? e:window.event;
    if (evt.stopPropogation) evt.stopPropogation();
    if (evt.cancelBubble != null) evt.cancelBubble = true;
}
AdlerDom.assign = function(store,options)
{
    var objArray = assignObject[store];
    if (!objArray) return;
    
    var oLen = objArray.length;
    if (!oLen) return;
    
    if (!objArray.scanned)
    {
        for (var i = 0; i < oLen;i++)
        {
            var oId = objArray[i].id;
            var obj = document.getElementById(oId);objArray[i].obj = obj; var nodeName = obj.nodeName.toLowerCase();
            objArray[i].nodeName = nodeName;
            if (nodeName === "select") objArray.select = true;
        }
        objArray.scanned = true;
    }
    
    var db = dataStores[store]; var id = null;
    if (!db.def.columns) return;
    
    var dataArray = []; var dLen = 0;
    if (!options)
    {
        id = STATEDB.getId(store);
        if (!id)
        {
            ;
        } else
        {
            var primaryKey = db.def.columns[0];
            options = {
            filter:[{"column":primaryKey,"cond":"=","val":id}]
            };
            dataArray = db.find(options);
            dLen = dataArray.length;
        }
        
    }
    
    
    
    for (var i = 0; i < oLen;i++)
    {
        var objPointer = objArray[i];var id = objPointer.id;var objDetail = idObject[id];
        var act = objDetail.actions[objPointer.seq];
        if (dLen >  0 || act.beforeFunction || act.afterFunction)
            AdlerDom.assignObj(db,dataArray,objDetail,act);
    }
}

AdlerDom.assignObj = function(db,dataArray,objDetail,act)
{
    var obj = objDetail.obj; var dLen = dataArray.length;
    var record = {};if (dLen)	record = dataArray[0];var inputs = {db:db,"storeName":db.def.store,record:record,"targetElement":obj};
    if (act.beforeFunction)
    {
        var output = {"returnString":"","domModified":false};
        try {
            output = window[act.beforeFunction].call(null,inputs);
        } catch (e) {adler.log("error during calling fuction , line - 2708 "+act.beforeFunction+" ",e);}
        // call the custom function
        try {
            if (output && output.domModified === false)
            {
                if (output.returnString != null && output.returnString !== "" )
                    obj[act.to] = output.returnString;
                else obj[act.to] = "";
            }
        } catch (e) { adler.log("error in assigning output from custom function - "+act.beforeFunction+", line - 2713 ",e);}
    } else
    {
        if (dataArray.length === 0) return;
        var nodeName = objDetail.nodeName;
        if (nodeName === "select")
        {
            var selectOptions = obj.options; var oLen = selectOptions.length;
            var data = dataArray[0];var str = data[act.column];
            for (var s = 0; s < oLen ;s++)
            {
                var val = selectOptions[s].value ;
                if (!val) val = selectOptions[s].text ;
                if (val == str) {obj.selectedIndex = s; return;}
            }
        } else
        {
            var to = act.to; if (!to) to = "innerHTML";
            var str = ""; var data = dataArray[0];
            if (act.range)
            {
                str = obj[to];
                
                var pre = str.substring(0,act.range.start);
                var post = str.substring(act.range.end);
                str = pre +data[act.column]+post ;
            }
            else str = data[act.column];
            
            if (str == null) str = "";
            if (act.toStoreName) {
                var imageId = str;
                if (!imageId) return null;
                STATEDB.setId(str,act.toStoreName);
                var domId = obj.getAttribute("id");
                if (AdlerStorage.containerType === 1)
                {
                    AdlerStorage.setLoading();
                    Android.readImage(domId,imageId,0);
                } else if (AdlerStorage.containerType === 2)
                {
                    AdlerStorage.setLoading();
                    ios_readImage(domId,imageId,0);
                }
            }
            else obj[to] = str;
        }
        
    }
    if (act.afterFunction) {try{window[act.afterFunction].call(null,inputs)} catch(e){adler.log("error during post function  "+act.afterFunction+" , line 2746 ",e);}}
}

AdlerDom.clickFunction = function()
{
    var o = event.target; var id = o.getAttribute("data-evnt-id");
    AdlerDom.cancelBubble(event);
    while(!id)
    {o = o.parentElement;
        if (!o || o === document.body) return;
        id = o.getAttribute("data-evnt-id");}
    
    idObject[id].functionArray.forEach(function(fnObj,index)
                                       {
                                       var fn = fnObj.func;
                                       var ac = fnObj.ac;
                                       var type = fnObj.evnt; if (!type) type = "click";
                                       if (type.indexOf(event.type) > -1)
                                       fn.apply(null,[event,ac]);
                                       });
    setTimeout(function(){AdlerDom.buttonClicked = false;
               AdlerStorage.keepPingTimerAlive();
               },800);
    return true;
}

AdlerDom.dataBinder = function(actArray)
{
    AdlerStorage.keepPingTimerAlive();
    if (typeof(actArray) === "string")
    {
        var st = actArray; // this is called from ping per store or sync per store
        AdlerDom.assign(st);
        AdlerDom.repeat(st,true);
        return;
    }
    // bind real object to idObject array
    AdlerDom.idObject();
    // assign all the objects
    for (var st in assignObject)
        AdlerDom.assign(st);
    
    var ids = idObject;
    var addFunction = function(oId,name,func,act,evnt)
    {
        var funcArray = ids[oId].functionArray;
        for (var i = funcArray.length.length - 1;i > -1;i--)
        {
            var e = funcArray[i];
            if (e.name === name)
            {
                if (e.ac === act) return;
            }
        }
        funcArray.push({"name":name,"func":func,"ac":act,"evnt":evnt});
        
    }
    for (var evnt in eventObject)
    {
        var functionArray = [];
        var objArray = eventObject[evnt]; var oLen = objArray.length;
        for (var i = 0; i < oLen;i++)
        {
            var oId = objArray[i].id; var aSeq = objArray[i].seq;
            if (!ids[oId]) throw {"message":"HTML Element - "+oId+" Not Defined But widget is defined ","stack":["AdlerDom.dataBinding - eventBinding "]};
            var obj = ids[oId].obj; var act = ids[oId].actions[aSeq];
            if (!ids[oId]["functionArray"])  ids[oId]["functionArray"] = [];
            
            obj.setAttribute("data-evnt-id",oId);
            if (act.clickAction === "Reset")
            {
                var store = act.storeName; var beforeFunction = act.beforeFunction;
                var resetEvent =  function(e,ac)
                {
                    // go find all the data entry objects
                    var dObjArray = formObject[store];
                    if (dObjArray)
                    {
                        var dLen = dObjArray.length;
                        // all the object values
                        for (var d = 0; d < dLen;d++)
                        {
                            var dOId = dObjArray[d].id; var daSeq = dObjArray[d].seq;
                            var dObj = document.getElementById(dOId); var dact = actionArray[daSeq];
                            if (dact.nodeName === "select")
                                dObj.selectedIndex = 0;
                            else
                                dObj[dact.from] = "";//empty it
                            
                            
                        }
                    }
                    var st = ac.storeName;
                    var db = dataStores[st];
                    var inputs = {db:db,"storeName":db.def.store,record:null};
                    if (ac.beforeFunction) {try{window[ac.beforeFunction].call(null,inputs);} catch(e){adler.log("error during pre function "+act.beforeFunction+" , line - 2821 ",e);}};
                    if (ac.afterFunction) {try{window[ac.afterFunction].call(null,inputs);} catch(e){adler.log("error during post function "+act.afterFunction+" , line - 2822 ",e);}};
                    
                };
                addFunction(oId,"resetEvent",resetEvent,act,evnt);
            } else if (act.clickAction === "Submit" || act.clickAction === "Update" || act.clickAction === "Retrieve")
            {
                
                var store = act.storeName; var beforeFunction = act.beforeFunction;
                var submitEvent =  function(e,ac)
                {
                    if (AdlerDom.buttonClicked) return;
                    // go find all the data entry objects
                    var record = {}; var elements = [];
                    var dObjArray = formObject[store];
                    if (dObjArray)
                    {
                        var dLen = dObjArray.length;
                        // all the object values
                        for (var d = 0; d < dLen;d++)
                        {
                            var dOId = dObjArray[d].id; var daSeq = dObjArray[d].seq;
                            var objDetail = idObject[dOId];
                            var dObj = objDetail.obj; var dact = objDetail.actions[daSeq];
                            elements.push({"obj":dObj,"from":dact.from,"id":dOId});
                            
                            if (dObj.nodeName === "SELECT")
                            { try {
                                var val = dObj.options[dObj.selectedIndex].value;
                                if (!val) val =  dObj.options[dObj.selectedIndex].text;
                                record[dact.column]= val;
                                
                            }catch(e){}}
                            else
                            {
                                if (dact.fromCustomAttr || dact.fromType) {record[dact.column] = dObj.getAttribute(dact.from);
                                }
                                else {
                                    var val = dObj[dact.from];
                                    if ( !val )
                                    {
                                        if (dact.Mandatory === "Y")
                                        {
                                            dObj.focus();AdlerDom.buttonClicked = true;
                                            var placeHolder = dObj.getAttribute("placeholder");
                                            adler.alert(placeHolder+" - Mandatory Field, Please Enter");
                                            return;
                                        }

                                    } else
                                    {
                                        if (dact.Validation){
                                            var valid = AdlerDom.validate(dObj,val,dact.Validation);
                                            if (!valid) return;
                                        }
                                    }
                                    record[dact.column] = val;
                                    //dObj[dact.from] = "";
                                }//empty it
                            }
                            
                        }
                    }
                    
                    var st = ac.storeName;
                    var db = dataStores[st];
                    var inputs = {"db":db,"storeName":db.def.store,record:record,"elements":elements,"targetElement":e.target};
                    if (ac.clickAction === "Update")
                    {
                        var id = STATEDB.getId(st);
                        record[db.getPrimaryKeyName()] = id;
                    }
                    if (ac.beforeFunction) {try{window[ac.beforeFunction].call(null,inputs);} catch(e){adler.log("error during pre function "+act.beforeFunction+" , line 2865 ",e);}}
                    else {
                        if (ac.clickAction === "Update")
                        {db.update(record); adler.alert("record updated");}
                        else if (ac.clickAction === "Retrieve")
                        {
                            var option = {"filter":[]};
                            for (var k in record)
                            {
                                var criteria = {"column":k,"cond":"=","val":record[k]};
                                option.filter.push(criteria);
                            }
                            AdlerDom.assign(st,option);
                        }
                        else
                        {
                            
                            db.push(record);adler.alert("record saved");}
                    }
                    if (ac.afterFunction) {try{window[ac.afterFunction].call(null,inputs);} catch(e){adler.log("error during post function "+act.afterFunction+" , line - 2882 ",e);}};
                    AdlerDom.buttonClicked = true;
                };
                addFunction(oId,"submitEvent",submitEvent,act,evnt);
                
            } else if (act.clickAction === "Delete")
            {
                var confirmEvent = function(e,ac)
                {
                    if (AdlerDom.buttonClicked) return;
                    AdlerDom.argList = [e,ac];
                    
                    //if (AdlerStorage.containerType === 1)
                    //   Android.showAlert("Delete","Are you sure you want to delete",0,"AdlerDom.deleteEvent(1)","AdlerDom.deleteEvent(0)" );
                    //else
                    AdlerDom.deleteEvent(1);
                    AdlerDom.buttonClicked = true;
                }
                addFunction(oId,"confirmEvent",confirmEvent,act,evnt);
            }
            else if (act.clickAction === "PageNavigate")
            {
                var navigateEvent = function(ev,ac) {
                    
                    if (ac.beforeFunction) {try{window[ac.beforeFunction].call(null,{"targetElement":ev.target});} catch(e){adler.log("error during pre function "+act.beforeFunction+" , line 2909 ",e);}}
                    if (ac.afterFunction) {try{window[ac.afterFunction].call(null,{"targetElement":ev.target});} catch(e){adler.log("error during post function "+act.afterFunction+" , line 2910 ",e);}}
                    var currentPage = ac.currentPage;
                    if (!currentPage) currentPage = STATEDB.getCurrentPage;
                    PageNavigate.goToPage(ac.page,ac.currentPage);
                }
                addFunction(oId,"navigateEvent",navigateEvent,act,evnt);
            } else if (act.clickAction === "Take Picture")
            {
                var takePictureEvent = function(ev,ac) {
                    if (AdlerDom.buttonClicked) return;
                    if (ac.beforeFunction) {try{window[ac.beforeFunction].call(null,{"targetElement":ev.target});} catch(e){adler.log("error during pre function "+act.beforeFunction+" , line 2918 ",e);}}
                    if (AdlerStorage.containerType)
                    {
                        var o = event.target; var id = o.getAttribute("data-evnt-id");
                        while(!id)
                        {o = o.parentElement;
                            if (!o || o === document.body) return;
                            id = o.getAttribute("data-evnt-id");}
                        
                        
                        if (AdlerStorage.containerType === 1)
                            Android.takeNSavePicture(id);
                        else if (AdlerStorage.containerType === 2)
                            ios_takeNSavePicture(id);
                        
                    } // end of containerType
                    if (ac.afterFunction) {try{window[ac.afterFunction].call(null,{"targetElement":ev.target});} catch(e){adler.log("error during post function "+act.afterFunction+" , line 2934 ",e);}};
                    AdlerDom.buttonClicked = true;
                } // end of takePictureEvent
                addFunction(oId,"takePictureEvent",takePictureEvent,act,evnt);
            } else if (act.clickAction === "Open Address Book")
            {
                var openAddrBookEvent = function(ev,ac) {
                    if (AdlerDom.buttonClicked) return;
                    if (ac.beforeFunction) window[ac.beforeFunction].call(null,{"targetElement":ev.target});
                    if (AdlerStorage.containerType)
                    {
                        var o = event.target; var id = o.getAttribute("data-evnt-id");
                        while(!id)
                        {o = o.parentElement;
                            if (!o || o === document.body) return;
                            id = o.getAttribute("data-evnt-id");}
                        
                        var file = "";
                        if (AdlerStorage.containerType === 1)
                            Android.showAddressList(id);
                        else if (AdlerStorage.containerType === 2)
                            ios_showAddressList(id);
                        
                        
                    } // end of containerType
                    if (ac.afterFunction) {try{window[ac.afterFunction].call(null,{"targetElement":ev.target});} catch(e){adler.log("error during post function "+act.afterFunction+" , line 2961 ",e);}}
                    AdlerDom.buttonClicked = true;
                    
                } // end of openAddrBookEvent
                addFunction(oId,"openAddrBookEvent",openAddrBookEvent,act,evnt);
                
            } // end of open address book
            else if (act.clickAction === "Custom")
            {
                var triggerEvent = function(ev,ac)
                {
                    if (ac.clickAction === "Custom")
                    {
                        var db = null;
                        if (ac.storeName && ac.storeName !== "IGNORE" )
                            db = dataStores[ac.storeName]; if (!db) db = AdlerStorage.findStorage(ac.storeName);
                        var inputs = {"db":db,"storeName":ac.storeName,"targetElement":ev.target};
                        if (ac.beforeFunction) {try{window[ac.beforeFunction].apply(null,[inputs]);} catch(e){adler.log("error during pre function "+act.beforeFunction+" , line 2978 ",e);}}
                        
                        if (ac.afterFunction) {try{window[ac.afterFunction].apply(null,[inputs]);} catch(e){adler.log("error during post function "+act.afterFunction+" , line 2981 ",e);}}
                        
                    }
                }
                addFunction(oId,"triggerEvent",triggerEvent,act,evnt);
            } // end of eventTrigger
            else if (act.instruction === "valid")
            {
                var validEvent = function(ev,ac)
                {
                    
                    var inputs = {"targetElement":ev.target};
                    if (ac.beforeFunction) {try{window[ac.beforeFunction].apply(null,[inputs]);} catch(e){adler.log("error during pre function "+act.beforeFunction+" , line 2993 ",e);}}
                    else
                    {
                        var obj = ev.target;var val = obj[ac.from];
                        if (ac.valid === "mandatory") {
                            if (!val) {alert("mandatory field");obj.focus();};
                        } else if (ac.valid === "numeric")
                        {
                            if (isNaN (val-0) || val == null || val.trim() == "" || val === false)
                            {alert("Must Enter Numeric Value");obj.focus();}
                        }
                    }
                    if (ac.afterFunction) {try{window[ac.afterFunction].apply(null,[inputs]);} catch(e){adler.log("error during post function "+act.afterFunction+" , line 3005 ",e);}}
                    
                }
                addFunction(oId,"validEvent",validEvent,act,evnt);
            }
        }
        
        
    }
    
    
    for (var evnt in eventObject)
    {
        for (var e =  eventObject[evnt].length - 1;e > -1;e--)
        {
            var oId = eventObject[evnt][e]["id"];
            ids[oId].obj[evnt] = AdlerDom.clickFunction ;
        }
    }
    
    // assign all the objects inside repeatable div
    for (var st in repeatObject)
        AdlerDom.repeat(st,false);
    
    AdlerMemory.restoreFormFromMemory(); // restore any form fields
    
}

AdlerDom.argList = [];
AdlerDom.buttonClicked = false;

AdlerDom.deleteEvent =  function(type)
{
    if (!type) { AdlerDom.argList = [];
        return;}
    var e = AdlerDom.argList[0];
    var ac = AdlerDom.argList[1];
    var st = ac.storeName;
    var db = dataStores[st];
    var id = STATEDB.getId(st);
    var record = {};record[db.getPrimaryKeyName()] = id;
    var inputs = {db:db,"storeName":db.def.store,record:record,"targetElement":e.target};
    if (ac.beforeFunction) {try{window[ac.beforeFunction].call(null,inputs);} catch(e){adler.log("error during pre function "+act.beforeFunction+" , line 3047 ",e);}}
    else
    {db.delete(record);
        adler.alert("record deleted");}
    if (ac.afterFunction) {try{window[ac.afterFunction].call(null,inputs);} catch(e){adler.log("error during post function "+act.afterFunction+" , line 3051 ",e);}}
    AdlerDom.argList = [];
}

AdlerDom.idObject = function()
{
    for (var oId in idObject)
    {
        var  objDetail = idObject[oId];
        var obj = document.getElementById(oId);
        if (!obj) continue;
        
        if (!objDetail.obj )
        {
            objDetail.obj = obj;
            objDetail.nodeName = obj.nodeName.toLowerCase();
        }
    }
}

AdlerDom.repeat = function(store,bubbleUp,options,par)
{
    
    var objArray = repeatObject[store]; if (!objArray) return;
    var oLen = objArray.length; if (oLen < 1) return;
    // split the object array
    for (var i = 0 ; i < oLen;i++)
    {
        var obj = objArray[i];
        if (par)
        {
            if (obj.type.indexOf("Nested") > -1) AdlerDom.repeatRepeat(store,options,par,[obj]);
        } else
        {
            if (obj.type === "repeat" || obj.type === "repeatSelect") AdlerDom.repeatRepeat(store,options,null,[obj]);
            else if (bubbleUp && obj.type && obj.type.indexOf("Nested") > -1) AdlerDom.repeatRepeat(store,options,null,[obj]);
        }
        
    }
    
}
AdlerDom.repeatRepeat = function(store,options,par,objArray)
{
    var firstObject = objArray[0]; var objDetail = idObject[firstObject.id];
    var rowSample = objDetail.obj; var domModified = false; var repeatAction = objDetail.actions[firstObject.seq]; var dataArray = null;
    var nested = false;
    if (firstObject.type === "repeatNested") nested = true;
    
    if (!par) {if (nested) {
        var nestedPointer = firstObject.nestedParent;
        
        var pAction = idObject[nestedPointer.id].actions[nestedPointer.seq];
        AdlerDom.repeat(pAction.storeName,true); // bubble up
        return;} //
        par = rowSample.adlerParent;
        if (!par && firstObject.type != "repeatSelect") // select is single item to repeat hence no need to create new parent
        {par = rowSample.parentElement;rowSample.adlerParent = par; // get the original parent
            var sampleParent = document.getElementById("adlerSampleParent"); // move the sample row here
            if (!sampleParent) {sampleParent = document.createElement("div"); sampleParent.setAttribute("id","adlerSampleParent");
                sampleParent.setAttribute("style","display:none;visibility:hidden;");sampleParent.appendChild(rowSample);
                document.body.appendChild(sampleParent);
            } else {sampleParent.appendChild(rowSample);}
        }
    }
    else nested = true;
    
    var rowMemory = {};
    
    var db = dataStores[store]; var dataArray = [];
    
    if (repeatAction.beforeFunction)
    {
        var inputs = {"db":db,"storeName":store,"records":dataArray,"targetElement":rowSample,"elements":[par]};
        var output = {"returnArray":[],"domModified":false};
        try {
            output = window[repeatAction.beforeFunction].call(null,inputs);
            if (output)
                domModified = output.domModified;
        } catch (e) {console.log("error calling before repeat function "+repeatAction.beforeFunction,e);}
        if (!domModified) dataArray = output.returnArray;
        else return;
    } else
    {
        var criteria = {}; if (repeatAction.filter) criteria.filter = JSON.parse(repeatAction.filter);
        if (repeatAction.sort) criteria.sort = JSON.parse(repeatAction.sort);
        if (repeatAction.limit) criteria.limit = JSON.parse(repeatAction.limit);
        if (options) criteria = options;
        dataArray = db.find(criteria);
    }
    
    if (firstObject.type === "repeatSelect")
    {
        var optString = "";var keyColumn = db.def.columns[0]; var dLen = dataArray.length;
        
        var uniq = []; var checkUnique = function(dta) { if (!dta || dta === "null") return null; for (var u = uniq.length - 1;u > -1;u--) if (uniq[u] === dta) return null; uniq.push(dta); return dta;}
        for (var r = 0; r < dLen;r++)
        {
            var record = dataArray[r]; var dta = record[repeatAction.column]; dta = checkUnique(dta);
            if (!dta) continue;
            
            optString += "<option value='"+record[keyColumn]+"' >"+dta+"</option>";
        }
        rowSample.innerHTML = optString;
        
        if (repeatAction.afterFunction)
        {
            var inputs = {"db":db,"storeName":store,"records":dataArray,"targetElement":rowSample,"elements":[par]};
            var output = {"returnArray":[],"domModified":false};
            try {
                output = window[repeatAction.afterFunction].call(null,inputs);
                if (output)
                    domModified = output.domModified;
                else domModified = false;
            } catch (e) {console.log("error calling after repeat function "+repeatAction.beforeFunction,e);}
        }
        return;
    }
    
    var cl = true;
    //var sampleParent = rowSample.parentElement;
    var rowSampleId = rowSample.getAttribute("data-evnt-id");
    
    if (par.prevGenRow)
    {
        var garbage = document.getElementById("garbage");
        if (!garbage) {
            garbage = document.createElement("div"); garbage.setAttribute("id","garbage");
            garbage.setAttribute("style","display:none;visibility:hidden;");
            document.body.appendChild(garbage);
        }
        for (var g = par.prevGenRow.length - 1;g > -1;g--) garbage.appendChild(par.prevGenRow[g]);
        garbage.innerHTML = ""; // trash them all
        //trash all rows
    } else par.prevGenRow = new Array();
    
    var len = dataArray.length;
    
    try {  var ids = idObject;
        var repeatFuncs =   ids[rowSampleId].functionArray;
        if (!repeatFuncs || repeatFuncs.length === 0) { ids[rowSampleId].functionArray = [{"name":"repeatItemClicked","func":AdlerDom.repeatItemClicked,"ac":repeatAction}];}
        else {
            if (repeatFuncs[0].name != "repeatItemClicked")
            {repeatFuncs.splice(0,0,{"name":"repeatItemClicked","func":AdlerDom.repeatItemClicked,"ac":repeatAction});}
        }
        var repeatEventDone = false;
        var inputs = {"db":db,"storeName":store,"records":dataArray,"record":null,"targetElement":rowSample,"elements":[par]};
        
        for (var i = 0 ; i < len;i++)
        {
            var data = dataArray[i];
            var row = rowSample.cloneNode(false); row.removeAttribute("data-adr-action");row.style.display="";
            var key = data[db.def.keyPath];
            row.setAttribute("id",key);row.setAttribute("data-adr-id",key);
            if (rowSample.onclick)
                row.addEventListener("click",rowSample.onclick);
            var aElementList = {}; //if (rowSampleId) aElementList[rowSampleId] = row;
            AdlerDom.cloneRow(db,rowMemory,rowSample,row,data,null,i,aElementList,row);
            if (!repeatEventDone) {
                AdlerDom.repeatElementEvents(aElementList,repeatAction); // attach correct events
                repeatEventDone = true;
            }
            
            par.appendChild(row);par.prevGenRow.push(row); // save it for future delete
            //par.insertBefore(row,rowSample); commented out because we added par.innerHTML = "" that was not there earlier
            if (repeatAction.afterEach)
            {
                try {
                    inputs.record = data;inputs.targetElement = row;
                    output = window[repeatAction.afterEach].call(null,inputs);
                } catch (e) {adler.log("error during post function, line - 3214 "+repeatAction.afterEach+" ",e);}
            }
        }
        if (repeatAction.afterFunction)
        {
            var inputs = {"db":db,"storeName":store,"records":dataArray,"targetElement":rowSample,"elements":[par]};
            var output = {"returnArray":[],"domModified":false};
            try {
                output = window[repeatAction.afterFunction].call(null,inputs);
                if (output)
                    domModified = output.domModified;
                else domModified = false;
            } catch (e) {console.log("error calling after repeat function "+repeatAction.beforeFunction,e);}
        }
        //if (par === sampleParent) sampleParent.appendChild(rowSample);// add it back
        if (AdlerDom.imageAssigned) // read the image from phone and assign it back. This is done so we don't block the ui draw
            setTimeout(AdlerDom.imageAssignment,1);
    } catch (e) {adler.log(" error during repeat, line- 3220 ",e);}
}

AdlerDom.cloneRow = function(db,rowMemory,obj,cloneParent,data,detail,rowSeq,aElementList,topRow)
{
    if (obj.hasChildNodes()) {
        var child = obj.firstChild;
        while(child){
            if (child.nodeType === 1) {
                var cloneChild = document.createElement(child.nodeName); var dtl = null;
                var attrs = child.attributes;
                var aLen = attrs.length;
                for (var i = 0; i < aLen;i++)
                { var attr = attrs[i];
                    var nm = attr.name; var val = attr.value;
                    if (nm === "data-adr-action") continue;
                    else
                        if (nm === "id") {dtl = idObject[val];val = val  +"_"+ rowSeq;}
                        else
                            if (nm === "href") {if (val.indexOf("#") === 0); val = val  +"_"+ rowSeq; }
                            else
                                if (nm === "data-evnt-id")  {var cId = child.getAttribute("id");aElementList[cId] = cloneChild;
                                    if (child.nodeName === "INPUT") {cloneChild.onblur = child.onblur;cloneChild.onfocus = child.onfocus;}
                                    else if (child.nodeName === "SELECT") {cloneChild.onselect = child.onselect;}
                                    
                                }
                    // when there is some event on an element, just store it in aElement to add events later
                    // aElementList[id] contains original id but new element so we can bind events to this new object
                    if (nm) try {cloneChild.setAttribute(nm,val);} catch (e) {}
                }
                if (dtl)
                {
                    if (dtl.actions)
                    {
                        var acLen = dtl.actions.length;
                        for (var l = 0; l < acLen;l++)
                        {
                            var dac = dtl.actions[l];
                            if (dac.widget === "Copy")
                            {
                                // copy to row Memory
                                rowMemory[dac.toStoreName] = data[dac.column];
                            }
                            else if (dac.instruction === "Assign")
                            {
                                if (dac.to != "innerHTML")
                                {
                                    var str = child[dac.to];
                                    str = AdlerDom.assignString(dtl,str,db,data,cloneChild,rowMemory); // pass cloneChild
                                    if (str == null)
                                        ;
                                    else
                                    {
                                        var a = str.action
                                        if (str.string != null) cloneChild[a.to] = str.string;
                                        else cloneChild[a.to] = "";
                                    }
                                } /* else if (child.innerHTML.indexOf("<") > -1)
                                   { // sometimes the there are many elements inside instead of plain text
                                   child.innerHTML = "-" ; // temporarily space is it out
                                   }  this code is commented, it caused problem in productListing.html		*/
                                
                            } // end of else copy
                            else if (dac.instruction === "Repeat")
                            {
                                try {
                                    var store = db.def.storeName;
                                    var id = topRow.getAttribute("id");
                                    STATEDB.setId(id,store);
                                    AdlerDom.repeat(dac.storeName,false,null,cloneParent);
                                    STATEDB.resetId(store);
                                } catch (e) {}
                            } // end of else (dac.instruction === "Repeat")
                        }
                    }
                    
                }
                
                AdlerDom.cloneRow(db,rowMemory,child,cloneChild,data,dtl,rowSeq,aElementList,topRow);
                cloneParent.appendChild(cloneChild);
            } else if (child.nodeType === 3)
            {
                var str = child.textContent; var strObj = {"string":str};
                if (detail && detail.actions) {
                    strObj = AdlerDom.assignString(detail,str,db,data,cloneParent,rowMemory); // pass cloneParent for text node
                    if (strObj == null)
                    {child = child.nextSibling;continue;}
                }
                if (strObj.string != null)
                    cloneParent.appendChild(document.createTextNode(strObj.string));
            }
            child = child.nextSibling;
        }
    }
}
AdlerDom.repeatItemClicked = function(e,ac)
{
    var ob = e.target;
    var id;
    while (!id && ob)
    {
        id = ob.getAttribute("data-adr-id"); // data-adr-id contains primarykey
        ob = ob.parentElement;
    }
    
    var store = ac.storeName;
    STATEDB.setId(id,store);// setId(id,store);
    AdlerDom.assign(store); // not sure why we assigned it again but this is causing double event need to investigate
}

AdlerDom.repeatElementEvents = function(aElementList,act)
{
    var ids = idObject;
    for (var oId in aElementList)
    {
        var funcArray = ids[oId].functionArray;
        //       if (funcArray.length > 0) if (funcArray[0].name === "repeatItemClicked") continue;
        
        funcArray.splice(0,0,{"name":"repeatItemClicked","func":AdlerDom.repeatItemClicked,"ac":act,"evnt":"onclick"});
    }
}

AdlerDom.assignString = function(detail,str,db,data,obj,rowMemory)
{
    var act = null; var found = false;
    for (var i = detail.actions.length - 1;i > -1;i-- )
    {
        act = detail.actions[i];
        if (act.instruction === "Assign") {found = true;break;}
    }
    if (!found) return {"string":str}; // changed 11/19 it was earlier returning null causing original value being lost
    if (act.storeName.indexOf("Memory.") > -1)
    {
        if (!rowMemory) return null;
        var imageId = rowMemory[act.storeName];
        if (!imageId) return null;
        var domId = obj.getAttribute("id");
        if (AdlerStorage.containerType === 1)
        {
            AdlerStorage.setLoading();
            Android.readImage(domId,imageId,0);
        } else if (AdlerStorage.containerType === 2)
        {
            AdlerStorage.setLoading();
            ios_readImage(domId,imageId,0);
        }
        return null;
        
    }
    var inputs = {"db":db,"storeName":db.def.store,"record":data,"targetElement":obj};
    if (act.beforeFunction)
    {
        var output = {"returnString":"","domModified":false}; var domModified= false;
        try {
            output = window[act.beforeFunction].call(null,inputs);
            
        } catch (e) {adler.log("error during calling fuction line - 3279 "+act.beforeFunction+" ",e);}
        // call the custom function
        if (output)
        {
            if (output.domModified === false)
                str = output.returnString;
            else
                return null;
        } else return null;
        
    } else
    { if (act.range)
    {  var pre = str.substring(0,act.range.start);
        var post = str.substring(act.range.end);
        str = pre +data[act.column]+post ;
    }
    else
        str = data[act.column];
    }
    if (act.afterFunction) {try{window[act.afterFunction].call(null,inputs);} catch(e){adler.log(" error during post function "+act.afterFunction+" , line - 3293 ",e);}};
    return {"action":act,"string": str};
}


/**
 *  The following rules apply
 'email','phone','password','creditcard'
 *
 **/
AdlerDom.validate = function(dObj,value,rule)
{
    if (!rule) return true;
    var ruleRegex = /^(.+?)\[(.+)\]$/,
    numericRegex = /^[0-9]+$/,
    integerRegex = /^\-?[0-9]+$/,
    decimalRegex = /^\-?[0-9]*\.?[0-9]+$/,
    emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
   alphaRegex = /^[a-z]+$/i,
   alphaNumericRegex = /^[a-z0-9]+$/i,
   alphaDashRegex = /^[a-z0-9_\-]+$/i,
   naturalRegex = /^[0-9]+$/i,
   naturalNoZeroRegex = /^[1-9][0-9]*$/i,
   ipRegex = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/i,
   base64Regex = /[^a-zA-Z0-9\/\+=]/i,
   numericDashRegex = /^[\d\-\s]+$/,
   urlRegex = /^((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/,
   phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
   creditcardRegex = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/;
                
                    if (!value) value = dObj.value;
                    if (!value) return true;
                    var valid = true; var msg = "";
                    if (rule === "email")
                    {
                    if (emailRegex.test(value)) valid = false;
                    } else if (rule === "phone")
                    {
                    if (phoneRegex.test(value)) valid = false;
                    } else if (rule === "password")
                    {
                        var minNumberofChars = 6;
                        var maxNumberofChars = 36;
                        var regularExpression  = /^[a-zA-Z0-9!@#$%^&*]{6,16}$/;

                        if(value.length < minNumberofChars || value.length > maxNumberofChars){
                            valid = false;
                            msg = "Password must contain atleast 6 characters";
                        }
                        /*
                        else {
                    
                            if(!regularExpression.test(value)) {
                                msg = "password should contain atleast one number and one special character";
                                valid =  false;
                            }
                    
                        }
                        */
                    } else if (rule === "creditcard")
                    {
                     if (creditcardRegex.test(value)) valid = false;
                     else
                      {
                        // The Luhn Algorithm.
                        var nCheck = 0, nDigit = 0, bEven = false;
                        value = value.replace(/\D/g, "");
                    
                        for (var n = value.length - 1; n >= 0; n--) {
                            var cDigit = value.charAt(n),
                            nDigit = parseInt(cDigit, 10);
                    
                            if (bEven) {
                                if ((nDigit *= 2) > 9) nDigit -= 9;
                            }
                    
                            nCheck += nDigit;
                            bEven = !bEven;
                        }
                    
                        if (!((nCheck % 10) == 0)) valid = false;
                      }
                    } else if (rule === "none") return true;
                
                    if (!valid)
                    {
                        dObj.focus();
                        if (!msg)
                        {
                            var placeHolder = dObj.getAttribute("placeholder");
                            msg = placeHolder+" - Not valid, Please enter correct Value ";
                        }
                        adler.alert(msg);
                    }
                    return valid;
                    
}

AdlerDom.imageAssigned = false;
AdlerDom.imageAssignmentList = {};
AdlerDom.imageAssignment = function()
{
    try {
        var im = AdlerDom.imageAssignmentList;
        for (var id in im)
        {
            var image = "";
            if (AdlerStorage.containerType === 1)
            {
                image = Android.readImage(id,0);
                if (image) image = "data:image/jpeg;base64,"+image;
            } else if (AdlerStorage.containerType === 2)
            {
                image = ios_readImage(id,0);
                if (image) {image = "data:image/jpeg;base64,"+image;}
                else {adler.log("No image returned");}
            }
            
            var obj = AdlerDom.imageAssignmentList[id].obj;
            obj.src = image;
            obj = null;
        }
    } catch (e) {adler.log("error during image assignment , line 3321 ",e);}
    AdlerDom.imageAssignmentList = {};
    AdlerDom.imageAssigned = false;
}


AdlerCallback = {};

AdlerCallback.checkLoadCounter = 0;
AdlerCallback.checkLoading = function()
{
    AdlerCallback.checkLoadCounter++;
    if (!AdlerStorage.loading)
    {
        if (AdlerStorage.containerType === 1)
            Android.loaded();
        else if (AdlerStorage.containerType === 2)
            ios_loaded();
        
        return true;
    }
    else {
        if (AdlerCallback.checkLoadCounter > 5) {
            if (AdlerStorage.containerType === 1)
                Android.loaded();
            else if (AdlerStorage.containerType === 2)
                ios_loaded();
            return true;
        }
        else
        {  setTimeout(AdlerCallback.checkLoading,300); return false;}
        
    }
}

AdlerCallback.AssignImageSrc = function(domId,base64Image)
{
    try {
        if (!base64Image) return;
        
        base64Image = "data:image/jpeg;base64,"+base64Image;
        var obj = document.getElementById(domId);
        if (obj)
        {
            obj.src = base64Image;
        }
        AdlerStorage.unsetLoading();
    } catch (e) { adler.log("error during assigning image , line 3364 ",e);}
}

AdlerCallback.AssignImageId = function(domId,base64JSON)
{
    try {
        var imageJSON = window.atob(base64JSON);
        imageJSON = JSON.parse(imageJSON);
        var obj = document.getElementById(domId);
        if (obj)
        {
            obj.setAttribute("data-adr-Memory.Images.imageId",imageJSON.file);
        }
    } catch (e) { adler.log("error during saving picture id , line - 3377 ",e);}
}

AdlerCallback.AssignAddressBook = function(domId,base64JSON)
{
    try {
        var contactJSON = window.atob(base64JSON);
        contactJSON = JSON.parse(contactJSON);
        
        var obj = document.getElementById(domId);
        if (obj)
        {
            var contact = contactJSON.contact;
            obj.setAttribute("data-adr-Memory.AddressBook.displayName",contact.displayName);
            STATEDB.setId(contact.displayName,"Memory.AddressBook");
            var addrDB = AddressBookDB;
            if (!addrDB) addrDB = AdlerStorage.findStorage("Memory.AddressBook");
            if (!addrDB.def.columns)
                AdlerMemory.DefineAddressBook(addrDB,true,contact);
            else AdlerMemory.DefineAddressBook(addrDB,false,contact);
            AdlerDom.assign("Memory.AddressBook"); // refresh the data
        } else
        {
            ;
        }
        
    } catch (e) {adler.log("crapped out contactJSON , line - 3403 ",e);}
}

AdlerMemory = {"stores":["Memory.Images","Memory.AddressBook","Memory.GPS"],"pageStores":[]};
AdlerMemory.defineMemoryStores = function(db)
{
    var storeName = db.def.storeName;
    if (storeName === "Memory.AddressBook") AdlerMemory.DefineAddressBook(db,true);
    else if (storeName === "Memory.Images")
    {
        db.def.keyPath = "imageId";
        db.def.columns = ["imageId","image"];
        db.def.primaryKey = "imageId";
    } else if (storeName === "Memory.GPS")
    {
        db.def.keyPath = "locationId";
        db.def.columns = ["locationId","timestamp","latitude","longitude","altitude","accuracy","heading","speed"];
        db.def.primaryKey = "locationId"; // this is longitude+latitude
    }
    // more to be added later.
}

AdlerMemory.DefineAddressBook = function(db,define,data)
{
    if (define)
    {
        db.def.keyPath = "displayName";
        db.def.columns = ["displayName","firstName","middleName","lastName","mobilePhone","workPhone","homePhone","homeAddress","workAddress"];
        db.def.primaryKey = "displayName";
    }
    if (!data) return;
    
    var record = {"displayName":data.displayName,"firstName":data.givenName,"middleName":"","lastName":data.familyName,"mobilePhone":null,"workPhone":null,"homePhone":null,"homeAddress":null,"workAddress":null};
    
    if (!record.firstName && record.displayName) {
        var disp = record.displayName.split(" "); var dsLen = disp.length;
        if (dsLen > 0) record.firstName = disp[0];
        if (dsLen > 1) record.lastName = disp[disp.length -1];
    }
    if (data.phoneNumbers)
    {
        var phs = data.phoneNumbers;var  phLen = phs.length;
        for (var p = 0; p < phLen;p++ )
        {
            var ph = phs[p];
            if (ph.type === "Home") record.homePhone = ph.number;
            else if (ph.type === "Work") record.workPhone = ph.number;
            else if (ph.type === "Mobile") record.mobilePhone = ph.number;
        }
    }
    if (data.addresses)
    {
        var adrs = data.phoneNumbers;var  adLen = adrs.length;
        for (var a = 0; a < adLen;a++ )
        {
            var adr = adrs[a];
            if (adr.type === "Home") record.homeAddress = adr.formattedAddress;
            else if (adr.type === "Work") record.homeAddress = adr.formattedAddress;
        }
    }
    /*
     contact json {"contact":{"displayName": "Barack H Obama",
     "addresses": [{"type": "Home","formattedAddress": "1500 Pensylvania Avenue, Washington DC","street": "1500 Pensylvania Avenue, Washington DC"}],
     "phoneNumbers": [{"type": "Mobile","number": "301-800-5632"}],
     "emails": [{"type": "Home","address": "barack_obama@whitehouse.gov"}]}}
     */
    db.push(record);
}

// function below is called from android when camera opens to save state
AdlerMemory.saveForm2Memory = function()
{
    var storeState = {};
    if (!formObject) return;
    for (store in formObject)
    {
        var record = {};
        
        var dObjArray = formObject[store];
        if (dObjArray)
        {
            var dLen = dObjArray.length;
            // all the object values
            for (var d = 0; d < dLen;d++)
            {
                var dOId = dObjArray[d].id; var daSeq = dObjArray[d].seq;
                var dObj = document.getElementById(dOId); var dact = actionArray[daSeq];
                if (dact.nodeName === "select")
                    record[dact.column]= dObj.options[dObj.selectedIndex][dact.from];
                else
                {
                    if (dact.fromType) {record[dact.column] = dObj.getAttribute(dact.from);dObj.setAttribute(dact.from,"");}
                    else {record[dact.column] = dObj[dact.from];dObj[dact.from] = "";}//empty it
                }
                
            }
        }
        storeState[store] = {"record":record};
    }
    var currentPage = STATEDB.getCurrentPage();
    var storeString = JSON.stringify(storeState);
    AdlerStorage.setItem("ADLER-SESSION-"+currentPage,storeString);
    //adler.log(" saved state is - "+storeString);
}

AdlerMemory.restoreFormFromMemory = function()
{
    var currentPage = STATEDB.getCurrentPage();
    //adler.log(" Entering restoreFormFromMemory - "+currentPage);
    var storeState = AdlerStorage.getItem("ADLER-SESSION-"+currentPage);
    if (storeState)
        storeState = JSON.parse(storeState);
    else return;
    if (!formObject) return;
    for (store in formObject)
    {
        var record = storeState[store].record ;
        
        var dObjArray = formObject[store];
        if (dObjArray)
        {
            var dLen = dObjArray.length;
            // all the object values
            for (var d = 0; d < dLen;d++)
            {
                var dOId = dObjArray[d].id; var daSeq = dObjArray[d].seq;
                var dObj = document.getElementById(dOId); var dact = actionArray[daSeq];
                if (dact.nodeName === "select")
                {
                    for (var s = dObj.options.length; s > -1;s--)
                    {
                        if (dObj.options[dObj.selectedIndex][dact.from] === record[dact.column])
                        {
                            dObj.selectedIndex = s; break;
                        }
                    }
                }
                else
                {
                    if (dact.fromType || dact.fromCustomAttr) { dObj.setAttribute(dact.from,record[dact.column]);}
                    else { dObj[dact.from] = record[dact.column];}
                }
                
            }
        }
    }
    AdlerStorage.setItem("ADLER-SESSION-"+currentPage,""); // wipe it out.
    //adler.log("Exiting restored from memory - "+currentPage);
}


function MD5cycle(x, k) {
    var a = x[0], b = x[1], c = x[2], d = x[3];
    
    a = FF(a, b, c, d, k[0], 7, -680876936);
    d = FF(d, a, b, c, k[1], 12, -389564586);
    c = FF(c, d, a, b, k[2], 17,  606105819);
    b = FF(b, c, d, a, k[3], 22, -1044525330);
    a = FF(a, b, c, d, k[4], 7, -176418897);
    d = FF(d, a, b, c, k[5], 12,  1200080426);
    c = FF(c, d, a, b, k[6], 17, -1473231341);
    b = FF(b, c, d, a, k[7], 22, -45705983);
    a = FF(a, b, c, d, k[8], 7,  1770035416);
    d = FF(d, a, b, c, k[9], 12, -1958414417);
    c = FF(c, d, a, b, k[10], 17, -42063);
    b = FF(b, c, d, a, k[11], 22, -1990404162);
    a = FF(a, b, c, d, k[12], 7,  1804603682);
    d = FF(d, a, b, c, k[13], 12, -40341101);
    c = FF(c, d, a, b, k[14], 17, -1502002290);
    b = FF(b, c, d, a, k[15], 22,  1236535329);
    
    a = GG(a, b, c, d, k[1], 5, -165796510);
    d = GG(d, a, b, c, k[6], 9, -1069501632);
    c = GG(c, d, a, b, k[11], 14,  643717713);
    b = GG(b, c, d, a, k[0], 20, -373897302);
    a = GG(a, b, c, d, k[5], 5, -701558691);
    d = GG(d, a, b, c, k[10], 9,  38016083);
    c = GG(c, d, a, b, k[15], 14, -660478335);
    b = GG(b, c, d, a, k[4], 20, -405537848);
    a = GG(a, b, c, d, k[9], 5,  568446438);
    d = GG(d, a, b, c, k[14], 9, -1019803690);
    c = GG(c, d, a, b, k[3], 14, -187363961);
    b = GG(b, c, d, a, k[8], 20,  1163531501);
    a = GG(a, b, c, d, k[13], 5, -1444681467);
    d = GG(d, a, b, c, k[2], 9, -51403784);
    c = GG(c, d, a, b, k[7], 14,  1735328473);
    b = GG(b, c, d, a, k[12], 20, -1926607734);
    
    a = HH(a, b, c, d, k[5], 4, -378558);
    d = HH(d, a, b, c, k[8], 11, -2022574463);
    c = HH(c, d, a, b, k[11], 16,  1839030562);
    b = HH(b, c, d, a, k[14], 23, -35309556);
    a = HH(a, b, c, d, k[1], 4, -1530992060);
    d = HH(d, a, b, c, k[4], 11,  1272893353);
    c = HH(c, d, a, b, k[7], 16, -155497632);
    b = HH(b, c, d, a, k[10], 23, -1094730640);
    a = HH(a, b, c, d, k[13], 4,  681279174);
    d = HH(d, a, b, c, k[0], 11, -358537222);
    c = HH(c, d, a, b, k[3], 16, -722521979);
    b = HH(b, c, d, a, k[6], 23,  76029189);
    a = HH(a, b, c, d, k[9], 4, -640364487);
    d = HH(d, a, b, c, k[12], 11, -421815835);
    c = HH(c, d, a, b, k[15], 16,  530742520);
    b = HH(b, c, d, a, k[2], 23, -995338651);
    
    a = II(a, b, c, d, k[0], 6, -198630844);
    d = II(d, a, b, c, k[7], 10,  1126891415);
    c = II(c, d, a, b, k[14], 15, -1416354905);
    b = II(b, c, d, a, k[5], 21, -57434055);
    a = II(a, b, c, d, k[12], 6,  1700485571);
    d = II(d, a, b, c, k[3], 10, -1894986606);
    c = II(c, d, a, b, k[10], 15, -1051523);
    b = II(b, c, d, a, k[1], 21, -2054922799);
    a = II(a, b, c, d, k[8], 6,  1873313359);
    d = II(d, a, b, c, k[15], 10, -30611744);
    c = II(c, d, a, b, k[6], 15, -1560198380);
    b = II(b, c, d, a, k[13], 21,  1309151649);
    a = II(a, b, c, d, k[4], 6, -145523070);
    d = II(d, a, b, c, k[11], 10, -1120210379);
    c = II(c, d, a, b, k[2], 15,  718787259);
    b = II(b, c, d, a, k[9], 21, -343485551);
    
    x[0] = ADD32(a, x[0]);
    x[1] = ADD32(b, x[1]);
    x[2] = ADD32(c, x[2]);
    x[3] = ADD32(d, x[3]);
    
}

function CMN(q, a, b, x, s, t) {
    a = ADD32(ADD32(a, q), ADD32(x, t));
    return ADD32((a << s) | (a >>> (32 - s)), b);
}

function FF(a, b, c, d, x, s, t) {
    return CMN((b & c) | ((~b) & d), a, b, x, s, t);
}

function GG(a, b, c, d, x, s, t) {
    return CMN((b & d) | (c & (~d)), a, b, x, s, t);
}

function HH(a, b, c, d, x, s, t) {
    return CMN(b ^ c ^ d, a, b, x, s, t);
}

function II(a, b, c, d, x, s, t) {
    return CMN(c ^ (b | (~d)), a, b, x, s, t);
}

function MD51(s) {
    txt = '';
    var n = s.length,
    state = [1732584193, -271733879, -1732584194, 271733878], i;
    for (i=64; i<=s.length; i+=64) {
        MD5cycle(state, MD5blk(s.substring(i-64, i)));
    }
    s = s.substring(i-64);
    var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
    for (i=0; i<s.length; i++)
        tail[i>>2] |= s.charCodeAt(i) << ((i%4) << 3);
    tail[i>>2] |= 0x80 << ((i%4) << 3);
    if (i > 55) {
        MD5cycle(state, tail);
        for (i=0; i<16; i++) tail[i] = 0;
    }
    tail[14] = n*8;
    MD5cycle(state, tail);
    return state;
}

/* there needs to be support for Unicode here,
 * unless we pretend that we can redefine the MD-5
 * algorithm for multi-byte characters (perhaps
 * by adding every four 16-bit characters and
 * shortening the sum to 32 bits). Otherwise
 * I suggest performing MD-5 as if every character
 * was two bytes--e.g., 0040 0025 = @%--but then
 * how will an ordinary MD-5 sum be matched?
 * There is no way to standardize text to something
 * like UTF-8 before transformation; speed cost is
 * utterly prohibitive. The JavaScript standard
 * itself needs to look at this: it should start
 * providing access to strings as preformed UTF-8
 * 8-bit unsigned value arrays.
 */
function MD5blk(s) { /* I figured global was faster.   */
    var MD5blks = [], i; /* Andy King said do it this way. */
    for (i=0; i<64; i+=4) {
        MD5blks[i>>2] = s.charCodeAt(i)
        + (s.charCodeAt(i+1) << 8)
        + (s.charCodeAt(i+2) << 16)
        + (s.charCodeAt(i+3) << 24);
    }
    return MD5blks;
}

var HEX_CHR = '0123456789abcdef'.split('');

function RHEX(n)
{
    var s='', j=0;
    for(; j<4; j++)
        s += HEX_CHR[(n >> (j * 8 + 4)) & 0x0F]
        + HEX_CHR[(n >> (j * 8)) & 0x0F];
    return s;
}

function HEX(x) {
    for (var i=0; i<x.length; i++)
        x[i] = RHEX(x[i]);
    return x.join('');
}

function MD5(s) {
    return HEX(MD51(s));
}

/* this function is much faster,
 so if possible we use it. Some IEs
 are the only ones I know of that
 need the idiotic second function,
 generated by an if clause.  */

function ADD32(a, b) {
    return (a + b) & 0xFFFFFFFF;
}

if (MD5('hello') != '5d41402abc4b2a76b9719d911017c592') {
    function ADD32(x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF),
        msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }
}
