$(document).ready(function() {

    var cols = 20, fixed = 2, rows = 50;

    var table = $('<table id="sample-table-1"></table>');

    var thead = $('<thead class="test-header" id="test-header"></thead>'),
        tfoot = $('<tfoot></tfoot>'),
        tbody = $('<tbody></tbody>'),
        debug = '';

    table.append(thead)
         .append(tfoot)
         .append(tbody);

    if (typeof(console) !== "undefined" && typeof(console.time) !== "undefined") {
        debug = 'Create table width '+rows+' rows and '+cols+' cols';
    }
    if (debug !== '') {
        console.time(debug);
    }
    var columns=function(row, num) {
        var max = (cols + 1), fix = (fixed + 1);
        for(var c = 1; c < max; c++) {
            if (c < fix) {
                row.append('<th>cell['+num+']['+c+']</th>');
            } else {
                row.append('<td>cell['+num+']['+c+']</td>');
            }
        }
    };
    for (var t = 0; t < 3; t++) {
        var row;
        switch(t) {
            case 0:
                row = $('<tr></tr>');
                thead.append(row);
                columns(row, 1);
                break;
            case 1:
                row = $('<tr></tr>');
                tfoot.append(row);
                columns(row, rows);
                break;
            default:
                for(var r = 2; r < rows; r++) {
                    row = $('<tr id="rownum-'+r+'"></tr>');
                    tbody.append(row);
                    columns(row, r);
                }
                break;
        }
    }

    if (debug !== '') {
        console.timeEnd(debug);
    }
    var source = $('#sample-1');
    source.hide();
    source.after(table);
    //var table2 = table.clone();
    //source.after(table2);
    //table2.attr('id','sample-table-2').tinytbl();
    var init = function() {
        if (debug !== '') {
            debug = 'TinyTable width '+rows+' rows and '+cols+' cols';
            console.time(debug);
        }
        table.tinytbl({
            'body': { 'autofocus':false },
            'head': { 'useclass':'test' },
            'foot': { 'useclass':'test', 'atTop':false },
            'cols': {
                'fixed': fixed,
                'moveable':  { 'disables': [0,1] },
                'resizable': { 'disables': [0,1,2,4,5] },
                'sortable':  { 'disables': [], defaults : [] }
            },
            'rtl':0,
            'width':'auto', 'height':'auto',
            'rowadd': function(rows, pos, data) {
                console.log('add');
                console.log(rows);
                console.log(pos);
                console.log(data);
            },
            'rowselect': function(event, ui) {
                console.log('You selected the following rows: ' + $(this).find('.ui-selected').map(function(id) {
                    return id;
                }).get().join(', '));
            },
            /*'rowremove': function(rows, pos, data) {
                console.log('remove');
                console.log(rows);
                console.log(pos);
                console.log(data);
            },*/
            '':''
        });
        //table.tinytbl('focus');
        if (debug !== '') {
            console.timeEnd(debug);
        }
    };
    init();

    var menu = $('#menu');
    menu.find('a').button();
    $('a.toggle').on('click',this, function() {
        if (table.is(':visible')) {
            init();
            $('.ui-button-text', this).text('destroy');
            menu.find('a').not($(this)).show();
            return false;
        }
        table.tinytbl('destroy');
        $('.ui-button-text', this).text('create');
        menu.find('a').not($(this)).hide();
        return false;
    });
    $('a.append').on('click',this, function() {
        row = $('<tr style="color: #c00"></tr>');
        rows++;
        columns(row, (rows*5));
        if (debug !== '') {
            debug = 'Append row';
            console.time(debug);
        }
        table.tinytbl('append', row);
        if (debug !== '') {
            console.timeEnd(debug);
        }
        return false;
    });
    $('a.prepend').on('click',this, function() {
        row = $('<tr style="color: #c00"></tr>');
        rows++;
        columns(row, rows);
        source.tinytbl('prepend', row);
        return false;
    });
    $('a.remove').on('click',this, function() {
        var del = table.tinytbl('numrows');
        if (debug !== '') {
            debug = 'Remove row';
            console.time(debug);
        }
        table.tinytbl('remove', del, (del-1));
        if (debug !== '') {
            console.timeEnd(debug);
        }
        return false;
    });

    console.log(table.tinytbl('getdata','head'));


});

