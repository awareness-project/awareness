// this runs after page is loaded

var currentNeuronPath = '';
var currentNeuron = null;

var navHistory = [{path:''}];

var svg;
var g;
var zoom;
//var rootHook;
var ancor;
//var mnemoFS

$(function() {
    $("#tabs").tabs({
        activate: function (event, ui) {
            if(ui.newPanel.attr('id')==='tabs-trends'){
                reloadGraph();
            } else {
                trends.src='';
            }

            if(ui.newPanel.attr('id')==='tabs-face'){
                getMnemo(currentNeuronPath, currentNeuron, window);
                //mnemo.js.src='mnemo/mnemo.js?path='+currentNeuronPath;
            } else {
                //$("#tabs-face").empty();
                //mnemo.js.src='';
            }

            if(ui.newPanel.attr('id')==='tabs-events'){
                setTimeout(mess.resizeTable, 0);
            } else {
            }

        }
    });


    getNeuron('');
    getValues('');

    $( "#neuronPath" ).on( "click", "li", function() {
        console.log( $( this ).attr("data-path") );
        //$( this ).nextAll().remove(); //remove all later elements in path
        //$( this ).prev().remove(); //remove preceding '/'
        //$( this ).remove(); //remove self cause will be added in response handler '/'
        getNeuron($( this ).attr("data-path"));
    });

    $( "#childList" ).on( "click", "li", function() {
        console.log( $( this ).attr("data-id") );
        getNeuron((currentNeuronPath?currentNeuronPath + '/':'') + $( this ).attr("data-id") );
    });
    $( "#chldList" ).on( "click", ".childName", function() {
        console.log( $( this ).attr("data-id") );
        getNeuron((currentNeuronPath?currentNeuronPath + '/':'') + $( this ).attr("data-id") );
    });

    $( "#tabs-tags" ).on( "click", ".rw", function() {

        $(".validateTips").text('Введите новое значение:');
        $("#newVal").val($( this ).text());
        $( "#dialog-form" ).dialog( "open" );
        //$( "#dialog-plate" ).dialog( "open" );
        idToSet = currentNeuronPath + (currentNeuronPath?'/':'') + $( this ).attr("data-id");
        console.log( idToSet );
    });


    $(document.body).toggle(); // body has initial display:none style, show it after ui decorations to prevent flicker

    function addUser() {
    }

    initDialogs();

    svg = d3.select("#face");
    g = svg.append("g").classed("hmiMnemo", true);
    svg.call(zoom = d3.zoom()
        .scaleExtent([0.5, 10])
        .extent([[0, 0], [500, 500]])
        .on("zoom", zoomed));

    function zoomed() {
        navHistory[navHistory.length - 1].transform = d3.event.transform;
        g.attr("transform", d3.event.transform);
    }


    mess.init();

});

function setValue() {
    $.get("set-value", {path: idToSet, value: $("#newVal").val()})
        .done(function (response) {
            $(".validateTips").text(response);
            $("#dialog-form").dialog("close");
            //getTags();
            //getNeuron(currentNeuronPath);
        })
        .fail(function (response) {
            console.log(response);
            $(".validateTips").text(response.responseText);
        });

}

function setValue2(path, value, callback) {
    $.get("set-value", {path, value: value})
        .done(function (response) {
            console.log(response);
            //getNeuron(currentNeuronPath);
            callback();
        })
        .fail(function (response) {
            console.log(response);
            callback(response.responseText);
        });

}

var idToSet = '';
var tagValueElements = {};
var mnemoTaggedTexts = $();

