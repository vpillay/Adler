                    var currentDiv = "Repeat";
                    var idObjects = null;
                    var originalIdObjString = "";
                    var currentAction = null;
                    var lastTable = "";


var objectIds = {};
var oId = "";
var existingWidget = false;
function addWidget()
{
    var s  = textarea.selectionStart;
	var e = textarea.selectionEnd;
    if (s === e)
    {
        alert("please highlight id attribute value, then pick widget");
        return;
    }
    var val = textarea.value;
    oId = val.substring(s,e);
    var attribute = val.substring((s-4),(s-1)).toLowerCase();
    if (attribute !== "id=") {
        alert("please highlight id attribute value, then pick widget");
        return;
    }
    //console.log(" object "+oId);
    var widget = document.getElementById("widget_list");
    widget.style.display = "block";
    widget.style.left = "380px";
    
    widget.style.top = "42px";
    
    //var top = (lastMouseClickPos.y - 80 - document.body.scrollTop);
    
    //widget.style.top = top +"px";
    textarea.selectionStart = s;textarea.selectionEnd = e;
    if (!idObjects) idObjects = {};
    if (idObjects[oId])
    {
        currentAction = idObjects[oId].actions[0];
        var widgetList = document.getElementById("widgetList");
        for (var i = widgetList.options.length - 1;i > -1;i--)
        {
            if (widgetList.options[i].value === currentAction.instruction)
            {
                widgetList.selectedIndex = i;
                showWidget();
                break;
            }
        }
    }
}

