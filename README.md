useref-sample
=============

_in progress_

A task that lets you use `usemin` blocks to inidicate the files you want to concat and minify. It updates the html
references from those blocks as well as automatically concat and minifying per the directive of those blocks.

This task assumes you are in temp directory. So first copy everything to a temp directory. The copy tasks is not added
to this task to keep it as atomic as possible.

A separate, `rev` like task also adds the `package.json` revision number to the end of files.

### Usage

```javascript

```
