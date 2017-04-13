var mess = {
    init: function init() {
        var context = this;
        //return;
        $("#jqGrid").jqGrid({
            url: 'mess_active',
            datatype: "json",
            colModel: [
                {label: 'Время', name: 'time', width: 150, fixed: true, formatter: mess.timeFormatter},
                {label: 'Место', name: 'location', width: 240},
                {label: 'Класс', name: 'class', width: 70, fixed: true},
                {label: 'Статус', name: 'state', width: 70, fixed: true},
                {label: 'Сообщение', name: 'mess', width: 500},
            ],
            cmTemplate: {sortable: false},
            viewrecords: true, // show the current page, data rang and total records on the toolbar
            //width: null,
            autowidth: true,
            //shrinkToFit: false,
            height: $("#tableHolder").innerHeight() - 60,
            rowNum: 20,
            rowList:[10,20,30],
            loadonce: false, // this is just for the demo
            pager: "#jqGridPager",
            rowattr: function (rd) {
                return {"class": "messClass_" + rd.class + "_" + ((rd.state == "+") ? "c" : "g")};
            }
        });

        $(window).bind('resize', context.resizeTable);

        //setTimeout(context.resizeTable, 0);

        setInterval(function () {
            if (!context.autoUpdate)return;
            if (context.mode === 'current') {
                context.setTableCurr();
            } else {
                context.setTableArch();
            }
        }, 2000);
    },

    resizeTable: function resizeTable(){
        $("#gbox_jqGrid").hide();
        $("#jqGrid")
            .setGridWidth($("#tableHolder").innerWidth() - 10)
            .setGridHeight($("#tableHolder").innerHeight() - 80);
        $("#gbox_jqGrid").show();
    },

    timeFormatter: function timeFormatter(cellvalue, options, rowObject) {
        var dateObject = new Date(cellvalue);
        return dateObject.toLocaleDateString() + ' ' + dateObject.toLocaleTimeString() + '.' + ('00' + dateObject.getMilliseconds()).slice(-3);
    },


    autoUpdate: true,

    mode: 'current',

    toggleUpdate: function toggleUpdate() {
        this.autoUpdate = !this.autoUpdate;

        if (this.autoUpdate) {
            $('#bt_mess_upsel').addClass('upsel');
        } else {
            $('#bt_mess_upsel').removeClass('upsel');
        }
    },

    setTableCurr: function setTableCurr() {
        $("#jqGrid")
            .setGridParam({url: 'mess_active', datatype: 'json', loadonce: true})
            .trigger("reloadGrid");

        $('#bt_mess_curr').addClass('tfsel');
        $('#bt_mess_arch').removeClass('tfsel');
        this.mode = 'current';
    },

    setTableArch: function setTableArch() {
        $("#jqGrid")
            .setGridParam({url: 'mess_archive', datatype: 'json', loadonce: false})
            .trigger("reloadGrid");

        $('#bt_mess_arch').addClass('tfsel');
        $('#bt_mess_curr').removeClass('tfsel');
        this.mode = 'archive';
    }
};