function saveWidget()
{
    var obj = event.target;
}


                    function showWidget()
                    {
                        /*
                        var widgetObj = document.getElementById("widgetList");
                        var widget = widgetObj.options[widgetObj.selectedIndex].text;
                        widget = widget.replace(" ","-");
                        var prevDiv = document.getElementById(currentDiv);
                        prevDiv.style.display = "none";
                        currentDiv = widget;
                        var div = document.getElementById(widget);
                        div.style.display = "block";
                        */
                        //var func = document.getElementById(currentDiv);
                        var widgetObj = document.getElementById("widgetList");
                        var widget = "Repeat";
                        widget = widgetObj.options[widgetObj.selectedIndex].value;
                        /*
                        if (widgetObj.selectedIndex === 0)
                        {
                            //func.style.display="none"; currentDiv = "";
                            return;
                        }
                        else
                        {
                            //func.style.display="block";
                            widget = widgetObj.options[widgetObj.selectedIndex].value;
                        }
                        */
                        var prevDiv = document.getElementById(currentDiv);
                        if (prevDiv)
                            {prevDiv.style.display = "none";
                            currentDiv = widget;}
                        var div = document.getElementById(currentDiv);
                        div.style.display = "block";
                        
                        var idListObj = document.getElementById("idListObj");
                        for (var i = idListObj.options.length - 1; i > -1;i--)
                        {
                            var id = idListObj.options[i].text;
                            if (id === oId)
                            {
                                idListObj.selectedIndex = i;
                                break;
                            }
                        }
                        
                        var widget = document.getElementById("widget_list");
                        widget.style.left = "380px";

                        widget.style.top = "42px";
                        
                        initWidgetList(div,widget,widgetObj);
                        
                    }
                function showBlock() {
                    var x = document.getElementById("list").value;
                    var y=document.getElementById("goto");
                    var label = y.getElementsByTagName("SPAN")[0];
                    var inp = y.getElementsByTagName("INPUT")[0];
                    label.parentElement.style.display = "block";
                    if (x=="PageNavigate"){
                        label.innerHTML = "Go To Page: ";
                        inp.setAttribute("name","page");
                    }
                    else
                    {
                        label.innerHTML = "Table Name: ";
                        inp.setAttribute("name","storeName");
                    }
                }
                
                function hide_widget(hideType)
                {
                    var div = document.getElementById("widget_list");
                    div.style.display="none";
                    
                    var widgetObj = document.getElementById("widgetList");
                    widgetObj.selectedIndex = 0;
                    
                    var idListObj = document.getElementById("idListObj");
                    idListObj.selectedIndex = 0;
                    
                    if (hideType < 1) {
                        (document.getElementById(currentDiv)).style.display = "none";
                         (document.getElementById("widgetSeq")).innerHTML = 1;
                        currentAction = null;
                        existingWidget = false;
                    return;}
                    
                    var idObject = idObjects[oId];
                    var action = currentAction;
                    if (hideType === 2)
                    {
                        if (!idObject) return;
                        var actions = idObject["actions"];
                        // remove the current action from idObject
                        for (var i = actions.length -1;i > -1;i--)
                        {
                            action = actions[i];
                            if (action === currentAction)
                            {
                                actions.splice(i,1);
                                break;
                            }
                        }
                        alert("widget removed ");
                        if (actions.length === 0) delete idObjects[oId];
                        (document.getElementById(currentDiv)).style.display = "none";
                        (document.getElementById("widgetSeq")).innerHTML = 1;
                        existingWidget = false;
                        return;
                    }
                    //
                    var widgetSeqObj = document.getElementById("widgetSeq");
                    widgetSeq = parseInt(widgetSeqObj.innerHTML.trim());
                    if (!idObject)
                        {
                            addAdlerRelatedCode();
                            if (widgetSeq > 1) widgetSeqObj.innerHTML = 1;
                            if (currentAction == null) {currentAction = {};action = currentAction;}
                            idObject = {"actions":[currentAction]}; idObjects[oId] = idObject;
                        }
                        var actions = idObject.actions;
                        if (actions.length < widgetSeq)  actions.push(currentAction);
                        else if (existingWidget) {
                            currentAction = {"instruction":currentDiv};action = currentAction;
                            actions[widgetSeq - 1 ] = action; // replace it
                        } ;
                    
                    var div = document.getElementById(currentDiv);
                    var fields = document.getElementsByClassName(currentDiv);
                    var fLen = fields.length;
                    
                    for (var i = 0; i < fLen;i++)
                    {
                        var field = fields[i];
                        var fId = field.getAttribute("name");
                        if (field.nodeName === "SELECT")
                        {
                            action[fId] = field.options[field.selectedIndex].value
                        } else
                        {
                            var val = field.value;
                            if (val)
                            {
                                if (fId === "storeName") updateTableList(val);
                                action[fId] = val;
                            } else
                            {
                                if (action[fId])
                                {
                                    delete action[fId];
                                }
                            }
                            
                        }
                    }
                    
                    
                    (document.getElementById(currentDiv)).style.display = "none";
                    (document.getElementById("widgetSeq")).innerHTML = 1;
                    currentAction = null;
                    existingWidget = false;
                }
                
                function initWidgetList(div,container,widgetObj)
                {
                    var actionExist = false;
                    if (!idObjects) idObjects = {};
                    
                    var idObject =idObjects[oId];
                    if (!idObject) {
                        currentAction = {"instruction":currentDiv};
                    }
                    else
                    {
                        var widgetSeqObj = document.getElementById("widgetSeq");
                        widgetSeq = parseInt(widgetSeqObj.innerHTML.trim());
                        if (idObject.actions.length >= widgetSeq)
                        {
                          currentAction = idObject.actions[widgetSeq-1]; actionExist = true;
                            
                        } else
                        {
                            currentAction = {"instruction":currentDiv};
                        }

                    }
                    
                    if (currentAction.instruction !== currentDiv && !existingWidget)
                    {
                        // flip it
                        var prevDiv = document.getElementById(currentDiv);
                        if (prevDiv)
                        {prevDiv.style.display = "none";
                            currentDiv = currentAction.instruction;}
                        var div = document.getElementById(currentDiv);
                        div.style.display = "block";
                        var widgetList = document.getElementById("widgetList");
                        for (var i = widgetList.options.length - 1;i > -1;i--)
                        {
                            if (widgetList.options[i].value === currentAction.instruction)
                            {
                                widgetList.selectedIndex = i;
                                break;
                            }
                        }
                        
                    }
                    var fields = document.getElementsByClassName(currentDiv);
                    var fLen = fields.length;
                    for (var i = 0; i < fLen;i++)
                    {
                        var field = fields[i];
                        var fieldName = field.getAttribute("name");
                        var val = currentAction[fieldName];
                        if (!val)
                        {
                            if (fieldName === "storeName") val = lastTable;
                            else val = "";
                        }
                        
                        if (field.nodeName === "SELECT")
                        {
                            field.selectedIndex = 0;
                            if (val)
                            {
                                for (var j = field.options.length -1;j > -1;j--)
                                {
                                    if (field.options[j].value === val)
                                    {
                                        field.selectedIndex = j;
                                        break;
                                    }
                                }
                                
                                if (fieldName === "storeName") showBlock()
                            }
                        } else
                        {
                            
                            field.value = val;
                        }
                    }
                    
                    if (actionExist) {existingWidget = true;}
                    
                }
                
                function increaseSeq()
                {
                    var widgetSeqObj = document.getElementById("widgetSeq");
                    var widgetSeq = widgetSeqObj.innerHTML;
                    widgetSeq = parseInt(widgetSeq.trim());
                    widgetSeq++;
                    widgetSeqObj.innerHTML = widgetSeq;

                    var widgetObj = document.getElementById("widgetList");
                    widgetObj.selectedIndex = 1;
                    showWidget();
                }
                
                function openWidget()
                {
                    var obj = event.target;
                    oId = obj.options[obj.selectedIndex].text; // this will be used later
                    
                    //
                    var widget = document.getElementById("widget_list");
                    widget.style.display = "block";

                    if (!idObjects) idObjects = {};
                    if (idObjects[oId])
                    {
                        currentAction = idObjects[oId].actions[0];
                        var widgetList = document.getElementById("widgetList");
                        for (var i = widgetList.options.length - 1;i > -1;i--)
                        {
                            if (widgetList.options[i].value === currentAction.instruction)
                            {
                                widgetList.selectedIndex = i;
                                showWidget();
                                break;
                            }
                        }
                    }
                    //
                    
                }
                
                function updateTableList(name)
                {
                    lastTable = name;
                    var tables =  document.getElementsByName("storeName");
                    for (var i = tables.length - 1;i > -1;i--)
                    {
                        var table = tables[i];
                        table.value = lastTable;
                    }
                }

                    var repeatObjects = {};
                    var assignObjects = {};
                    var eventObjects = {"onclick":[]};
                    var formObjects = {};
                    var dataStores = {};
                    function makeIndexes()
                    {
                         repeatObjects = {};
                         assignObjects = {};
                         eventObjects = {"onclick":[]};
                         formObjects = {};
                         dataStores = {};
                        var nestedRepeats= false;
                        for (var id in idObjects)
                        {
                            var actions = idObjects[id].actions;
                            var aLen = actions.length;
                            for (var i = 0; i < aLen;i++)
                            {
                                var inx = {"id":id,"seq":i};
                                var action = actions[i];
                                var store = action.storeName;
                                if (store)
                                    dataStores[store] = store;
                                var storeObj = [];
                                if (action.instruction === "Repeat")
                                {
                                    if (!repeatObjects[store]) repeatObjects[store] = [];
                                    storeObj =  repeatObjects[store];
                                    inx.type = action.type;
                                    if (inx.type === "repeatNested") nestedRepeats = true;

                                    storeObj.push(inx);
                                    eventObjects.onclick.push({"id":inx.id,"seq":inx.seq});
                                }
                                else if (action.instruction === "Assign")
                                {
                                    
                                    if (action.assignType === "multi")
                                    {
                                        if (!repeatObjects[store]) repeatObjects[store] = [];
                                        storeObj =  repeatObjects[store];
                                        inx.type = action.assignType;
                                    } else
                                    {
                                        if (!assignObjects[store]) assignObjects[store] = [];
                                        storeObj =  assignObjects[store];
                                    }
                                    storeObj.push(inx);
                                    
                                }
                                else if (action.instruction === "Click")
                                eventObjects.onclick.push(inx);
                                else if (action.instruction === "Source")
                                {
                                    if (!formObjects[store]) formObjects[store] = [];
                                    storeObj =  formObjects[store];
                                    storeObj.push(inx);
                                }
                            }
                        }
                        
                        if (nestedRepeats)
                        {
                            var idFindList = document.getElementById("idFindList");
                            var options = idFindList.options;
                            var idPointer = {};
                            
                            for (var tbl in repeatObjects)
                            {
                                var tbls = repeatObjects[tbl]; var tLen = tbls.length;
                                for (var i = 0; i < tLen;i++)
                                {
                                    var inx = tbls[i];
                                   if (inx.type === "repeat" || inx.type === "repeatNested") idPointer[inx.id]= inx;
                                }

                            }
                            
                            for (var i = options.length -1;i > -1;i--)
                            {
                                var idd = options[i].text;
                                var val = options[i].value;
                                if (idPointer[idd])
                                        idPointer[idd].pos = parseInt(val);
                            }
                            
                            for (var idd in idPointer)
                            {
                                var pointer = idPointer[idd];
                                if (pointer.type === "repeatNested")
                                {
                                    var nestedPos = pointer.pos;
                                    // go find its parent
                                    var parentPointer = {pos:0,id:""}; var found = false;
                                    for (var pId in idPointer)
                                    {
                                        var pos = idPointer[pId].pos;
                                        if (pos < nestedPos && parentPointer.pos < pos )
                                        {
                                            parentPointer.pos = pos; parentPointer.id = pId;
                                            parentPointer.seq = idPointer[pId].seq;
                                            found = true;
                                        }
                                    }
                                    if (found)
                                    {
                                        idPointer[idd].nestedParent = {"id":parentPointer.id,"seq":parentPointer.seq};
                                    } else
                                    {
                                        console.log("no parent exist");
                                    }
                                }
                            }
                        }
                        
                        
                        // action string
                        var dataStoresString = "\r\n\t\t dataStores = {"; var added = false;
                        for (var st in dataStores)
                        { added = true;
                            dataStoresString += "\""+st+"\":AdlerStorage.findStorage(\""+st+"\"),";
                        }
                        if (added) {
                            var ln = dataStoresString.length - 1;
                            dataStoresString = dataStoresString.substring(0,ln)+"};";
                        } else dataStoresString + "};"
                        
                        var qualifier = localStorage["Adler-User"];
                        if (!originalIdObjString) originalIdObjString =
                            "function adlerInit() {"+
                            "\r\n\t\t    try {"+
                            "\r\n\t\t        ADLER_SCHEMA = \""+qualifier+"\" ; // replace qualifier "+
                            "\r\n\t\t           // only provider those variables that needs override in dbConfig -- schema is a must "+
                            "\r\n\t\t           // var dbConfig = {\"schema\":'dbschema',\"dbUrl\":\"\",\"syncUrl\":\"\",\"pingUrl\":\"\",\"queryUrl\":\"\"};"+
                            "\r\n\t\t           //AdlerStorage.firstTimeSetup('"+qualifier+"',sync2Server,syncInterval,dbConfig); // needed only for the first page" +
                            "\r\n\t\t        STATEDB.init();"+
                            "\r\n\t\t        STATEDB.put(\"pages\",[{\"pageName\":\"samplePage1\",\"extension\":\"html\"}],\"Object\");"+
                            "\r\n\t\t        AdlerDom.dataBinder();"+
                            "\r\n\t\t        //init(); // user defined function if any "+
                            "\r\n\t\t    } catch (e) { adler.log(\" Error during Data Binding  \",e);} "+
                            "\r\n\t\t }";
                        
                        var actionString = "\r\n\t\t idObject = "+JSON.stringify(idObjects)+";" +
                        "\r\n\t\t repeatObject = "+JSON.stringify(repeatObjects) +";" +
                        "\r\n\t\t assignObject = "+JSON.stringify(assignObjects) +";" +
                        "\r\n\t\t eventObject = "+JSON.stringify(eventObjects) +";"  +
                        "\r\n\t\t formObject = "+JSON.stringify(formObjects) +";"  +
                        dataStoresString  +
                        "\r\n\t\t " + originalIdObjString;
                        return actionString;
                    }
