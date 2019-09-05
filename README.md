# bookify

I was a long-time fan of the [Ulysses](https://ulysses.app/) word-processor until they switched to a [subscription pricing model](https://www.youtube.com/watch?v=oHg5SJYRHA0) while conspicuously failing to deliver useful new 
features.

This tool was written specifically to rescue a [large book](https://loewald.com/c3dbook) from Ulysses, but may eventually be made generic. Right now it's hardwired to run on a directory called `Learn 3D` that's in the same directory as the repo, i.e.

```
some-directory/
  Learn 3D/
  bookify/
```

The contents of `Learn 3D` are what you get when you export a Ulysses project as markdown -- a single `index.md` file and a huge pile of images in pdf, png, and jpg formats.

If you clone this repo and then:

```
npm install
...
npm run test
```

The script will create a subdirectory of `Learn 3D` called `bookified` that
contains a broken up version of `index.md` where every `<H1>` starts a new chapter
and every `<H2>` after the first breaks a new section.

All the images referred to in `index.md` will have been converted to `.jpg` 
(using `sips`) and the references to those images updated in the markdown.

**Three additional files** will be created:

- `documentation.json` is a table of contents. This file is compatible with [bindinator's](https://bindinator.com) documentation component.
- `imageMap.json` is a map of images to the sections containing them. The idea of
  this file is to allow a table of figures and the ability to **browse images** and implement a visual index.
- `wordMap.json` is a map of sections to the words appearing in them. The purpose of this file is to ease the implementation of **fast free text search**.
  
## TODO

- Allow user to specify the target folder (rather than be forced to replace `Learn 3D` in the script or only process files in folders named `Learn 3D`)
- Implement `book.component.html` -- a book-centric version of `documentation.component.html` -- that supports free text search and image lookup (and doesn't run background unit tests)
- Create an index.html file that pulls `b8r.js` and `book.component.html` described above from `bindinator.com` and allows you to host books as **github pages**.
- Possibly build a `b8r-native` app around this and provide edit functionality. Build something like Ulysses with an actual table editor, decent image-management tools, etc. etc.
- Figure out how to generate an ePub either from the command-line and/or on-the-fly in the browser
