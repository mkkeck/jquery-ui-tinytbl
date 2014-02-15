$(document).ready(function() {

    var cols = 20, fixed = 2, rows = 50;

    var table = $('<table id="sample-table-1"></table>');
    $('body').append(table);

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

    if (debug !== '') {
        debug = 'TinyTable width '+rows+' rows and '+cols+' cols';
        console.time(debug);
    }
    var init = function() {
        table.tinytbl({
            'autofocus': false,
            'thead': 1,
            'tfoot': 1,
            'fixed': fixed,
            'rtl':0,
            'width':'auto',
            'height':'auto',
            'colresizable': { 'disable': '0,1,5,6' },
            'colmoveable': true,
            'onRowAdd': function(rows, after, event, ui) {
                console.log(rows);
                console.log(after);
                console.log(event);
                console.log(ui);
            }
        });
        //table.tinytbl('focus');
    };
    init();
    if (debug !== '') {
        console.timeEnd(debug);
    }

    $('#sample-1').css({'display':'none'});
    $('a.toggle').on('click',this, function() {
        if (table.is(':visible')) {
            init();
            $(this).text('destroy');
            $('.append, .prepend, .remove').show();
            return false;
        }
        table.tinytbl('destroy');
        $(this).text('create');
        $('.append, .prepend, .remove').hide();
        return false;
    });
    $('a.append').on('click',this, function() {
        row = $('<tr style="color: #c00"></tr>');
        rows++;
        columns(row, (rows*5));
        table.tinytbl('append', row);
    });
    $('a.prepend').on('click',this, function() {
        row = $('<tr style="color: #c00"></tr>');
        rows++;
        columns(row, rows);
        table.tinytbl('prepend', row);
    });
    $('a.remove').on('click',this, function() {
        var del = table.data('tbody').get(0).rows.length;
        table.tinytbl('remove', del, (del-1));
    });
});

