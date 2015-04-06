document.onmousedown = function(e) {
    
    return eventStart(e);
};

document.onmousemove = function(e) {
    eventContinue(e);
};

document.onmouseup = function(e) {
    return eventStop(e);
};

document.addEventListener("dragenter", dragenterF, false);
document.addEventListener("dragover",dragoverF,false);
document.addEventListener("drop", dropF, false);

var counter = 0;var targetElement = null;var prevStoreName = null;
var actionArray = null;windowSize = null;var dblclick = false;var jsObject = {};var action = null;
var virtual = "beta";var Adler = {"flow":null,"page":null}; var widgetSelectorDiv = null;var treeViewDiv = null;var showDiv = null;
var ADLER_PERMISSIONS = null; var customHelpDiv = null;
var helpList = [
                "Help coming soon..",
                "<div class='helpH1'>DataStore2HTML</div> Use this widget  to populate HTML Element with data from external sources such as data stores"+
                "<hr><div class='helpH1'>Html2DataStore</div> Use this widget to extract value or data out of HTML Element and later use it for Insert/Update/Delete or any other purpose."+
                "<hr><div class='helpH1'>Click</div> Use this widget when \"on click\" you want to <ul><li>Submit(Insert)/Update/Delete/Reset Form data</li><li>Retrieve Data</li><li>Open Camera on Phone</li><li>Open AddressBook on Phone</li></ul>"
                ]
var dynamicJson =
[
 /*
  {
  "widget":"Phone Utils","apply":"underConn","steps":
  [
  {"label":"Pick Utility Type","id":"utilSel","inputType":"select","fill":["camera","microphone","speaker"],"event":{"onchange":"underConn"}},
  ],
  "moreOptions":[]
  },	*/
 {
 "widget":"Copy","apply":"copyApply","steps":
 [
  {"label":"From Datastore","id":"storeSel","inputType":"select","fill":"fillStore","event":{"onchange":"pickStore"}},
  {"label":"From Columns","id":"columnSel","inputType":"select","fill":"fillColumn"},
  {"label":"To Memory","id":"toStoreSel","inputType":"select","fill":["Memory.Images","Memory.AddressBook"],"event":{"onchange":"pickToStore"}}
  ],
 "moreOptions":[]
 },	/*
     {
     "widget":"Communication","apply":"CommunicationApply","steps":
     [
     {"label":"Pick Communication Type","id":"commSel","inputType":"select","fill":["Phone Dialer","SMS","Email"]},
     {"label":"Pick Datastore","id":"storeSel","inputType":"select","fill":"fillStore","event":{"onchange":"pickStore"}},
     {"label":"Pick Columns","id":"columnSel","inputType":"select","fill":"fillColumn"}
     ],
     "moreOptions":[]
     },
     {
     "widget":"Navigation","apply":"underConn","steps":
     [
     {"label":"Pick Navigation Type","id":"navSel","inputType":"select","fill":["direction"],"event":{"onchange":"underConn"}},
     {"label":"Pick Datastore","id":"storeSel","inputType":"select","fill":"fillStore","event":{"onchange":"pickStore"}},
     {"label":"Pick Columns","id":"columnSel","inputType":"select","fill":"fillColumn"}
     ],
     "moreOptions":[]
     },
     {
     "widget":"Page Navigate","apply":"PageNavigationApply","steps":
     [
     {"label":"Pick Navigation Type","id":"pageNavSel","inputType":"select","fill":["onclick","onswipe"]},
     {"label":"Pick- To Page","id":"pageSel","inputType":"select","fill":"fillPages"}
     ],
     "moreOptions":[]
     }, */
 {
 "widget":"Click","instruction":"Click","apply":"ClickApply","init":"pickClickAction","steps":
 [
  {"label":"Pick Click Action","id":"clickSel","inputType":"select","fill":["PageNavigate","Submit","Delete","Update","Retrieve","Reset","Custom","Take Picture","Open Address Book"],"event":{"onchange":"pickClickAction"},"helpNo":0},
  {"label":"Pick Datastore","id":"storeSel","inputType":"select","fill":"fillStore","event":{"onchange":"pickStore"},"helpNo":0},
  {"label":"Pick- To Page","id":"pageSel","inputType":"select","fill":"fillPages","helpNo":0},
  {"label":"Before Function","id":"beforeFunction","inputType":"input","placeHolder":"function Name","helpNo":0},
  {"label":"After Function","id":"afterFunction","inputType":"input","placeHolder":"function Name","helpNo":0}
  ],
 "moreOptions":[]
 },
 {
 "widget":"FormElement","instruction":"Source","apply":"formApply","steps":
 [
  {"label":"is Optional","id":"optionSel","inputType":"select","fill":["Optional","Mandatory"],"helpNo":0},
  {"label":"Edit Checks","id":"validSel","inputType":"select","fill":["none","Email","Phone","Password"],"helpNo":0},
  {"label":"Pick Datastore","id":"storeSel","inputType":"select","fill":"fillStore","event":{"onchange":"pickStore"},"helpNo":0},
  {"label":"Pick Column","id":"columnSel","inputType":"select","fill":"fillColumn","helpNo":0},
  {"label":"Before Function","id":"beforeFunction","inputType":"input","placeHolder":"function Name","helpNo":0},
  {"label":"After Function","id":"afterFunction","inputType":"input","placeHolder":"function Name","helpNo":0}
  ],
 "moreOptions":[]
 },
 {
 "widget":"Fill","instruction":"Assign","apply":"fillApply","init":"pickTableAction","steps":
 [
  {"label":"Pick Datastore","id":"storeSel","inputType":"select","fill":"fillStore","event":{"onchange":"pickStore"},"helpNo":0},
  {"label":"Pick Column","id":"columnSel","inputType":"select","fill":"fillColumn","helpNo":0},
  {"label":"Fill Type","id":"fillTypeSel","inputType":"select","fill":["Fill inside a repeat","Fill from 1 saved Record"],"helpNo":0},
  {"label":"Before Function","id":"beforeFunction","inputType":"input","placeHolder":"function Name","helpNo":0},
  {"label":"After Function","id":"afterFunction","inputType":"input","placeHolder":"function Name","helpNo":0}
  ],
 "moreOptions":[]
 },
 {
 "widget":"Repeat","instruction":"Repeat","apply":"repeatApply","init":"pickTableAction","steps":
 [
  {"label":"Pick Datastore","id":"storeSel","inputType":"select","fill":"fillStore","event":{"onchange":"pickStore"},"helpNo":0},
  {"label":"Before Function","id":"beforeFunction","inputType":"input","placeHolder":"function Name","helpNo":0},
  {"label":"After Each Row","id":"afterEach","inputType":"input","placeHolder":"function Name","helpNo":0},
  {"label":"After Function","id":"afterFunction","inputType":"input","placeHolder":"function Name","helpNo":0}
  ],
 "moreOptions":[]
 }
 
 ];

function addColumnList(storeName,columnSel)
{
    if (storeName === "IGNORE") return columnSel;
    if (!columnSel) return;
    var html = "<option>--column--</option>";
    if (storeName.indexOf("Memory") > -1)
    {
        if (storeName === "Memory.Images")
            html += "<option>imageId</option><option>image</option>";
        else if (storeName === "Memory.AddressBook")
        {
            html += "<option>displayName</option><option>firstName</option><option>lastName</option><option>mobilePhone</option><option>workPhone</option><option>homePhone</option>";
            html += "<option>homeAddress</option><option>workAddress</option>";
        } else if (storeName === "Memory.GPS")
        {
            html += "<option>locationId</option><option>timestamp</option><option>latitude</option><option>longitude</option><option>altitude</option><option>accuracy</option><option>heading</option>";
            html += "<option>speed</option>";
        }
    } else
    {
        var db = AdlerStorage.findStorage(storeName);
        var columns = db.def.columns; var columnLength = columns.length;
        
        for (var i = 0; i < columnLength;i++)
        {
            html += "<option>"+columns[i]+"</option>";
        }
    }
    
    
    columnSel.innerHTML = html;
    return columnSel;
}

function adlerSave()
{
    var pathArray = window.location.pathname.split("/");
    
    pathArray.splice(1,1); // remove "Customization
    
    var fileName = pathArray[pathArray.length - 1];
    pathArray.pop();
    var folder = pathArray.join("/") +"/";
    folder = decodeURI(folder);
        var flArray = fileName.split(".");
    var pageName = flArray[0];
    
    var fileData = rebuildPage(fileName,pageName);
    var loading = document.getElementById("loading");
    
    
    loading.style.visibility = "visible";
    
    var json = {fileData:fileData,fileName:fileName,fileType:"text/html",folder:folder};
    jsonString = JSON.stringify(json);
    var sd = AdlerStorage.syncData;AdlerStorage.syncData = true;
        AdlerStorage.jsonPost(fileName,jsonString,"/upload/diff",false);
    
    var actionFile = pageName+"_action.js";
    var actionData = makeIndexes();
    json = {fileData:actionData,fileName:actionFile,fileType:"text/javascript",folder:folder+"js/"};
    jsonString = JSON.stringify(json);
        AdlerStorage.jsonPost(flArray[0],jsonString,"/upload/diff",false);
    json = {fileNames:["/js/adlerStorage.js"]}; // give all file names, separated by "," commas
    AdlerStorage.jsonPost("dataTable",JSON.stringify(json),"/copy/1",false);
    AdlerStorage.syncData = sd; // reset it back
    loading.style.visibility = "hidden";
    alert("page Saved");
    
}

function rebuildPage(fileName,pageName)
{
    
    // clone head
    var hd = document.head.cloneNode(true);
    // remove all 'adlerBase
    var adrBase = hd.getElementsByTagName("script");
    for (var i = adrBase.length -1;i>-1;i--)
    {
        var scr = adrBase[i];
        if (scr.getAttribute("name") === "adlerBase")
            trashDom(scr);
    }
    var adrBase = hd.getElementsByTagName("link");
    for (var i = adrBase.length -1;i>-1;i--)
    {
        var lnk = adrBase[i];
        if (lnk.getAttribute("name") === "adlerBase")
            trashDom(lnk);
    }
    
    /*
     var script = document.createElement("script");
     script.setAttribute("name","adlerBase"); // so that it gets removed in future during re-edit
     script.innerHTML = generateScript();
     hd.appendChild(script);
     */
    
    var customScript = getCustomFunctions();
    if (customScript)
    {
        script = document.createElement("script");
        script.setAttribute("name","adlerBase"); // so that it gets removed in future during re-edit
        script.setAttribute("id","customFunctions")
        script.innerHTML = customScript;
        hd.appendChild(script);
    }
    
    script = document.createElement("script");
    script.setAttribute("name","adlerBase"); // so that it gets removed in future during re-edit
    script.setAttribute("src","AdlerGen/js/adlerStorage.js");
    script.setAttribute("type","text/javascript");
    hd.appendChild(script);
    
    script = document.createElement("script");
    script.setAttribute("name","adlerBase"); // so that it gets removed in future during re-edit
    script.setAttribute("src","AdlerGen/js/DBDef.js");
    script.setAttribute("type","text/javascript");
    hd.appendChild(script);
    
    script = document.createElement("script");
    script.setAttribute("name","adlerBase"); // so that it gets removed in future during re-edit

    var actionFile = pageName+"_action.js";
    script.setAttribute("src","js/"+actionFile);
    script.setAttribute("type","text/javascript");
    hd.appendChild(script);
    
    if (Adler.flow.jsObject)
    {
        for (var file in Adler.flow.jsObject)
        {
            script = document.createElement("script");
            script.setAttribute("name","adlerBase"); // so that it gets removed in future during re-edit
            script.setAttribute("src","AdlerGen/js/"+file);
            script.setAttribute("type","text/javascript");
            hd.appendChild(script);
        }
    }
    try {
        for (var idd in idObject)
        {
            var actions = idObject[idd];
            for (var i = actions.length - 1;i > -1;i--)
            {
                var action = actions[i];
                if (action.instruction && action.instruction === "Assign")
                {
                    var target = document.getElementById(action.id);
                    var ndName = target.nodeName.toLowerCase();
                    if (ndName === "img")
                        target.src = "";
                    else
                    {
                        // work on innerHTML later as there may be action.range invovled so need to substring it
                    }
                }
            }
        }
    } catch(e) {}
    // clone body
    var bdy = document.body.cloneNode(true);
    // remove all 'adlerBase
    adrBase = bdy.getElementsByClassName("adlerBase");
    for (var i = adrBase.length -1;i>-1;i--)
        trashDom(adrBase[i]);
    
    
    var titles = hd.getElementsByTagName("title");
    if (titles && titles.length > 0)
    {
        titles[0].innerHTML = "Powered by Adler - "+fileName;
    } else
    {
        var title = document.createElement("TITLE");
        title.innerHTML = "Powered by Adler - "+fileName;
        hd.appendChild(title);
    }
    
    
    var fileData = "<html><head>"+hd.innerHTML+"</head><body onload=\"adlerInit()\">"+bdy.innerHTML+"</body></html>";
    return fileData;
}

function adlerEditor()
{
    var pathArray = window.location.pathname.split("/");
    
    pathArray.splice(1,1); // remove "Customization
    
    var fileName = pathArray[pathArray.length - 1];
    pathArray.pop();
    var folder = pathArray.join("/") +"/";
    folder = decodeURI(folder);
    var fArray = fileName.split("."); var pageName = fArray[0];

    var flName = folder.substring(1)+fileName;
    // get the file and save it local
    var fileData = rebuildPage(fileName,pageName);
    localStorage["Adler-Editor-"+flName] = fileData;
    
        try {if (idObject) ;} catch(e) {idObject = {};}
        var actionData = makeIndexes();

        var actionFile = folder+"/js/"+pageName+"_action.js";
        if (fileData === "error") ;
        else localStorage["Adler-Editor-"+flName+"-idObjects"] = actionData;
    
    //
    var fileList = localStorage["Adler-Editor-FileList"]; if (fileList) fileList = JSON.parse(fileList); else fileList = [];
    var found = false;
    for (var i = fileList.length - 1;i > -1;i--)
    {
        var file = fileList[i];
        if (file === flName) {found = true;break;}
    }
    if (!found) {
        fileList.push(flName);
        localStorage["Adler-Editor-FileList"] = JSON.stringify(fileList);
    }
    var fileDetails = {"fileName":flName,"savedFromAdler":true,"lastSaved":"","dirty":true};
    localStorage["Adler-Editor-currentFile"] = JSON.stringify(fileDetails);

    //
    var sUrl = window.location.origin+"/Customization/Editor.html";
    var customWindow = window.open(sUrl);
    if (customWindow)
    {
        alert("Editor is open in separate Tab/Window");
        window.history.back();
    }
}

