
### A quick and dirty implementation of text on a path, for Fabric.js

Note: this is a high-level (library-external) class that manipulates a Fabric canvas and its objects from its public API, not anything like a new Fabric shape implemented as working inside of the library.

(I spent a while trying to nicely reuse the `fabric.Text` / `fabric.IText` classes by subtly changing the underlying "coordinate system", but the code is very complex and a bit too messy in my opinion, especially given that I'd probably need simpler "external controls" being additional shapes instead of low-level context drawings. In the end I decided the easiest way to go was to simply write a library-external addition, even though an internal implementation would have had my preference.)

![Curved text example](/screenshot.png?raw=true)