function getNeuron(path){
    $.getJSON( "neuron.json", path?'path='+path:'', function( neuron ) {
        var items = [];
        var linkPath = '';
        //var currentNeuron = null;
        tagValueElements = {};

        if(navHistory.length > 30) navHistory.shift();
        if(navHistory[navHistory.length - 1].path !== path) navHistory.push({path: path});

        currentNeuronPath = path;
        currentNeuron = neuron;


        ancor = undefined;
        if($( "#tabs" ).tabs( "option", "active" ) == 2){ //mnemo tab is opened
            getMnemo(currentNeuronPath, currentNeuron, window);
        }

        var currentPathElement = $("#neuronPath").find('[data-path="' + path + '"]');
        if (currentPathElement.length) {
            currentPathElement.nextAll().remove();
        } else {
            $("#neuronPath").append((path ? '<span>/</span>' : '') + "<li data-path='" + currentNeuronPath + "'>" + neuron.name + "</li>");
        }

        /*var items = [];
        $.each(neuron.children, function (id, child) {
            items.push('<li data-id="' + id + '">' + child.name + '</li>');
        });

        $("#childList").empty().append("|" + items.join("|") + "|");*/

        var container = $("#ownValue").empty();

        var li = $('<li id="child-li-" class = "ui-widget-content"></li>').appendTo(container);
        $('<div class = "childName" data-id="">' + neuron.name + '</div>' +
            '<div class = "childUnit">' + (neuron.unit ? neuron.unit : '&nbsp') + '</div>'
        ).appendTo(li);
        tagValueElements['_'] =
            //$('<div class = "childValue' + (neuron.rw ? ' rw' : '') + '" data-id="" data-quality="'+ neuron.quality +'">' + valOrBr(neuron.value) + '</div>'
            $('<div class = "childValue' + (neuron.rw ? ' rw' : '') + '" data-id="" ></div>'
            ).appendTo(li);


        container = $("#chldList").empty();
        if (neuron.children) {
            $.each(neuron.children, function (id, child) {
                var li = $('<li id="child-li-' + id + '" class = "ui-widget-content"></li>').appendTo(container);
                $('<div class = "childName" data-id="' + id + '">' + child.name + '</div>' +
                    '<div class = "childUnit">' + (child.unit ? child.unit : '&nbsp') + '</div>'
                ).appendTo(li);
                tagValueElements[id] =
                    //$('<div class = "childValue' + (child.rw ? ' rw' : '') + '" data-id="' + id + '" data-quality="'+ child.quality +'">' + valOrBr(child.value) + '</div>'
                    $('<div class = "childValue' + (child.rw ? ' rw' : '') + '" data-id="' + id + '"></div>'
                    ).appendTo(li);
            });

        } else {
            container.append('Параметры не определены');
        }
        //getMnemo(currentNeuronPath);

        updateTree(currentNeuron);

        reloadGraph();

        //if (typeof hook == "object") {
        //    hook.update(currentNeuron);
        //}

    });
}



function getMnemo(path, neuron, scope, level) {

    if(scope === window) {  //perform on root mnemo only
        scope.g.selectAll("*").remove();
        if(navHistory[navHistory.length - 1].transform){
            svg.call(zoom.transform, navHistory[navHistory.length - 1].transform);
        } else {
            svg.call(zoom.transform, d3.zoomIdentity);
        }

        level = 0;
    }
    hook = undefined;

    d3.xml('npub/mnemo.svg?path=' + path, function(error, documentFragment) {
        if (error){
            $("#result").html("No mnemo");
            console.log(error);
        } else {
            var svgNode = documentFragment
                .getElementsByTagName("svg")[0];
            //scope.g.node().appendChild(svgNode);
            while(svgNode.children.length) {
                if(svgNode.children[0].nodeName === 'script'){ // reinsert script as new element for it to be executed
                    var fixedScript = document.createElement('script');
                    fixedScript.type = svgNode.children[0].type;
                    fixedScript.innerHTML = svgNode.children[0].innerHTML;
                    fixedScript.async = false;
                    svgNode.removeChild(svgNode.children[0]);
                    scope.g.node().appendChild(fixedScript);
                } else {
                    scope.g.node().appendChild(svgNode.children[0]);
                }
            }
            scope.ancor = hmi.svg.hook();
            var children = scope.ancor.init(path, neuron, scope.g, {level: level});
            $.each(children, function (id, child) {
                getMnemo(path + (path?'/':'') + id, neuron.children[id], child, level + 1);
            });
        }
    });


 /*   $.getScript('npub/mnemo.js?path=' + path)
        .done(function (script, textStatus) {
            if (typeof hook == "object") {
                scope.ancor = hook;
                var children = hook.init(path, neuron, scope.g);
                $.each(children, function (id, child) {
                    getMnemo(path + '/' + id, neuron.children[id], child);
                });
                //if(typeof callback == "function"){
                //    callback(hook);
                //}
            }
        })
        .fail(function (jqxhr, settings, exception) {
        });
*/
}

