/**
 * jQuery UI TinyTbl
 * Creates a scrollable table with frozen thead, tfoot and columns
 *
 * Copyright (c) 2012-2014 Michael Keck <http://michaelkeck.de/>
 * Released:  2014-03-15
 * Version:   3.1.2
 * License:   Dual licensed under the MIT or GPL Version 2 licenses.
 *            http://jquery.org/license
 * Depends:   jquery.ui.core
 *            jquery.ui.widget
 */


(function($) {
    /**
     * Get scrollbar size
     * @return  {Number} scrollbar
     * @public
     */
    $.scrollbar = function() {
        if (typeof(window['scrollbar']) === 'undefined' || window['scrollbar'] === null) {
            var body = $('body'), elem = $('<div id="ui-helper-scrollbar"></div>');
            elem.css({ 'width': '100px', 'height': '100px', 'overflow': 'scroll', 'position': 'absolute', 'top': '-110px','left': '-110px', '-webkit-overflow-scrolling': 'touch' });
            body.append(elem);
            window['scrollbar'] = elem.get(0).offsetWidth - elem.get(0).clientWidth;
            elem.remove();
        }
        return window['scrollbar'];
    };

})(jQuery);

(function($) {

    /**
     * global counter for TinyTbl objects
     * @type {Object}
     */
    var tinytables = {
        added: 0,   // counter added TinyTables
        removed: 0, // counter removed TinyTables
        timers: {}
    };


    $.widget('ui.tinytbl', {

        version: '3.1.2',

        /**
         * Options
         * @type {Object}
         */
        options: {
            'body': {
                'useclass': null,
                'autofocus': false
            },
            'cols': {
                'autosize': false,
                'frozen': 0,
                'moveable': false,
                'resizable': false,
                'sortable': false
            },
            'foot': {
                'useclass': null,
                'atTop': false
            },
            'head': {
                'useclass': null
            },
            'height': 'auto',
            'id': null,
            'resizable': false,
            'rows': {
                'onInsert': null,     // function() {},
                'onRemove': null,     // function() {},
                'onSelect': null,     // function() {}
                'onContext': null,    // function() {}
                'multiselect': false
            },
            'rtl': false,
            'useclass': null,
            'width': 'auto'
        },

        /**
         * Classes for table rows
         * @type {Object}
         */
        classes: {
            body: { normal:'ui-widget-content', frozen:'ui-widget-header' },
            foot: { normal:'ui-widget-header',  frozen:'ui-widget-header' },
            head: { normal:'ui-widget-header',  frozen:'ui-widget-header' }
        },

        /**
         * TinyTbl-Object
         * @type {Object}
         */
        tinytbl: null,


        /**
         * Get tagname of an element
         * @param   [element]
         * @return  {string}
         * @private
         */
        tagname: function(element) {
            element = element || this.element;
            return (''+element.get(0).tagName).toLowerCase();
        },


        /**
         * Get parent element of an element
         * @param   [element]
         * @return  {Object|Boolean}
         * @private
         */
        parent: function(element) {
            element = element || this.element;
            if (this.tagname(element.parent()) !== 'body' && this.tagname(element.parent()) !== 'html') {
                return element.parent();
            }
            return false;
        },


        /**
         * Get some css styles to calculate the corrections
         * for width and height
         * @param   element
         * @param   {string} size
         * @return  {number}
         * @private
         */
        correct_size: function(element, size) {
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
        max_size: function() {
            if (!this.tinytbl) {
                return;
            }

            // some variables
            var width  = this.options.width,
                height = this.options.height,
                layout = this.layout,
                $body = $('body'),
                $parent = this.parent(this.tinytbl.main) || $body;

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
            if (layout.width.autoset) {
                layout.width.maxsize = (($parent !== $body) ? $parent.width() : $(window).width());
            }
            if (layout.width.autoset < 2) {
                layout.width.maxsize = calc(width, layout.width.maxsize);
            }
            layout.width.maxsize -= layout.width.correct;
            if (this.options.cols.frozen && $(document).height() > $(window).height()) {
                layout.width.maxsize -= layout.scrollbar;
            }

            // maxheight
            if (layout.height.autoset) {
                layout.height.maxsize = (($parent !== $body) ? $parent.height() : $(window).height());
            }
            if (layout.height.autoset < 2) {
                layout.height.maxsize = calc(height, layout.height.maxsize);
            }
            layout.height.maxsize -= layout.height.correct;
        },


        /**
         * Makes the parent of an element to be hidden
         * @return  {void}
         * @private
         */
        parent_hide: function() {
            if (!this.tinytbl || !this.tinytbl.main) {
                return;
            }
            var parent = this.parent(this.tinytbl.main);
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
        parent_show: function() {
            if (!this.tinytbl || !this.tinytbl.main) {
                return;
            }
            var parent = this.parent(this.tinytbl.main);
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
         * Initialize table layout
         * @return  {void}
         * @private
         */
        init_layout: function() {
            if (!this.tinytbl) {
                return;
            }
            var options = this.options,
                tinytbl = this.tinytbl,
                layout  = this.layout,
                border = function(name, border) {
                    if (tinytbl[name] && tinytbl[name].outer) {
                        tinytbl[name].outer.css('border-'+border, '0');
                    }
                };

            $.each(['body','foot','head'], function(index, name) {
                if (!options[name] || !tinytbl[name] || !tinytbl[name].normal || !tinytbl[name].frozen) {
                    return; // exit: table not found
                }
                var height = [],
                    rows1 = tinytbl[name].normal.children('table').get(0).rows,
                    rows2 = tinytbl[name].frozen.children('table').get(0).rows;
                if (rows1.length !== rows2.length) {
                    return; // exit: different rows.length
                }
                $.each(rows1, function(i) { height.push(rows1[i].cells[0].offsetHeight); });
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
                layout.height[name] = tinytbl[name].normal.children('table').get(0).offsetHeight;
            });

            if (options.head || (options.foot && options.foot.atTop)) {
                border('body', 'top');
            }
            if (options.foot && !options.foot.atTop) {
                border('body','bottom');
            } else {
                if (options.foot && options.foot.atTop !== 'before') {
                    border('foot', 'top');
                }
                else if (options.foot && options.foot.atTop === 'before' && options.head) {
                    border('head', 'top');
                }
            }
            this.resize();
        },

        rows_class: function() {
            if (!this.tinytbl || !this.tinytbl.body || !this.tinytbl.body.normal) {
                return;
            }
            var table = this.tinytbl.body,
                frozen = this.options.cols.frozen;
            var rows1 = table.normal.children('table').get(0).rows,
                rows2 = (frozen && table.frozen) ? table.frozen.children('table').get(0).rows : [];
            var r = 0, rows = (rows1.length-1), classes;
            while(r <= rows) {
                classes = 'ui-data-row ui-data-row-'+r+' ui-row-even';
                if (r%2) {
                    classes = 'ui-data-row ui-data-row-'+r+' ui-row-odd';
                }
                if (r === rows) {
                    classes += ' ui-data-row-last';
                }
                rows1[r].className = classes;
                if (rows2 && rows2[r]) {
                    rows2[r].className = classes;
                }
                r++;
            }
        },


        /**
         * Insert rows to source table and TinyTbl
         * @param    {Array|Object} rows
         * @param    {Boolean} [before]
         * @return   {*}
         * @private
         */
        rows_insert: function(rows, before) {
            if (!rows || !this.tinytbl || !this.tinytbl.body|| !this.tinytbl.body.normal) {
                return; // exit: tinytbl object not found
            }
            var options = this.options,
                tinytbl = this.tinytbl,
                source,
                insert = before ? 'prepend' : 'append',
                normal = $('table.ui-tinytbl-outer > .ui-tinytbl-inner', tinytbl.body.normal),
                frozen = (options.cols.frozen && tinytbl.body.frozen) ? $('table.ui-tinytbl-outer > .ui-tinytbl-inner', tinytbl.body.frozen) : null,
                attr, c, cols, r = 0,
                rowfrozen,
                rownormal, returns = [];
            source = tinytbl.main.data('source').children('tbody') || null;
            if (!source) {
                source = tinytbl.main.data('source');
            }
            if (frozen) {
                cols = (tinytbl.cols - options.cols.frozen);
            }
            while (r < rows.length) {
                if (this.tagname($(rows[r])) !== 'tr') {
                    rows[r] = $('<tr>'+rows[r]+'</tr>');
                }
                rownormal = $(rows[r]).get(0).cloneNode(true);
                rownormal.className = 'ui-data-row';
                normal[insert](rownormal);
                source[insert](rows[r]);
                returns[r] = $(rownormal);
                // frozen columns
                if (frozen) {
                    rowfrozen = rownormal.cloneNode(true);
                    c = 0; while (c < cols)                { rowfrozen.deleteCell(-1); c++; }
                    c = 0; while (c < options.cols.frozen) { rownormal.deleteCell(0); c++; }
                    if (attr = rowfrozen.getAttribute('id')) {
                        rowfrozen.setAttribute('data-id', attr);
                        rowfrozen.removeAttribute('id');
                    }
                    frozen[insert](rowfrozen);
                    if (rowfrozen.cells[0].offsetHeight > rownormal.cells[0].offsetHeight) {
                        rownormal.cells[0].style.height = rowfrozen.cells[0].style.height = rowfrozen.cells[0].offsetHeight + 'px';
                    } else {
                        rownormal.cells[0].style.height = rowfrozen.cells[0].style.height = rownormal.cells[0].offsetHeight + 'px';
                    }
                    returns[r] = $(rownormal).add($(rowfrozen));
                }
                rowfrozen = null;
                rownormal = null;
                r++;
            }

            // reset row classes
            this.rows_class();

            // resize table
            if (this.layout.height.autoset === 2) {
                this.layout.height.body = $(normal).outerHeight();
                this.parent_show();
                this.resize();
                this.parent_hide();
            }

            // returning
            if (typeof(options.rows.onInsert) === 'function' && this.tinytbl.body.normal) {
                options.rows.onInsert($(returns), normal, frozen);
            }
        },


        /**
         * Constructor
         * @private
         */
        _create: function() {
            var $source = this.element;
            if (this.tagname($source) !== 'table' || this.tagname($source.parent()) === 'td' || this.tagname($source.parent()) === 'th') {
                return;
            }
            var $body = $('body'),
                $colgroup = { normal: null, frozen: null },
                $parent = (this.parent($source) || $body),
                classes = this.classes,
                create = {
                    'normal': '<div class="ui-tinytbl-column" />',
                    'frozen': '<div class="ui-tinytbl-frozen" />',
                    'outer':  '<div class="ui-helper-clearfix" />'
                },
                layout, options = this.options,
                source = {
                    'body': ($source.children('tbody') && $source.children('tbody').get(0).rows.length > 0),
                    'foot': ($source.children('tfoot') && $source.children('tfoot').get(0).rows.length > 0),
                    'head': ($source.children('thead') && $source.children('thead').get(0).rows.length > 0)
                },
                tinytbl = {
                    'body': null, 'foot': null, 'head': null, // table objects
                    'main': $('<div class="ui-tinytbl ui-widget-content ui-corner-all ui-helper-clearfix" />')
                },
                cells, cols, cssoverflow, csszindex, name,
                i = 0, r = 0, rows, rowfrozen, rownormal, table, tables;

            var colgroup = function(first, last, type) {
                $colgroup[type] = $('<colgroup />');
                var num, val, col = '';
                for (num = first; num < last; num++) {
                    //val = Math.ceil(cells[num].offsetWidth / 5) * 5;
                    val = cells[num].offsetWidth;
                    $colgroup[type].append('<col data-num="'+num+'" style="width:'+val+'px;" />');
                    layout.width[type] += val;
                }
            };
            var rowgroup = function(cols, rownormal, rowfrozen) {
                var c, attr;
                c = 0; while (c < cols)                { rowfrozen.deleteCell(-1); c++; }
                c = 0; while (c < options.cols.frozen) { rownormal.deleteCell(0); c++; }
                if (attr = rowfrozen.getAttribute('id')) {
                    rowfrozen.setAttribute('data-id', attr);
                    rowfrozen.removeAttribute('id');
                }
            };

            // OPTIONS
            tinytbl.rows = $source.get(0).rows;
            if (tinytbl.rows.length > 0) {
                tinytbl.cols = tinytbl.rows[0].cells.length;
                tinytbl.rows = tinytbl.rows.length;
            }
            if (tinytbl.cols < 1) {
                return; // exit: table is empty
            }

            // check if TinyTable should be created
            if (!options.cols.frozen && !isNaN(parseInt(options.cols, 10))) {
                options.cols = { 'frozen' : options.cols };
            }
            options.cols.frozen = parseInt(options.cols.frozen, 10) || 0;
            if (options.cols.frozen >= $source.cols) {
                options.cols.frozen = 0;
            }
            options.head = ((options.head && options.body && options.head) ? options.head : false);
            options.foot = ((options.foot && options.body && options.foot) ? options.foot : false);
            if (!options.head && !options.foot && !options.cols.frozen) {
                return; // exit: no frozen header, footer or columns
            }

            // check options and/or extend
            options.id  = (options.id || 'tinytbl-'+(tinytables.added+1));
            options.rtl = (options.rtl ? 'right' : 'left');
            if (options.cols.resizable) {
                options.cols.resizable = $.extend({
                    'disables': [],
                    'helper':   null,
                    'maxWidth': null, 'minWidth': 30
                }, options.cols.resizable);
                // overwrite handles and grid
                options.cols.resizable = $.extend(options.cols.resizable, {
                    'handles': (options.rtl === 'right' ? 'w' : 'e'),
                    'grid': 5
                });
            }
            if (options.cols.moveable) {
                options.cols.moveable = $.extend({
                    'disables': [],
                    'helper':   null
                }, options.cols.moveable);
                // overwrite axis
                options.cols.moveable = $.extend(options.cols.moveable, {
                    'axis': 'x'
                });
            }
            if (options.cols.sortable) {
                options.cols.sortable = $.extend({
                    'disables': [],
                    'defaults': null
                }, options.cols.sortable);
            }
            if (options.resizable) {
                options.resizable = $.extend({
                    'helper':    null,
                    'maxHeight': null, 'maxWidth':  null,
                    'minHeight': 100, 'minWidth': 100
                }, options.resizable);
                // overwrite handles
                options.resizable = $.extend(options.resizable, {
                    'handles': (options.rtl === 'right' ? 'w,s' : 'e,s')
                });
            }
            if (!options.body) {
                options.body = { 'useclass':null, 'autofocus':false };
            }

            // prepare layout object
            layout = {
                'height': {
                    'autoset': 0, 'correct': 0, 'inner': 0, // corrections
                    'maxsize': 0,                           // max height
                    'head': 0, 'foot': 0                    // height: header and footer
                },
                'width': {
                    'autoset': 0, 'correct': 0, 'inner': 0, // corrections
                    'maxsize': 0,                           // max width
                    'frozen': 0, 'normal': 0                // width: frozen and normal
                },
                'factor': ($parent.css('font-size') || 16), // em to pixel calc factor
                'scrollbar': $.scrollbar(),                 // scrollbar size
                'tables': ['head','body','foot']            // order elements for layout
            };

            // get tables layout
            if (options.foot.atTop) {
                layout.tables = ((''+options.foot.atTop).toLowerCase() === 'before') ? ['foot','head','body'] : ['head','foot','body'];
            }

            // prepare colgroups
            cells = $source.get(0).rows[0].cells;
            colgroup(options.cols.frozen, tinytbl.cols, 'normal');
            if (options.cols.frozen) {
                colgroup(0, options.cols.frozen, 'frozen');
            }

            // save original source
            tinytbl.main.data('source', $source.children().clone());

            // create TinyTbl Widget
            while (i < 3) {
                name = layout.tables[i];
                rownormal = $source.children('t'+name).get(0) || null;
                cssoverflow = 'hidden'; csszindex = 2;
                r = 0; rows = rownormal.rows.length;
                if (name === 'body') {
                    if (!rownormal) {
                        $source.wrapInner('<tbody />');
                        rownormal = $source.children('tbody').get(0);
                    }
                    cssoverflow = 'auto'; csszindex = 1;
                }

                if (!rownormal || !options[name]) {
                    return; // exit: no rows and/or no frozen header or footer
                }

                // prepare table[name] object
                tinytbl[name] = {};
                tinytbl[name].outer = $(create.outer);
                tinytbl.main.append(tinytbl[name].outer);
                tinytbl[name].outer
                    .addClass('ui-tinytbl-'+ name +' '+ classes[name].normal)
                    .css({ 'z-index':csszindex });

                // frozen columns
                if (options.cols.frozen) {

                    tinytbl[name].frozen = $(create.frozen);
                    tinytbl[name].outer.append(tinytbl[name].frozen);

                    rowfrozen = rownormal.cloneNode(true);
                    cols = (tinytbl.cols - options.cols.frozen);
                    if (name === 'body') {
                        while (r < rows) {
                            rowgroup(cols, rownormal.rows[r], rowfrozen.rows[r]);
                            rowfrozen.rows[r].className = 'ui-data-row';
                            rownormal.rows[r].className = 'ui-data-row';
                            r++;
                        }
                    } else {
                        while (r < rows) {
                            rowgroup(cols, rownormal.rows[r], rowfrozen.rows[r]);
                            r++;
                        }
                    }
                    rowfrozen.className = 'ui-tinytbl-inner '+ classes[name].frozen;

                    table = $('<table style="width:'+ layout.width.frozen+ 'px;" class="ui-tinytbl-outer" />');

                    tinytbl[name].frozen
                        .css({ 'float':options.rtl, 'z-index':2, 'overflow':'hidden' })
                        .append(table);

                    table.append($colgroup.frozen.clone())
                        .append(rowfrozen);
                }
                else {
                    if (name === 'body') {
                        while (r < rows) {
                            rownormal.rows[r].className = 'ui-data-row';
                            r++;
                        }
                    }
                }

                // normal columns
                tinytbl[name].normal = $(create.normal);
                tinytbl[name].outer.append(tinytbl[name].normal);

                rownormal.className = 'ui-tinytbl-inner '+ classes[name].normal;

                table = $('<table style="width:'+ layout.width.normal +'px;" class="ui-tinytbl-outer" />');

                tinytbl[name].normal
                    .css({ 'float':options.rtl, 'z-index':1, 'overflow':cssoverflow })
                    .append(table);

                table.append($colgroup.normal.clone())
                    .append(rownormal);

                // append some properties from source table
                if (options[name] && options[name].useclass) {
                    tinytbl[name].outer.addClass(options[name].useclass);
                }

                // reset
                rowfrozen = null;
                rownormal = null;
                i++;
            }

            // remove non needed
            $colgroup.normal.remove();
            if ($colgroup.frozen) {
                $colgroup.frozen.remove();
            }

            // append TinyTbl after original (source) table
            tinytbl.main
                .attr('id', options.id)
                .attr('role', $source.attr('id'))
                .addClass(options.useclass)
                .addClass($source.attr('class'))
                .addClass('ui-tinytbl-'+options.rtl);

            $source.empty().hide().after(tinytbl.main);

            // get some css styles for correcting the layout dimensions
            layout.width.correct += this.correct_size(tinytbl.main, 'width');
            if ((''+options.width) === 'auto' || (''+options.width).substr(-1,1) === '%') {
                layout.width.autoset = ((''+options.width) === 'auto') ? 2 : 1;
                layout.width.correct += this.correct_size($parent, 'width');
            }
            layout.height.correct = this.correct_size(tinytbl.main, 'height');
            if ((''+options.height) === 'auto' || (''+options.height).substr(-1,1) === '%') {
                layout.height.autoset = ((''+options.height) === 'auto') ? 2 : 1;
                layout.height.correct += this.correct_size($parent, 'height');
            }
            tables = ['body','head','foot'];
            if (tinytbl.body && tinytbl.body.outer) {
                layout.width.inner += this.correct_size(tinytbl.body.outer, 'width');
                for (i = 0; i < 3; i++) {
                    if (!tinytbl[tables[i]] || !tinytbl[tables[i]].outer) {
                        continue;
                    }
                    layout.height.inner += this.correct_size(tinytbl[tables[i]].outer, 'height');
                }
            }

            // save object
            this.tinytbl = tinytbl;
            // save options
            this.options = options;
            // save dimension
            this.layout = layout;

            // counter
            tinytables.added++;

            // reset styles
            this.rows_class();

            // resize
            this.parent_show();
            this.init_layout();
            this.parent_hide();

        },


        /**
         * Initialize TinyTbl widget
         * @private
         */
        _init: function() {
            if (!this.tinytbl) {
                return;
            }
            var that = this,
                options = that.options,
                height = (''+options.height).toLowerCase(), width = (''+options.width).toLowerCase(),
                tinytbl = that.tinytbl;
            if (tinytbl.body && tinytbl.body.normal) {

                // scroll function
                tinytbl.body.normal.off('.tinytbl').on('scroll.tinytbl', function() {
                    var x = tinytbl.body.normal.scrollLeft(),
                        y = tinytbl.body.normal.scrollTop();
                    if (options.cols.frozen && tinytbl.body.frozen) {
                        tinytbl.body.frozen.scrollTop(y);
                    }
                    if (options.head && tinytbl.head && tinytbl.head.normal) {
                        tinytbl.head.normal.scrollLeft(x);
                    }
                    if (options.foot && tinytbl.foot && tinytbl.foot.normal) {
                        tinytbl.foot.normal.scrollLeft(x);
                    }
                });

                // auto focus
                if (options.body.autofocus) {
                    setTimeout(function() { tinytbl.body.normal.focus(); }, 100);
                }
            }

            // auto resize at window.onresize
            if (height === 'auto' || width === 'auto') {
                $(window).resize(function() {
                    if (tinytables.timers && tinytables.timers.resizewin) {
                        clearTimeout(tinytables.timers.resizewin);
                        tinytables.timers.resizewin = null;
                    }
                    setTimeout(function() { that.resize(); }, 50);
                });
            }

        },


        /**
         * Append new rows to the TinyTbl body object
         * @return  {*}
         * @public
         */
        append: function() {
            var rows = arguments;
            if (arguments.length === 1) {
                rows = arguments[0];
                if (typeof(arguments[0]) !== 'object') {
                    rows = [arguments[0]];
                }
            }
            return this.rows_insert(rows, false);
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
                this.tinytbl.main.data('source')
            ).removeData();
            this.tinytbl.main.remove().removeData();
            this.tinytbl = null;

            // remove events
            tinytables.added = tinytables.added - 1;
            if (tinytables.added <= 0) {
                this._off( this.window, 'resize');
            }
        },


        /**
         * Get the number of rows in TinyTbl body object
         * @return  {Number}
         * @public
         */
        numrows: function() {
            if (!this.tinytbl || !this.tinytbl.body || !this.tinytbl.body.normal) {
                return 0;
            }
            return $('table.ui-tinytbl-outer > .ui-tinytbl-inner', this.tinytbl.body.normal).get(0).rows.length;
        },


        /**
         * Prepend new rows to the TinyTbl body object
         * @return  {*}
         * @public
         */
        prepend: function() {
            var rows = arguments;
            if (arguments.length === 1) {
                rows = arguments[0];
                if (typeof(arguments[0]) !== 'object') {
                    rows = [arguments[0]];
                }
            }
            return this.rows_insert(rows, true);
        },


        /**
         * Removes rows from source table and TinyTbl
         * @param   rows
         * @param   [start]
         * @return  {null|Object}
         * @public
         */
        remove: function(rows, start) {
            if (!rows || !this.tinytbl || !this.tinytbl.body|| !this.tinytbl.body.normal) {
                return; // exit: tinytbl object not found
            }
            var options = this.options,
                tinytbl = this.tinytbl,
                source,
                normal = $('table.ui-tinytbl-outer > .ui-tinytbl-inner', tinytbl.body.normal).get(0),
                frozen = (options.cols.frozen && tinytbl.body.frozen) ? $('table.ui-tinytbl-outer > .ui-tinytbl-inner', tinytbl.body.frozen).get(0) : null,
                row, retval = 0;
            source = tinytbl.main.data('source').children('tbody').get(0) || null;
            if (!source) {
                source = tinytbl.main.data('source').get(0);
            }
            if (typeof(rows) === 'number') {
                if (typeof(start) !== 'number') {
                    row = 0;
                } else {
                    row = parseInt(start, 10) || 0;
                }
                for(;row < rows; row++) {
                    if (!$(normal.rows[row])) {
                        continue;
                    }
                    retval++;
                    $(source.rows[row]).remove();
                    $(normal.rows[row]).remove();
                    if (!frozen) {
                        continue;
                    }
                    $(frozen.rows[row]).remove();
                }
            }
            else if (typeof(rows) === 'object') {
                $(rows).each(function(row) {
                    if (!$(normal.rows[row])) {
                        return;
                    }
                    retval++;
                    $(source.rows[row]).remove();
                    $(normal.rows[row]).remove();
                    if (!frozen) {
                        return;
                    }
                    $(frozen.rows[row]).remove();
                });
            }

            // reset row classes
            this.rows_class();

            // resize table
            if (this.layout.height.autoset === 2) {
                this.layout.height.body = $(normal).outerHeight();
                this.parent_show();
                this.resize();
                this.parent_hide();
            }

            // returning
            if (typeof(options.rows.onRemove) === 'function' && this.tinytbl.body.normal) {
                options.rows.onRemove(retval, $(normal), $(frozen));
            }
        },


        /**
         * Resize table layout
         * @return  {void}
         * @public
         */
        resize: function() {
            if (!this.tinytbl || !this.tinytbl.body || !this.tinytbl.body.normal) {
                return;
            }
            this.max_size();
            var innerHeight, innerWidth,
                outerHeight, outerWidth,
                layout  = this.layout,
                tinytbl = this.tinytbl,
                body = tinytbl.body.normal.get(0),
                maxWidth = layout.width.maxsize - layout.width.inner,
                maxHeight = layout.height.maxsize - layout.height.inner;

            // height
            outerHeight = maxHeight;
            if (layout.height.autoset === 2) {
                outerHeight = layout.height.head + layout.height.foot + layout.height.body;
                if (outerHeight > maxHeight) {
                    outerHeight = maxHeight;
                }
            }
            innerHeight = outerHeight - (layout.height.head + layout.height.foot);
            body.style.height = innerHeight+'px';

            // width
            outerWidth = maxWidth;
            if (layout.width.autoset === 2) {
                outerWidth = layout.width.normal + layout.width.frozen;
                if (outerWidth > maxWidth) {
                    outerWidth = maxWidth;
                }
            }
            innerWidth = outerWidth - layout.width.frozen;
            body.style.width = innerWidth +'px';

            if (body.clientWidth < body.offsetWidth && (innerWidth + layout.scrollbar) < maxWidth) {
                outerWidth += layout.scrollbar;
                body.style.width = (innerWidth + layout.scrollbar)+'px';
            }

            // apply to other objects
            if (tinytbl.body.frozen) {
                tinytbl.body.frozen.height(body.clientHeight);
            }
            innerWidth = body.clientWidth;
            if (tinytbl.foot && tinytbl.foot.normal) {
                tinytbl.foot.normal.width(innerWidth);
            }
            if (tinytbl.head && tinytbl.head.normal) {
                tinytbl.head.normal.width(innerWidth);
            }

            // set main container
            tinytbl.main.css({'height':(outerHeight+layout.height.inner)+'px','width':(outerWidth+layout.width.inner)+'px'});
        },


        // NOOP ;)
        '': null

    });

})(jQuery);
