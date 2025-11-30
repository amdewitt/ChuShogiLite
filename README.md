# ChuShogiLite - Embeddable Chu Shogi Web Applet
This is a piece of Chu Shogi infrastructure that can be very easily embedded in websites, and be embedded multiple times per page. It is based on the DHTML Chu Shogi Board found at https://toybox.a.la9.jp/chushogi/dhtmlchu/, but improves it in many key ways, including, but not limited to:

* A much simpler setup method, which can be used multiple times per page
* Rule enforcement, with several settings to account for the most common rule variations
* Legal move highlights for selected pieces with 100% accuracy
* The ability to draw circles and arrows on the board with right-clicks
* Easy exports and imports for games (albeit to a simplistic plaintext that fits everything in a single line)
* Easy editing of all aspects of the board position with the mouse
* As a bonus, a collection of tsume puzzles and a couple of helpful tools are included.

## Live Version

A live version of the script is available [here](https://www.chessvariants.com/invention/chushogilite).

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

To embed the applet in a webpage, simply embed the following code into the page's HTML. Make sure JavaScript is enabled, or the applet will not run.

__&lt;!-- Include files (Embed these once per page) --><br>
&lt;link rel="stylesheet" href="&lt;FILE PATH HERE>/chushogi-lite.css"><br>
&lt;script src="&lt;FILE PATH HERE>/chushogi-lite.js">&lt;/script><br>
&lt;!-- Game container (Embed as many of these as desired)--><br>
&lt;div class="chuShogiLite" data-config='{<br>
&nbsp; "appletMode": "sandbox",<br>
&nbsp;  "startGame": null,<br>
&nbsp;  "allowCustomComments": true,<br>
&nbsp;  "flipView": false,<br>
&nbsp;  "displaySFEN": false,<br>
&nbsp;  "displayInlineNotation": false,<br>
&nbsp;  "boardSize": "large",<br>
&nbsp;  "showCoordinates": true,<br>
&nbsp;  "showMoveablePieces": true,<br>
&nbsp;  "showLegalMoves": true,<br>
&nbsp;  "showLastMove": true,<br>
&nbsp;  "showPromotionZones": false,<br>
&nbsp;  "showInfluenceDisplay": false,<br>
&nbsp;  "allowIllegalMoves": false,<br>
&nbsp;  "allowCustomComments": true,<br>
&nbsp;  "midpointProtection": false,<br>
&nbsp;  "trappedLancePromotion": false,<br>
&nbsp;  "repetitionHandling": "strict"<br>
}'>&lt;/div>__

## Applet Settings

The __daga-config__ attribute can be used to set the applet's various settings, whose defaults are shown above. It's value is a JSON string of key-value pairs, with their defaults shown above. Settings that use their default values can be left out of the JSON string, and if the default applet is desired the __daga-config__ attribute can be left out entirely.

Most of the key-value pairs in the JSON string have boolean values (i.e. they can be true or false), with the following being exceptions:
* __"appletMode"__ - Can be "sandbox", "fixedStart", "fixedRules", "fixedSettings", "fixedStartAndRules", "fixedStartAndSettings", "puzzle", or "viewOnly"
* __"startGame"__ - Can be any Game Export string* or null
* __"boardSize"__ - Can be "small", "medium", or "large"
* __"repetitionHandling"__ - Can be "strict", "lenient", or "relaxed"

*A Game Export string is a string containing an SFEN string followed by a series of moves in USI, all separated by spaces.

<a href="https://en.wikipedia.org/wiki/Shogi_notation#SFEN">SFEN (Shogi Forsyth-Edwards Notation)</a> is a compact string encoding of the position of a Shogi game, and <a href="https://en.wikipedia.org/wiki/Shogi_notation#SFEN">USI (Universal Shogi Interface)</a> is a dialect of UCI (Universal Chess Interface) adapted for Shogi (i.e. 7g7f or 7g7c+). ChuShogiLite uses versions of both that are specifically adapted for Chu Shogi, which are the same as those used by <a href="https://lishogi.org/analysis/chushogi">Lishogi</a>.

## Custom Styling

The 'chushogi-lite.css' file comes with many different variables found at the top of the file that can be customized, allowing for a variety of styling options. However, these must be customized within the file itself (or altered in a copy which is used for the desired applets) or by using &lt;style> tags, like so.

__&lt;style><br>
.chuShogiLite {<br>
&nbsp; --text-color-container: #1f1f1f;<br>
&nbsp; --background-board-square: hsl(45, 45%, 87%);<br>
&nbsp; --border-light: hsl(20, 5.9%, 90%);<br>
&nbsp; --sidebar-button-text-color: white;<br>
...<br>
}<br>
&lt;/style>__