function updateMnemo( ancor, neuron){
    if (typeof ancor == "object") {
        ancor.update(neuron);

        $.each(ancor.children, function (id, child) {
            updateMnemo(child.ancor, neuron.children[id]);
        });
    }
}

function updateTree(neuron) {
    var rootElement = tagValueElements['_'];
    var childElement;

    if(typeof rootElement != 'object') return;

    rootElement.attr('data-quality', neuron.quality);
    if (neuron.value != undefined) {
        rootElement.attr('data-state', neuron.state ? neuron.state[0].level : 0);
        rootElement.html((neuron.state && neuron.showState) ? neuron.state[0].text : neuron.value);
    }
    if (neuron.children) {
        $.each(neuron.children, function (id, child) {
            childElement = tagValueElements[id];
            if(typeof childElement == 'object') {
                //childElement.text(child.value);
                childElement.attr('data-quality', child.quality);
                childElement.attr('data-state', child.state ? child.state[0].level : 0);
                childElement.html((child.state && child.showState) ? child.state[0].text : child.value);
            }
        });
    }
}

function getValues(path){
    $.get(/*"values.json"*/"neuron.json", {path: currentNeuronPath}, function (response) {
        $( "#dialog-error" ).dialog( "close" );
        if(path === currentNeuronPath) {
            currentNeuron = response;

            updateMnemo( ancor, currentNeuron);

            updateTree(currentNeuron);
        }

        setTimeout(function(){
            getValues(currentNeuronPath);
        },100);

    }, 'json')
        .fail(function (response) {
            console.log(response);
            setTimeout(function(){
                getValues(currentNeuronPath);
            },1000);

            $( "#dialog-error" ).dialog( "open" );

        });
}

function getSession(){
    $.get("session.json", {}, function (response) {
        if(typeof response == 'object' && typeof response.user == 'object') {
            $("#username").text(response.user.name);
        } else {
            $("#username").text('');
        }
        setTimeout(function(){
            getSession();
        },1000);

    }, 'json')
        .fail(function (response) {
            setTimeout(function(){
                getSession();
            },1000);
        });
}

getSession();

var panelId = 1;
var timePeriod = "3h";

function reloadGraph(){
    var metric = currentNeuronPath.replace(/\//g,'.');
    trends.src='/grafana/dashboard-solo/db/awarenessdefault?panelId=' + panelId + '&var-metric='+metric + '&from=now-'+ timePeriod +'&to=now';
}

function goFullScreen() {
    document.getElementById('tabs-face').webkitRequestFullscreen();
    $('#dialog-form').dialog('option', 'appendTo', '#tabs-face');
    $('#dialog-error').dialog('option', 'appendTo', '#tabs-face');
}

function cancelFullScreen(){
    document.webkitCancelFullScreen();
    $('#dialog-form').dialog('option','appendTo','body');
    $('#dialog-error').dialog('option','appendTo','body');
}

function navBack(){
    if(navHistory.length > 1){
        navHistory.pop(); //last element is the current neuron
        var navPoint = navHistory[navHistory.length - 1];//.pop();
        getNeuron(navPoint.path);
    }

}