function addWidgetDiv()
{
    var div = document.createElement("div");
    //var inner_ht = "";
    div.setAttribute("class","adlerBase");
    div.setAttribute("id","adlerWidgetSelector");
    div.setAttribute("class","zoom adlerBase");
    div.setAttribute("style","display:none;");
    
    //the default innerhtml.
    var getWidgetList = function()
    {
	   	var h = "";
        for (var i = dynamicJson.length -1;i >-1;i--)
            h += "<option value='"+dynamicJson[i].instruction+"'>"+dynamicJson[i].widget+"</option>";
		return h;
    }
    //
    
    div.innerHTML = "<div onclick='pickTab()' name=\"tabs\" style=\"position:absolute;left: 21px;top: -30px;width:50px;\" class='adlerBase tab1 tabActive'>1</div>"+
    "<div onclick='pickTab()' name=\"tabs\" style=\"position:absolute;left: 79px;top: -30px;width:50px;\" class='adlerBase tab1'>2</div>"+
    "<div onclick='pickTab()' name=\"tabs\" style=\"position:absolute;left: 136px;top: -30px;width:50px;\" class='adlerBase tab1'>3</div>"+
    "<div onclick='pickTab()' name=\"tabs\" style=\"position:absolute;left: 193px;top: -30px;width:50px;\" class='adlerBase tab1'>4</div>"+

    "<img class=\"adlerBase\" style=\"position:absolute;left:-20px;top:-20px;width:30px;height:30px;\" onclick='closeWidgetSelector()' src=\"/"+virtual+"/png/glyphicons_197_remove.png\">"
    +"<div style='height:49px;'>Node picked : <span class=\"adlerBase\" id=\"nodeNameDisplay\" style='font-weight:bold'>LI</span>"+
    "<button class=\"adlerBase\" onclick=\"deleteElement();\" style='margin-left:5px'>Delete</button><button class=\"adlerBase\" onclick=\"editElement();\" style='margin-left:5px'>Edit</button>"+

    "</div>" +
    "<div class=\"adlerBase step\"  style='height:49px;'><span name=\"stepCount\">n.</span> Pick Widget :<img style=\"margin:0px 5px 0px 5px;\" id=\"removeActionImg\" class=\"adlerBase\"  onclick='removeAction()' src=\"/"+virtual+"/png/glyphicons_197_remove.png\"><select class=\"adlerBase select float3\" id=\"s_widget\" onchange=\"inner_html()\">" +
    getWidgetList() +
    "</select><img class=\"adlerBase customHelp float3\"  onclick='customHelp(1)' src=\"/"+virtual+"/adlericons/help.png\"></div>"+
    //<hr class=\"adlerBase\">" +
    "<div class=\"adlerBase\"  id=\"dynamic\"></div>"+
    "<div class=\"adlerBase\" id='rangeTextArea' style='height:125px;display:none'><span name=\"stepCount\">n.</span> Hilight replacement below (optional):<img class=\"adlerBase float3 customHelp \"  onclick='customHelp(0)' src=\"/"+virtual+"/adlericons/help.png\">" +
    "<textarea class=\"adlerBase\" onblur=\"resetSelection()\"></textarea></div><hr class=\"adlerBase\">" +
    "<div class=\"adlerBase\"><span name=\"stepCount\" class='float2'>n.</span><a onclick='showJsOptions()' class=\"adlerBase btns float3\" style='margin-left:5px;display:none'>JavaScript</a><a class=\"adlerBase btns float3\" style='margin-left:5px'>Apply</a></div>" ;
    
    document.body.appendChild(div);
    
    inner_html(div,0);
    
    
    var save = document.createElement("div");
    save.setAttribute("class","float1 float2 adlerBase");
    save.setAttribute("style","position:absolute;left:40%;top:80%;z-index:1000")
    save.setAttribute("id","adlerMenu");
    save.innerHTML = "<a id=\"saveButton\" class=\"adlerBase btns\" onclick=\"adlerSave()\" style=\"\">Save</a>"
    +"<a id=\"editButton\" class=\"adlerBase btns\" onclick=\"adlerEditor()\" style=\"margin-left:5px;\">Edit</a>"
    +"<select id=\"pageWidgetList\"  class=\"select adlerBase\" onchange='showPageWidget()' style='display:none'><option>--Page Widgets--</option><option>onLoad Script</option><option>load JSON</option><option>get Location</option></select>"
    +"<select id=\"memoryList\"  class=\"select adlerBase\" onchange='openMemory()' style='display:none'><option>--Page Stores--</option><option>create New</option></select>"
    +"<select id=\"convertList\"  class=\"select adlerBase\" onchange='convertPage()' style=''><option>--Native Formats--</option><option value='android'>Create Android Layout</option><option value='ios'>Create iOs Layout</option></select>";
    
    document.body.appendChild(save);
    
    var jsDiv = document.createElement("div");
    jsDiv.setAttribute("class","adlerBase");
    jsDiv.setAttribute("style","position:absolute;left:10%;top:10%;width:70%;height:70%;display:none;z-index:1000;border:1px solid;background-color:white;box-shadow:6px 6px 8px;")
    jsDiv.setAttribute("id","adlerJSEdit");
    jsDiv.innerHTML = "<div class='adlerBase' style='width:96%;margin:2%'><a class='adlerBase btns float2' onclick='saveCustomFunction()'>Save</a><a class='adlerBase btns float2' style='margin-left:5px;' onclick='closeJsEditor()'>Cancel</a><a class='adlerBase btns float2' style='margin-left:5px' onclick='deleteFunc()'>Delete</a><select id=\"jsList\"  class=\"select adlerBase\" onchange='fillJs()'></select></div>" +
    "<textarea class=\"adlerBase\" id='jsEditor' contentEditable='true' style=\"width: 94%;height: 80%;margin: 2%;padding: 1%;border: 1px solid;font-family: consolas,monospace;font-size: 14px;\"></textarea>";
    document.body.appendChild(jsDiv);
    
    defineJSEditorEvents();
    
    widgetSelectorDiv = div;
    return div;
    
}

function openMemory()
{
    var valStr = "<input class=\"adlerBase\" style=\"border:1px solid;padding:10px;margin:10px;\" type=\"text\" placeholder=\"columnName\"";
    var plus = "<img class=\"adlerBase\" style=\"width:30px;height:30px;\" onclick='memParmCheck()' src=\"/"+virtual+"/png/glyphicons_190_circle_plus.png\">"
    var rowsStr = "";
    /* something goes here
     if (action.query)
     {
     for (var k in action.query)
     {
     rowsStr += "<tr><td>"+nameStr+" value=\""+k+"\"></td><td>"+valStr+" value=\""+action.query[k]+"\"></td></tr>";
     }
     sUrl = action.serverURL;
     } */
    rowsStr += "<tr class=\"adlerBase\"><td class=\"adlerBase\" colspan=\"2\">"+valStr+"></td></tr><tr class=\"adlerBase\"><td class=\"adlerBase\">"+valStr+"></td><td class=\"adlerBase\">"+plus+"</td></tr>";
    
    
    var div = document.createElement("div");
    div.setAttribute("class","adlerBase");div.setAttribute("style","z-index:100;position:absolute;left:35%;top:10%;width:380px;height:auto;border:1px solid silver;box-shadow:5px 5px 6px silver;padding:10px;background-color:white");
    div.setAttribute("id","memoryDiv");
    var html =
    "	<label  class=\"adlerBase\">Page Store Name</label><input type=\"text\" style=\"width:320px;border:1px solid;padding:10px;margin:10px;\" class=\"adlerBase\" placeholder=\"storeName\" />"+
    "	<table  class=\"adlerBase\" style=\"padding:10px;\">"+
    rowsStr+
    "		<tr class=\"adlerBase\" ><td class=\"adlerBase\"><a class=\"adlerBase btns float2\" onclick=\"memoryApply()\">Apply</a></td><td class=\"adlerBase\"><a class=\"adlerBase btns float2\" onclick=\"closeMemory()\" >Cancel</a></td></tr>"+
    "	</table>";
    div.innerHTML = html;
    document.body.appendChild(div);
}
function memoryApply()
{
    var memDiv = document.getElementById("memoryDiv");
    var inputs = memDiv.getElementsByTagName("input");
    var storeName = inputs[0].value; if (storeName.indexOf("Page.") === -1) storeName = "Page."+storeName;
    var memStoreObj = {"storeName":storeName,"columns":[]};
    var colname = "";
    for (var i = 1;i<inputs.length;i++)
    {
        var val = inputs[i].value;
        if (val) memStoreObj.columns.push(val);
    }
    AdlerMemory.stores.push(storeName);
    if (!AdlerMemory.pageStores) AdlerMemory.pageStores = [];
    AdlerMemory.pageStores.push(memStoreObj);
    AdlerStorage.local.saveLocal = false;
    var db = AdlerStorage.findStorage(storeName);
    db.def.columns = memStoreObj.columns;
    db.def.primaryKey = memStoreObj.columns[0];
    db.def.keyPath = memStoreObj.columns[0];
    AdlerStorage.local.saveLocal = true;
    closeMemory(memDiv)
}
function closeMemory(memDiv)
{
    if (!memDiv) memDiv =  document.getElementById("memoryDiv");
    trashDom(memDiv);
    var mList = document.getElementById("memoryList");
    mList.selectedIndex = 0;
}
function showExtraWidget(extraType,storeName)
{
   	var targetEl = widgetSelectorDiv.targetElement;
   	var nodeName = targetEl.nodeName.toLowerCase();
   	
   	var div = document.createElement("div");
   	div.setAttribute("class","adlerBase extra");
	div.setAttribute("style","");
   	div.setAttribute("id","extraDiv");
   	div.extraType = extraType;
	div.storeName = storeName;
    var html =  "<img class=\"adlerBase\" style=\"position:absolute;left:-20px;top:-20px;width:30px;height:30px;\" onclick='closeExtra()' src=\"/"+virtual+"/png/glyphicons_197_remove.png\">"
    +"<div class=\"adlerBase\">"+extraType+" Widget for "+storeName+"</div>";
    
    var ehtml = "";
    if (extraType === "filter")
     	ehtml = " <select name=\"columnExtraSel\" class=\"select adlerBase\" onchange=\"pickExtraColumn()\"></select> <select name=\"condSel\" class=\"select adlerBase\"><option>=</option><option>&lt;</option><option>&gt;</option><option>like</option></select><input class=\"adlerBase\" style=\"width:80px\" type=\"text\" name=\"filterval\"></div>";
    else
   	 	ehtml = " <select name=\"columnExtraSel\" class=\"select adlerBase\" onchange=\"pickExtraColumn()\"></select><select name=\"orderSel\" class=\"select adlerBase\" style=\"padding:10px;height:38px;\"><option>--order by--</option><option>Asc</option><option>Desc</option></select></div>";
    
    var options = "";var oLen = 1;
    if (nodeName === "select")
    {
   	 	options = targetEl.options; var oLen = options.length;
    } else
    {
		options = [{"text":" for "+storeName}];
    }
    for (var i = 0; i < oLen;i++)
    {
        var option = options[i];
        if (extraType === "filter")
            html += ehtml;
        else
            html += ehtml;
    }
    
	html +=	"<div style=\"margin-right:10px;\"><a  class=\"adlerBase btns float2\" onclick=\"dataExtraApply()\">Apply</a><input class=\"adlerBase float2\" style=\"width:125px;margin:0px 0px 0px 10px\" type=\"text\" id=\"limit\" placeHolder=\"# of Rows to Limit\" >";
	
	div.innerHTML = html;
	document.body.appendChild(div);
	var columnDivs = document.getElementsByName("columnExtraSel");
	for (var i = columnDivs.length - 1;i > -1;i--)
    {
        addColumnList(storeName,columnDivs[i]);
        if (action.detail)
        {
            var det = action.detail[i];
            for (var c = columnDivs[i].options.length -1;c > -1;c--)
            {
                if (columnDivs[i].options[c].text === det.column)
                {columnDivs[i].selectedIndex = c;break;}
            }
        }
    }
    if (action.detail)
    {
        for (var d = action.detail.length - 1;d > -1;d--)
        {
		  	var det = action.detail[d];
			if (extraType === "filter")
			{
				var condSel = document.getElementsByName("condSel");
				var filterVal = document.getElementsByName("filterval");
				filterVal[d].value = det.val
                //
                for (var o = condSel[d].options.length -1;o > -1;o--)
                {
                    if (condSel[d].options[o].text === det.cond)
                    {condSel[d].selectedIndex = o;break;}
                }
                //
			} else
			{
				var val = det.val; if (val) val = "Asc"; else val = "Desc";
				var orderSel = document.getElementsByName("orderSel");
                //
                for (var o = orderSel[d].options.length -1;o > -1;o--)
                {
                    if (orderSel[d].options[o].text === val)
                    {orderSel[d].selectedIndex = o;break;}
                }
                //
			}
        }
    }
    
}

function more()
{
    var moreSel = event.target;
    var choice = moreSel.options[moreSel.selectedIndex].text;
    if (moreSel.selectedIndex > 0)
    {
        var storeSel = document.getElementById("storeSel");
        if (storeSel.selectedIndex === 0)
        {
            alert("Please pick a Data Store");
            moreSel.selectedIndex = 0;
            return;
        }
        action.instruction = actionSel.options[actionSel.selectedIndex].text;
        showExtraWidget(choice,storeSel.options[storeSel.selectedIndex].text);
        //closeWidgetSelector(widgetSelectorDiv);
    }
    moreSel.selectedIndex = 0;
}

function showJsOptions()
{
    checkStore();
    // also check if columnSelect is needed
    var columnSel = document.getElementById("columnSel");
    if (columnSel && columnSel.selectedIndex)
    {
        if ( columnSel.selectedIndex > 0)
            action.column = columnSel.options[columnSel.selectedIndex].text;
    }
    
    var jsSel,jsSel1,jsSelLocal,jsSelLocal1;
    var preX = false; var postX = false;
    var div = document.getElementById("jsChoice");
    if (!div)
    {
        var beforeButton = "New"; var afterButton = "New";
        var extraOption = "";
        div = document.createElement("div");
        div.setAttribute("class","adlerBase extra");
        div.setAttribute("style","width:550px;z-index:1010;border:3px solid red");
        div.setAttribute("id","jsChoice");
		
        var html = "<img class=\"adlerBase\" style=\"position:absolute;left:5px;top:5px;width:30px;height:30px;\" onclick='closeJsChoice()' src=\"/"+virtual+"/png/glyphicons_197_remove.png\">" +
        "<div class=\"adlerBase\" style='text-align:center'><h3 class=\"adlerBase\">Custom JavaScript</h3></div>"+extraOption+
        "<div class=\"adlerBase\" style='width:530px;height:50px'><span>Before: </span>"+
        "<select id='jsSel' class='select adlerBase' ><option>--External JS --</option></select> or "+
        "<select id='jsSelLocal' class='select adlerBase' ><option>--Local JS --</option></select>"+
        "<button id='beforeButton' class=\"adlerBase btns float3\">"+beforeButton+"</button></div>" +
        "<div class=\"adlerBase\" style='width:530px;height:50px'><span>After:&nbsp;&nbsp; </span>"+
        "<select  id='jsSel1' class='select adlerBase'><option>--External JS --</option></select> or "+
        "<select id='jsSelLocal1' class='select adlerBase' ><option>--Local JS --</option></select>"+
        "<button id='afterButton' class=\"adlerBase btns float3\">"+afterButton+"</button></div>";
        div.innerHTML = html;
        document.body.appendChild(div);
        
        // populate the list
        
        if (Adler.flow.jsObject)
        {
            jsSel = document.getElementById("jsSel");
            jsSel1 = document.getElementById("jsSel1");
            var optionString = "<option>--External JS --</option>"
            var jObj = Adler.flow.jsObject;
            for (var file in jObj)
            {
                var funcArray = jObj[file]; var fLen = funcArray.length;
                for (var i = 0; i < fLen;i++)
                {
                    var funcDetail = funcArray[i];
                    optionString += "<option>"+funcDetail.functionName+"</option>";
                }
            }
            jsSel.innerHTML = optionString;
            jsSel1.innerHTML = optionString;
            jsSel.onchange = function()
            {
                var obj = event.target;
                
                jsSelLocal = document.getElementById("jsSelLocal");
                if (obj.selectedIndex > 0)
                {
                    jsSelLocal.selectedIndex = 0;
                    document.getElementById("beforeButton").style.display = "none";
                } else document.getElementById("beforeButton").style.display = "block";
                
            }
            jsSel1.onchange = function()
            {
                var obj = event.target;
                jsSelLocal1 = document.getElementById("jsSelLocal1");
                if (obj.selectedIndex > 0)
                {
                    jsSelLocal1.selectedIndex = 0;
                    document.getElementById("afterButton").style.display = "none";
                } else document.getElementById("afterButton").style.display = "block";
                
            }
        }
        
    } else
    {
        div.style.display="block";
    }
    
    jSelLocal = document.getElementById("jsSelLocal");
    jSelLocal1 = document.getElementById("jsSelLocal1");
    var optionString = "<option>--Local JS --</option>";
    for (var func in jsObject)
    {
        optionString += "<option>"+func+"</option>";
    }
    jSelLocal.innerHTML = optionString;
    jSelLocal1.innerHTML = optionString;
    
    var button = document.getElementById("beforeButton");
    button.style.display = "block";
    button.onclick = function() {
        var jsChoiceDiv = document.getElementById("jsChoice");
        hideDom(jsChoiceDiv);
        customFunctionCreator(1);
    };
    jsSel = document.getElementById("jsSel");	jsSel.selectedIndex = 0;
    if (action.customFunction)
    {
        for (var i = jsSel.options.length - 1;i > -1;i--)  if (jsSel.options[i].text === action.customFunction) {jsSel.selectedIndex = i;preX = true;break;}
        var found = false;
        if (!preX)
        {
            for (var i = jSelLocal.options.length - 1;i > -1;i--)  if (jSelLocal.options[i].text === action.customFunction) {jSelLocal.selectedIndex = i;found = true;break;}
        }
        if (found) 	 button.innerHTML = "Edit";
        else button.style.display = "none";
    } else {
        button.innerHTML = "New";
    }
    
    button = document.getElementById("afterButton");
    button.style.display = "block";
    button.onclick = function() {
        var jsChoiceDiv = document.getElementById("jsChoice");
        hideDom(jsChoiceDiv);
        customFunctionCreator(2);
    };
    jsSel1 = document.getElementById("jsSel1");	jsSel1.selectedIndex = 0;
    if (action.postFunction)
    {
        for (var i = jsSel1.options.length - 1;i > -1;i--)  if (jsSel1.options[i].text === action.postFunction) {jsSel1.selectedIndex = i;postX = true;break;}
        var found = false;
        if (!postX)
        {
            for (var i = jSelLocal1.options.length - 1;i > -1;i--)  if (jSelLocal1.options[i].text === action.postFunction) {jSelLocal1.selectedIndex = i;found = true;break;}
        }
        if (found) 	 button.innerHTML = "Edit";
        else button.style.display = "none";
    } else {
        button.innerHTML = "New";
    }
}

