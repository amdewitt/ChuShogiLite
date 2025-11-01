# ChuShogiLite - Embeddable Chu Shogi Web Applet
This is a piece of Chu Shogi infrastructure that can be very easily embedded in websites, and be embedded multiple times per page. It is based on the DHTML Chu Shogi Board found at https://toybox.a.la9.jp/chushogi/dhtmlchu/, but improves it in many key ways, including, but not limited to:

* A much simpler setup method
* Rule enforcement, with several settings to account for the most common rule variations
* Legal move highlights for selected pieces with 100% accuracy
* The ability to draw circles and arrows on the board with right-clicks
* Easy exports and imports for games (albeit to a simplistic plaintext that fits everything in a single line)
* Easy editing of all aspects of the board positionw with the mouse

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

__&lt;!-- Include files --><br>
&lt;link rel="stylesheet" href="chushogi-lite.css"><br>
&lt;script src="chushogi-lite.js">&lt;/script><br>
&lt;!-- Game container --><br>
&lt;div class="chuShogiLite" data-config='{<br>
&nbsp; "appletMode": "sandbox",<br>
&nbsp; "startGame": null,<br>
&nbsp; "flipView": false,<br>
&nbsp; "useInlineNotation": false,<br>
&nbsp; "boardSize": "large",<br>
&nbsp; "showCoordinates": true,<br>
&nbsp; "showLegalMoves": true,<br>
&nbsp; "showLastMove": true,<br>
&nbsp; "showPromotionZones": false,<br>
&nbsp; "showInfluenceDisplay": false,<br>
&nbsp; "allowIllegalMoves": false,<br>
&nbsp; "midpointProtection": false,<br>
&nbsp; "trappedLancePromotion": false,<br>
&nbsp; "repetitionHandling": "strict"<br>
}'>&lt;/div>__

The include files should be included once per page, but the chuShogiLite &lt;div class="chuShogiLite"></div> tags can be included as many times as desired, each will create its own self-contained applet.

The __daga-config__ attribute can be used to set the applet's various settings, whose defaults are shown above. It's value is a JSON string with the key-value pairs shown above. Most of these key-value pairs have boolean values (i.e. they can be true or false), with the following being exceptions:

* __"appletMode"__ - Can be "sandbox", "fixedStart", "fixedRules", "fixedSettings", "fixedStartAndRules", "fixedStartAndSettings", "puzzle", or "viewOnly"
* __"startGame"__ - Can be any Game Export string ("SFEN USIMove1 USIMove2..." or "USIMove1 USIMove2...") or null
* __"boardSize"__ - Can be "small", "medium", or "large"
* __"repetitionHandling"__ - Can be "strict", "lenient", or "relaxed"
