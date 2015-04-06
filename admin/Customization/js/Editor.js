
            window.onbeforeunload = function()
            {
                var msg = null;
                if (fileDirty)
                {
                    save2Local();
                }
                if (fileuploaded)
                {
                    return null;//"file Uploaded, Closing the Editor";
                }
                return null;
            }
        
        function save2Local()
        {
            var bkMarks = document.getElementsByName("bookMarks");
            var bkArray = [];
            var bkLen = bkMarks.length;
            for (var i = 0; i < bkLen ;i++)
            {
                var bkMark = bkMarks[i];
                
                var textareaScroll = bkMark.textareaScroll;
                var yPos = bkMark.yPos;
                var textareaPos = bkMark.textareaPos;
                var tagTxt = bkMark.tagTxt;
                var id = "";
                //bkMark.getAttribute("id");
                bkArray.push({"tagTxt":tagTxt,"yPos":yPos,"textareaScroll":textareaScroll,"textareaPos":textareaPos,"id":id});
            }
            
            if (idObjects) localStorage["Adler-Editor-"+filename+"-idObjects"] = makeIndexes();
            localStorage["Adler-Editor-"+filename+"-bkmarks"] = JSON.stringify(bkArray);
            localStorage["Adler-Editor-"+filename] = textarea.value;
        }
        
        var fileuploaded = false;
        var fileDirty = false;
        var textarea = null;
        var fileList = null;
        var shiftActive = false; gtActive = 0;var lastVerb = ""; var lastWord = "";
        var ctrlActive = false;
        var txtActive = false;
        var wordList = [];
        var noClosing = {"img":true,"input":true,"br":true};
        var prevS = 0;
        var enterTimer = 0;
        
        // bookmark
        var lineDiv = null;var finishFlag = null; var editorDim = null;
        
        // undo information
        var lineRangeStart = -1; var lineRangeEnds = -1;
        var selStart = -1; var selEnd = -1;
        var undoRecord = []; // contains object {rs:,re,prevLine}
        
        // assist related info
        var assistObj = null;
        
        function loadFile()
        {
            var fileListObj = document.getElementById("fileList");
            if (fileListObj.selectedIndex === 0 ) return;
            filename = fileListObj.options[fileListObj.selectedIndex].text;
            textarea.value = localStorage["Adler-Editor-"+filename] ;
            textarea.style.height = textarea.scrollHeight + "px";
            document.body.scrollTop = 0;
            finishFlag = document.getElementById("finishFlag");
            finishFlag.style.display = "none";
            var bkArray = localStorage["Adler-Editor-"+filename+"-bkmarks"];
            if (bkArray)
            {
                bkArray = JSON.parse(bkArray);
                var bkLen = bkArray.length;
                for (var i = 0; i < bkLen ;i++)
                {
                    var bkObj = bkArray[i];
                    //{"tag":tag,"y":y,"textareaScroll":textareaScroll}
                    var textareaScroll = bkObj.textareaScroll;
                    var textareaPos = bkObj.textareaPos;
                    var yPos = bkObj.yPos;
                    var tagTxt = bkObj.tagTxt;
                    //var id = bkObj.id;
                    createBkElement(yPos,textareaPos,textareaScroll,tagTxt);
                }
                lineDiv.noOfBk = bkLen;
            }
            
            // update current file
            
            //
            
            originalIdObjString = localStorage["Adler-Editor-"+filename+"-idObjects"];
            if (originalIdObjString)  {

                var start = originalIdObjString.indexOf("idObject");
                start = originalIdObjString.indexOf("{",start);
                var end = originalIdObjString.indexOf(";",start);
                var idObj = originalIdObjString.substring(start,end).trim(); var pos = idObj.indexOf("\n"); var cnt = 0;
                while (pos > -1) {
                    idObj = idObj.replace("\n","");
                    pos = idObj.indexOf("\n");cnt++;
                    if (cnt > 100) {alert("looping ");break;}
                }
                var adlerInitStart = originalIdObjString.indexOf("function adlerInit()",end);
                originalIdObjString = originalIdObjString.substring(adlerInitStart);
                try {
                    idObjects = JSON.parse(idObj);
                    var idListObj = document.getElementById("idListObj");
                    var option = "<option>--ID List--</option>";
                    for (var k in idObjects)
                    {
                        option += "<option>"+k+"</option>";
                    }
                    idListObj.innerHTML = option;
                }
                catch(e) { alert("error parsing action widgets. No widgets assigned ");}
            }
            setTimeout(populateIdsNFuncs,10);
        }
        
        function openFile()
        {
            var fl = document.getElementById("fileUpload");
            fl.click();
        }
        
        function handleFiles(files)
        {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                filename = file.name;
                doesFileExist(filename);
                var reader = new FileReader();
                reader.onload = (function(aTxtarea) { return function(e) {
                                 localStorage["Adler-Editor-"+filename] = e.target.result; ;
                                 var fileListObj = document.getElementById("fileList"); var found = false;
                                 for (var f = fileListObj.options.length - 1;f > -1;f--)
                                 {
                                 var fName = fileListObj.options[f].text;
                                 if (fName === filename) {
                                 found = true;
                                 fileListObj.selectedIndex = f;
                                 break;
                                 }
                                 }
                                 if (!found)
                                 {
                                 var fLen = fileListObj.options.length;
                                 var opt = document.createElement("option");
                                 opt.innerHTML = filename;
                                 fileListObj.appendChild(opt);
                                 fileListObj.selectedIndex = fLen;
                                 }
                                 loadFile();
                                 }; })(textarea);
                                 reader.readAsText(file);
            }
        }
        
        function doesFileExist(flName)
        {
            var fileListObj = document.getElementById("fileList");
            var found = false;
            for (var i = fileList.length - 1;i > -1;i--)
            {
                var file = fileList[i];
                if (file === flName) {found = true;fileListObj.selectedIndex = i;break;}
            }
            if (!found) {
                fileList.push(flName);
                localStorage["Adler-Editor-FileList"] = JSON.stringify(fileList);
                var opt = document.createElement("option");
                opt.innerHTML = flName;
                fileListObj.appendChild(opt);
                fileListObj.selectedIndex = fileList.length;
            }
        }
        
        function findNewRange()
        {
            //console.log("Finding new range s-"+selStart +" rs-" + lineRangeStart+" e-"+selEnd +" re-"+lineRangeEnds);
            var val = textarea.value;
            
            var i = selStart; var prevLineStart = lineRangeStart;
            
            while (val[i] !== "\n")
            {
                i--;
                lineRangeStart = i;
                if (i < 1) break;
            }
            if (i === selStart)
            {
                // if this happens means typeing too fast go back 1 and try again
                i--; if (selEnd === selStart) selEnd = i; selStart = i;
                while (val[i] !== "\n")
                {
                    i--;
                    lineRangeStart = i;
                    if (i < 1) break;
                }
            }
            
            if ( prevLineStart === lineRangeStart) {
                //console.log("Returning         s-"+selStart +" rs-" + lineRangeStart+" e-"+selEnd +" re-"+lineRangeEnds);
            return;}
            var i = selEnd; var totalLen = val.length;lineRangeEnds = i;
            
            while (val[i] !== "\n")
            {
                i++;
                lineRangeEnds = i;
                if (i > totalLen) break;
            }
            
            var prevLine = val.substring(lineRangeStart,lineRangeEnds); // check to see if you are covering every byte
            lineRangeEnds++;
            fileDirty = true;
            //undoRecord.push({"rs":lineRangeStart,"re":(lineRangeEnds+1),"prevLine":prevLine});
            //console.log("Added new range s-"+selStart +" rs-" + lineRangeStart+" e-"+selEnd +" re-"+lineRangeEnds);
        }
        
        function undoChanges()
        {
            return;
            var undoLen = undoRecord.length - 1;
            if (undoLen < 0) return;
            var val = textarea.value;
            var undoObj = undoRecord[undoLen];
            var i = undoObj.rs+1; var end = i;
            var totalLen = val.length;
            while (val[i] !== "\n")
            {
                i++;
                end = i;
                if (i > totalLen) break;
            }
            
            
            textarea.value = val.substring(0,undoObj.rs)+undoObj.prevLine+val.substring(end);
            undoRecord.pop();
        }
        
        var filename = "filename.txt";
        function assist() {
            var keyCode = event.keyCode;
            selStart = textarea.selectionStart;selEnd = textarea.selectionEnd;
            if ((selStart < lineRangeStart) || (selEnd > lineRangeEnds)) findNewRange();
            if (isAlphaN(keyCode))
            {
                if (ctrlActive)
                {
                    if (keyCode === 90) undoChanges();
                    else if (keyCode === 83) {undoRecord = [];
                        save2Local;
                    }
                    
                    return;
                }
                if (txtActive) return true;
                txtActive = textarea.selectionStart;
                assistObj.style.display = "none";
                return true;
            }
            if (assistObj.style.display === "block") assistObj.style.display = "none";
            //support tab on textarea
            if (keyCode === 9) { //tab was pressed
                event.preventDefault();
                if (shiftActive) return true;
                matchChar(null,"\t",true,true);
                return false;
            } else if (keyCode === 13)
            {
                if (!enterTimer)
                    enterTimer = setTimeout(newLine,200);
                    else {clearTimeout(enterTimer);enterTimer = setTimeout(newLine,200)};
                    
                return true;
            } else  if (keyCode === 16) // shift was pressed
            {
                shiftActive = true;
            }
            else  if (keyCode === 17) // shift was pressed
            {
                ctrlActive = true;
            } else  if (keyCode === 32) //space was pressed
            {
                if (gtActive)
                {
                    var s = textarea.selectionStart;
                    var val = textarea.value;
                    lastVerb = val.substring(gtActive,s);
                    gtActive = 0;
                } else {if (txtActive) pushWord();return true;}
            } else if (keyCode === 40)
            {
                if (shiftActive)
                    matchChar("(",")");
            } else if (keyCode === 188)
            {
                if (shiftActive) { gtActive = textarea.selectionStart+1; lastVerb = "";}
                
            } else if (keyCode === 190)
            {
                if (!shiftActive) {
                    if (txtActive) {
                        pushWord();
                    }
                return;}
                
                if (lastVerb) ;
                else if (gtActive) {
                    var s = textarea.selectionStart;
                    var val = textarea.value;
                    lastVerb = val.substring(gtActive,s);
                } else return true;
                if (!isAlphaN(lastVerb.charCodeAt(0))) return true;
                var lowerlastVerb = lastVerb.toLowerCase();
                if (noClosing[lowerlastVerb]) return true;
                
                matchChar(null,"</"+lastVerb+">");lastVerb = "";gtActive=0;
                
            } else if (keyCode === 191)
            {
                if (gtActive || lastVerb) {gtActive = 0;lastVerb = "";}
            }
            else if (keyCode === 219)
            {
                var ch = "]";var opening = "[";
                if (shiftActive)
                {ch = "}";opening = "{";}
                
                matchChar(opening,ch);
            } else if (keyCode === 222)
            {
                var ch = "'";
                if (shiftActive)
                    ch = '"';
                
                //matchChar(ch,ch);
            }
            //console.log(event.which);
            if (txtActive) {
                pushWord();
            }
        }
        
        function checkShift()
        {
            var keyCode = event.keyCode;
            if (keyCode === 16) shiftActive = false;
            else if (keyCode === 17) ctrlActive = false;
            else if (event.keyCode === 13) { //enter was pressed
                return true;
                //setTimeout(function(){textarea.selectionStart = prevS  ; textarea.selectionEnd = prevS;},1);
            }
        }
        
        function pushWord(){
            return;
            var s = textarea.selectionStart;
            var val = textarea.value;
            lastWord = val.substring((txtActive - 1),s);
            
            txtActive = 0;
            for (var i = wordList.length -1;i > -1;i--)
            {
                if (wordList[i] === lastWord) return;
            }
            wordList.push(lastWord);
        }
        
        function newLine()
        {
            clearTimeout(enterTimer);
            enterTimer = 0;
            if (assistObj.style.display === "block") assistObj.style.display = "none";
            var s= textarea.selectionStart ;
            var val = textarea.value;
            if (val.charAt(s - 1) === "\n") s--;
            prevS = s;var end = s;
            var i = s -1; var lineStarts = 0; var totalLen = val.length;
            while (val[i] !== "\n")
            {
                i--;
                lineStarts = i;
                if (i < 1) break;
            }
            // find first non space
            lineStarts++;
            i = lineStarts; var marginStarts = i;
            while (val[i] === " " || val[i] === "\t")
            {
                i++; if (i > totalLen) break;
                marginStarts = i;
            }
            lineStarts;
            var margin = "";
            if (marginStarts > lineStarts)
            margin = val.substring(lineStarts,marginStarts);
            prevS++;
            textarea.value = val.substring(0,prevS) + margin + val.substring(prevS);
            prevS = s + margin.length+1;
            textarea.selectionStart = prevS  ; textarea.selectionEnd = prevS;
        }
        
        function matchChar(opening,ch,beforeChar,eachLine)
        {
            var s = textarea.selectionStart; var noOfLines = 0;
            var end = textarea.selectionEnd;
            var val = textarea.value; var sel = ch;
            if (end > s)
            {
                sel = val.substring(s,end);
                if (eachLine)
                {
                    var lines = sel.split("\n"); var lLen = lines.length;
                    for (var i = 0; i < lLen;i++)
                    {
                        lines[i] = ch+lines[i];noOfLines++;
                    }
                    sel = lines.join("\n");
                } else
                {
                    sel = sel+ch;
                }
            }
            textarea.value = val.substring(0,s) + sel + val.substring(end);
            
            
            if (beforeChar)
            {
                if (noOfLines > 0)
                { textarea.selectionStart = s; textarea.selectionEnd = end+noOfLines;}
                else textarea.selectionEnd = s+1;
            }
            else textarea.selectionEnd = s;
            
        }
        
        function downloadActions()
        {
            if (idObjects)
            {

                textToWrite = makeIndexes();

                var textFileAsBlob = new Blob([textToWrite], {type:'text/html'});
                
                var pickedFile = filename; var extension = ".js";
                
                var fArray = pickedFile.split("."); if (fArray.length > 0) extension = fArray[fArray.length - 1];
                var fileNameToSaveAs = fArray[0]+"_action.js";
                
                var downloadLink = document.createElement("a");
                
                downloadLink.download = fileNameToSaveAs;
                downloadLink.innerHTML = "Download File";
                if (window.webkitURL != null)
                {
                    // Chrome allows the link to be clicked
                    // without actually adding it to the DOM.
                    downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
                }
                else
                {
                    // Firefox requires the link to be added to the DOM
                    // before it can be clicked.
                    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                    downloadLink.onclick = destroyClickedElement;
                    downloadLink.style.display = "none";
                    document.body.appendChild(downloadLink);
                }
                
                downloadLink.click();
                garbage.appendChild(downloadLink);garbage.innerHTML = "";
            }
            removeFile();
        }
        function saveTextAsFile()
        {
            var textToWrite = textarea.value;
            var textFileAsBlob = new Blob([textToWrite], {type:'text/html'});
            
            var pickedFile = filename; var extension = "txt";
            
            var fArray = pickedFile.split("."); if (fArray.length > 0) extension = fArray[fArray.length - 1];
            var fileNameToSaveAs = pickedFile;
            
            var downloadLink = document.createElement("a");
            
            downloadLink.download = fileNameToSaveAs;
            downloadLink.innerHTML = "Download File";
            if (window.webkitURL != null)
            {
                // Chrome allows the link to be clicked
                // without actually adding it to the DOM.
                downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
            }
            else
            {
                // Firefox requires the link to be added to the DOM
                // before it can be clicked.
                downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                downloadLink.onclick = destroyClickedElement;
                downloadLink.style.display = "none";
                document.body.appendChild(downloadLink);
            }
            
            downloadLink.click();
            garbage.appendChild(downloadLink);garbage.innerHTML = "";
            setTimeout(downloadActions,100);
        }
        
        function removeFile()
        {
            localStorage.removeItem("Adler-Editor-"+filename);
            if (idObjects) localStorage.removeItem("Adler-Editor-"+filename+"-idObjects");
            localStorage.removeItem("Adler-Editor-"+filename+"-bkmarks");
            
            var option = "<option>--Prev File--</option>";
            for (var i = fileList.length - 1;i > -1;i--)
            {
                var file = fileList[i];
                if (file === filename)
                fileList.splice(i,1);
                else
                option += "<option>"+fileList[i]+"</option>";
            }
            var fileListObj = document.getElementById("fileList");
            fileListObj.innerHTML = option;
            localStorage["Adler-Editor-FileList"] = JSON.stringify(fileList);
            textarea.value = "";
            filename = "";
        }
        
        function init()
        {
            var editorContainer = document.getElementById("editorContainer");
            editorDim = editorContainer.getBoundingClientRect();
            lineDiv = document.getElementById("lineDiv");
            lineDiv.bkMrks = 0;
            textarea = document.getElementById("editor");
            var leftDivWidth = 45; var textareaPadding = 3;var borderThickness = 1;
            //textarea.style.width = (editorDim.width - (leftDivWidth +textareaPadding+borderThickness )) + "px";
            var clone = document.getElementById("editorClone");
            //clone.style.width = (editorDim.width - (leftDivWidth +textareaPadding+borderThickness )) + "px";
            var garbage = document.getElementById("garbage");
            
            fileList = localStorage["Adler-Editor-FileList"];
            if (fileList) fileList = JSON.parse(fileList);
            else fileList = [];
            

            // check to see if there is a current file
            var currentFile = "";
            var fileDetail = localStorage["Adler-Editor-currentFile"];
            if (!fileDetail)  currentFile = "";
            else
            {
                fileDetail = JSON.parse(fileDetail);
                currentFile = fileDetail.fileName;
                fileDirty = true;
                var uploadAdler1 = document.getElementById("uploadAdler1");
                uploadAdler1.style.display = "block";
            }
            var selectedIndex = 0;
            var fLen = fileList.length ;
            var option = "<option>--Prev File--</option>";
            for (var i = 0; i < fLen;i++)
            {
                var file = fileList[i];
                option += "<option>"+file+"</option>";
                if (currentFile && file === currentFile) selectedIndex = i+1;
            }
            var fileListObj = document.getElementById("fileList");
            fileListObj.innerHTML = option;
            finishFlag = document.getElementById("finishFlag");
            fileListObj.selectedIndex = selectedIndex;
            loadFile();
            
            assistObj = document.getElementById("assistObj");
        }
        var lastMouseClickPos = 0;var dblclick = false;var findTimer = 0;
        function recordTextareaClick()
        {
            if (dblclick)
            {
                clearTimeout(findTimer);
                return true;
            }
            lastMouseClickPos = getPosition(event);
            
            if (lastMouseClickPos.x < 45)
            {
                // note down scrollTop and selStart
                lastMouseClickPos.clickTimer = setTimeout(function(){
                                                          var textareaScroll =  document.body.scrollTop;
                                                          var textareaPos = textarea.selectionStart;
                                                          
                                                          createBkElement(lastMouseClickPos.y,textareaPos,textareaScroll);
                                                          },400);
                                                          
                                                          
                                                          return;
            }
            
            dblclick = true;
            setTimeout(function(){dblclick= false;},550);
            /*
            if (ctrlActive)
                findTimer = setTimeout(findEnd,300);
            */
            //console.log(" x-"+lastMouseClickPos.x+" y-"+lastMouseClickPos.y);
            assistObj.style.left = lastMouseClickPos.x - 50 +"px";
            assistObj.style.top = lastMouseClickPos.y - 50 - document.body.scrollTop  +"px";
            assistObj.style.display= "block";
            setTimeout(function(){
                       if (assistObj.style.display === "block") assistObj.style.display = "none";
                       },2000);
        }
        
        
        function isAlphaN(cd)
        {
            if (cd > 47 && cd < 58  )
            {
                return true;
            } else if (cd > 96 && cd < 123)
            {
                return true;
            } else if (cd > 64 && cd < 91)
            {
                return true;
            }
            return false;
        }
        
        
        function findWord(val)
        {
            var i = selStart;
            // go backward  ch.charCodeAt(0)
            while (isAlphaN(val.charCodeAt(i)))
            {
                i--;
            }
            var s = i+1;
            i = selStart;
            
            // go forward
            while (isAlphaN(val.charCodeAt(i)))
            {
                i++;
            }
            var e = i;
            return {"s":s,"str":val.substring(s,e)};
        }
        
        
        function findEnd()
        {
            selStart = textarea.selectionStart;selEnd = textarea.selectionEnd;
            
            var val = textarea.value;
            var sObj= findWord(val);
            var selected = sObj.str;
            var endSelected = selected;
            if (selected === "{") endSelected = "}";
            else if (selected === "[") endSelected = "]"
            else if (selected === "(") endSelected = ")"
            else if (selected === "'") ;
            else if (selected === '"') ;
            else {
                var oneB4 = val[(sObj.s - 1)];
                if (oneB4 === "<")
                {
                    if (selected !== "<")
                    {endSelected = "</"+selected;selected = "<"+selected;}
                } else if (oneB4 === "?")
                {
                    oneB4 = val[(sObj.s - 2)];
                    if (oneB4 === "<")
                    {endSelected = "?>";selected = "<?"+selected;}
                    else return;
                } else return;
            }
            
            var asymmetric = true;
            if (selected === endSelected) asymmetric = false;
            var pos1 = selEnd; pos2 = selEnd;
            while(pos2 <= pos1)
            {
                pos1 = val.indexOf(endSelected,(pos1+1));
                if (asymmetric)
                pos2 = val.indexOf(selected,(pos2+1));
                else pos2 = pos1 + 1;
                //console.log(" pos1 "+pos1+" pos2 "+pos2+" selEnd "+selEnd);
                if (pos1 < 0 ) break;
                if (pos2 < 0) pos2 = pos1+1;
            }
            if (pos1 < 0) {alert("Mismatched "+selected);return true;}
            textarea.selectionStart = pos1; textarea.selectionEnd = pos1+endSelected.length;
            finishFlag.style.display = "block";
            finishFlag.style.top = (lastMouseClickPos.y - 50 - document.body.scrollTop) +"px";
            finishFlag.textareaScroll = textarea.scrollTop;
            finishFlag.y = lastMouseClickPos.y;
            finishFlag.pos1 = pos1;
            finishFlag.pos2 = pos1+endSelected.length;
            //scroll2Position(pos1);
            //console.log("selected "+selected);
        }
        
        function positionEnd()
        {
            cancelBubble(event);
            var pos = finishFlag.pos1;
            var offY = finishFlag.style.top;
            offY = parseInt(offY.substring(0,(offY.length - 2)));
            textarea.selectionStart = pos; textarea.selectionEnd = finishFlag.pos2;
            scroll2Position(pos,offY);
        }
        
        function scroll2Position(pos,offY)
        {
            var origVal = textarea.value;
            var clone = document.getElementById("editorClone");
            clone.value = origVal.substring(0,pos);
            var h = clone.scrollHeight - offY - 13;
            //scroll to end
            clone.value = "";
            if (h < document.body.offsetHeight)
                document.body.scrollTop = 0;
            else
                document.body.scrollTop = h;
        }
        
        function getPosition(e) {
            var x;
            var y;
            
            
            if (e.pageX || e.pageY) {
                x = e.pageX;
                y = e.pageY;
            }
            else {
                
                x = e.clientX + document.body.scrollLeft +
                document.documentElement.scrollLeft;
                y = e.clientY + document.body.scrollTop +
                document.documentElement.scrollTop;
            }
            
            
            return {x: x, y:y};
        }
        
        function contextAssist()
        {
            assistObj.style.display = "none";
            alert("feature coming soon");
        }
        
        function cancelBubble(e)
        {
            var evt = e ? e:window.event;
            if (evt.stopPropogation) evt.stopPropogation();
            if (evt.cancelBubble != null) evt.cancelBubble = true;
        }
        
        function removeBookMark()
        {
            fileDirty = true;
            cancelBubble(event);
            var bkMarkTag = document.getElementById("bkMarkTag");
            var line = document.getElementById("bkMarkLine");
            var bkmark = bkMarkTag.target;
            
            document.body.scrollTop = bkmark.textareaScroll ;
            textarea.selectionEnd = bkmark.yPos;
            var y = bkmark.style.top;
            line.style.top = parseInt(y.substring(0,(y.length - 2)))  + "px";
            line.style.display = "block";
            
            setTimeout(function(){
                       garbage.appendChild(bkmark);
                       garbage.innerHTML = "";
                       var noOfBk = lineDiv.bkMrks - 1;
                       lineDiv.bkMrks = noOfBk;
                       line.style.display = "none";
                       bkMarkTag = document.getElementById("bkMarkTag");
                       bkMarkTag.style.display = "none";
                       },500);
                       
                       //textarea.focus();
        }
        function positionBookMark()
        {
            var bkmark = event.target;
            cancelBubble(event);
            
            bkMarkTag = document.getElementById("bkMarkTag");
            bkMarkTag.style.display = "none";
            
            document.body.scrollTop = bkmark.textareaScroll ;
            textarea.selectionEnd = bkmark.yPos;
            var y = bkmark.style.top;
            var line = document.getElementById("bkMarkLine");
            line.style.top = parseInt(y.substring(0,(y.length - 2)))  + "px";
            line.style.display = "block";
            setTimeout(function(){
                       line.style.display = "none";
                       },1100);
        }
        
        function bookMark()
        {
            var noOfBk = lineDiv.bkMrks + 1;
            var pos = getPosition(event);
            var y = pos.y  - document.body.scrollTop;
            var id = "bkMark"+noOfBk; var textareaScroll = document.body.scrollTop;
            var tag = "Bookmark "+noOfBk;
            var bkmark = createBkElement(y,textareaPos,textareaScroll,tag);
            lineDiv.bkMrks = noOfBk;
            fileDirty = true;
        }
        
        function createBkElement(y,textareaPos,textareaScroll,tag)
        {
            fileDirty = true;
            var bkmark = document.createElement("img");
            var stl = "position:absolute;margin-left:-15px;top:"+ (y - textareaScroll )+"px;"
            bkmark.setAttribute("style",stl);
            
            //bkmark.setAttribute("id",id);
            bkmark.setAttribute("name","bookMarks");
            bkmark.src = "image/green_bookmark_star.png";
            
            bkmark.textareaScroll = textareaScroll;
            
            if (!tag)
            {
                //find the line based on position
                var val = textarea.value; var valLen = val.length;
                if (val[textareaPos] === "\n") textareaPos++;
                var i = textareaPos; var e = i;
                while (val[i] !== "\n")
                {
                    e = i;
                    i++;
                    if (i > valLen) break;
                }
                tag = val.substring(textareaPos,e);
            }
            bkmark.textareaPos = textareaPos;
            bkmark.tagTxt = tag;
            bkmark.yPos = y;
            bkmark.onclick = positionBookMark;
            bkmark.onmouseover = function() {
                var obj = event.target;
                if (obj.bkTimer) {clearTimeout(obj.bkTimer);obj.bkTimer = 0;};
                var bkMarkTag = document.getElementById("bkMarkTag");
                bkMarkTag.style.display = "block";
                bkMarkTag.target = obj;
                var pre = bkMarkTag.lastElementChild;
                pre.innerText = obj.tagTxt;
                var top = obj.style.top; top = parseInt(top.substring(0,(top.length - 2)));
                bkMarkTag.style.top = top - 50 + "px";
            }
            bkmark.onmouseout = function() {
                var obj = event.target;
                obj.bkTimer = setTimeout(function() {
                                         var bkMarkTag = document.getElementById("bkMarkTag");
                                         bkMarkTag.style.display = "none";
                                         },2200);
            }
            lineDiv.appendChild(bkmark);
            return bkmark;
        }
        
        function cancelBkTimer()
        {
            var bkMarkTag = event.target;
            clearTimeout(bkMarkTag.timer);
        }
        function addBkTimer()
        {
            var bkMarkTag = event.target;
            bkMarkTag.timer = setTimeout(function() {
                                         var bkMarkTag = document.getElementById("bkMarkTag");
                                         bkMarkTag.style.display = "none";
                                         },1500);
        }

