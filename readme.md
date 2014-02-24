jQuery UI TinyTable
===========================================================================

Light weight and fully themeable jQuery UI Plugin to generate tables on the
fly with fixed columns, header and/or footer.  Simple usage and a very small
with basic functions like append, prepend or remove one row to the table.



API description
---------------------------------------------------------------------------

### Create

Convert a normal table into a TinyTable, simple use this command:  
`$('.selector').tinytbl(object options);`


#### You can use follow options:
`
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
`        

### Destroy

`$('.selector').tinytbl('destroy');`  
Removes the TinyTable and restores the original table.


### Focus

`$('.selector').tinytbl('focus');`  
Set the focus to the scrollable area.


### Append a row

`$('.selector').tinytbl('append', object tr-element);`  
Add a new row to TinyTable to the bottom of the body section.


### Prepend a row

`$('.selector').tinytbl('prepend', object tr-element);`  
Add a new row to TinyTable to the top of the body section.


### Remove a row

`$('.selector').tinytbl('remove', object tr-element);`  
Removes a specified row from the body section.



Changelog
---------------------------------------------------------------------------

### Version 3.1.2, under development
__Complete reprogrammed__  
- Ready for jQuery 1.10.2 and jQuery UI 1.10.3.  
- Faster implementation, and easier interface  
- Option 'renderer' removed  
- Prepared to support col-resizing  
__Please do not use this in production environment.__  


### Version 2.1.2beta
__Support interlock tables__  
[https://github.com/mkkeck/jquery-ui-tinytbl/tree/2.1.2beta](https://github.com/mkkeck/jquery-ui-tinytbl/tree/2.1.2beta)

### Version 2.1.1
__Official public release__  
[https://github.com/mkkeck/jquery-ui-tinytbl/tree/2.1.1](https://github.com/mkkeck/jquery-ui-tinytbl/tree/2.1.1)

### Version 1.9.0a, released 2011-10-08
__1st official release__


Notes
---------------------------------------------------------------------------

### Minimum requirements:
- jQuery 1.6.2
- jQuery UI Core 1.8.16
- jQuery UI Widget 1.8.16

### Tested browsers:
- Firefox (> 26)
- Google Chrome (> 21)
- Internet Explorer (> 8)

### Mics:
- To enable fixed table header the table must have a tbody and a thead.
- To enable fixed table footer the table must have a tbody and a tfoot.