function jsOpen(seq,ac)
{
    var div = document.getElementById("jsChoice");
    hideDom(div);
    if (seq === 1)
    {
        if (ac === "Create")
            customFunctionCreator(1);
    } else if (seq === 2)
    {
        if (ac === "Create")
            customFunctionCreator(2);
    }
    
    
}

function rebuildTree()
{
    var treeContainer = document.getElementById("treeContainer");
    treeContainer.innerHTML = "";
    buildTree(document.body,{"parent":treeContainer,"ulAdded":false},0);
}

function buildTree(nd,hObject,seq)
{ //  hObject =  {"parent":treeDiv,"ulAdded":false};
    var child = nd.firstElementChild;
    var virt = virtual;
    while (child)
    {
        var ndType = child.nodeType;
        if (ndType === 1)
        {
            var cls = child.getAttribute("class"); var parent = hObject.parent;
            if (cls && cls.indexOf("adlerBase") > -1) {child = child.nextSibling;continue;} // skip it
            if (!hObject.ulAdded) {hObject.ulAdded= true;var ul = document.createElement("ul");ul.setAttribute("class","adlerBase");ul.setAttribute("style","display:inline");var li = document.createElement("li");li.setAttribute("class","adlerBase");ul.appendChild(li);parent.appendChild(ul);parent = li;hObject.parent = ul; }
            else {var li = document.createElement("li");parent = li; li.setAttribute("class","adlerBase");hObject.parent.appendChild(li);}
            //parent.appendChild(document.createElement("br"));
            var expand = document.createElement("div"); expand.innerHTML = "<img alt='' onclick='collapseExpand(0)' style='display:inline' class='collapse adlerBase' src=\"/"+virt+"/adlericons/collapse.png\"><img alt='' style='display:none;'  onclick='collapseExpand(1)'  class='expand adlerBase' src=\"/"+virt+"/adlericons/expand.png\">";
            parent.appendChild(expand); expand.setAttribute("class","adlerBase");
            //var redStyle = "display:none";
            var childId = child.getAttribute("id"); try {if (idObject) ;} catch(e) {idObject = {};}
            var ac = idObject[childId]; if (ac) ;//redStyle = "display:inline";
            var str = child.nodeName; //var str = "<div class='adlerBase redDot' style='"+redStyle+"'></div>"+child.nodeName;
            var id = child.getAttribute("id");
            if (id) str+= "#"+id; if (cls) str += "."+cls.split(" ").join(".");
            var div = document.createElement("div"); div.innerHTML = str;div.setAttribute("class","adlerBase");
            if (ac) div.setAttribute("class","adlerBase elementHasAction");
            child.treeElement = div; // use this to focus the div
            div.linkedElement = child; // used in pickElement
            div.onclick = pickElement;
            parent.appendChild(div);
            buildTree(child,{"parent":parent,"ulAdded":false},++seq);
        }
        child = child.nextSibling;
    }
}


function collapseExpand(type) // type 0 - collapse, 1 - expand
{
    var obj = event.target;
    var disp = obj.style.display;
    if (disp === "none") obj.style.display = "inline"; else obj.style.display = "none";
    var prev = null;
    if (type) prev = obj.previousSibling;  else prev = obj.nextSibling;
    disp = prev.style.display;
    if (disp === "none") prev.style.display = "inline"; else prev.style.display = "none";
    var grandParent = obj.parentElement.parentElement;
    var child = grandParent.lastElementChild;var ul = null;
    while(child || ul)
    {
        if (child.nodeName === "UL")
        {ul = child; break;}
        child = child.previousElementSibling;
    }
    if (ul) {
        disp = ul.style.display;
        if (disp === "none") ul.style.display = "inline";
        else if (disp === "inline") ul.style.display = "none";
        else ul.style.display = "inline";
    }
}

function cancelBubble(e) {
    var evt = e ? e:window.event;
    if (evt.stopPropagation)    evt.stopPropagation();
    if (evt.cancelBubble!=null) evt.cancelBubble = true;
}

function checkStore(storeSel)
{
    if (!storeSel)
        storeSel = document.getElementById("storeSel");
    
    if (storeSel.selectedIndex === 0)
    {
        if ( !storeSel.parentElement.style.display || storeSel.parentElement.style.display === "none")
            ;
        else {alert("No store picked!!");return;}
        
    }
    
    return  storeSel.options[storeSel.selectedIndex].text;
    
}

function closeWidgetSelector(div)
{
    if (!div || div instanceof Event)
        div = widgetSelectorDiv;
    //treeViewDiv.style.display = "none";
    var extraInfo = document.getElementById("extraInfo");
    if (extraInfo) trashDom(extraInfo);
    var treeElement = div.targetElement.treeElement;
    var cls = treeElement.getAttribute("class"); if (cls.indexOf("elementHasAction") > -1) cls = "adlerBase elementHasAction"; else cls = "adlerBase";
    treeElement.setAttribute("class",cls);
    div.style.display="none";
    dblclick= false;
    if (div.tabIndex > 0)
    {
        var tabs = document.getElementsByName("tabs");
        var firstTab = tabs[0];
        var activeTab = tabs[div.tabIndex];
        activeTab.setAttribute("class","adlerBase tab1");
        firstTab.setAttribute("class","adlerBase tab1 tabActive");
        div.tabIndex = 0;
    }
    
}
function closeJsChoice()
{
    var jsChoiceDiv = document.getElementById("jsChoice");
    hideDom(jsChoiceDiv);
    // check to see if anything is selected
    var jsSel = document.getElementById("jsSel");
    if (jsSel.selectedIndex === 0)
    {
        var jsSelLocal = document.getElementById("jsSelLocal");
        if (jsSelLocal.selectedIndex === 0) {if (action.customFunction) delete action.customFunction;}
        else action.customFunction = jsSelLocal.options[jsSelLocal.selectedIndex].text;
    } else action.customFunction = jsSel.options[jsSel.selectedIndex].text;
    
    var jsSel1 = document.getElementById("jsSel1");
    if (jsSel1.selectedIndex === 0)
    {
        var jsSelLocal1 = document.getElementById("jsSelLocal1");
        if (jsSelLocal1.selectedIndex === 0) {if (action.postFunction) delete action.postFunction;}
        else  action.postFunction = jsSelLocal1.options[jsSelLocal1.selectedIndex].text;
    } else action.postFunction = jsSel1.options[jsSel1.selectedIndex].text;
    
    if (action.widget === "getLocation")
        locationApply();
}
function closeExtra()
{
    var extraDiv = document.getElementById("extraDiv");
    trashDom(extraDiv);
}
function closeJsEditor()
{
    dblclick = false;
   	var jsDiv = document.getElementById("adlerJSEdit");
   	jsDiv.style.display = "none";
}
function closeHTMLEditor()
{
    dblclick = false;
    var htmlDiv = document.getElementById("adlerHTMLEdit");
    htmlDiv.style.display = "none";
}

function customFunctionCreator(type)
{
   	var jsDiv = document.getElementById("adlerJSEdit");
	var jsEditor = document.getElementById("jsEditor");
	if (type) jsEditor.functionType = type;
    else jsEditor.functionType = 0;
	var pickedFunc = null;
	if (type === 1)
		pickedFunc = action.customFunction;
	else if (type === 2) pickedFunc = action.postFunction;
	
   	if (pickedFunc)
   	{
   		// this already has custom function just fill it.
   		var jsList = document.getElementById("jsList");
        for (var i = jsList.options.length - 1;i > -1;i--)  if (jsList.options[i].text === pickedFunc) {jsList.selectedIndex = i;jsEditor.value = jsObject[pickedFunc];break;}
        
      	jsDiv.style.display = "block";
      	return;
   	}
    dblclick = true;
   	var obj = event.target;
   	var div = obj.parentElement;
    
	var customText1 = "function TypeYourFunction(inputs)\r\n{\r\n";
    
    var widgetSelect = document.getElementById("s_widget"); var widgetIndex = 0;
    if (!widgetIndex)
        widgetIndex = widgetSelect.selectedIndex;
    
    var widgetPick = widgetSelect.options[widgetIndex].text;
    var check = true;
    if (widgetPick === "DataStore2Html" || widgetPick === "Html2DataStore"  || widgetPick === "Click")
    {	check = checkStore();
        if (!check) {return;}
        var columnSel = document.getElementById("columnSel");
        if (columnSel)
        {
            var colList = [];var cLen = columnSel.options.length ;
            for (var c = 1;c < cLen;c++) colList.push(columnSel.options[c].text);
        }
        var actionSel = document.getElementById("actionSel");
        var instruction = actionSel.options[actionSel.selectedIndex].text;
        
        var storeName = check; if (storeName.indexOf(".") > -1) storeName = check.split(".")[1];
        var aLen = actionArray.length; var formColumnArray = []; var domListArray = [];
        for (var ia = 0; ia < aLen;ia++)
        {
            var actn = actionArray[ia];
            domListArray.push({"domId":actn.id});
            if (actn.instruction === "Source" && actn.storeName === check) formColumnArray.push(actn.column);
        }
        if (widgetPick === "DataStore2Html" || (widgetPick === "Click" && instruction != "PageNavigate"))
        {
            var clmn =  "		var option = {} ; // set option to search your own record	\r\n"+
            "		var record = inputs.record;	// this is one single record of "+storeName+", if no data found, this will be null\r\n";
			
            if (columnSel && columnSel.selectedIndex)
            {clmn += "		var columnData = record."+columnSel.options[columnSel.selectedIndex].text+";	\r\n";}
            var actionSel = document.getElementById("actionSel");
            var instruction = actionSel.options[actionSel.selectedIndex].text;
            var ret = "		output.returnString = \"\" // set this value for Adler to use\r\n";
            if (instruction === "Repeat" && type === 1)
            {   clmn = "";
                ret = "\r\n		output.returnArray = db.find(option);  // Adler will use data array to repeat dom \r\n\r\n";
            } else if (type == 2) ret = "";
            customText1 += "		var db = inputs.db	// contains data model for "+check+"\r\n"+
            clmn+
            "		var targetDom = inputs.targetElement \r\n"+
            "		var output = {};output.domModified = false; // if you want to modify dom, set this to true \r\n"+
            ret+"		return output; // return output object;\r\n"+
            "\r\n /* Example of sample option on row filtering  */\r\n"+
            " /***\r\n sampleOptions = {\r\n filter:[{\"column\":\"memberId\",\"cond\":\"=\",\"val\":\"124\"},{\"column\":\"income\",\"cond\":\">\",\"val\":\"124\"}],"+
            " column:[\"product_id\",\"pdetails\"],\r\n"+
            " sort:[{\"column\":\"product_id\",\"order\":1},{\"column\":\"-income\":\"order\":-1}],    //order  1 asc, -1 desc\r\n"+
            " limit:100 // send first 100 rows only\r\n"+
            " }\r\n  // see the example to search & retrieve your own data below\r\n  var recordArray = db.find(sampleOptions)\r\n"+
            "**/\r\n"+
            "\r\n /* list of All Columns for reference \r\n"+JSON.stringify(colList)+"\r\n */\r\n"+
            "\r\n /* list of All Dom id assigned \r\n"+JSON.stringify(domListArray)+"\r\n */\r\n";
        } else
        {
            customText1 += "		var db = inputs.db	// contains data model for "+check+"\r\n"+
            "		var record = inputs.record; // this contain a json with values of the columns\r\n"+
            "\r\n /* \r\n"+JSON.stringify(formColumnArray)+"\r\n */ \r\n\r\n"+
            "		db.push(record);\r\n"+
            "\r\n /* list of All Columns for reference \r\n"+JSON.stringify(colList)+"\r\n */\r\n"+
            "\r\n /* list of All Dom id assigned \r\n"+JSON.stringify(domListArray)+"\r\n */\r\n";
        }
        
        
    }
    else if (widgetPick === "Page Navigation")
        ;
    if (!check)
        return;
    
    
    jsDiv.style.display = "block";
    jsEditor.value = customText1 +"}";
}


function deleteFunc()
{
    var jsList = document.getElementById("jsList");
    var jsEditor = document.getElementById("jsEditor");
    var func = jsObject[jsList.options[jsList.selectedIndex].text];
    delete jsObject[func];
    jsEditor.value = "";
    trashDom(jsList.options[jsList.selectedIndex]);
    jsList.selectedIndex = 0;
}
function eventStart(e)
{
    counter = 0;
    targetElement = event.target;
    return ;
}
function eventContinue(e)
{
    counter++;
}
function eventStop(e)
{
    if (counter < 2 && !dblclick)
    {
        dblclick = true;
        setTimeout(function(){dblclick= false;},600);
        var cls = targetElement.getAttribute("class");
        if (cls && cls.indexOf("adlerBase") > -1)
            return;
        if (e.target === document.body) return;
        // its a click
        
        cancelBubble(e);
        setTimeout(function(){dblclick= true;},700);
        var div = widgetSelectorDiv;
        if (!div)
            div = addWidgetDiv();
        
        //placeWindow(div,{x:e.x,y:100,w:400,h:400});
        placeWindow(div,{x:400,y:100,w:400,h:400});
        
        div.targetElement = targetElement;
        pickElement(targetElement);
        //widgetSelect(div,targetElement,0);
        
        return false;
    }
}

function fillColumn()
{
    
}

