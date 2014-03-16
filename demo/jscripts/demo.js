$(document).ready(function() {

    var cols = 20, frozen = 2, rows = 50;

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
    var columns=function(num) {
        var max = (cols + 1), fix = (frozen + 1), col = '';
        for(var c = 1; c < max; c++) {
            if (c < fix) {
                col+='<th>cell['+num+']['+c+']</th>';
            } else {
                //if (c < fix+1) {
                //    row.append('<td><table><tbody><tr><td>tbl['+num+']['+c+']</td></tr></tbody></table></td>');
                //}
                col+='<td>cell['+num+']['+c+']</td>';
            }
        }
        return col;
    };
    for (var t = 0; t < 3; t++) {
        var row;
        switch(t) {
            case 0:
                thead.append('<tr>'+columns(1)+'</tr>');
                break;
            case 1:
                tfoot.append('<tr>'+columns(rows)+'</tr>');
                break;
            default:
                for(var r = 2; r < rows; r++) {
                    tbody.append('<tr id="rownum-'+r+'">'+columns(r)+'</tr>');
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
            'body': {
                'useclass': null,
                'autofocus':false
            },
            'head': {
                'useclass':null
            },
            'foot': {
                'useclass':null,
                'atTop':false
            },
            'cols': {
                'frozen': frozen,
                'moveable':  { 'disables': [0,1] },
                'resizable': { 'disables': [0,1,2,4,5] },
                'sortable':  { 'disables': [], defaults : { 0:'asc' ,5:'desc' } }
            },
            'rtl':0,
            'width':'auto',
            'height':'auto',

            'rows': {
                'onInsert':function(rows, normal, frozen) {
                    console.log('added: ', rows, normal, frozen);
                },
                'onRemove':function(rows, normal, frozen) {
                    console.log('removed: ', rows, ', ', normal, frozen);
                },
                'onSelect':function(rows, pos, data) {
                    console.log('select: ', rows, ', ', pos, '; ', data);
                },
                'onContext': function(row, index, x, y) {
                    console.log('context: ', row, ', ', index, '; ', x ,', ', y);
                },
                multiselect: 1
            },

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
        rows++;
        if (debug !== '') {
            debug = 'Append row';
            console.time(debug);
        }
        table.tinytbl('append', ['<tr style="color: #cc0000;">'+columns(rows)+'</tr>', columns(rows+1)]);
        if (debug !== '') {
            console.timeEnd(debug);
        }
        return false;
    });
    $('a.prepend').on('click',this, function() {
        rows++;
        table.tinytbl('prepend', '<tr style="color: #cc0000;">'+columns(rows)+'</tr>');
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



});