function populateIdsNFuncs()
{
    var val = textarea.value;
    var totalLen = val.length;
    var idList = "";
    if (filename.indexOf(".htm") > -1)
    {
        var pos = val.indexOf("id=");
        while (pos > -1)
        {
            pos = pos + 3; var start = val.charAt(pos);
            if ( start === '"' || start === "'" )
            {
                pos++;
                // find the end
                var end  = val.indexOf(start,pos);
                idList += "<option value='"+pos+"'>"+val.substring(pos,end)+"</option>";
                pos = val.indexOf("id=",end);
            }
        }
    }

    var idFindList = document.getElementById("idFindList");
    if (idList)
    {
        idFindList.parentElement.style.display = "block";
        idFindList.innerHTML = "<option>Id</option>"+idList
    } else
    {
        idFindList.parentElement.style.display = "none";
    }
    
    var funcList = "";
    var pos = val.indexOf("function");
    while (pos > -1)
    {
        pos = pos + 8; var end = val.indexOf("(",pos);

        if (end < pos) continue; // not a function
        if (end === pos) {
            pos = val.indexOf("function",(pos+1));
            continue; // will handle it later
        }
        if ((end - pos) > 100) {
             pos = val.indexOf("function",(pos+1));
            continue ; //something is wrong here
        }
        var cd = 0;
            while( (cd = val.charCodeAt(pos++)) < 33  ) {
                if (pos > totalLen) break;
            }
        if (pos >= end) {
            pos = val.indexOf("function",pos);
            continue ; //something is wrong here
        }
        var pos1 = pos;
        while (pos1 < end)
        {
            cd = val.charCodeAt(pos1++);
            if (!isAlphaN(cd) && cd != 95)
            {
                if (cd != 40)
                    pos = end;
                break;
            }
        }
        if (pos == end) {
            pos = val.indexOf("function",pos);
            continue ; //something is wrong here
        }
        pos--;
        funcList += "<option value='"+pos+"'>"+val.substring(pos,end)+"</option>";
        pos = val.indexOf("function",end);

    }
    
    if (funcList)
    {
        var funcFindList = document.getElementById("funcFindList");
        funcFindList.innerHTML = "<option>Function</option>"+funcList
    }
    
}

function setPosition()
{
    var sel = event.target;
    var selIndex = sel.selectedIndex;
    if (selIndex < 1) return;
    var pos = sel.options[selIndex].value;
    var idName = sel.options[selIndex].text;
    pos = parseInt(pos);
    var end = pos + idName.length;
    scroll2Position(pos,20);
    textarea.selectionStart = pos;
    textarea.selectionEnd = end;
}

function accordian()
{
    var accItem = document.getElementsByClassName("accordionItem");
    for(var i=0;i<accItem.length;i++)
    {
        accItem[i].children[1].classList.add( "top_menu_active" );
    }
    var obj = event.target;
    var cls = obj.getAttribute("class");
    while (cls != "accordionItem")
    {
        obj = obj.parentElement;
        cls = obj.getAttribute("class");
    }
    var div =  obj.children[1];
    div.classList.toggle( "top_menu_active" );
    
}

function top_menu_toggl()
{
				var modal=document.getElementById("task_list");
				modal.classList.toggle( "menu_active1" );
				var tool = document.getElementsByClassName("toolDeactive ");
				tool[0].classList.toggle( "tool_active" );
    
}
