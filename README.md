# ChuShogiLite - Embeddable Chu Shogi Web Applet
This is a piece of Chu Shogi infrastructure that can be very easily embedded in websites, and be embedded multiple times per page. It is based on the DHTML Chu Shogi Board found at https://toybox.a.la9.jp/chushogi/dhtmlchu/, but improves it in many key ways, including:

* A much simpler setup method
* Rule enforcement, with several settings to account for the most common rule variations
* Legal move highlights for selected pieces with 100% accuracy
* The ability to draw circles and arrows on the board with right-clicks
* Easy exports and imports for games (albeit to a simplistic plaintext that fits everything in a single line)
* Easy editing of all aspects of the board positionw with the mouse
* Full rules description of Chu Shogi, which dynamically updates with changes to the Rules settings.
* A Help section explaining all included features

## Setting up ChuShogiLite a Website

To set up the applet onto your own site, do the following:

1. Go to the following website:
   * https://github.com/amdewitt/ChuShogiLite
3. Click the < > Code button, then click Download ZIP and extract the files.
   * If you only want the files necessary to run the applet, just download the 'chushogi-lite.js' and 'chushogi-lite.css' files.
5. Put the 'chushogi-lite.js' and 'chushogi-lite.css' files into the desired location.
   * Ideally both files should be in the same folder.
6. The applet is now ready to be used!

## Embedding the applet in a web page

To embed the applet in a webpage, simply embed the following code into the page's HTML:

&lt;!-- Include files -->
&lt;link rel="stylesheet" href="chushogi-lite.css">
&lt;script src="chushogi-lite.js">&lt;/script>
&lt;!-- Game container -->
&lt;div class="chuShogiLite">
&lt;/div>

The include files should be included once per page, but the chuShogiLite &lt;div class="chuShogiLite"></div> tags can be included as many times as desired, each will create its own self-contained applet which will not inter
