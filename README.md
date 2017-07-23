# html-includes package

This package allows you to write partial html documents and combine them together on save. This way, you don't have to write server-side logic or worry about performance with html include statements.

# usage

Add the html tag

`<partial src="exampleIncludeFile.html"/>`

to your html document to include an outside file. Then, rename your html document with the extension .anomalous. Now, every time your .anomalous file is saved, a .html file will be generated where your partials will be included in the resulting html file.