function fillJs()
{
    var jsList = document.getElementById("jsList");
    var jsEditor = document.getElementById("jsEditor");
    var func = jsObject[jsList.options[jsList.selectedIndex].text];
    if (!func)
        func = "";
    jsEditor.value = func;
}

function fillPages()
{
    var flow = JSON.parse(sessionStorage["adler-flowDetail"]);
    var layout = sessionStorage["adler-layout"];
    pages = flow[layout].pages;
    var html ="<option>--To Page--</option>";
    // fill the store name
    var pageLen = pages.length;
    if (pageLen > 0)
    {
        for (var i = 0;i < pageLen;i++)
        {
            html += "<option>"+	pages[i].pageName+"</option>";
        }
    }
    html += "<option>#goBack</option>";
    // done filling the store names
    return html;
}

function fillStore()
{
    var html ="<option>--Data Store--</option>";
    // fill the store name
    var schema = localStorage["Adler-User"];
    var storeDefList = AdlerStorage.getStoreList(schema);
    var storeLen = storeDefList.length;
    if (storeLen > 0)
    {
        for (var i = 0;i < storeLen;i++)
        {
            html += "<option>"+	storeDefList[i].storeName+"</option>";
        }
    }
    html += "<option>Memory Stores</option><option>IGNORE</option>";
    // done filling the store names
    return html;
}

function generateScript()
{
    
    var fixAdlerInner = function(nd)
    {
        var child = nd.firstElementChild;
        while (child)
        {
            var ndType = child.nodeType;
            if (ndType === 1)
            {
                var actSeqArray = child.getAttribute("data-adr-action");
                if (actSeqArray)
                {	actSeqArray = JSON.parse(actSeqArray);
                    if (!actSeqArray.length) // convert it to array
                    {var tmpSeq = actSeqArray; actSeqArray=[];actSeqArray.push(tmpSeq);}
                    var sLen = actSeqArray.length;
                    for (var s =  0;s < sLen;s++)
                    {
                        var actSeq = actSeqArray[s];
                        var act = actionArray[parseInt(actSeq)];
                        if (act.instruction === "Assign")
                        {
                            var stName = act.storeName; var aArray = assgnObject[stName]; var aLen = aArray.length;
							// move it from assignArray to repeatArray
                            for (var i = 0;i < aLen;i++)
                            {
                                var a = aArray[i];
                                if (a.id === act.id)
                                {
                                    aArray.splice(i,1);
                                    if (stName.indexOf("Memory.") > -1)
                                    {
                                        // fix the stName to the stName of repeat Dom
                                        // find the copy storeName and assign it to stName
                                        var iArray = idObject[a.id].seq; var iaLen = iArray.length;
                                        for (var ido = 0; ido < iaLen;ido++) {var idoAction = actionArray[iArray[ido]]; if (idoAction.widget === "Copy") {stName = idoAction.storeName;break;}}
                                    }
                                    if (!reptObject) reptObject = {};
                                    if (!reptObject[stName]) reptObject[stName] = new Array();
                                    a.type = act.widget;
                                    reptObject[stName].push(a);
                                    break;
                                }
                            }
                        }
                    }
                    
                    
                    child.removeAttribute("data-adr-action");
                    child.removeAttribute("id");
                }
                fixAdlerInner(child);
            }
            child = child.nextSibling;
        }
        return;
    }
    var pageObj = getPageNavInfo(); var specifyUser =  "				ADLER_SCHEMA = \""+localStorage["Adler-User"]+"\" ;\r\n";
    if (pageObj.entryPage) { specifyUser =  "				localStorage[\"Adler-User\"] = \""+localStorage["Adler-User"]+"\" ;\r\n"+specifyUser
      	+"				STATEDB.init(true);\r\n"; }
    else
        specifyUser+"				STATEDB.init();\r\n";
    
    var script = "\r\n		function adlerInit() {\r\n" +
    "			try {\r\n" +
    specifyUser+
    "				STATEDB.init();\r\n"+
    "				STATEDB.put(\"pages\","+JSON.stringify(pageObj.pages)+",\"Object\");\r\n"+
    "				AdlerDom.dataBinder(defineActions());\r\n";
    
    var htmlString = "";
    var actionLen  = actionArray.length; var assignFound = false;var repeatFound = false;var keyPath;
    var db = null; var initFunction = null;
    
    var result = createActionIndexes()
    var assgnObject = result.assignObject;var reptObject = result.repeatObject;var eventObject = result.eventObject;
    var formObject = result.formObject;var dataStores = result.dataStores; var idObject = result.idObject;
    
    for (var i = 0; i < actionLen;i++)
    {
        var action = actionArray[i]; if (!action.instruction) action.instruction = "";
        if (action.instruction === "Repeat")
        {
            repeatFound = true;
            // remove all the children
            var origRepeat = document.getElementById(action.id);
            var repeatElement = origRepeat.cloneNode(true);
            fixAdlerInner(repeatElement);
            
            if (origRepeat.nodeName != "SELECT") origRepeat.style.display = "none"; // hide it
        } else if (action.instruction === "Control")
        { var extraType = action.detail[0].type.toLowerCase();
            // it needs to be as part of repeat object
            if (reptObject)
            {
                
                reptObject[action.storeName].push({"id":action.id,"seq":i,"type":extraType});
            }
            
        } else if (action.widget === "Click")
        {
            var cAction = action.clickAction;
            if (cAction === "Take Picture") {ADLER_PERMISSIONS.details.CAMERA = true;ADLER_PERMISSIONS.dirty = true;}
            else if (cAction === "Open Address Book") {ADLER_PERMISSIONS.details.READ_CONTACTS = true;ADLER_PERMISSIONS.dirty = true;}
            
        }
        else if (action.widget === "Communication")
        {
            var commData = "";
            if (action.customFunction)
                commData = action.customFunction+"()";
            else
            {   var keyDetails = getDBKey(action.storeName);
                var key = keyDetails.key;var pKey = keyDetails.pKey; var db = keyDetails.db;
                var optStr  = "options = {\"filter\":[{\"column\":\""+key+"\",\"cond\":\"=\",\"val\":id}],\"limit\":1}";var parentOptStr;
                if (pKey) parentOptStr = "options = {\"filter\":[{\"column\":\""+pKey+"\",\"cond\":\"=\",\"val\":id}],\"limit\":1}";
                
                var recordName = action.storeName.split(".")[1];
                script +=	"				var db = AdlerStorage.findStorage(\""+action.storeName+"\"); \r\n"+
                "				var ids = STATEDB.getId(); var options = {\"limit\":1}; var id;\r\n"+
                "               if (ids) \r\n"+
                "					 { if (typeof(ids) === \"string\") ids = JSON.parse(ids);id = ids[\""+action.storeName+"\"]; \r\n"+
                "						if (id) "+optStr+" \r\n"+
                "						else { if (db.def.parent) { id = ids[\""+db.def.parent+"\"]; if (id) "+parentOptStr+"  }\r\n"+
                "							 } \r\n"+
                "					 }\r\n"+
                "			var "+recordName+" = db.find(options); // get record with the id\r\n";
                commData = recordName+"."+action.column;
            }
            if (action.instruction === "Phone Dialer" ) // "Phone Dialer","SMS","Email"
            {
                script += "				var commElement = document.getElementById(\""+action.id+"\");\r\n"+
                "				commElement.onclick = function() {COMM.dial("+commData+")};\r\n";
            } else if (action.instruction === "SMS")
            {
                script += "				var commElement = document.getElementById(\""+action.id+"\");\r\n"+
                "				commElement.onclick = function() {COMM.SMS("+commData+")};\r\n";
            } else
            {
                script += "				var commElement = document.getElementById(\""+action.id+"\");\r\n"+
                "				commElement.onclick = function() {COMM.mailto("+commData+")};\r\n";
            }
            
        } else if (action.instruction === "LOCATION")
        {
            ADLER_PERMISSIONS.details.GPS = true;ADLER_PERMISSIONS.dirty = true;
            script += "				Navigation.getLocation("+i+");\r\n";
        } else if (action.instruction === "GETJSON")
        {
            script += "				AdlerNet.getJSONP('"+action.serverURL+"','"+JSON.stringify(action.query)+"');\r\n";
        } else  if (action.widget === "onLoad")
            initFunction = action.postFunction;
    }
    
    if (initFunction)
		script +="					"+initFunction+"(); // user defined function \r\n";
    script +="				} catch (e) { adler.log(\" Error during Data Binding  \",e);}\r\n" +
    "			}\r\n" ;
    
    
    
    var dbInit = "";
    for (db in dataStores)
        dbInit += "				"+dataStores[db]+"DB = AdlerStorage.findStorage(\""+db+"\");\r\n";
    dbInit += "				dataStores = { "; var prefix = " ";
    for (db in dataStores)
    {
        dbInit += prefix+"\""+db+"\":"+dataStores[db]+"DB";
        if (prefix === " ")
            prefix = ",";
    }
    dbInit += "};\r\n";
    var actionScript = 	"\r\n		// for internal use only \r\n"+
    "		function defineActions() {\r\n"+
    "			var newAction = function() {\r\n"+
    "				actionArray = "+JSON.stringify(actionArray)+";\r\n"+
    "				assignObject = "+JSON.stringify(assgnObject)+";\r\n"+
    "				repeatObject = "+JSON.stringify(reptObject)+";\r\n"+
    "				formObject = "+JSON.stringify(formObject)+";\r\n"+
    "				idObject = "+JSON.stringify(idObject)+";\r\n"+
    "				eventObject = "+JSON.stringify(eventObject)+";\r\n"+
    dbInit+
    "				var pageStores = "+JSON.stringify(AdlerMemory.pageStores)+";\r\n"+
    "				AdlerMemory.pageStores = pageStores;\r\n "+
    "				for (var i = pageStores.length -1;i > -1;i--) {AdlerMemory.stores.push(pageStores[i].storeName);var d = AdlerStorage.findStorage(pageStores[i].storeName);d.def.columns = pageStores[i].columns;d.def.keyPath = d.def.columns[0]}\r\n"+
    "			}\r\n"+
    "			try { if (!actionArray) newAction()} catch(e) {newAction();}\r\n"+
    " 			return actionArray;\r\n"+
    "		}\r\n";
    localStorage["adler-permissions"] = JSON.stringify(ADLER_PERMISSIONS);
    return actionScript+htmlString+script;
    
}
function getDBKey(storeName)
{  var db;
    if (typeof(storeName) === "string")
        db = AdlerStorage.findStorage(storeName);
    else db = storeName;
    var key = db.def.keyPath; var pKey;
    if (db.def.parent)
    {
        // find the parent key
        var columns = db.def.columns; var cLen = columns.length;
        for (var i = 1;i < cLen;i++)
        {
            var column = columns[i].toLowerCase();
            if (column.indexOf("id") > -1)
            { pKey = columns[i]; break;}
        }
    }
    return {"key":key,"pKey":pKey,"db":db};
}
function fillRepeatDetail()
{
    
    htmlString =
    "\r\n	 var rowSample = null;\r\n"+
    "\r\n    function tableGenerator(tableInfo,options) {\r\n" +
    "    	var db = AdlerStorage.findStorage(tableInfo.storeName);\r\n" +
    "		var dArray = db.find(options);\r\n"+
    "    	var dbLen = dArray.length;\r\n"+
    "		var parent = document.getElementById(tableInfo.parent);\r\n"+
    "	 	var rowSample = document.getElementById(tableInfo.tableId);parent.innerHTML = \"\"; \r\n"+
    "	 	rowSample.style.display = \"none\"; \r\n"+
    "    	for (var i = 0 ; i < dbLen;i++) {\r\n"+
    "			var data = dArray[i];\r\n"+
    "			insertRow(data,rowSample,parent);\r\n"+
    "	 	}\r\n"+
    "		parent.appendChild(rowSample);\r\n"+
    "	 };\r\n"+
    "\r\n    function insertRow("+recordName+",rowSample,parent) {\r\n" +
    "			var html = "+htmlString+" \r\n" +
    "	 			var row = rowSample.cloneNode(false);\r\n"+
    "	 			row.innerHTML = html;\r\n"+
    "				var keyId = "+recordName+"[\""+keyPath+"\"];\r\n"+
    "				row.setAttribute(\"style\",\"\");row.setAttribute(\"id\",\"adlerRow\"+keyId);\r\n"+
    "				row.keyId = keyId	; 			\r\n"+
    "	 			row.onclick = function(){\r\n"+
    "	 				var obj = event.target;\r\n"+
    "	 				while(!obj.keyId)\r\n"+
    "	 					obj = obj.parentElement;\r\n"+
    "	 				STATEDB.setId(obj.keyId);\r\n";
    var nextPage = getNextPage();
    if (nextPage)
        htmlString +=
        "	 				PageNavigate.goToPage(\""+getNextPage()+"\",'"+sessionStorage["adler-pageName"]+"');\r\n";
    htmlString +=
    "	 			};\r\n"+
    "	 			parent.appendChild(row);	 \r\n"+
    "	 }\r\n";
    
    
    
}

function fillOptionDetails(details,extraType)
{
    var script = "					switch (obj.selectedIndex) {\r\n";
    var dLen = details.length;
    for (var i = 0; i < dLen;i++)
    {
        var detail = details[i];
        if (!detail.column)
            script+=			"					case "+i+": return;\r\n";
        else
        {
            var opt = "{\"column\":\""+detail.column+"\",";
            if (extraType === "sort")
                opt += "\"order\":"+detail.val+"}";
            else
                opt += "\"cond\":\""+detail.cond+"\",\"val\":\""+detail.val+"\"}";
            script+=			"					case "+i+": options."+extraType+".push("+opt+");break;\r\n";
        }
    }
    script+=			"					} \r\n";
    return script;
}

function createActionIndexes()
{
    var actionobj = actionArray;
    var actionob_len = actionArray.length;
    var assgnObject = {};
    var formObject = {};
    var eventObject = {};
    var repeatObject = {};
    var idObject = {};
    var dataStores = {};
    
    // first push all ids into idObject
    for (var i = 0 ; i < actionob_len ; i++)
    {
        var a = actionobj[i];
        if (!a.id) continue;//{adjustActions(i);actionob_len = actionArray.length;}; // since page widgets don't have id hence skip
        var obj = document.getElementById(a.id); if (!obj) {adjustActions(i);actionob_len = actionArray.length;};
        if (!idObject[a.id]) idObject[a.id] = {"seq":[i]};
        else idObject[a.id].seq.push(i); // there could be multiple action on the same object
    }
    // then examine each actions and arrange them
    for (var i = 0 ; i < actionob_len ; i++)
    {
        var a = actionobj[i];
        if (!a.id) continue;
        
        if(a.event)
        {
            if (!eventObject) eventObject = {};
            if (!eventObject[a.event]) eventObject[a.event] = new Array();
            eventObject[a.event].push({"id":a.id,"seq":i});
            if (a.instruction === "Take Picture")
            {
                // check any Html2DataStore is attached to it, if it is then from will be Memory.images.path
                for (var d = idObject[a.id].seq.length -1;d > -1;d--)
                {
                    var seq = idObject[a.id].seq[d];
                    var peepAction = actionArray[seq];
                    if (peepAction.instruction === "Source")
                    {peepAction.from = "data-adr-Memory.Images.imageId";
                        peepAction.fromType = "attr";
                        continue;}
                }
            }
            continue;
        }
        
        var storeName = a.storeName;
        if (!storeName) continue;
        if (!dataStores[storeName])
        {
            var st = ""; if (storeName.indexOf(".") > -1) st = storeName.split(".")[1];
            dataStores[storeName] = st;
        }
        
        if (a.instruction === "Assign")
        {
            
            if (!assgnObject) assgnObject = {};
            if (!assgnObject[storeName]) assgnObject[storeName] = new Array();
            assgnObject[storeName].push({"id":a.id,"seq":i});
        }
        
        else if(a.instruction === "Repeat")
        {
            if (!repeatObject) repeatObject = {};
            if (!repeatObject[storeName]) repeatObject[storeName] = new Array();
            var obj = document.getElementById(a.id);
            var rObject = {"id":a.id,"seq":i,"type":"repeat"}

            // check to see if repeat object is a select
            if (obj.nodeName === "SELECT") rObject.type = "repeatSelect";

            repeatObject[storeName].push(rObject); //  logic is required to push the assign objects under repeat.
            if (!eventObject["onclick"]) eventObject["onclick"] = new Array();
            eventObject["onclick"].push({"id":a.id,"seq":i}); // every repeat element must have event attached to it to save its id in statedb.
        }
        
        else if(a.instruction === "Source")
        {
            if (!formObject) formObject = {};
            if (!formObject[storeName]) formObject[storeName] = new Array();
            formObject[storeName].push({"id":a.id,"seq":i});
        }
        
        else if(a.instruction == "Submit")
        {
            if (!eventObject) eventObject = {};
            if (!eventObject["onclick"]) eventObject["onclick"] = new Array();
            eventObject["onclick"].push({"id":a.id,"seq":i});
        }
        
        
    }
    
    result = {"assignObject":assgnObject,"repeatObject":repeatObject,"formObject":formObject,"idObject":idObject,"eventObject":eventObject,"dataStores":dataStores}
    return result;
}

