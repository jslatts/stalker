# Stalker

Stalker is a utility to watch a directory tree for incomign files and fire off 
the callback function __OF YOUR CHOICE!__.

It should be smart enough to multiple files/folders being dropped into the 
directory being stalked. I haven't tested it much. Be warned!

## Installation

    $ npm install stalker

## How to use

    var stalker = require('stalker');

    stalker.watch('some_directory', function (err, file) {
      console.log('I saw a file. It was going like this: ' + file);
    });

## License 

(The MIT License)

Copyright (c) 2011 Justin Slattery &lt;Justin.Slattery@fzysqr.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Gir

                         __
                      _,'  `:--.__
                    ,'    .       `'--._
                  ,'    .               `-._
          ,-'''--/    .                     `.
        ,'      /   .    ,,-''`-._            `.
       ; .     /   .   ,'         `,            |____
       |      /   .   ;             :           |--._\
       '     /   :    |      .      |           |
        `.  ;   _     :             ;           |
          `-:   `"     \           ,           _|==:--.__
             \.-------._`.       ,`        _.-'     `-._ `'-._
              \  :        `-...,-``-.    .'             `-.   |
               `.._         / | \     _.'                  `. |
                   `.._    '--'```  .'                       `|
                       `.          /
                .        `-.       \
         ___   / \  __.--`/ , _,    \
       ,',  `./,--`'---._/ = / \,    \  __
      /    .-`           `"-/   )_    \"`
    _.--`-<_         ,..._ /,-'` /    /
  ,'.-.     `.    ,-'     `.    /`'.+(
 / /  /  __   \. ,'    ,   `.  '    \ \
 |(_.'  /  \   ; |          |        ""_
 |     (   ;   `  \        /           `.
 '.     `-`   `    `.___,-`             `.
   `.        `                           |
    ; `-.__`                             |
    \    -._                             |
     `.                                  /
      /`._                              /
      \   `,                           /
       `---'.     /                  ,'
             '._,'-.              _,(_,_
                    |`--.    ,,.-' `-.__)
                     `--`._.'   dew   `._)
                                         `=-
