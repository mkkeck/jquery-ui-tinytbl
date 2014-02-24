/**
 * jQuery UI TinyTbl
 * Creates a scrollable table with fixed thead, tfoot and columns
 *
 * Copyright (c) 2012-2014 Michael Keck <http://michaelkeck.de/>
 * Released:  2014-02-21
 * Version:   3.1.2
 * License:   Dual licensed under the MIT or GPL Version 2 licenses.
 *            http://jquery.org/license
 * Depends:   jquery.ui.core
 *            jquery.ui.widget
 */


(function($) {

    /**
     * global scrollbar size
     * @type {null|Number}
     */
    var scrollbar = null;

    /**
     * global counter for TinyTbl objects
     * @type {Object}
     */
    var tinytables = {
        counter: 1,
        timers: {}
    };

    $.widget('ui.tinytbl', {

        version: '3.1.2',

        /**
         * Options
         * @type {Object}
         */
        options: {
            'autofocus': false,
            'useclass': null,
            'cols': {
                'autosize':  false,
                'fixed':     0,
                'moveable':  false,
                'resizable': false,
                'sortable':  false
            },
            'foot':      true,
            'head':      true,
            'height':    'auto',
            'id':        null,
            'resizable': false,
            'rtl':       false,
            'width':     'auto',
            'rowadd':    null, // function() {},
            'rowremove': null, // function() {},
            'rowselect': null  // function() {}
        },

        /**
         * Classes for table rows
         * @type {Object}
         */
        classes: {
            body: { 1:'ui-widget-content ui-corner-all', 2:'ui-widget-header ui-corner-all' },
            foot: { 1:'ui-widget-header ui-corner-all',  2:'ui-widget-header ui-corner-all' },
            head: { 1:'ui-widget-header ui-corner-all',  2:'ui-widget-header ui-corner-all' }
        },

        /**
         * TinyTbl-Object
         * @type {Object}
         */
        tinytbl: null,

        /**
         * Get parent element of an element
         * @param   [element]
         * @return  {Object|Boolean}
         * @private
         */
        _parent: function(element) {
            element = element || this.element;
            if (this._tagname(element.parent()) !== 'body' && this._tagname(element.parent()) !== 'html') {
                return element.parent();
            }
            return false;
        },


        /**
         * Get tagname of an element
         * @param   [element]
         * @return  {string}
         * @private
         */
        _tagname: function(element) {
            element = element || this.element;
            return (''+element.get(0).tagName).toLowerCase();
        },


        /**
         * Get some css styles to calculate the corrections
         * for width and height
         * @param   element
         * @param   {string} size
         * @return  {number}
         * @private
         */
        _fix_size: function(element, size) {
            var value = 0;
            if (!(element && (size === 'height' || size === 'width'))) {
                return value;
            }
            switch(size) {
                case 'width':
                    $.each(['marginLeft', 'marginRight', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'], function(index, name) {
                        value += parseInt(element.css(name), 10);
                    });
                    return value;
                case 'height':
                    $.each(['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'], function(index, name) {
                        value+= parseInt(element.css(name), 10);
                    });
                    return value;
            }
            return value;
        },


        /**
         * Get available max sizes (width and height)
         * for the table object
         * @returns  {void}
         * @internal
         */
        _max_size: function() {
            if (!this.tinytbl) {
                return;
            }

            // some variables
            var width  = (''+this.options.width).toLowerCase(),
                height = (''+this.options.height).toLowerCase(),
                layout = this.options.layout,
                $body  = $('body'),
                $papa  = this._parent(this.tinytbl.main) || $body;

            // calculating
            var calc = function(val, max) {
                var typ = val.replace(/\d/g, ''),
                    num = (typ === '%') ? parseFloat(val) : parseInt(val, 10);
                switch(typ) {
                    case 'em':
                        return Math.round(num * layout.factor);
                    case 'pt':
                        return Math.round(num * 1.3);
                    case '%':
                        return Math.round((num * 0.01) * max);
                    default:
                        return parseInt(num, 10);
                }
            };

            // maxwidth
            if (width === 'auto' || width.substr(-1,1) === '%') {
                layout.maxwidth = (($papa !== $body) ? $papa.width() : $(window).width());
            }
            if (width !== 'auto') {
                layout.maxwidth = calc(width, layout.maxwidth);
            }
            layout.maxwidth -= layout.fixwidth;
            if (this.options.cols.fixed && $(document).height() > $(window).height()) {
                layout.maxwidth -= scrollbar;
            }

            // maxheight
            if (height === 'auto' || height.substr(-1,1) === '%') {
                layout.maxheight = (($papa !== $body) ? $papa.height() : $(window).height());
            }
            if (height !== 'auto') {
                layout.maxheight = calc(width, layout.maxheight);
            }
            layout.maxheight -= layout.fixwidth;
        },


        /**
         * Get scrollbar size
         * @return  {void}
         * @private
         */
        _scrollbar: function() {
            if (scrollbar === null) {
                var elem = $('<div id="ui-tinytbl-helper-scrollbar"></div>');
                elem.css({
                    'width': '100px', 'height': '100px', 'overflow': 'scroll',
                    'position': 'absolute', 'top': '0px','left': '0px',
                    '-webkit-overflow-scrolling': 'touch'
                });
                $('body').append(elem);
                scrollbar = elem.get(0).offsetWidth - elem.get(0).clientWidth;
                elem.remove();
            }
        },


        /**
         * Makes the parent of an element to be hidden
         * @return  {void}
         * @private
         */
        _parent_hide: function() {
            if (!this.tinytbl || !this.tinytbl.main) {
                return;
            }
            var parent = this._parent(this.tinytbl.main);
            if (!(parent && parent.is(':visible')) ) {
                return; // exit: parent is hidden or table object not found
            }
            if (parent.hasClass('ui-tinytbl-helper-hide')) {
                parent.css({ display:'none' }).removeClass('ui-tinytbl-helper-hide');
            } else if (parent.hasClass('ui-tinytbl-helper-show')) {
                parent.css({ display:'' }).removeClass('ui-tinytbl-helper-show');
            }
        },


        /**
         * Force the parent of an element to be visible
         * @return  {void}
         * @private
         */
        _parent_show: function() {
            if (!this.tinytbl || !this.tinytbl.main) {
                return;
            }
            var parent = this._parent(this.tinytbl.main);
            if (!(parent && !parent.is(':visible')) ) {
                return;
            }
            if (parent.css('display') === 'none') {
                parent.css({ display:'block' }).addClass('ui-tinytbl-helper-hide');
            } else if (parent.css('display') !== 'block' && parent.css('display') !== 'static') {
                parent.css({ display:'block' }).addClass('ui-tinytbl-helper-show');
            }
        },


        /**
         * Calculates and syncs the width of each column
         * from source table with another table
         * @return  {void}
         * @private
         */
        _col_size: function() {
            if (!this.tinytbl) {
                return; // exit: table object not found
            }
            var opt = this.options, tbl = this.tinytbl,
                width1 = [], width2 = [],
                size1 = 0, size2 = 0,
                tables = ['body','foot','head'];
            $.each(tables, function(index, name) {
                var cells;
                if (!opt[name] || !tbl[name] || !tbl[name]['body1']) {
                    return; // exit: table #1 not found
                }
                cells = tbl[name]['body1'].get(0).rows || [];
                if (cells.length < 1) {
                    return; // exit: no cells in table
                }
                cells = cells[cells.length-1].cells;
                $.each(cells, function(num, col) {
                    var val = Math.ceil(col.offsetWidth / 5) * 5;
                    if (width1[num] && (width1[num] >= val)) {
                        return;
                    }
                    width1[num] = val;
                });
                if (!tbl[name]['body2']) {
                    return; // exit: table #2 not found
                }
                cells = tbl[name]['body2'].get(0).rows || [];
                if (cells.length < 1) {
                    return; // exit: no cells in table
                }
                cells = cells[cells.length-1].cells;
                $.each(cells, function(num, col) {
                    var val = Math.ceil(col.offsetWidth / 5) * 5;
                    if (width2[num] && (width2[num] >= val)) {
                        return;
                    }
                    width2[num] = val;
                });
            });
            if (width1.length > 0) {
                $.each(width1, function(index, value) {
                    $('col[data-num="'+(index+opt.cols.fixed)+'"]').css({'width':value+'px'});
                    size1 += value;
                });
                if (width2.length > 0) {
                    $.each(width2, function(index, value) {
                        $('col[data-num="'+index+'"]').css({'width':value+'px'});
                        size2 += value;
                    });
                }
                $.each(tables, function(index, name) {
                    if (!opt[name] || !tbl[name] || !tbl[name]['table1']) {
                        return;
                    }
                    var table = tbl[name]['table1'].get(0);
                    table.style.width = size1+'px';
                    if (!opt.layout.size1 || table.offsetWidth > opt.layout.size1) {
                        opt.layout.size1 = table.offsetWidth;
                    }
                    if (tbl[name]['table2']) {
                        table = tbl[name]['table2'].get(0);
                        table.style.width = size2+'px';
                        if (!opt.layout.size2 || table.offsetWidth > opt.layout.size2) {
                            opt.layout.size2 = table.offsetWidth;
                        }
                    }
                });
            }
        },


        /**
         * Calculates and syncs the height of each row
         * from source table with another table
         * @return  {void}
         * @private
         */
        _row_size: function() {
            var that = this;
            if (!that.tinytbl) {
                return;
            }
            var tbl = that.tinytbl, opt = that.options;
            if (!opt.cols.fixed) {
                $.each(['body','foot','head'], function(index, name) {
                    if (!opt[name] || !tbl[name] || !tbl[name]['body1']) {
                        return; // exit: table not found
                    }
                    var rows = tbl[name]['body1'].get(0).rows;
                    $.each(rows, function(i) {
                        rows[i].cells[0].style.height = rows[i].cells[0].offsetHeight+'px';
                    });
                    if (that._tagname(tbl[name]['body1']) === 'tbody') {
                        opt.layout[name] = tbl[name]['table1'].get(0).offsetHeight;
                    }
                });
                return;
            }
            $.each(['body','foot','head'], function(index, name) {
                if (!opt[name] || !tbl[name] || !tbl[name]['body1'] || !tbl[name]['body2']) {
                    return; // exit: table not found
                }
                var height = [],
                    rows1 = tbl[name]['body1'].get(0).rows,
                    rows2 = tbl[name]['body2'].get(0).rows;
                if (rows1.length !== rows2.length) {
                    return; // exit: different rows.length
                }
                $.each(rows1, function(i) {
                    height.push(rows1[i].cells[0].offsetHeight);
                });
                $.each(rows2, function(i) {
                    var value = rows2[i].cells[0].offsetHeight;
                    if (height[i] && (height[i] >= value)) {
                        return;
                    }
                    height[i] = value;
                });
                $.each(height, function(i) {
                    rows1[i].cells[0].style.height = height[i]+'px';
                    rows2[i].cells[0].style.height = height[i]+'px';
                });
                if (that._tagname(tbl[name]['body1']) === 'tbody') {
                    opt.layout[name] = tbl[name]['table1'].get(0).offsetHeight;
                }
            });
        },


        /**
         * Resize table layout
         * @return  {void}
         * @private
         */
        _tbl_size: function() {
            if (!this.tinytbl || !this.tinytbl.body || !this.tinytbl.body.inner1) {
                return;
            }
            this._max_size();
            var innerHeight, innerWidth,
                outerHeight, outerWidth,
                size = this.options.layout,
                tbl  = this.tinytbl,
                body = tbl.body.inner1.get(0);

            // height
            outerHeight = size.head + size.foot + size.body;
            if (outerHeight > size.maxheight) {
                outerHeight = size.maxheight;
            }
            innerHeight = outerHeight - (size.head + size.foot);
            body.style.height = innerHeight+'px';

            // width
            outerWidth = size.size1 + size.size2;
            if (outerWidth > size.maxwidth) {
                outerWidth = size.maxwidth;
            }
            innerWidth = outerWidth - size.size2;
            body.style.width = innerWidth +'px';
            if (body.clientWidth < body.offsetWidth && (innerWidth + scrollbar) < size.maxwidth) {
                outerWidth += scrollbar;
                body.style.width = (innerWidth + scrollbar)+'px';
            }

            // apply to other objects
            if (tbl.body.inner2) {
                tbl.body.inner2.height(body.clientHeight);
            }
            innerWidth = body.clientWidth;
            if (tbl.foot.inner1) {
                tbl.foot.inner1.width(innerWidth);
            }
            if (tbl.head.inner1) {
                tbl.head.inner1.width(innerWidth);
            }

            // set main conatiner
            tbl.main.css({'height':outerHeight+'px','width':outerWidth+'px'});
        },


        /**
         * Insert rows to source table and TinyTbl
         * @param    rows
         * @param    {Boolean} [before]
         * @return   {*}
         * @private
         */
        _rows_insert: function(rows, before) {
            if (!rows || !this.tinytbl || !this.tinytbl.body || !this.tinytbl.body.body1) {
                return; // exit: tinytbl object not found
            }
            var opt = this.options,
                tbl = this.tinytbl,
                source = tbl.main.data('body'),
                start  = 0,
                length = rows.length,
                r,
                append = before ? 'prepend' : 'append',
                table1 = tbl.body.body1,
                table2 = (opt.cols.fixed) ? tbl.body.body2 : null,
                css = this.classes;

            if (!table1 || (opt.cols.fixed && !table2)) {
                return; // exit: table bodies not found
            }
            if (source) {
                start = source.get(0).rows.length;
                source[append](rows);
            }

            // reset sizes
            if (opt.cols.autosize || !opt.cols.resizable) {
                $.each(['foot','head','body'], function(id, key) {
                    var element;
                    if (element = tbl[key].body1) {
                        element.parent('table').css({width:''});
                    }
                });
            }

            // create rows
            // without fixed columns
            if (!table2) {
                r = 0;
                while (r < length) { //$.each(rows, function(i) {
                    var row = rows[r].cloneNode(true);
                    row.className = css['body'][1];
                    table1[append](row);
                    r++;
                }
            }
            // with fixed columns
            else {
                r = 0;
                while(r < length) { //$.each(rows, function(i) {
                    var row1 = rows[r].cloneNode(true), row2 = rows[r].cloneNode(true), c, cols, attr;
                    c = 0; cols = opt.cols.fixed;
                    while(c < cols) { c++; row1.deleteCell(0); }
                    c = 0; cols = (rows[r].cells.length - opt.cols.fixed);
                    while (c < cols) { c++; row2.deleteCell(-1); }
                    c = 0; cols = row2.cells.length;
                    if (attr = row1.getAttribute('id')) {
                        row1.setAttribute('data-id', attr);
                        row1.removeAttribute('id');
                    }
                    row1.className = css['body'][1];
                    row2.className = css['body'][2];
                    table1[append](row1);
                    table2[append](row2);
                    r++;
                }
            }
            // resize cols and table layout if needed and/or required by users options
            if (opt.height === 'auto' || opt.cols.autosize || !opt.cols.resizable) {
                this._parent_show();
                if (opt.cols.autosize || !opt.cols.resizable) {
                    this._col_size();
                }
                if (opt.height === 'auto') {
                    opt.layout.body = tbl.body.table1.outerHeight();
                }
                this._tbl_size();
                this._parent_hide();
            }

            // returning
            if (typeof(opt.rowadd) === 'function' && table1) {
                var retval = { 'cols':null, 'rows':null, 'fixedCols':null, 'fixedRows':null };
                retval.rows = table1.get(0).rows;
                if (tbl.body['colum1']) {
                    retval.cols = tbl.body['colum1'].children('col');
                }
                if (table2) {
                    retval.fixedRows = table2.get(0).rows;
                    if (tbl.body['colum2']) {
                        retval.fixedCols = tbl.body['colum2'].children('col');
                    }
                }
                opt.rowadd(rows, (!before ? start : 0), retval);
            }
        },


        /**
         * Removes rows from source table and TinyTbl
         * @param   rows
         * @param   [start]
         * @return  {null|Object}
         * @private
         */
        _rows_remove: function(rows, start) {
            if (!this.tinytbl || !this.tinytbl.body || !this.tinytbl.body.body1) {
                return null;
            }
            var opt = this.options,
                tbl = this.tinytbl,
                table1 = tbl.body.body1.get(0),
                table2 = opt.cols.fixed ? tbl.body.body2.get(0) : null,
                source = tbl.main.data('body').get(0),
                row = 0, beg;
            if (!table1 || (opt.cols.fixed && !table2)) {
                return null;
            }
            if (typeof(rows) === 'number') {
                if (typeof(start) !== 'number') {
                    row = 0;
                } else {
                    row = parseInt(start, 10) || 0;
                }
                beg = row;
                if (!table2) {
                    for(;row < rows; row++) {
                        table1.deleteRow(row);
                        source.deleteRow(row);
                    }
                }
                else {
                    for(;row < rows; row++) {
                        table1.deleteRow(row);
                        table2.deleteRow(row);
                        source.deleteRow(row);
                    }
                }
            }
            else if (typeof(rows) === 'object') {
                if (!table2) {
                    $(rows).each(function(row) {
                        $(table1.rows[row]).remove();
                        $(source.rows[row]).remove();
                    });
                }
                else {
                    $(rows).each(function(row) {
                        $(table1.rows[row]).remove();
                        $(table2.rows[row]).remove();
                        $(source.rows[row]).remove();
                    });
                }
                beg = null;
            }
            if (opt.height === 'auto') {
                opt.layout.body = tbl.body.table1.outerHeight();
                this._parent_show();
                this._tbl_size();
                this._parent_hide();
            }

            // returning
            if (typeof(opt.rowremove) === 'function' && table1) {
                var retval = { 'cols':null, 'rows':null, 'fixedCols':null, 'fixedRows':null };
                retval.rows = table1.rows;
                if (tbl.body['colum1']) {
                    retval.cols = tbl.body['colum1'].children('col');
                }
                if (table2) {
                    retval.fixedRows = table2.rows;
                    if (tbl.body['colum2']) {
                        retval.fixedCols = tbl.body['colum2'].children('col');
                    }
                }
                opt.rowremove(rows, beg, retval);
            }
        },

        /**
         * Syncs scroll positions
         * @return  {void}
         * @private
         */
        _scroll: function() {
            var tbl = this.tinytbl, opt = this.options;
            if ( !(tbl && (opt.cols.fixed || opt.head || opt.foot)) ) {
                return;
            }
            if (opt.cols.fixed) {
                var y = tbl.body.inner1.scrollTop();
                tbl.body.inner2.scrollTop(y);
            }
            if (opt.head || opt.foot) {
                var x = tbl.body.inner1.scrollLeft();
                if (opt.head) {
                    tbl.head.inner1.scrollLeft(x);
                }
                if (opt.foot) {
                    tbl.foot.inner1.scrollLeft(x);
                }
            }
        },


        /**
         * Initialize table layout
         * @return  {void}
         * @private
         */
        _layout: function() {
            if (!this.tinytbl) {
                return;
            }
            var opt = this.options, tbl = this.tinytbl;
            var margin = function(name, value) {
                if (opt[name] && tbl[name]) {
                    tbl[name]['inner1'].css({'margin-top':value});
                    if (tbl[name]['inner2']) {
                        tbl[name]['inner2'].css({'margin-top':value});
                    }
                }
            };
            if (opt.head || (opt.foot && opt.foot.atTop)) {
                margin('body', '-1px');
            }
            if (opt.foot && opt.foot.atTop !== 'before') {
                margin('foot', '-1px');
            }
            else if (opt.foot && opt.foot.atTop === 'before' && opt.head) {
                margin('head', '-1px');
            }
            this._col_size();
            this._row_size();
            this._tbl_size();
        },


        /**
         * Creates TinyTbl widget
         * @private
         */
        _create: function() {
            var $src = this.element;
            if (this._tagname($src) !== 'table' || this._tagname($src.parent()) === 'td' || this._tagname($src.parent()) === 'th') {
                return;
            }
            var $body = $('body'),
                $papa = (this._parent($src) || $body),
                opt = this.options,
                div = {
                    'inner1': '<div class="has-scroll" />',
                    'inner2': '<div class="non-scroll" />',
                    'outer':  '<div class="ui-helper-clearfix" />'
                },
                src = {
                    'body': ($src.children('tbody') && $src.children('tbody').get(0).rows.length > 0),
                    'foot': ($src.children('tfoot') && $src.children('tfoot').get(0).rows.length > 0),
                    'head': ($src.children('thead') && $src.children('thead').get(0).rows.length > 0)
                },
                tbl = {
                    'body': null, 'head': null, 'foot': null,
                    'main': $('<div class="ui-tinytbl ui-widget-content ui-corner-all ui-helper-clearfix" />')
                },
                css = this.classes;

            // fast row insert without fixed columns
            var rowsOne = function(name) {
                var data = $src.children('t'+name).children() || null;
                if (!data && name === 'body') {
                    data = $src.children();
                }
                if (!data || data.length < 1 || !tbl[name] || !tbl[name].body1) {
                    return;
                }
                var table = tbl[name].body1.get(0), r = 0, rows = data.length;
                while(r < rows) {
                    var row = data.get(r);
                    row.className = css[name][1];
                    table.appendChild(row);
                    r++;
                }
            };

            // fast row insert with fixed columns
            var rowsTwo = function(name) {
                var data = $src.children('t'+name).children() || null;
                if (!data && name === 'body') {
                    data = $src.children();
                }
                if (!data || data.length < 1 || !tbl[name] || !tbl[name].body1 || !tbl[name].body2) {
                    return;
                }
                var table1 = tbl[name].body1.get(0), table2 = tbl[name].body2.get(0), r = 0, rows = data.length;
                while(r < rows) {
                    var attr, c, cols, cells = data.get(r).cells.length, row1 = data.get(r), row2 = data.get(r).cloneNode(true);
                    c = 0; cols = opt.cols.fixed;
                    while (c < cols) {
                        row1.deleteCell(0);
                        c++;
                    }
                    c = 0; cols = (cells - opt.cols.fixed);
                    while (c < cols) {
                        row2.deleteCell(-1);
                        c++;
                    }
                    if (attr = row1.getAttribute('id')) {
                        row1.setAttribute('data-id', attr);
                        row1.removeAttribute('id');
                    }
                    row1.className = css[name][1];
                    row2.className = css[name][2];
                    table1.appendChild(row1);
                    table2.appendChild(row2);
                    r++;
                }
            };

            tbl.rows = $src.get(0).rows;
            if (tbl.rows.length > 0) {
                tbl.cols = tbl.rows[0].cells.length;
                tbl.rows = tbl.rows.length;
            }
            if (tbl.cols < 1) {
                return; // exit: table is empty
            }

            // check if TinyTable should be created
            if (!opt.cols.fixed && !isNaN(parseInt(opt.cols, 10))) {
                opt.cols = { 'fixed' : opt.cols };
            }
            opt.cols.fixed = (!isNaN(parseInt(opt.cols.fixed, 10)) && opt.cols.fixed > 0 && opt.cols.fixed < tbl.cols) ? opt.cols.fixed : 0;
            opt.head = ((opt.head && src.body && src.head)
                ? $.extend({ 'useclass': null }, opt.head)
                : null
            );
            opt.foot = ((opt.foot && src.body && src.foot)
                ? $.extend({ 'useclass': null, 'atTop':false }, opt.foot)
                : null
            );
            if (!opt.head && !opt.foot && !opt.cols.fixed) {
                return; // exit: no fixed header, footer or columns
            }

            // check options and/or extend
            opt.id  = (opt.id || 'tinytbl-'+tinytables.counter);
            opt.rtl = (opt.rtl ? 'right' : 'left');
            if (opt.cols) {
                if (opt.cols.resizable) {
                    opt.cols.resizable = $.extend({ 'disables':[], 'helper':null, 'maxWidth':null, 'minWidth':30 }, opt.cols.resizable);
                    // overwrite handles and grid
                    opt.cols.resizable = $.extend(opt.cols.resizable, { 'handles': (opt.rtl ? 'w' : 'e'), 'grid':5 });
                }
                if (opt.cols.moveable) {
                    opt.cols.moveable = $.extend({ 'disables':[], 'helper':null }, opt.cols.moveable);
                    // overwrite axis
                    opt.cols.moveable = $.extend(opt.cols.moveable, { 'axis':'x' });
                }
                if (opt.cols.sortable) {
                    opt.cols.sortable = $.extend({ 'disables':[], 'defaults':[] }, opt.cols.sortable);
                }
            }
            if (opt.resizable) {
                opt.resizable = $.extend({ 'helper':null, 'maxHeight':null, 'maxWidth':null, 'minHeight':100, 'minWidth':100 }, opt.resizable);
                // overwrite handles
                opt.resizable = $.extend(opt.resizable, {
                    'handles': (opt.rtl ? 'w,s' : 'e,s')
                });
            }
            opt.body = $.extend({ 'useclass': null }, opt.body);

            // prepare layout options object
            opt.layout = { 'maxheight':0, 'maxwidth':0, 'fixheight':0, 'fixwidth':0, 'size1':0, 'size2':0, 'head':0, 'foot':0 , 'factor':($papa.css('font-size') || 16), 'order':['head','body','foot'] };

            // get layout order (head, body, foot | head, foot, body)
            if (opt.foot.atTop) {
                opt.layout.order = ['head','foot','body'];
                if (''+opt.foot.atTop === 'before') {
                    opt.layout.order = ['foot','head','body'];
                }
            }

            $.each(opt.layout.order, function(index, name) {
                var hasrows = src[name], overflow = 'hidden', zindex = 2;
                if (name === 'body') {
                    hasrows = true; overflow = 'auto'; zindex = 1;
                }
                // prepare table[name] object
                tbl[name] = {
                    'outer':  null,     // wrapper
                    // scrollable area ------------------------------
                    'colum1': null,    // colgroup element
                    'inner1': null,    // scrollable area container
                    'table1': null,    // table element
                    'body1':  null,    // tbody element
                    // fixed area -----------------------------------
                    'colum2': null,    // colgroup element
                    'inner2': null,    // fixed area container
                    'table2': null,    // table element
                    'body2':  null     // tbody element
                };

                if (!hasrows || !opt[name]) {
                    return; // exit: no rows and/or no fixed header or footer
                }
                tbl[name].outer  = $(div.outer).addClass('ui-tinytbl-'+name).css({ 'z-index':zindex });
                tbl[name].inner1 = $(div.inner1).css({ 'float':opt.rtl, 'z-index':1, 'overflow':overflow });
                tbl[name].outer.append(tbl[name].inner1);
                if (opt.cols.fixed) {
                    tbl[name].inner2 = $(div.inner2).css({ 'float':opt.rtl, 'z-index':2, 'overflow':'hidden' });
                    tbl[name].outer.prepend(tbl[name].inner2);
                }
                tbl.main.append(tbl[name].outer);
            });

            // read content form source table $src and append to layout
            $.each(['body','head','foot'], function(index, name) {
                var col, data = $src.children('t'+name) || null;
                if (name === 'body' && !data) {
                    data = $src;
                }

                // append some properties from source table
                if (opt[name] && data !== $src && opt[name]['useclass']) {
                    tbl[name]['outer'].addClass(opt[name]['useclass']);
                }
                if ((!opt[name] && data === $src) || (opt[name] && data !== $src)) {
                    tbl[name]['outer'].addClass(data.attr('class'));
                    tbl[name]['outer'].attr('data-id', data.attr('id'));
                }

                // save original data as clone for destroy function
                tbl.main.data(name, data.clone());

                // init table on first run or fixed header / fixed footer
                if (opt[name] || name === 'body') {
                    tbl[name]['table1'] = $('<table />');
                    tbl[name]['body1']  = $('<tbody />');
                    tbl[name]['colum1'] = $('<colgroup />');
                    // colgroup
                    for (col = opt.cols.fixed; col < tbl.cols; col++) {
                        tbl[name]['colum1'].append('<col data-type="'+name+'" data-num="'+col+'" />');
                    }
                    tbl[name]['table1'].append(tbl[name]['colum1'], tbl[name]['body1']);
                    tbl[name]['inner1'].append(tbl[name]['table1']);
                    // with fixed columns
                    if (opt.cols.fixed) {
                        tbl[name]['table2'] = $('<table />');
                        tbl[name]['body2']  = $('<tbody />');
                        tbl[name]['colum2'] = $('<colgroup />');
                        for (col = 0; col < opt.cols.fixed; col++) {
                            tbl[name]['colum2'].append('<col data-type="'+name+'" data-num="'+col+'" />');
                        }
                        tbl[name]['table2'].append(tbl[name]['colum2'], tbl[name]['body2']);
                        tbl[name]['inner2'].append(tbl[name]['table2']);
                        tbl[name]['table1'].css('margin-'+opt.rtl,'-1px');
                        rowsTwo(name);
                        return;
                    }
                    // without fixed columns
                    rowsOne(name);
                    return;
                }

                // init table if no fixed header / no fixed footer
                tbl[name]['table1'] = tbl.body.table1;
                tbl[name]['body1'] = $('<t'+name+' />');
                tbl[name]['table1'].find('tbody').eq(0).before(tbl[name]['body1']);
                // with fixed columns
                if (opt.cols.fixed) {
                    tbl[name]['table2'] = tbl.body.table2;
                    tbl[name]['body2']  = $('<t'+name+' />');
                    tbl[name]['table2'].find('tbody').eq(0).before(tbl[name]['body2']);
                    rowsTwo(name);
                    return;
                }
                // without fixed columns
                rowsOne(name);
            });

            tbl.main.attr('id', opt.id).attr('role', $src.attr('id'));
            tbl.main.addClass(opt.useclass).addClass($src.attr('class'));

            // append TinyTbl after original (source) table
            $src.empty().hide().after(tbl.main);

            // getting fixed sizes
            opt.layout.fixwidth += this._fix_size(tbl.main, 'width');
            if ((''+opt.width) === 'auto' || (''+opt.width).substr(-1,1) === '%') {
                opt.layout.fixwidth += this._fix_size($papa, 'width');
            }
            opt.layout.fixheight += this._fix_size(tbl.main, 'height');
            if ((''+opt.height) === 'auto' || (''+opt.height).substr(-1,1) === '%') {
                opt.layout.fixheight += this._fix_size($papa, 'height');
            }

            // get scrollbar size
            if (scrollbar === null) {
                this._scrollbar();
            }

            // save object
            this.tinytbl = tbl;
            tinytables.counter++;

            // save options
            this.options = opt;

            // init layout
            this._parent_show();
            this._layout();
            this._parent_hide();

            var that = this;
            this._on( this.window, {
                resize: function() {
                    if (that.options.height === 'auto' || that.options.width === 'auto') {
                        setTimeout(function() { that._tbl_size(); }, 25);
                    }
                }
            });

        },


        /**
         * Initialize TinyTbl widget
         * @private
         */
        _init: function() {
            if (!this.tinytbl) {
                return;
            }
            var that = this, opt = that.options, tbl = that.tinytbl;
            // scroll function
            tbl.body.inner1.off('.tinytbl').on('scroll.tinytbl', function() {
                that._scroll();
            });

            if (typeof(opt.rowselect) === 'function' && tbl.body && tbl.body.body1) {
                tbl.body.body1.selectable({
                    'filter':'tr',
                    'start': function() {
                        $('tr.ui-selected').removeClass('ui-selected').children().removeClass('ui-state-highlight');
                    },
                    'stop': function() {
                        if (tbl.body.body2) {
                            $(this).find('.ui-selected').each(function() {
                                $(tbl.body.body2.get(0).rows[$(this).index()]).addClass('ui-selected');
                            });
                        }
                        $('tr.ui-selected > td, tr.ui-selected > th').addClass('ui-state-highlight');
                        opt.rowselect();
                    }
                });
            }

            if (opt.body.autofocus) {
                setTimeout(function() { tbl.body.inner1.focus(); }, 100);
            }

        },


        /**
         * Append new rows to the TinyTbl body object
         * @param   {jQuery|Object} rows
         * @return  {*}
         * @public
         */
        append: function(rows) {
            return this._rows_insert(rows, false);
        },


        /**
         * Removes the TinyTbl and restores the original table
         * @return  {void}
         * @public
         */
        destroy: function() {
            if (!this.tinytbl) {
                return;
            }
            this.element.show().append(
                this.tinytbl.main.data('head'),
                this.tinytbl.main.data('foot'),
                this.tinytbl.main.data('body')
            ).removeData();
            this.element.removeUniqueId();
            this.tinytbl.main.remove().removeData();
            this.tinytbl = null;

            // remove events
            tinytables.counter = tinytables.counter -1;
            if (tinytables.counter < 1) {
                $(window).off('.tinytbl');
            }
        },


        /**
         * Get the data of an TinyTbl object
         * @param   {String} [name]   ('body'|'head'|'foot')
         * @return  {*}
         * @public
         */
        getdata: function(name) {
            name = name || 'body';
            if (!this.tinytbl || !this.tinytbl[name] || !this.tinytbl[name].body1) {
                return null;
            }
            return {
                1 : this.tinytbl[name].body1.get(0).rows || null,
                2 : this.tinytbl[name].body2 ? (this.tinytbl[name].body2.get(0).rows || null) : null
            };
        },


        /**
         * Get the number of rows in TinyTbl body object
         * @return  {Number}
         * @public
         */
        numrows: function() {
            if (!this.tinytbl || !this.tinytbl.main.data('body')) {
                return 0;
            }
            return this.tinytbl.main.data('body').get(0).rows.length;
        },

        /**
         * Prepend new rows to the TinyTbl body object
         * @param   {jQuery|Object} rows
         * @return  {*}
         * @public
         */
        prepend: function(rows) {
            return this._rows_insert(rows, true);
        },


        /**
         * Remove rows from the TinyTbl body object
         * @param   {jQuery|Number} rows       // jQuery object of table rows or integer of rows to be deleted
         * @param   {Number}        [start]    // if rows is integer, then set start
         * @return  {*}
         * @public
         */
        remove: function(rows, start) {
            return this._rows_remove(rows, start);
        },

        '':''

    });

})(jQuery);