function getCustomFunctions()
{
    var html = "";
    for (var k in jsObject)
    {
        var scr = jsObject[k];
        if (scr === "") continue;
        while (scr.indexOf("\r\n		/* ~** Ends */ \r\n") > -1) scr.replace("\r\n		/* ~** Ends */ \r\n","");
        html += "\r\n		/* Function~--"+k+"~--Begins ~** */ \r\n"+scr+"\r\n		/* ~** Ends */ \r\n";
    }
    return html;
}

function getNextPage()
{
    var flow = sessionStorage["adler-flowDetail"];
    flow = JSON.parse(flow);
    var layout = sessionStorage["adler-layout"];
    var currentPage = sessionStorage["adler-pageName"];
    var pages = flow[layout].pages; var href = null;
    for (var i = pages.length - 1;i> -1;i--)
        if (pages[i].pageName === currentPage)
        {href = pages[i].href;break;}
    if (href)
        return href[0];
    else
        return "";
}

function getPageNavInfo()
{
    var flow = sessionStorage["adler-flowDetail"];
    flow = JSON.parse(flow);
    var layout = sessionStorage["adler-layout"]; var pages = flow[layout].pages;
    var currentPageName = sessionStorage["adler-pageName"];
    var entryPage = false;
    if (flow[layout].entryPage === currentPageName) entryPage = true;
    
    var findPage = function(pgNm) {
        for (var i = pages.length - 1; i > -1;i--)
            if (pages[i].pageName === pgNm)
                return pages[i];
    }
    
    var currentPage = findPage(currentPageName); var list = new Array();
    for (var i = currentPage.href.length - 1; i > -1;i--)
    {
        var pg = findPage(currentPage.href[i]);
        var trimPg = {pageName:pg.pageName,extension:pg.extension};
        
        list.push(trimPg);
    }
    
    
    
    return {"entryPage":entryPage,"pages":list,"currentPageName":currentPageName};
}


function inner_html(div,widgetIndex, widgetSelect, diffWidge){ //function called on change if pick widget select.
    var widgetJson = null;
    
	if (!div)
		div = widgetSelectorDiv;
    
	var dynamic = document.getElementById("dynamic"); var stepCounter = 3; //start with 3
	if (!widgetSelect)
        widgetSelect = document.getElementById("s_widget");
	if (!widgetIndex)
		widgetIndex = widgetSelect.selectedIndex;
	
	var differentWidget = false;
	var widgetPick = widgetSelect.options[widgetIndex].value;
	if (div.widgetPick !== widgetPick)
		differentWidget = true;
    
	if (diffWidge)
		differentWidget = diffWidge; // force override
    
	if (differentWidget)
	{
		div.widgetPick = widgetPick;
        var clas = " class=\"adlerBase";
		for (var i = dynamicJson.length -1;i >-1;i--)
			if (dynamicJson[i].instruction === widgetPick)
            {widgetJson = dynamicJson[i];break;}
		var inner_ht = "";
		for(var j=0;j < widgetJson.steps.length;j++) // go through the json steps
		{
            
			var step = widgetJson.steps[j];
			inner_ht += "<div><div class=\"adlerBase step\" style='height:49px;'><span name=\"stepCount\">1.</span> "+step.label + ":</span>"+"<" + step.inputType+" id=\""+step.id+"\"  ";
			
			if (step.event)
			{
				for (var k in step.event)
				{
					inner_ht +=  k+"=\""+step.event[k]+"()\"";
				}
				
			}
			if (step.inputType === "input")
			{
                inner_ht += " type=\"text\" ";
                if (step.placeHolder)
                    inner_ht += "placeholder=\""+step.placeHolder+"\" "+clas+" float3\" ";
			} else if (step.inputType === "select")
			{
				inner_ht += clas+" select float3\" ";
			}
			inner_ht += " >" ;
			if (step.fill)
            {
                if (typeof(step.fill) === "string")
                    inner_ht += window[step.fill].call(null) ;
                else
                {
                    var opts = step.fill;
                    for (var o = 0;o < opts.length;o++)
                        inner_ht += "<option>"+opts[o]+"</option>";
                }
            }
            
			inner_ht += "</" + step.inputType +"><img class=\"adlerBase customHelp float3\"  onclick='customHelp(\""+step.helpNo+"\")' src=\"/"+virtual+"/adlericons/help.png\"></div></div>"; //<hr class=\"adlerBase\"></div>";
            
            stepCounter++; //for indexing.
		}
		dynamic.innerHTML = inner_ht;
		if (widgetJson.init)
            window[widgetJson.init].call(null);
        
		var buttons = div.getElementsByTagName("a");
		buttons[1].onclick = window[widgetJson.apply];
        
		//var moreSel = document.getElementById("moreSel");
		//var options = moreSel.options; var oLen = options.length;
		//for (var io = oLen -1; io > 0;io--) trashDom(options[io]);
		//var moreOpt = widgetJson.moreOptions; var mLen = moreOpt.length;
		//for (var im = 0; im < mLen;im++)
		//{
		//		var opt = document.createElement("option");opt.innerHTML = moreOpt[im];moreSel.appendChild(opt);
		//}
		
		if (widgetPick === "DataStore2Html")
			document.getElementById("rangeTextArea").style.display = "block";
		else if (widgetPick === "Html2DataStore")
		{
			document.getElementById("rangeTextArea").style.display = "none";
			var aSel = document.getElementById("actionSel"); hideDom(aSel.parentElement);
		}
		else document.getElementById("rangeTextArea").style.display = "none";
		
		renumber();
        return widgetJson;
	}
    
}

function hideDom(div)
{
    div.style.display = "none";
}

function jsonApply()
{
    if (!action)
        action = {};
    action.instruction = "GETJSON";
    var jsonDiv = document.getElementById("jsonDiv");
    var inputs = jsonDiv.getElementsByTagName("input");
    action.serverURL = inputs[0].value;
    var query = {};var nameToggle = true;var name = "";
    for (var i = 1;i<inputs.length;i++)
    {
        var val = inputs[i].value;
        if (nameToggle)
        {
            if (!val)
            {
                i++; // jump two, retain nameToggle = true
                continue;
            }
            name = val;
            nameToggle = false;
        } else
        {
            nameToggle = true;
            if (val)
                query[name] = val;
        }
    }
    action.query = query;
    // get all the values, add it to actionArray
    // find and push
    var i = findAction({instruction:"GETJSON"});
    if (i != null) actionArray[i] = action;
    else actionArray.push(action);
    
    trashDom(jsonDiv);
    
    // try to load json to DB
    AdlerNet.getJSONP(action.serverURL,JSON.stringify(action.query));
    alert("JSON Widget will be added");
    action = {};
}

function pickTableAction(e)
{
    return ; // return for now
    // code below to be deleted later
    var controlSel = document.getElementById("controlSel");
    var act = actionSel.options[actionSel.selectedIndex].text;
    if (act === "Control")
    {controlSel.parentElement.style.display = "block";}
    else
        hideDom(controlSel.parentElement);
}

function pickClickAction(e)
{
    var cActionSel = document.getElementById("clickSel");
    var clickAction = action.clickAction;
    for (var i = cActionSel.options.length - 1;i > 0;i--)
    {
        if (cActionSel.options[i].text === clickAction)
        {cActionSel.selectedIndex = i;break;}
    }
    var act = cActionSel.options[cActionSel.selectedIndex].text;
   	
    if (act === "PageNavigate")
    {
        var storeSel = document.getElementById("storeSel");
        if (storeSel)
            hideDom(storeSel.parentElement);
        var pageSel = document.getElementById("pageSel");
        if (pageSel)
            pageSel.parentElement.style.display = "block";
        renumber();
    } else if (act === "Submit" || act === "Update"  || act === "Delete"  || act === "Retrieve")
    {
        var storeSel = document.getElementById("storeSel");
        if (storeSel)
            storeSel.parentElement.style.display = "block";
        var pageSel = document.getElementById("pageSel");
        if (pageSel)
            hideDom(pageSel.parentElement);
        renumber();
    }  else if (act === "Take Picture" || act === "Open Address Book")
    {
        var storeSel = document.getElementById("storeSel");
        if (storeSel)
            hideDom(storeSel.parentElement);
        var pageSel = document.getElementById("pageSel");
        if (pageSel)
            hideDom(pageSel.parentElement);
    }  else
    {
        var storeSel = document.getElementById("storeSel");
        if (storeSel)
            storeSel.parentElement.style.display = "block";
        var pageSel = document.getElementById("pageSel");
        if (pageSel)
            hideDom(pageSel.parentElement);
        renumber();
    }
}

function pickAction(e)
{
    var actionSel ;
    try {
        if (e)
            actionSel = e.target;
        else
            actionSel = event.target;
    } catch (ex) {actionSel = e.target;}
    
    if (!action)
        action = {};
    var act = actionSel.options[actionSel.selectedIndex].text;
    if (!act)
        return;
    
    var storeSel = document.getElementById("storeSel");
    if (storeSel)
        storeSel.parentElement.style.display = "block";
    //
    var columnSel = document.getElementById("columnSel");
    if (act === "Repeat" || act === "Control")
    {
        var controlSel = document.getElementById("controlSel");
        if (columnSel)
            hideDom(columnSel.parentElement);
        if (act === "Control")
        {
            if (action.detail)
            {
                var choice = action.detail[0].type;
                controlSel.parentElement.style.display = "block";
                for (var i = controlSel.length - 1;i > 0;i--)
                {
                    if (controlSel.options[i].text === choice)
                    {controlSel.selectedIndex = i;break;}
                }
                showExtraWidget(choice,storeSel.options[storeSel.selectedIndex].text);
            } else
            {
                if (controlSel.parentElement.style.display = "none")
                {controlSel.parentElement.style.display = "block";
                    action.instruction = "Control";
                    renumber();
                }
            }
            
        }
        else
            hideDom(controlSel.parentElement)
            
            document.getElementById("rangeTextArea").style.display = "none";
        renumber();
    }  else if (act === "Source")
    {
        hideDom(actionSel.parentElement);
        document.getElementById("rangeTextArea").style.display = "none";
        renumber();
    } else if (act === "PageNavigate")
    {
        hideDom(storeSel.parentElement);
        document.getElementById("rangeTextArea").style.display = "none";
        renumber();
    } else
    {  document.getElementById("rangeTextArea").style.display = "block";
        if (columnSel)
            columnSel.parentElement.style.display = "block";
    }
    
}

function pickChild()
{
    var div = widgetSelectorDiv;
    var targetElement = div.targetElement;
    targetElement = targetElement.firstElementChild;
    if (!targetElement)
    { alert("no more elements");return;}
    widgetSelect(div,targetElement,0);
}

function pickElement(targetElement)
{
    var linkedElement = targetElement;
    if (!targetElement || targetElement instanceof MouseEvent)
    {
        var obj = event.target;
        linkedElement = obj.linkedElement;
    }

    var bnd = linkedElement.getBoundingClientRect();

    var div = widgetSelectorDiv;
    div.style.display="block";
    var treeElement = div.targetElement.treeElement;
    var cls = treeElement.getAttribute("class"); if (cls.indexOf("elementHasAction") > -1) cls = "adlerBase elementHasAction"; else cls = "adlerBase";
    treeElement.setAttribute("class",cls);
    
    //
    //get showDiv, set and show
    var horizBound = showDiv.horizBound; var vertBound = showDiv.vertBound;
    var sStyle = showDiv.style; var hStyle = horizBound.style;var vStyle = vertBound.style;
    sStyle.left = bnd.left + window.scrollX + "px";sStyle.top  = bnd.top + window.scrollY + "px";
    vStyle.left = bnd.left + window.scrollX +"px";hStyle.top = bnd.top + window.scrollY + "px";
    
    sStyle.width = bnd.width + "px";sStyle.height = bnd.height + "px";
    vStyle.width = bnd.width + "px";hStyle.height = bnd.height + "px";
    
    sStyle.zIndex = "9999";vStyle.zIndex = "9999";hStyle.zIndex = "9999";
    widgetSelectorDiv.style.display = "none";treeView.style.display = "none";
    
    sStyle.display = "block";vStyle.display = "block";hStyle.display = "block";
    
    setTimeout(function() {showDiv.style.zIndex = 999;showDiv.horizBound.style.zIndex = 999;showDiv.vertBound.style.zIndex = 999;
               widgetSelectorDiv.style.display = "block";treeView.style.display = "block";
               widgetSelect(div,linkedElement,0);
               },900);
    
    //
}


function pickParent()
{
    var div = widgetSelectorDiv;
    var targetElement = div.targetElement;
    targetElement = targetElement.parentElement;
    if (!targetElement)
    { alert("no more elements");return;}
    widgetSelect(div,targetElement,0);
}

function pickSibling()
{
    var div = widgetSelectorDiv;
    var targetElement = div.targetElement;
    var t = targetElement.nextElementSibling;
    if (!t)
    {	var t1 = div.targetElement.parentElement.firstElementChild;
        if (targetElement === t1)
        {alert("no sibling elements ");return;}
        else targetElement = t1;
    } else targetElement = t;
    widgetSelect(div,targetElement,0);
}

function pickTab()
{
    //widgetSelect(div,targetElement);
    var div = widgetSelectorDiv;
    var targetElement = div.targetElement;
    var obj = event.target;
    
    var tabs = document.getElementsByName("tabs"); var tLen = tabs.length;
    for (var i = 0;i < tLen;i++)
    {
        var tb = tabs[i];
        if (tb === obj)
        {
            var activeTab = div.getElementsByClassName("tabActive")[0];
            activeTab.setAttribute("class","adlerBase tab1");
            tb.setAttribute("class","adlerBase tab1 tabActive");
            widgetSelect(div,targetElement,i);
        }
    }
}

