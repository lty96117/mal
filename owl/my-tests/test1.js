'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const printer_1 = require('../printer');
const reader_1 = require('../reader');
// const str: string = '{"abc" 1}';
const str = '(+ 23 1)';
// const str: string = '^{"a" 1} [1 2 3]';
// console.log(prStr(readStr("(+    1 2 )")));
// console.log(readStr("(+    1 2 )"));
console.log(printer_1.prStr(reader_1.readStr(str)));
