function initDialogs() {
    var dialogVal = $("#dialog-form").dialog({
        autoOpen: false,
        height: 300,
        width: 350,
        modal: true,
        //closeOnEscape: false,
        //appendTo: "#tabs-face",
        buttons: {
            "Ввод": setValue,
            "Отмена": function () {
                $(this).dialog("close");
            }
        },
        open: function () {
            /*clearTimeout(window.hackInterval);
             window.hackInterval = setTimeout(function(){
             if(window.hackFunction){
             window.hackFunction();
             window.hackFunction = undefined;
             }
             },10000);*/
            //setTimeout(goFullScreen, 2000);
        },
        close: function () {
        }
    })/*.on('keydown', function(evt) {
        if (evt.keyCode === $.ui.keyCode.ESCAPE) {
            $(this).dialog('close');
        }
        evt.stopPropagation();
    })*/;

    /*$(document).bind('webkitfullscreenchange', function(e) {
        if(!document.webkitIsFullScreen && dialogVal.dialog('isOpen')){
            dialogVal.dialog('close');
            window.hackFunction = function(){goFullScreen();};
        }
    });*/

    form = dialogVal.find("form").on("submit", function (event) {
        event.preventDefault();
        setValue();
    });


    var dialog = $("#dialog-error").dialog({
        autoOpen: false,
        height: 200,
        width: 350,
        modal: true,
        close: function () {
        }
    });

    function login() {
        $.post("login", {username: $("#uName").val(), password: $("#uPass").val()})
            .done(function (response, status, xhr) {
                $("#loginInfo").text(response);
                $("#dialog-login").dialog("close");
                //$("#username").text(decodeURI(xhr.getResponseHeader("uName")));
            })
            .fail(function (response) {
                console.log(response);
                $("#loginInfo").text(response.responseText);
                //$("#username").text('');
            });
    }


    var dialog = $("#dialog-login").dialog({
        open: function() {
            $("#loginInfo").text('Введите реквизиты:');
        },
        autoOpen: false,
        height: 350,
        width: 350,
        modal: true,
        buttons: {
            "Ввод": login,
            "Отмена": function () {
                $(this).dialog("close");
            }
        },
        close: function () {
            $("#uName").val('');
            $("#uPass").val('');
        }
    });
    form = dialog.find("form").on("submit", function (event) {
        event.preventDefault();
        login();
    });

}