function removeAction()
{
    var div = widgetSelectorDiv;
    var tabIndex = div.tabIndex;
    var mark4Deletion = -1;
    var targetElement = div.targetElement;
    var adlerAction = targetElement.getAttribute("data-adr-action");
    var actionSeq = 0; var actionSeqArray = [];
    if (adlerAction)
    {
        actionSeqArray = JSON.parse(adlerAction);
        var aLen = actionSeqArray.length;
        for (var i = aLen - 1;i > -1;i--)
        {
            if (i === tabIndex)
            {
                actionSeq = actionSeqArray[i];
                mark4Deletion = actionSeq;
                actionSeqArray.splice(i,1);
                break;
            }
            
        }
        if (aLen === 1) targetElement.removeAttribute("data-adr-action");
        else targetElement.setAttribute("data-adr-action",JSON.stringify(actionSeqArray));
    }
    else return;
    var te = targetElement.treeElement;if (te) te.setAttribute("class","adlerBase");
    adjustActions(mark4Deletion);
    
    showTip("Widget removed");
    closeWidgetSelector(div);
}
function adjustActions(mark4Deletion)
{
    var aLen = actionArray.length;
    for (var i = aLen - 1; i > mark4Deletion;i--)
    {
        var act = actionArray[i];
        var obj = document.getElementById(act.id); if (!obj) continue;
        adlerAction = obj.getAttribute("data-adr-action");
        if (adlerAction)
        {
            actionSeqArray = JSON.parse(adlerAction);
            var aLen = actionSeqArray.length;
            for (var a = aLen - 1;a > -1;a--)
            {
                actionSeq = actionSeqArray[a];
                if (actionSeq > mark4Deletion) actionSeqArray[a] = (actionSeq - 1); // 1 less because we will delete one
            }
            obj.setAttribute("data-adr-action",JSON.stringify(actionSeqArray));
        }
        else continue;
    }
    actionArray.splice(mark4Deletion,1);
}

function pickStore(div)
{
    
    var storeSel = event.target;
    storeName = storeSel.options[storeSel.selectedIndex].text;
    if (storeName === "Memory Stores")
    {
        injectMemoryStores(storeSel);
        return;
    }   else if (storeName === "Other Stores")
    {
        storeSel.innerHTML = fillStore();
        return;
    }
    
    var columnSel = document.getElementById("columnSel");
    var div = storeSel.parentElement.parentElement;
    var target = div.targetElement;
    
    div.storeName = storeName
    addColumnList(storeName,columnSel);
}

function injectMemoryStores(storeSel)
{
    var str = "<option>- Memory Stores -</option>";
    var mLen = AdlerMemory.stores.length;
    for (var m = 0; m < mLen;m++)
    {
        str += "<option>"+AdlerMemory.stores[m]+"</option>";
    }
    storeSel.innerHTML = str + "<option>Other Stores</option>";
}

function pickExtraColumn()
{
    var obj = event.target; var index = obj.selectedIndex;
    var columnDivs = document.getElementsByName("columnSel");
    
    for (var i = columnDivs.length - 1;i > -1;i--)
    {
        var columnObj = columnDivs[i];
        if (columnObj.selectedIndex === 0)
            columnObj.selectedIndex = index;
    }
}

function locationApply()
{
    action.instruction = "LOCATION";
    var i = findAction({instruction:"LOCATION"});
    if (i != null) actionArray[i] = action;
    else  actionArray.push(action); // you should actually check to see if this was added earlier.
    alert("GPS Location widget added ");
    action = {};
}

function CommunicationApply()
{
    var obj = prepForAction("Communication"); var div = obj.div; var actionSeq = obj.actionSeq;
    var commSel = document.getElementById("commSel");
    var storeSel = document.getElementById("storeSel");
    var columnSel = document.getElementById("columnSel");
    
    if (storeSel.selectedIndex === 0)
    {
        alert("please pick a store");
        return;
    }
    if (columnSel.selectedIndex === 0 && !action.customFunction)
    {
        alert("please pick a column");
        return;
    }
    
    action.storeName = storeSel.options[storeSel.selectedIndex].text;
    if (!action.customFunction)
        action.column = columnSel.options[columnSel.selectedIndex].text;
    action.instruction = commSel.options[commSel.selectedIndex].text;
    columnSel.selectedIndex = 0;
    
}

function prepForAction(widget)
{
    var div = widgetSelectorDiv;
    var tabIndex = div.tabIndex;
    var targetElement = div.targetElement;
    if (!widget)
        action.instruction = div.widgetPick;
    else
        action.instruction = widget;
    
    var oId = targetElement.getAttribute("id");
    var newAction = true;
    if (idObject[oId]) newAction = false;

    if (targetElement.id)
    {
        id = targetElement.id;
        // check to see if id is duplicate
        if (newAction)
        {check4Dups(id,targetElement,action);}
    }
    else
    {
        id = "adler"+actionSeq;
        targetElement.setAttribute("id",id);
    }
    var actionSeq = 0;
    if (newAction) idObject[oId] = {"actions":[action]};
    else
    {
        // find the seq
        var actions = idObject[oId].actions; var aLen = actions.length;
        for (var i = 0; i < aLen;i++)
        {
            var act = actions[i];
            if (act.instruction === action.instruction)
            {
                if (act.storeName && act.storeName == action.storeName)
                { actionSeq = i;break;}
            }
        }
    }
    
    var allInputs = div.getElementsByTagName("INPUT");
    for (var i = allInputs.length -1; i > -1;i--)
    {
        var inp = allInputs[i]; var iid = inp.getAttribute("id");
        if (inp.value)
        {
            action[iid] = inp.value;
        } else if (action[iid]) delete action[iid];
    }
    
    var te = targetElement.treeElement;if (te) te.setAttribute("class","adlerBase elementHasAction elementSelected");
    closeWidgetSelector(div);
    
    return {"div":div,"actionSeq":actionSeq};
}

function check4Dups(id,targetElement,currentAction)
{
    var match = 0; var newId = id;
    for (var i = actionArray.length - 2;i > -1;i--)
    {
        var act = actionArray[i];
        if (act.id === currentAction.id && act.widget === currentAction.widget)
        { 	match++;  newId = id+"-DUP"+match;
            targetElement.setAttribute("id",newId);
        }
    }
    
    if (match > 0)
        currentAction.id = newId;
}

function copyApply()
{
    var obj = prepForAction(); var div = obj.div; var actionSeq = obj.actionSeq;
    action.instruction = "Assign";
    var storeSel = document.getElementById("storeSel");
    action.storeName = storeSel.options[storeSel.selectedIndex].text;
    var columnSel = document.getElementById("columnSel");
    action.column = columnSel.options[columnSel.selectedIndex].text;
    var toStoreSel = document.getElementById("toStoreSel");
    action.toStoreName = toStoreSel.options[toStoreSel.selectedIndex].text;
}

function ValidApply()
{
    var targetElement = widgetSelectorDiv.targetElement;var nodeName = targetElement.nodeName;
    if (nodeName === "INPUT" || nodeName === "TEXTAREA" || nodeName === "SELECT")
    {
        var obj = prepForAction(); var div = obj.div; var actionSeq = obj.actionSeq;
        action.instruction = "valid";
        var validSel =  document.getElementById("validSel");
        var valid =  validSel.options[validSel.selectedIndex].text;
        action.valid = valid;
        var evnt = "onblur"; action.from = "value";
        if (nodeName === "SELECT") {evnt = "onchange";action.from = "text"}
        else if (nodeName === "INPUT") { var type = targetElement.type.toLowerCase();
      	   	if (type === "checkbox" || type === "radio") {evnt = "onclick"; action.from = "checked"}
        }
        
        action.event = evnt;
    } else alert("Can't apply edit validation on a non editable element "+nodeName);
}

function CustomApply()
{
    var obj = prepForAction(); var div = obj.div; var actionSeq = obj.actionSeq;
    action.instruction = "eventTrigger";
    var eventSel =  document.getElementById("eventSel");
    var evnt =  eventSel.options[eventSel.selectedIndex].text;
    action.event = evnt;
    var storeSel = document.getElementById("storeSel");
    action.storeName = storeSel.options[storeSel.selectedIndex].text;
}

function ClickApply()
{
    var obj = prepForAction(); var div = obj.div; var actionSeq = obj.actionSeq;
    var cActionSel = document.getElementById("clickSel");
    var act = cActionSel.options[cActionSel.selectedIndex].text;
    action.clickAction = act;
    action.event = "onclick";
    if (act === "PageNavigate")
    {
        var pageSel = document.getElementById("pageSel");
        action.page = pageSel.options[pageSel.selectedIndex].text;
        action.currentPage = sessionStorage["adler-pageName"];
    } else if (act === "Take Picture" || act === "Open Address Book")
    {
        action.storeName = "IGNORE";
    } else
    {
        var storeSel = document.getElementById("storeSel");
        action.storeName = storeSel.options[storeSel.selectedIndex].text;
    }
    
}

function PageNavigationApply()
{
    var obj = prepForAction(); var div = obj.div; var actionSeq = obj.actionSeq;
    action.instruction = "PageNavigate";
    var pageNavSel = document.getElementById("pageNavSel");
    var pageSel = document.getElementById("pageSel");
    action.event = pageNavSel.options[pageNavSel.selectedIndex].text;
    action.page = pageSel.options[pageSel.selectedIndex].text;
    action.currentPage = sessionStorage["adler-pageName"];
}

function dataExtraApply()
{
    dataApply(true); // ignoreColumn
    //var obj = prepForAction(); var div = obj.div; var actionSeq = obj.actionSeq;
    var extraDiv = document.getElementById("extraDiv");
    var extraType = extraDiv.extraType;
    //action.instruction = extraType;
    var columnDivs = document.getElementsByName("columnExtraSel");
    var condDivs = document.getElementsByName("condSel");
    var datas = null;var filter = false;
    if (extraType === "filter")
    {datas = document.getElementsByName("filterval");filter = true;}
    else  datas = document.getElementsByName("orderSel");
    var len = datas.length; var details = new Array();
    for (var i = 0; i < len;i++)
    {
        var dataObj = datas[i];
        var detail = {"type":extraType,"seq":i,"val":""};
        if (filter)
            detail.val = dataObj.value;
        else
        {
            if (dataObj.selectedIndex === 1)
                detail.val = 1;
            else if (dataObj.selectedIndex === 2) detail.val = -1;
        }
        if (detail.val)
        {  var columnDiv = columnDivs[i];
            detail.column = columnDiv.options[columnDiv.selectedIndex].text;
            if (filter)
                detail.cond = condDivs[i].options[condDivs[i].selectedIndex].text;
        }
        details.push(detail);
        
    }
    action.detail = details;
    closeExtra();
}
function formApply(ignoreCol)
{
    var obj = prepForAction(); var div = obj.div; var actionSeq = obj.actionSeq;

    var targetElement = div.targetElement;
    
    var storeSel = document.getElementById("storeSel");
    var columnSel = document.getElementById("columnSel");
    var optionSel = document.getElementById("optionSel");
    var validSel = document.getElementById("validSel");

    action.storeName = storeSel.options[storeSel.selectedIndex].text;
        
    checkStore(storeSel);
    action.column = columnSel.options[columnSel.selectedIndex].text;
    if (optionSel.selectedIndex > 0) action.Optional = true;
    else action.Optional = false;
    
    if (validSel.selectedIndex > 0)
        action.Validation = validSel.options[validSel.selectedIndex].text;

    return;
}

function repeatApply(ignoreCol)
{
    var obj = prepForAction(); var div = obj.div; var actionSeq = obj.actionSeq;
    
    var targetElement = div.targetElement;
    
    if (targetElement.nodeName === "SELECT") action.type = "repeatSelect";
    else {
        
        action.type = "repeat";
    }
    var storeSel = document.getElementById("storeSel");
   
    action.storeName = storeSel.options[storeSel.selectedIndex].text;
    
    checkStore(storeSel);
    
    return;
}

function fillApply(ignoreCol)
{
    var obj = prepForAction(); var div = obj.div; var actionSeq = obj.actionSeq;
    
    var targetElement = div.targetElement;

    var fillTypeSel = document.getElementById("fillTypeSel");
    var storeSel = document.getElementById("storeSel");
    var columnSel = document.getElementById("columnSel");
    action.storeName = storeSel.options[storeSel.selectedIndex].text;
    
    checkStore(storeSel);
    action.column = columnSel.options[columnSel.selectedIndex].text;
    if (fillTypeSel.selectedIndex === 1) action.assignType = "once";
    else action.assignType = "multi";
    
    return;
}

function parmCheck()
{
    var jsonDiv = document.getElementById("jsonDiv");
    var rows = jsonDiv.getElementsByTagName("tr");
    var inputs = jsonDiv.getElementsByTagName("input");
    if (inputs[inputs.length - 2].value)
    {
   	 	// insert another row
   	 	var tr = document.createElement("tr");
   	 	tr.innerHTML = "<td><input class=\"adlerBase\" onblur=\"parmCheck()\" style=\"border:1px solid;padding:10px;margin:10px;\" type=\"text\" placeholder=\"name\"></td><td><input class=\"adlerBase\" style=\"border:1px solid;padding:10px;margin:10px;\" type=\"text\" placeholder=\"value\"></td>";
		var tb = rows[0].parentElement;var lastRow = rows[rows.length - 1];
		tb.insertBefore(tr,lastRow);
    }
}

function memParmCheck()
{
    var plus = event.target;
    var memoryDiv = document.getElementById("memoryDiv");
    var rows = memoryDiv.getElementsByTagName("tr");
    var inputs = memoryDiv.getElementsByTagName("input");
    if (inputs[inputs.length - 2].value)
    {
   	 	// insert another row
   	 	var tr = document.createElement("tr");
   	 	tr.innerHTML = "<td><input class=\"adlerBase\"  style=\"border:1px solid;padding:10px;margin:10px;\" type=\"text\" placeholder=\"Column\"></td>";
		var tb = rows[0].parentElement;var lastRow = rows[rows.length - 1];
		tb.insertBefore(tr,lastRow);
		var td = document.createElement("td"); td.appendChild(plus);
		tr.appendChild(td);
    }
}

function renumber()
{
    var stepCounts = document.getElementsByName("stepCount"); var counter = 1;
    for (var i = 0; i < stepCounts.length;i++)
    {
        var step = stepCounts[i]; if (step.parentElement.style.display === "none") continue;
        stepCounts[i].innerHTML = counter++ +".";
    }
    
}

function findAction(actionSample)
{  var found = false;
	for (var i = actionArray.length - 1; i > -1; i--)
	{ var act = actionArray[i];
		for (var k in actionSample)
		{
			if (!act[k]) {found = false; break;}
			if (actionSample[k] !== act[k]) {found = false; break;}
			found = true;
		}
		if (found) return i;
	}
	return null;
}

function saveCustomFunction()
{
    var jsEditor = document.getElementById("jsEditor");
    var js = jsEditor.value;var pos = js.indexOf("(");var keywords = js.substring(0,pos);
    var type = jsEditor.functionType;
    // parse function
    var arr = keywords.split(" ");var funcName = arr[arr.length -1];
    if (!jsObject[funcName])
    {
   	 	var opt = document.createElement("option");
   	 	opt.innerHTML = funcName;
   	 	var jsList = document.getElementById("jsList"); jsList.appendChild(opt);
    }
    jsObject[funcName] = js;
    closeJsEditor();
    
    if (type === 1)
   	 	action.customFunction = funcName;
    else action.postFunction = funcName;
    
    if (action.widget === "onLoad")
    {
		// find and push
		var i = findAction({widget:"onLoad"});
        action.instruction = "";
		if (i != null) actionArray[i] = action;
		else actionArray.push(action);
    }
}

function saveHTML()
{
    var htmlEditor = document.getElementById("htmlEditor");
    var garbage = document.getElementById("garbage");
    if (!garbage)
        garbage = document.createElement("garbage");
    garbage.innerHTML = htmlEditor.value;
    var div = widgetSelectorDiv;
    var targetElement = div.targetElement;
    var parent = targetElement.parentElement;
    parent.insertBefore(garbage.firstElementChild,targetElement);
    garbage.appendChild(targetElement);
    garbage.innerHTML = "";
    // rebuild the tree
    rebuildTree();
    closeHTMLEditor();
}

