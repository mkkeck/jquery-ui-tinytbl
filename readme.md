# jQuery UI TinyTable

Light weight and fully themeable jQuery UI Plugin to generate tables on the
fly with fixed columns, header and/or footer.  Simple usage and a very small
with basic functions like append, prepend or remove one row to the table.


## API description

### Create
Convert a normal table into a TinyTable, simple use this command:  
`$('selector').tinytbl({ });`


#### You can use follow options:
    table.tinytbl({
      'body': {
        'useclass': null,
        'autofocus': false
      },
      'cols': {
        'autosize': false,   // Not used yet
        'frozen': 0,
        'moveable': false,   // Not implemented yet
        'resizable': false,  // Not implemented yet
        'sortable': false    // Not implemented yet
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
      'resizable': false,     // Not implemented yet 
      'rows': {
        'onInsert': null,     // function() {}, but not implemented yet
        'onRemove': null,     // function() {}, but not implemented yet
        'onSelect': null,     // function() {}, only silly test
        'onContext': null,    // function() {}, but not implemented yet
        'multiselect': false
      },
      'rtl': false,
      'useclass': null,
      'width': 'auto'
    });  


##### Option `body`
This option is allways true, but you can setup here some specials.  
- `useclass: 'your-css-body-classname'` to setup an extra CSS classname.  
- `autofocus: false` disables (with `true` enables) the autofocus to the scrollable area after the widget was created and/or init.  


##### Option `cols`  
Here you can set the frozen columns for TinyTable.  
- `autosize: false` disables columns resizing after inserting or deleting rows to the body container. This option is not used at the moment, because the insert and delete methods are not implemented.  
- `frozen: 0` set the number of columns to be frozen. `0`, `null` or `false` disables frozen columns.  
- `moveable: false` this options is not implemented yet. Later it would be an configuarable object of moveable columns. To enable this feature, you need jQuery UI Draggable/Droppable  
- `resizable: false` this options is not implemented yet. Later it would be an configuarable object of resizable columns. To enable this feature, you need jQuery UI Resizable.  
- `sortable: false` this options is not implemented yet. Later it would be an configuarable object for sorting table data.


##### Option `foot`  
This option is false, if your source table does not include a `<tfoot>` and/or `<tbody>` html tag.  
- `useclass: 'your-css-foot-classname` to setup an extra CSS classname.  
- `atTop: false` is default and will set the foot-container to the bottom of TinyTable.  
- `atTop: true` or `atTop: 'after'` sets the foot-container beetween the head- and body-container.  
- `atTop: 'before'` the foot-container is the first-container.  
If youd don't want to use a table footer, please set: `foot: false` or `foot: null`.  
Notice: If `foot: false` or `foot: null`` the footer of your source table would not be available in TinyTable.


##### Option `head`  
This option is false, if your source table does not include a `<thead>` and/or `<tbody>` html tag.  
- `useclass: 'your-css-head-classname` to setup an extra CSS classname.  
If you don't want to use a table header, please set: `head: false` or `head: null`.  
**Notice:** If `head: false` or `head: null` the header of your source table would not be available in TinyTable. Column resizing, reorder and data sorting would be disabled, if no header is used. 


##### Options `height` and `width`
The new version of TinyTable has an intelligent calculation for the correct diemnsions. The deprecated option `renderer` is removed.  
You can use any of the following units to set the dimensions: `%`, `px`, `em` or `pt`. If you not use an unit, calculation will be done with pixels.  

###### Default or pixels `px`
Set the dimensions to the given values.

###### Points `pt`
Calculates the dimensions with given points into pixels. Here's a small sample: you set the width to `886.5pt` and the result is `886.5pt * 1.3 = 1152px`.

###### Percentage `%`
Calculates the `height` and / or `width` in percentage values of available `height` and/or `width`. A small sample: your table has a container and its width is `1280px`, you will set the width of TinyTable to `90%` than you get `1280px/100% * 90% = 1152px`. 

###### Relative with `em`
Calculates the `height` and / or `width` relative to the used font-size. The default factor for this is `16px`. Here's a small sample: you set the width to `72em` and the result is `72em/1em * 16px = 1152px`.  

###### Dimensions with `auto`  
If you use `'auto'` for the options `height` and/or `width`, TinyTable would be resized to maximum available `height` and/or `width`. If TinyTable smaller than maximum available `height` and `width` it would be resized to its outersize.


##### Option `id`
Default is `null` and will use an internal id lik `tinytbl-XX` where `XX` is internal counter. You can set here your own unique id: `id: 'my-own-unique-tt'`.  


##### Option `rows`
This setting is not fully implemented yet.

###### Function `onInsert()`
Not implemented yet.

###### Function `onRemove()`
Not implemented yet.

###### Function `onSelect()`
Partial implemented for testing the option `rows.multiselect`

###### Function `onContext()`
Not implemented yet. Would be an right click popup menu later.

###### `multiselect`
Setup, if row multiselection would available or not. Default is `false`. On `true` it requires the function `rows.onSelect()` and jQuery UI Selectable.


##### Option `rtl`
Set the text direction:  
- `rtl: false`, text direction is left to right  
- `rtl: true`, text direction is right to left


##### Option `useclass`
Here you can set an extra CSS classname for the container of TinyTable. Default value is `null`.



### Destroy

To remove TinyTable and restore original table call follow command:  
`$('.selector').tinytbl('destroy');`  



Changelog
---------------------------------------------------------------------------

#### Version 3.1.2, still under development
**Complete reprogrammed**  
- Ready for jQuery 1.10.2 and jQuery UI 1.10.3.  
- Faster implementation, and easier interface  
- Option 'renderer' removed  
- Prepared to support col-resizing, col-moving, col-reorder  

**NOTICE:** Please do not use this in production environment.  


#### Version 2.1.2beta
**Support interlock tables**  
[https://github.com/mkkeck/jquery-ui-tinytbl/tree/2.1.2beta](https://github.com/mkkeck/jquery-ui-tinytbl/tree/2.1.2beta)  


#### Version 2.1.1
**1st official public release**  
[https://github.com/mkkeck/jquery-ui-tinytbl/tree/2.1.1](https://github.com/mkkeck/jquery-ui-tinytbl/tree/2.1.1)  


#### Version 1.9.0a, released 2011-10-08
**1st internal release**

Notes
---------------------------------------------------------------------------

#### Minimum requirements:
- jQuery 1.9.x
- jQuery UI Core 1.8.16
- jQuery UI Widget 1.8.16  
- Dependencies on options:  
  - jQuery UI Resizable  
  - jQuery UI Selectable
  - jQuery UI Drag/Drop

#### Tested browsers:
- Firefox (> 26)
- Google Chrome (> 21)
- Internet Explorer (> 8)

#### Mics:
- To enable fixed table header the table must have a tbody and a thead.
- To enable fixed table footer the table must have a tbody and a tfoot.