function assignStore(storeSel)
{
    var columnSel = document.getElementById("columnSel");
    var found = false;
    for (var i = storeSel.options.length - 1;i > -1;i--)
    {
        if (storeSel.options[i].text === action.storeName)
        {found = true;storeSel.selectedIndex = i;addColumnList(action.storeName,columnSel);break;}
    }
    
    if (!found)
    {
        if (storeSel.options[0].text.indexOf("Memory Stores") > -1)
        {
            storeSel.innerHTML = fillStore();
        }   else
        {
            injectMemoryStores(storeSel);
        }
        for (var i = storeSel.options.length - 1;i > -1;i--)
        {
            if (storeSel.options[i].text === action.storeName)
            {storeSel.selectedIndex = i;addColumnList(action.storeName,columnSel);break;}
        }
    }
}

function setStore(action,widget)
{ var actionPicked = false;
    var storeSel = document.getElementById("storeSel");
    var columnSel = document.getElementById("columnSel");
    var actionSel = document.getElementById("actionSel"); if (!actionSel) actionSel = {"options":[""],"selectedIndex":0};
    if (action.widget === "Click")
    {
        for (var i = storeSel.options.length - 1;i > -1;i--)
        {
            if (storeSel.options[i].text === action.storeName)
            {storeSel.selectedIndex = i;addColumnList(action.storeName,columnSel);break;}
        }
        for (var i = actionSel.options.length - 1;i > -1;i--)
        {
            if (actionSel.options[i].text === action.instruction)
            {actionSel.selectedIndex = i;pickAction({target:actionSel});actionPicked = true;break;}
        }
        var pageSel = document.getElementById("pageSel");
        if (action.instruction === "PageNavigate")
        {
            for (var i = pageSel.options.length - 1;i> -1;i--) if (pageSel.options[i].text === action.page) {pageSel.selectedIndex = i;break;}
        } else
            hideDom(pageSel.parentElement);
		
    } else if ( action.storeName)
    {
        var found = false;
        for (var i = storeSel.options.length - 1;i > -1;i--)
        {
            if (storeSel.options[i].text === action.storeName)
            {found = true;storeSel.selectedIndex = i;addColumnList(action.storeName,columnSel);break;}
        }
        
        if (!found)
        {
            // check in the memory table
            injectMemoryStores(storeSel);
            for (var i = storeSel.options.length - 1;i > -1;i--)
            {
                if (storeSel.options[i].text === action.storeName)
                {storeSel.selectedIndex = i;addColumnList(action.storeName,columnSel);break;}
            }
        }
        
        if (action.column)
        {
            for (var i = columnSel.options.length - 1;i > -1;i--)
            {
                if (columnSel.options[i].text === action.column)
                {columnSel.selectedIndex = i;break;}
            }
        } else { if (columnSel) columnSel.selectedIndex = 0;}
        
        if (action.customFunction)
        {
            var jsList = document.getElementById("jsList"); var jsEditor = document.getElementById("jsEditor");
            for (var i = jsList.options.length - 1;i > -1;i--)  if (jsList.options[i].text === action.customFunction) {jsList.selectedIndex = i;jsEditor.value = jsObject[action.customFunction];break;}
        }
        
        for (var i = actionSel.options.length - 1;i > -1;i--)
        {
            if (actionSel.options[i].text === action.instruction)
            {actionSel.selectedIndex = i;pickAction({target:actionSel});actionPicked = true;break;}
        }
        
    } else
    {
        if (widget === "Page Navigate")
        {
            if (action.page)
            {
                var pageNavSel = document.getElementById("pageNavSel");
                var pageSel = document.getElementById("pageSel");
                for (var i = pageNavSel.options.length - 1;i > -1;i--) if (pageNavSel.options[i].text == action.event) {pageNavSel.selectedIndex = i;break;}
                for (var i = pageSel.options.length - 1;i> -1;i--) if (pageSel.options[i].text === action.page) {pageSel.selectedIndex = i;break;}
            }
        } else
        {
            if (columnSel)
                columnSel.selectedIndex = 0;
        }
        
    }
    if (action.widget === "Custom")
    {
        // get the right event trigger
        var eventSel = document.getElementById("eventSel");
        for (var i = eventSel.options.length - 1;i> -1;i--) if (eventSel.options[i].text === action.event) {eventSel.selectedIndex = i;break;}
        actionPicked = true;
    }
    
    if (!actionPicked)
        pickAction({"target":actionSel});
    
}

function showJsonWidget()
{
    var i = findAction({"instruction":"GETJSON"});
	if (i != null) action = actionArray[i];
	var query = {}; if (action.query) query = action.query;
	var nameStr = 	"<input class=\"adlerBase\" onblur=\"parmCheck()\" style=\"border:1px solid;padding:10px;margin:10px;\" type=\"text\" placeholder=\"name\"";
	var valStr = "<input class=\"adlerBase\" style=\"border:1px solid;padding:10px;margin:10px;\" type=\"text\" placeholder=\"value\"";
	var rowsStr = ""; var sUrl = "";
	if (action.query)
	{
		for (var k in action.query)
		{
			rowsStr += "<tr><td>"+nameStr+" value=\""+k+"\"></td><td>"+valStr+" value=\""+action.query[k]+"\"></td></tr>";
		}
		sUrl = action.serverURL;
	}
	rowsStr += "<tr><td>"+nameStr+"></td><td>"+valStr+"></td></tr><tr><td>"+nameStr+"></td><td>"+valStr+"></td></tr>";
    
	
   	var div = document.createElement("div");
   	div.setAttribute("class","adlerBase");div.setAttribute("style","z-index:100;position:absolute;left:35%;top:20%;width:380px;height:auto;border:1px solid silver;box-shadow:5px 5px 6px silver;padding:10px;background-color:white");
   	div.setAttribute("id","jsonDiv");
    var html =
	"	<label  class=\"adlerBase\">Server Url</label><input type=\"text\" style=\"width:360px;border:1px solid;padding:10px;margin:10px;\" class=\"adlerBase\" placeholder=\"http://serverurl here\" value=\""+sUrl+"\" />"+
	"	<table  class=\"adlerBase\" style=\"padding:10px;\">"+
	"		<tr><td  class=\"adlerBase\" colspan=\"2\">Query Parameters</td></tr>"+
	rowsStr+
	"		<tr><td><a class=\"adlerBase btns float2\" onclick=\"jsonApply()\">Apply</a></td><td><a class=\"adlerBase btns float2\" onclick=\"trashDom('jsonDiv')\" >Cancel</a></td></tr>"+
	"	</table>";
	div.innerHTML = html;
	document.body.appendChild(div);
}

function showPageWidget()
{
    
    action = {};
    var pageSel = document.getElementById("pageWidgetList");
    var pageSelIndex = pageSel.selectedIndex;
    var opt = pageSel.options[pageSelIndex].text;
    if (pageSelIndex === 1)
    {
        dblclick = true;action = {};
        var jsDiv = document.getElementById("adlerJSEdit");
        var jsEditor = document.getElementById("jsEditor");
        jsDiv.style.display = "block";
        var i = findAction({widget:"onLoad"});
        if (i != null) {action = actionArray[i]};
        action.instruction = "";
        if (action.postFunction)
        {
            jsEditor.innerHTML = jsObject[action.postFunction];
            var jsList = document.getElementById("jsList");
            for (var i = jsList.length - 1;i > -1;i--)  if (jsList.options[i].text === action.postFunction) {jsList.selectedIndex = i;jsEditor.value = jsObject[action.postFunction];break;}
        }
        else
            jsEditor.innerHTML = "function init()\r\n{\r\n return ;\r\n};";
        action.widget = "onLoad";
   	  	pageSel.selectedIndex=0;
   	  	
    } else if (pageSelIndex === 2)
    {
		action.widget = "loadJSONP";
   	  	showJsonWidget();
   	  	pageSel.selectedIndex=0;
   	  	
    } else if (pageSelIndex === 3)
    {
		// check to see if location widget exist, if it does, use that instead
		var i = findAction({instruction:"LOCATION"});
		if (i != null)  action = actionArray[i];
      	else  action.widget = "getLocation";
		showJsOptions();
   	  	pageSel.selectedIndex=0;
    }
}

function underConn()
{
    alert("Under Construction but we recorded that you want this feature");
}

var stepActionMapping = {
    "clickSel":{"actionKey":"clickAction","func":"pickClickAction"},
    "actionSel":{"actionKey":"instruction"},
    "storeSel":{"actionKey":"storeName","func":"assignStore"},
    "columnSel":{"actionKey":"column"},
    "pageSel":{"actionKey":"page"},
    "optionalSel":{"actionKey":"Optional"},
    "validSel":{"actionKey":"Validation"},
    "fillTypeSel":{"actionKey":"assignType"}
};

function showTip(msg)
{
    if (!AdlerStorage.tip) {AdlerStorage.tip = document.createElement("div"); AdlerStorage.tip.setAttribute("class","class_tooltip adlerbase");
        AdlerStorage.tip.setAttribute("style","visibility:hidden;opacity:0;z-index:1");
        document.body.appendChild(AdlerStorage.tip);
    }
    var tip = AdlerStorage.tip;
    AdlerStorage.tip.style.visibility = "visible";
    tip.innerHTML = msg; tip.style.zIndex = 9000; setTimeout('AdlerStorage.tip.style.opacity = "1.0"',50);
    setTimeout('AdlerStorage.tip.style.visibility = "hidden";AdlerStorage.tip.style.opacity = "0";AdlerStorage.tip.style.zIndex = "0"',1200);
}

function widgetSelect(div,targetElement,tabIndex)
{
    div.targetElement = targetElement;
    // get treelement
    var treeElement = targetElement.treeElement; var cls = treeElement.getAttribute("class") + " elementSelected";
    treeElement.scrollIntoView(true); treeElement.setAttribute("class",cls);var tb = treeElement.getBoundingClientRect();
    
    treeViewDiv.scrollTop =  treeViewDiv.scrollTop - 100;
    treeViewDiv.scrollLeft = treeElement.offsetLeft - 140;
    
    div.tabIndex = tabIndex;
    var nodeName = targetElement.nodeName;
    var content =  "";
    if (nodeName === "IMG")
        content = targetElement.src;
    else
        content = targetElement.innerHTML;
    var s_widget = document.getElementById("s_widget"); var currentIndex = s_widget.selectedIndex; var widget = s_widget.options[currentIndex];
    action = {};
    
    var oId = targetElement.getAttribute("id");
    if (oId)
    {
        try {
        if (!idObject) idObject = {};
        } catch (e) {idObject = {};}
        var idO = idObject[oId];
        if (idO)
        {
            var actions = idO.actions;
            if (actions.length > 0)
            action = actions[0];
        }
    }

    var removeActionObj = document.getElementById("removeActionImg");
    if (action.instruction)
    {
        var widgetJson = null;
        widget = action.instruction;
        for (var i = s_widget.options.length - 1; i > -1; i--) if (s_widget.options[i].value === action.instruction) {s_widget.selectedIndex = i;break;}
        if (currentIndex !== s_widget.selectedIndex) widgetJson = inner_html(div,s_widget.selectedIndex,s_widget);
        // added on 11/22/2014 to handle individual steps initiatialization
        if (!widgetJson)
            for (var i = dynamicJson.length -1;i >-1;i--)
                if (dynamicJson[i].widget === widget)
                {widgetJson = dynamicJson[i];break;}
        
        for(var j=0;j < widgetJson.steps.length;j++) // go through the json steps
        {
            var step = widgetJson.steps[j];
            var obj = document.getElementById(step.id); var map = stepActionMapping[step.id];
            if (!map) continue; if (map.func) {window[map.func].call(null,obj);continue;};
            
            var actionKey = map.actionKey;
            if (step.inputType === "input")
            {
                j=j;
            } else if (step.inputType === "select")
            {
                for (var i1 = obj.options.length - 1;i1 > -1;i1--)
                {
                    if (obj.options[i1].text === action[actionKey])
                    {obj.selectedIndex = i1;break;}
                }
            }
            
            if (step.event) { for (var k in step.event) {
                try{   window[step.event[k]].call(null,{target:obj}); } catch(e) {}
            }; };
        }
        var divE = document.getElementById("extraInfo");
        if (action.customFunction || action.postFunction)
        {
            var dyn = document.getElementById("dynamic");
            var append = false;
            if (!divE)
            { append = true;
                divE = document.createElement("div");divE.setAttribute("class","adlerBase step");divE.setAttribute("style","height:49px");divE.setAttribute("id","extraInfo");
            }
            
            var str = "&nbsp;&nbsp;"; if (action.customFunction) str = "Function Before - "+action.customFunction+" &nbsp; ";
            if (action.postFunction) str = "Function After - "+action.postFunction;
            divE.innerHTML =str; if (append) dyn.appendChild(divE);
        } else
        {
            if (divE) trashDom(divE);
        }
        removeActionObj.style.visibility = "visible";
        setTimeout(function(){showTip(widget+" Widget Opened ");},500);
        //
    }  else {
        var extraInfo = document.getElementById("extraInfo");
        if (extraInfo) trashDom(extraInfo);
        if (tabIndex > 0)
        {
            s_widget.selectedIndex = 0;
            inner_html(div,0,s_widget,true);
        }
        removeActionObj.style.visibility = "hidden";
        setTimeout(function(){showTip("No Previously Defined Widget");},500);
    }
    
    //if (action.storeName) div.storeName = action.storeName;
    //setStore(action,widget);
    var nodeNameDisplay = document.getElementById("nodeNameDisplay");
    var tId = targetElement.getAttribute("id");var tClass = targetElement.getAttribute("class");
    var tName = nodeName; if (tId) tName = "<span style=''>#"+tId+"</span>"; else if (tClass) { tcArray = tClass.split(" "); tName += "."+tcArray[0]; }
    nodeNameDisplay.innerHTML = tName;
    var txtarea = div.getElementsByTagName("textarea")[0];
    if (txtarea) txtarea.value = content;
    
    treeViewDiv.style.height = div.offsetHeight+25+"px";
}

// utility
function resetSelection()
{
	var el = event.target;
	var sel = getInputSelection(el);
	if (action)
	{
		if (sel.start !== sel.end)
			action.range = sel;
	}
	//console.log("id "+action.id+" end "+action.range.end);
	return true;
}
function getInputSelection(el) {
    var start = 0, end = 0, normalizedValue, range,
    textInputRange, len, endRange;
    
    if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
        start = el.selectionStart;
        end = el.selectionEnd;
        el.setSelectionRange(1,1);
        el.selectionStart = 0;
        el.selectionEnd = 0;
    } else {
        range = document.selection.createRange();
        
        if (range && range.parentElement() == el) {
            len = el.value.length;
            normalizedValue = el.value.replace(/\r\n/g, "\n");
            
            // Create a working TextRange that lives only in the input
            textInputRange = el.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());
            
            // Check if the start and end of the selection are at the very end
            // of the input, since moveStart/moveEnd doesn't return what we want
            // in those cases
            endRange = el.createTextRange();
            endRange.collapse(false);
            
            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                start = end = len;
            } else {
                start = -textInputRange.moveStart("character", -len);
                start += normalizedValue.slice(0, start).split("\n").length - 1;
                
                if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                    end = len;
                } else {
                    end = -textInputRange.moveEnd("character", -len);
                    end += normalizedValue.slice(0, end).split("\n").length - 1;
                }
            }
        }
    }
    
    return {
    start: start,
    end: end
    };
}

function replaceSelectedText(el, text) {
    var sel = getInputSelection(el), val = el.value;
    el.value = val.slice(0, sel.start) + text + val.slice(sel.end);
}

function placeWindow(div,pos)
{
    if (!windowSize)
    {
        windowSize = {width:0,height:0};
        if( typeof( window.innerWidth ) == 'number' ) {
            //Non-IE
            windowSize.width = window.innerWidth;
            windowSize.height = window.innerHeight;
        } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
            //IE 6+ in 'standards compliant mode'
            windowSize.width = document.documentElement.clientWidth;
            windowSize.height = document.documentElement.clientHeight;
        } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
            //IE 4 compatible
            windowSize.width = document.body.clientWidth;
            windowSize.height = document.body.clientHeight;
        }
    }
    
    if ((pos.x+pos.w+50) > windowSize.width)
        pos.x =( windowSize.width - pos.w - 80);
    
    if ((pos.y+pos.h) > windowSize.height)
        pos.y = (windowSize.height - pos.h - 80);
    
    div.style.left = pos.x + "px";
    div.style.top = pos.y +"px";
    div.style.display="block";
    treeViewDiv.style.display = "block";
}

function customInit()
{
   	if (window.location.host.indexOf("localhost") > -1)
        virtual = "compressed";
   	
   	// build the tree
    var bd = document.body;
    treeViewDiv = document.createElement("div"); treeViewDiv.setAttribute("class","adlerBase treeView");treeViewDiv.setAttribute("id","treeView");
    treeViewDiv.setAttribute("style","display:none");
    var hObject = {"parent":treeViewDiv,"ulAdded":false};
    buildTree(bd,hObject,0);
    bd.appendChild(treeViewDiv);
    var treeClose = document.createElement("IMG");treeClose.setAttribute("style","width:30px;height:30px;padding-bottom:5px;");treeClose.setAttribute("class","adlerBase");treeClose.onclick = function(){
        hideDom(showDiv);
        hideDom(showDiv.horizBound);
        hideDom(showDiv.vertBound);
        hideDom(event.target.parentElement);
    }
    treeClose.src = "/beta/png/glyphicons_197_remove.png";
    var treeContainer = document.createElement("div"); treeContainer.setAttribute("style","overflow:scroll;width:100%;height:92%");treeContainer.setAttribute("class","adlerBase");treeContainer.setAttribute("id","treeContainer");
    treeContainer.appendChild(treeViewDiv.firstElementChild);
    treeViewDiv.appendChild(treeClose);treeViewDiv.appendChild(treeContainer);
    
        setTimeout(function() {
    // create div to show an element when selected
    showDiv = document.createElement("div");var horizBound  = document.createElement("div");var vertBound  = document.createElement("div");
    showDiv.setAttribute("class","adlerBase showDiv");showDiv.setAttribute("style","display:none;width:1px;height:1px;position:absolute;left:0px;top:0px;z-index:999;");
    showDiv.setAttribute("id","showDiv");
    
    horizBound.setAttribute("style","display:none;z-index:999;");horizBound.setAttribute("class","adlerBase horizBound");
    vertBound.setAttribute("style","display:none;z-index:999;");vertBound.setAttribute("class","adlerBase vertBound");
    
    showDiv.horizBound = horizBound; showDiv.vertBound = vertBound;
    
    document.body.appendChild(showDiv);
    document.body.appendChild(horizBound);
    document.body.appendChild(vertBound);
    
    loading = document.createElement("div");loading.setAttribute("style","visibility:hidden;position:absolute;z-index:10000;left:0px;top:0px;width:100%;height:100%;background:rgba(158,158,158,0.5);");
                   loading.setAttribute("id","loading"); loading.setAttribute("class","adlerBase");
    var loadingGif = document.createElement("img"); loadingGif.setAttribute("style","position:absolute;left:28%;top:29%;border-radius: 20px;");
                   loadingGif.setAttribute("class","adlerBase");
    loadingGif.src= "/"+virtual+"/adlericons/loading1.gif";
    loading.appendChild(loadingGif);
    document.body.appendChild(loading);
               },200);
    
    
   	// end of build Tree
    var hd = document.head;
    // get all scripts
    var scr = hd.getElementsByTagName("script");
    // go through all the local scripts and parse;
    scanScripts(scr);
    
    var script = document.createElement("script");
    script.setAttribute("name","adlerBase"); // so that it gets removed in future during re-edit
    script.setAttribute("src","AdlerGen/js/DBDef.js");
    script.setAttribute("type","text/javascript");
    hd.appendChild(script);
    
    script = document.createElement("script");
    script.setAttribute("name","adlerBase"); // so that it gets removed in future during re-edit
    script.setAttribute("src","AdlerGen/js/adlerStorage.js");
    script.setAttribute("type","text/javascript");
    hd.appendChild(script);
    
    script.onload = function() { // beginning of script onload
        
        addWidgetDiv();
        try {
            if (defineActions)
            {
                defineActions(); // this will define action array
                
                //restore the repeat elements
                for (var i = actionArray.length -1;i>-1;i--)
                {
                    action = actionArray[i];
					
                    if (action.instruction === "Repeat")
                        document.getElementById(action.id).setAttribute("style","");
                    else if (action.instruction === "Assign" && (action.innerHTML || action.src) )
                    {
                        var targetElement = document.getElementById(action.id);
                        var ndName = targetElement.nodeName.toLowerCase();
                        if (ndName === "img")
                            targetElement.src = action.src;
                        //else  this is creating problem when there are children with actions so commented for now
                        //targetElement.innerHTML = action.innerHTML;
                    }
                }
            }
            
            var customFunctions = document.getElementById("customFunctions");
            if (customFunctions)
            {
                // parse it and add to jsObject
                var jsList = document.getElementById("jsList");
                var jOptions = "<option>--function--</option>";
                var customScript = customFunctions.innerHTML;
                var nameArray = customScript.split("~--"); var nLen = nameArray.length;var toggle = true;var func = "";
                for (var i = 1; i < nLen;i++)
                {
                    if (toggle)
                    {
                        func = nameArray[i];
                        toggle = false;
                    } else
                    {
                        var script = nameArray[i]; var sLen = script.length - 19;
                        for (var s = script.length - 1;s > -1;s--) if (script[s] === "}") {sLen = s + 1;break;}
                        
                        script = script.substring(15,sLen);
                        jsObject[func] = script;
                        toggle = true;
                        jOptions += "<option>"+func+"</option>";
                    }
                    
                }
                jsList.innerHTML = jOptions;
                
            }
        } catch (e) {actionArray = new Array();}
        var flDetail = sessionStorage["adler-flowDetail"];
        Adler.flow = JSON.parse(flDetail);
        
        ADLER_PERMISSIONS =  localStorage["adler-permissions"];
        if (!ADLER_PERMISSIONS) ADLER_PERMISSIONS = {"flowName":Adler.flow.flowName,"dirty":true,"details":{"INTERNET":true}};
        else {
            ADLER_PERMISSIONS = JSON.parse(ADLER_PERMISSIONS);
            if (ADLER_PERMISSIONS.flowName != Adler.flow.flowName)
                ADLER_PERMISSIONS = {"flowName":Adler.flow.flowName,"dirty":true,"details":{"INTERNET":true}};
        }
        
	   	// end of script onload
    }
   	
}

function scanScripts(scrs)
{
    var sLen = scrs.length;
    for (var i = 0; i < sLen;i++)
    {
        var scr = scrs[i];
        if (scr.getAttribute("name") === "adlerBase") continue;
        var source = scr.getAttribute("src") ;
        if (source) continue;
        var fns = scr.innerHTML; fns = fns.split("function "); var fLen = fns.length;
        for (var f = 1; f < fLen ;f++)
        {
            var jText = fns[f]; words = jText.split(" ");
            var fName = words[0];var wLen = fName.length; var func = "";
            for (var w = 0; w < wLen ;w++)
            {
                var ch = fName[w];
                if (ch === "(") break;
                func += ch;
                
            }
            //fName = fName.replace(/[^a-zA-Z0-9_ .-]+/g, "");
            jsObject[func] = "";
            //console.log(fName);
        }
        
    }
}

function deleteElement()
{
    var div = widgetSelectorDiv;
    var targetElement = div.targetElement;
    trashDom(targetElement);
    closeWidgetSelector(div);
    // rebuild the tree
    rebuildTree();
}

function editElement()
{
    var adlerHTMLEdit = document.getElementById("adlerHTMLEdit");
    if (!adlerHTMLEdit)
    {
        var htmlDiv = document.createElement("div");
        htmlDiv.setAttribute("class","adlerBase");
        htmlDiv.setAttribute("style","position:absolute;left:5%;top:5%;width:80%;height:80%;display:block;z-index:1000;border:1px solid;background-color:white;box-shadow:6px 6px 8px;")
        htmlDiv.setAttribute("id","adlerHTMLEdit");
        htmlDiv.innerHTML = "<div class='adlerBase' style='width:96%;margin:2%'><a class='adlerBase btns float2' onclick='saveHTML()'>Save</a><a class='adlerBase btns float2' style='margin-left:5px' onclick='closeHTMLEditor()'>Cancel</a></div>" +
        "<textarea class=\"adlerBase\" id='htmlEditor' contentEditable='true' style=\"width: 94%;height: 80%;margin: 2%;padding: 1%;border: 1px solid;\"></textarea>";
        document.body.appendChild(htmlDiv);
    } else  adlerHTMLEdit.style.display = "block";
    
    var div = widgetSelectorDiv;
    var targetElement = div.targetElement;
    var htmlEditor = document.getElementById("htmlEditor");
    htmlEditor.value = targetElement.outerHTML;
    closeWidgetSelector(div);
}

function trashDom(div)
{
    if (typeof(div) === "string")
        div = document.getElementById(div);
    dblclick= false;
    var garbage = document.getElementById("garbage");
    if (!garbage)
        garbage = document.createElement("garbage");
    
    garbage.appendChild(div);
    garbage.innerHTML = "";
}

// custom help div
function customHelp(helpNo)
{
    if (!customHelpDiv)
    {
        customHelpDiv = document.createElement("DIV");  customHelpDiv.setAttribute("class","customHelpBox");
        customHelpDiv.innerHTML = "<img class=\"adlerBase\" style=\"position:relative;top:-7px;left:-6px;width:20px;height:20px;\" onclick='hideDom(this.parentElement)' src=\"/"+virtual+"/png/glyphicons_197_remove.png\"><div></div>";
        document.body.appendChild(customHelpDiv);
    } else customHelpDiv.style.display = "block";
    customHelpDiv.lastElementChild.innerHTML = helpList[helpNo];
    
}
// editor events

function defineJSEditorEvents()
{
    var textarea = document.getElementById("jsEditor");
    textarea.onkeydown = function(event) {
	    //support tab on textarea
	    if (event.keyCode == 9) { //tab was pressed
	        var textarea = event.target;
            event.preventDefault();
            var s = this.selectionStart;
            this.value = this.value.substring(0,this.selectionStart) + "\t" + this.value.substring(this.selectionEnd);
            this.selectionEnd = s+1;
	        return false;
	    }
    }
    /*
     if(event.keyCode == 8){ //backspace
     if (textarea.value.substring(textarea.getCaretPosition() - 4, textarea.getCaretPosition()) == "    ") { //it's a tab space
     var newCaretPosition;
     newCaretPosition = textarea.getCaretPosition() - 3;
     textarea.value = textarea.value.substring(0, textarea.getCaretPosition() - 3) + textarea.value.substring(textarea.getCaretPosition(), textarea.value.length);
     textarea.setCaretPosition(newCaretPosition);
     }
     }
     if(event.keyCode == 37){ //left arrow
     var newCaretPosition;
     if (textarea.value.substring(textarea.getCaretPosition() - 4, textarea.getCaretPosition()) == "    ") { //it's a tab space
     newCaretPosition = textarea.getCaretPosition() - 3;
     textarea.setCaretPosition(newCaretPosition);
     }
     }
     if(event.keyCode == 39){ //right arrow
     var newCaretPosition;
     if (textarea.value.substring(textarea.getCaretPosition() + 4, textarea.getCaretPosition()) == "    ") { //it's a tab space
     newCaretPosition = textarea.getCaretPosition() + 3;
     textarea.setCaretPosition(newCaretPosition);
     }
     }
     */
}


function makeIndexes()
{
    var repeatObjects = {};
    var assignObjects = {};
    var eventObjects = {"onclick":[]};
    var formObjects = {};
    var dataStores = {};
    var nestedRepeats= false;
    for (var id in idObject)
    {
        var actions = idObject[id].actions;
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
                var obj = document.getElementById(id);
                // check to see if repeat is nested or not
                var nested = -1;
                while(nested < 0 && obj)
                {
                    obj = obj.parentElement;
                    if (obj) {
                        if (obj === document.body) break;
                        var oId = obj.getAttribute("id");
                        if (oId) {
                            var odetail = idObject[oId];
                            if (odetail) {
                                var acts = odetail.actions;
                                for (var s = acts.length - 1;s> -1;s--)
                                {
                                    var oaction = acts[s];
                                    if (oaction.instruction === "Repeat") {action.type = "repeatNested";
                                                                            inx.nestedParent = {"id":oId,"seq":s};
                                                                            break;
                                                                            }
                                }
                            }
                        }
                    }
                }
                inx.type = action.type;
                
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
        var originalIdObjString =
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
    
    var actionString = "\r\n\t\t idObject = "+JSON.stringify(idObject)+";" +
    "\r\n\t\t repeatObject = "+JSON.stringify(repeatObjects) +";" +
    "\r\n\t\t assignObject = "+JSON.stringify(assignObjects) +";" +
    "\r\n\t\t eventObject = "+JSON.stringify(eventObjects) +";"  +
    "\r\n\t\t formObject = "+JSON.stringify(formObjects) +";"  +
    dataStoresString  +
    "\r\n\t\t " + originalIdObjString;
    return actionString;
}

// all drag related functions

function dragstartF(e) {
    e.dataTransfer.setData("Text",e.target.getAttribute("data-source"));
}

function dragenterF(e) {
    e.stopPropagation();
    e.preventDefault();
}

function dragoverF(e)
{
    e.stopPropagation();
    e.preventDefault();
    
    return true;
}

function dropObj(e)
{
    e.stopPropagation();
    e.preventDefault();
    
    var obj = e.target;
    var domseq = obj.getAttribute("data-seq");
    var data = e.dataTransfer.getData("Text");
    
    if (domseq)
    {
        var currentTag = {};
        domseq = parseInt(domseq);
        for (var i = docArray.length - 1; i  > -1;i--)
        {
            currentTag = docArray[i];
            if (currentTag.domSeq === domseq)
            {
                alert(" trying to drop "+data + " on dom  "+currentTag.tag );
                currentTag.source = data;
                var arr = data.split("[");
                currentTag.table = arr[0];
                var source = obj.getElementsByClassName("info");
                
                source[0].innerHTML = data;
                break;
            }
        }
    }
    
    
    //document.getElementById(data);
}

function dropF(e)
{
    
    e.stopPropagation();
    e.preventDefault();
    
    
    var dt = e.dataTransfer;
    var files = dt.files;
    
    // var pos = fixPosition(e, Adler.canvas);
    
    handleFiles(files);
    
    return false;
}

function handleFiles(files)
{
    for (var i = 0; i < files.length; i++)
    {
        var file = files[i];
        
        var fileType = file.type;
        var fileName = file.name;
        if (!fileType.trim())
        {
            if (fileName.indexOf(".json") > -1)
                fileType = "application/json";
            else if (fileName.indexOf(".htm") > -1)
                fileType = "text/html";
        }
        var reader = new FileReader();
        
        if (fileType === "text/html")
        {
            reader.onload = (function()
                             {
                             return function(e)
                             {
				        	 var h = e.target.result;
				        	 parseHTML(h);
                             };
                             
                             
                             })();
            
        } else if (fileType === "application/json")
        {
            reader.onload = (function()
                             {
                             return function(e)
                             {
				        	 AdlerStorage.json2DB(e.target.result);
				        	 alert("json scanned");
                             };
                             
                             
                             })();
        }
        reader.readAsText(file);
    }
}


