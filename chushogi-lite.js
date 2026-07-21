/**
 * ChuShogiLite - Pure JavaScript Chu Shogi Implementation
 * A complete, embeddable Chu Shogi game with SFEN support
 */

(function (global) {
    "use strict";

    // Version Number

    // Debug system
    const showDebugOutput = false;

    const disambiguateMoves = true;

    function showDebugMessage(msg) {
        if (showDebugOutput) {
            console.log(msg);
        }
    }

    // Piece definitions with movement patterns and promotions (based on Wikipedia table)
    const PIECE_DEFINITIONS = {
        // Basic pieces that do promote (corrected based on Wikipedia)
        P: { name: "Pawn", kanji: "\u6b69", movement: "P", promotes: "+P" },
        I: { name: "Go-Between", kanji: "\u4ef2", movement: "I", promotes: "+I" },
        C: {
            name: "Copper General",
            kanji: "\u9285",
            movement: "C",
            promotes: "+C",
        },
        S: {
            name: "Silver General",
            kanji: "\u9280",
            movement: "S",
            promotes: "+S",
        },
        G: { name: "Gold General", kanji: "\u91d1", movement: "G", promotes: "+G" },
        F: {
            name: "Ferocious Leopard",
            kanji: "\u8c79",
            movement: "F",
            promotes: "+F",
        },
        T: { name: "Blind Tiger", kanji: "\u864e", movement: "T", promotes: "+T" },
        E: {
            name: "Drunk Elephant",
            kanji: "\u8c61",
            movement: "E",
            promotes: "+E",
        },
        X: { name: "Phoenix", kanji: "\u9cf3", movement: "X", promotes: "+X" },
        O: { name: "Kirin", kanji: "\u9e92", movement: "O", promotes: "+O" },
        L: { name: "Lance", kanji: "\u9999", movement: "L", promotes: "+L" },
        A: {
            name: "Reverse Chariot",
            kanji: "\u53cd",
            movement: "A",
            promotes: "+A",
        },
        M: { name: "Side Mover", kanji: "\u6a2a", movement: "M", promotes: "+M" },
        V: {
            name: "Vertical Mover",
            kanji: "\u7aea",
            movement: "V",
            promotes: "+V",
        },
        B: { name: "Bishop", kanji: "\u89d2", movement: "B", promotes: "+B" },
        R: { name: "Rook", kanji: "\u98db", movement: "R", promotes: "+R" },
        H: { name: "Dragon Horse", kanji: "\u99ac", movement: "H", promotes: "+H" },
        D: { name: "Dragon King", kanji: "\u9f8d", movement: "D", promotes: "+D" },

        // Basic pieces that don't promote
        Q: { name: "Queen", kanji: "\u5954", movement: "Q", promotes: null },
        N: { name: "Lion", kanji: "\u7345", movement: "N", promotes: null },
        k: { name: "King", kanji: "\u7389", movement: "K", promotes: null },
        K: { name: "King", kanji: "\u738b", movement: "K", promotes: null },

        // Promoted pieces (only appear upon promotion)
        // These should be accessed by the original piece type prefixed with '+'
        "+T": {
            name: "Flying Stag",
            kanji: "\u9e7f",
            movement: "+T",
            promotes: null,
        }, // Blind Tiger -> Flying Stag
        "+E": { name: "Prince", kanji: "\u592a", movement: "K", promotes: null }, // Drunk Elephant -> Prince (same as King)
        "+L": {
            name: "White Horse",
            kanji: "\u99d2",
            movement: "+L",
            promotes: null,
        }, // Lance -> White Horse
        "+A": { name: "Whale", kanji: "\u9be8", movement: "+A", promotes: null }, // Reverse Chariot -> Whale
        "+M": {
            name: "Free Boar",
            kanji: "\u732a",
            movement: "+M",
            promotes: null,
        }, // Side Mover -> Free Boar
        "+V": {
            name: "Flying Ox",
            kanji: "\u725b",
            movement: "+V",
            promotes: null,
        }, // Vertical Mover -> Flying Ox
        "+H": {
            name: "Horned Falcon",
            kanji: "\u9df9",
            movement: "+H",
            promotes: null,
        }, // Dragon Horse -> Horned Falcon
        "+D": {
            name: "Soaring Eagle",
            kanji: "\u9df2",
            movement: "+D",
            promotes: null,
        }, // Dragon King -> Soaring Eagle

        // Additional promoted pieces based on original piece types and their promotion targets
        "+P": {
            name: "Gold General",
            kanji: "\u91d1",
            movement: "G",
            promotes: null,
        }, // Pawn -> Gold General
        "+I": {
            name: "Drunk Elephant",
            kanji: "\u8c61",
            movement: "E",
            promotes: null,
        }, // Go-Between -> Drunk Elephant
        "+C": {
            name: "Side Mover",
            kanji: "\u6a2a",
            movement: "M",
            promotes: null,
        }, // Copper General -> Side Mover
        "+S": {
            name: "Vertical Mover",
            kanji: "\u7aea",
            movement: "V",
            promotes: null,
        }, // Silver General -> Vertical Mover
        "+G": { name: "Rook", kanji: "\u98db", movement: "R", promotes: null }, // Gold General -> Rook
        "+F": { name: "Bishop", kanji: "\u89d2", movement: "B", promotes: null }, // Ferocious Leopard -> Bishop
        "+X": { name: "Queen", kanji: "\u5954", movement: "Q", promotes: null }, // Phoenix -> Queen
        "+O": { name: "Lion", kanji: "\u7345", movement: "N", promotes: null }, // Kirin -> Lion
        "+B": {
            name: "Dragon Horse",
            kanji: "\u99ac",
            movement: "H",
            promotes: null,
        }, // Bishop -> Dragon Horse
        "+R": {
            name: "Dragon King",
            kanji: "\u9f8d",
            movement: "D",
            promotes: null,
        }, // Rook -> Dragon King
    };

    // KIF board-diagram constants. These are specific to the plain-text KIF
    // "drawing" format used for non-standard starting positions, and are
    // intentionally separate from PIECE_DEFINITIONS above: the KIF diagram
    // convention for some promoted pieces (e.g. "+P" -> "\u6210\u6b69") differs from
    // the piece's actual promoted identity used elsewhere in the app
    // (Pawn -> Gold General, kanji "\u91d1"). This table matches the literal
    // reference diagram exactly.
    const KIF_DIAGRAM_KANJI = {
        P: "\u6b69",
        I: "\u4ef2",
        C: "\u9285",
        S: "\u9280",
        G: "\u91d1",
        F: "\u8c79",
        T: "\u864e",
        E: "\u8c61",
        X: "\u9cf3",
        O: "\u9e92",
        L: "\u9999",
        A: "\u53cd",
        M: "\u6a2a",
        V: "\u7aea",
        B: "\u89d2",
        R: "\u98db",
        H: "\u99ac",
        D: "\u9f8d",
        Q: "\u5954",
        N: "\u7345",
        K: "\u7389",
        "+P": "\u6210\u6b69",
        "+I": "\u6210\u8c61",
        "+C": "\u6210\u6a2a",
        "+S": "\u6210\u7aea",
        "+G": "\u6210\u98db",
        "+F": "\u6210\u89d2",
        "+T": "\u9e7f",
        "+E": "\u592a",
        "+X": "\u6210\u5954",
        "+O": "\u6210\u7345",
        "+L": "\u99d2",
        "+A": "\u9be8",
        "+M": "\u732a",
        "+V": "\u725b",
        "+B": "\u6210\u99ac",
        "+R": "\u6210\u9f8d",
        "+H": "\u9df9",
        "+D": "\u9df2",
    };

    // Formal (traditional, multi-kanji) piece names used in KIF move text \u2014
    // distinct from the single-kanji board-diagram glyphs in
    // KIF_DIAGRAM_KANJI above (e.g. Bishop's board glyph is "\u89d2" but its
    // formal move-notation name is "\u89d2\u884c"). For promoted pieces, the name
    // shown is always the RESULTING piece's formal name (e.g. a promoting
    // Bishop is shown as "\u9f8d\u99ac", the Dragon Horse it becomes), matching the
    // reference example exactly. Names for the eight uniquely-named
    // promoted pieces not covered by the reference example (+T, +E, +L,
    // +A, +M, +V, +H, +D) use their standard historical two-kanji Chu
    // Shogi names.
    const KIF_MOVE_PIECE_NAMES = {
        P: "\u6b69\u5175",
        I: "\u4ef2\u4eba",
        C: "\u9285\u5c06",
        S: "\u9280\u5c06",
        G: "\u91d1\u5c06",
        F: "\u731b\u8c79",
        T: "\u76f2\u864e",
        E: "\u9154\u8c61",
        X: "\u9cf3\u51f0",
        O: "\u9e92\u9e9f",
        L: "\u9999\u8eca",
        A: "\u53cd\u8eca",
        M: "\u6a2a\u884c",
        V: "\u7aea\u884c",
        B: "\u89d2\u884c",
        R: "\u98db\u8eca",
        H: "\u9f8d\u99ac",
        D: "\u9f8d\u738b",
        Q: "\u5954\u738b",
        N: "\u7345\u5b50",
        K: "\u7389\u5c06",
        "+P": "\u91d1\u5c06",
        "+I": "\u9154\u8c61",
        "+C": "\u6a2a\u884c",
        "+S": "\u7aea\u884c",
        "+G": "\u98db\u8eca",
        "+F": "\u89d2\u884c",
        "+T": "\u98db\u9e7f",
        "+E": "\u592a\u5b50",
        "+X": "\u5954\u738b",
        "+O": "\u7345\u5b50",
        "+L": "\u767d\u99d2",
        "+A": "\u9be8\u9be2",
        "+M": "\u5954\u732a",
        "+V": "\u98db\u725b",
        "+B": "\u9f8d\u99ac",
        "+R": "\u9f8d\u738b",
        "+H": "\u89d2\u9df9",
        "+D": "\u98db\u9df2",
    };

    const KIF_RANK_KANJI = [
        "\u4e00",
        "\u4e8c",
        "\u4e09",
        "\u56db",
        "\u4e94",
        "\u516d",
        "\u4e03",
        "\u516b",
        "\u4e5d",
        "\u5341",
        "\u5341\u4e00",
        "\u5341\u4e8c",
    ];

    // Static file-number header and top/bottom border - always the same
    // since the Chu Shogi board is always 12x12.
    const KIF_FILE_HEADER =
        " \uff11\uff12 \uff11\uff11 \uff11\uff10 \uff19  \uff18  \uff17  \uff16  \uff15  \uff14  \uff13  \uff12  \uff11";
    const KIF_BOARD_BORDER = "+" + "-".repeat(48) + "+";

    // The standard Chu Shogi starting position's board field (no player/move
    // fields). Used to decide whether a KIF export needs the "\u624b\u5408\u5272\uff1a" line
    // (standard start) or a full board drawing (non-standard start).
    const KIF_STANDARD_START_BOARD =
        "lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL";

    // CENTRALIZED UTILITY FUNCTIONS
    // Consolidates repeated DOM operations, coordinate parsing, and CSS class management
    const utils = {
        // DOM UTILITIES - Centralized DOM query and manipulation functions
        dom: {
            // Find element within container with error handling
            querySelector(container, selector) {
                const element = container.querySelector(selector);
                if (!element && selector.includes("[data-")) {
                    console.warn(`Element not found: ${selector}`);
                }
                return element;
            },

            // Find all elements within container
            querySelectorAll(container, selector) {
                return container.querySelectorAll(selector);
            },

            // Add CSS classes with validation
            addClass(element, ...classes) {
                if (element && classes.length > 0) {
                    element.classList.add(...classes.filter((c) => c));
                }
            },

            // Remove CSS classes with validation
            removeClass(element, ...classes) {
                if (element && classes.length > 0) {
                    element.classList.remove(...classes.filter((c) => c));
                }
            },

            // Toggle CSS class
            toggleClass(element, className, force) {
                if (element && className) {
                    return element.classList.toggle(className, force);
                }
                return false;
            },

            // Clear all highlight classes from board squares
            clearHighlights(container, highlightClasses) {
                const squares = this.querySelectorAll(
                    container,
                    "[data-square]",
                );
                squares.forEach((square) => {
                    this.removeClass(square, ...highlightClasses);
                });
            },
        },

        // COORDINATE UTILITIES - Centralized square ID parsing and board coordinate functions
        coords: {
            // Parse square ID into [rank, file] with validation
            parseSquareId(squareId) {
                if (!squareId || typeof squareId !== "string") {
                    console.error("Invalid squareId:", squareId);
                    return [0, 0];
                }

                const file = squareId.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
                const rank = parseInt(squareId.slice(1)) - 1; // '1' = 0, '2' = 1, etc.

                // Validate bounds
                if (rank < 0 || rank >= 12 || file < 0 || file >= 12) {
                    console.error("Square coordinates out of bounds:", {
                        squareId,
                        rank,
                        file,
                    });
                    return [0, 0];
                }

                return [rank, file];
            },

            // Generate square ID from rank and file
            getSquareId(rank, file) {
                if (rank < 0 || rank >= 12 || file < 0 || file >= 12) {
                    console.error("Coordinates out of bounds:", { rank, file });
                    return "a1";
                }
                return String.fromCharCode(97 + file) + (rank + 1);
            },

            // Get piece at square with bounds checking
            getPieceAt(board, squareId) {
                const [rank, file] = this.parseSquareId(squareId);
                return board[rank] && board[rank][file]
                    ? board[rank][file]
                    : null;
            },

            // Set piece at square with bounds checking
            setPieceAt(board, squareId, piece) {
                const [rank, file] = this.parseSquareId(squareId);
                if (board[rank]) {
                    board[rank][file] = piece;
                    return true;
                }
                return false;
            },

            // Check if coordinates are within board bounds
            isValidSquare(rank, file) {
                return rank >= 0 && rank < 12 && file >= 0 && file < 12;
            },

            // Calculate alternate square for prompts (consistent logic)
            calculateAlternateSquare(squareId) {
                const [rank, file] = this.parseSquareId(squareId);

                // Determine direction based on which half of the board the square is in
                let targetRank;
                if (rank <= 5) {
                    // Upper half (a-f), point towards bottom
                    targetRank = rank + 1;
                } else {
                    // Lower half (g-l), point towards top
                    targetRank = rank - 1;
                }

                // Ensure target rank is within bounds
                if (!this.isValidSquare(targetRank, file)) {
                    return null;
                }

                return this.getSquareId(targetRank, file);
            },
        },

        // CSS CLASS MANAGEMENT - Centralized highlight class management
        highlights: {
            // All possible highlight classes for centralized management
            allClasses: [
                "selected",
                "valid-move",
                "repeat-promotion-move",
                "valid-illegal-move",
                "last-move",
                "last-move-outline",
                "last-move-midpoint",
                "lion-first-move",
                "lion-double-origin",
                "lion-double-midpoint",
                "lion-king-move",
                "lion-return-choice",
                "promotion-source",
                "promotion-origin-highlight",
                "promotion-choice",
                "promotion-midpoint",
                "counterstrike-highlight",
                "influence-friendly",
                "influence-enemy",
                "influence-white",
                "influence-black",
                "influence-contested",
                "influence-king-zone",
                "influence-promotion-zone",
                "double-move-origin",
                "double-move-midpoint",
                "double-move-destination",
                "drawing-circle",
            ],

            // Clear all highlights from an element
            clearAll(element) {
                if (element) {
                    utils.dom.removeClass(element, ...this.allClasses);
                }
            },

            // Apply highlights to specific squares
            applyToSquares(container, squareIds, className) {
                squareIds.forEach((squareId) => {
                    const element = utils.dom.querySelector(
                        container,
                        `[data-square="${squareId}"]`,
                    );
                    if (element) {
                        utils.dom.addClass(element, className);
                    }
                });
            },

            // Remove highlights from specific squares
            removeFromSquares(container, squareIds, className) {
                squareIds.forEach((squareId) => {
                    const element = utils.dom.querySelector(
                        container,
                        `[data-square="${squareId}"]`,
                    );
                    if (element) {
                        utils.dom.removeClass(element, className);
                    }
                });
            },
        },

        // SFEN UTILITIES - Centralized SFEN parsing and validation
        sfen: {
            // Validate SFEN format with comprehensive checks
            validate(sfen) {
                if (!sfen || typeof sfen !== "string") return false;

                const parts = sfen.trim().split(/\s+/);
                if (parts.length !== 6) return false;

                const [
                    board,
                    player,
                    capturedPieces,
                    moveNumber,
                    plyCount,
                    gameNumber,
                ] = parts;

                // Basic validation
                if (!board || !["b", "w"].includes(player)) return false;
                if (
                    !/^\d+$/.test(moveNumber) ||
                    !/^\d+$/.test(plyCount) ||
                    !/^\d+$/.test(gameNumber)
                )
                    return false;

                return true;
            },

            // Parse SFEN into components
            parse(sfen) {
                if (!this.validate(sfen)) {
                    console.error("Invalid SFEN format:", sfen);
                    return null;
                }

                const parts = sfen.trim().split(/\s+/);
                return {
                    board: parts[0],
                    player: parts[1],
                    capturedPieces: parts[2],
                    moveNumber: parseInt(parts[3]),
                    plyCount: parseInt(parts[4]),
                    gameNumber: parseInt(parts[5]),
                };
            },

            // Generate SFEN from components
            generate(
                board,
                player,
                capturedPieces,
                moveNumber,
                plyCount,
                gameNumber,
            ) {
                return `${board} ${player} ${capturedPieces} ${moveNumber} ${plyCount} ${gameNumber}`;
            },
        },

        // VALIDATION UTILITIES - Centralized validation functions
        validation: {
            // Validate move notation formats
            isValidMoveNotation(move) {
                if (!move || typeof move !== "string") return false;

                // Check for basic move patterns (simplified validation)
                const patterns = [
                    /^[1-9][0-9]?[a-l][1-9][0-9]?[a-l][\+\=]?$/, // Normal moves like 7g6f, 5i5h+
                    /^[PLNSGBRQKDEFHM][a-l][1-9][0-9]?\*?[\+\=]?$/, // Piece placement like P*5e
                ];

                return patterns.some((pattern) => pattern.test(move));
            },

            // Validate square bounds
            isValidSquare(squareId) {
                return utils.coords
                    .parseSquareId(squareId)
                    .every((coord) => coord >= 0 && coord < 12);
            },

            // Validate piece type
            isValidPieceType(pieceType) {
                if (!pieceType || typeof pieceType !== "string") return false;
                const validPieces = [
                    "P",
                    "L",
                    "N",
                    "S",
                    "G",
                    "B",
                    "R",
                    "Q",
                    "K",
                    "D",
                    "E",
                    "F",
                    "H",
                    "M",
                ];
                return validPieces.includes(pieceType.toUpperCase());
            },
        },

        // MOVE DISAMBIGUATION UTILITIES - Centralized logic for double move disambiguation
        disambiguation: {
            // Apply disambiguation to a move string if needed (must bind to game instance)
            disambiguateMove(gameInstance, move) {
                if (!disambiguateMoves) return move;

                const coordinates = gameInstance.parseUSICoordinates(
                    move.replace("+", ""),
                );
                if (!coordinates || !coordinates.midpointSquare) return move;

                // Check if midpoint is empty at current board state
                const pieceAtMidpoint = utils.board.getPieceAt(
                    gameInstance.board,
                    coordinates.midpointSquare,
                );
                if (!pieceAtMidpoint) {
                    // Empty midpoint - convert double move to normal move
                    const hasPromotion = move.endsWith("+");
                    const disambiguatedMove =
                        coordinates.fromSquare +
                        coordinates.toSquare +
                        (hasPromotion ? "+" : "");
                    console.log(
                        `Disambiguation: Converting ${move} to ${disambiguatedMove} (empty midpoint)`,
                    );
                    return disambiguatedMove;
                }

                return move;
            },

            // Check if a move should be disambiguated (conditions must all be met)
            shouldDisambiguate(gameInstance, move) {
                if (!disambiguateMoves) return false;

                const coordinates = gameInstance.parseUSICoordinates(
                    move.replace("+", ""),
                );
                if (!coordinates || !coordinates.midpointSquare) return false;

                // Check if midpoint is empty at current board state
                const pieceAtMidpoint = utils.board.getPieceAt(
                    gameInstance.board,
                    coordinates.midpointSquare,
                );
                return !pieceAtMidpoint;
            },
        },

        // LOGGING UTILITIES - Centralized logging with consistent formatting
        log: {
            debug(message, data = null) {
                if (data) {
                    showDebugMessage(`[DEBUG] ${message}:`, data);
                } else {
                    showDebugMessage(`[DEBUG] ${message}`);
                }
            },

            info(message, data = null) {
                if (data) {
                    console.log(`[INFO] ${message}:`, data);
                } else {
                    console.log(`[INFO] ${message}`);
                }
            },

            warn(message, data = null) {
                if (data) {
                    console.warn(`[WARN] ${message}:`, data);
                } else {
                    console.warn(`[WARN] ${message}`);
                }
            },

            error(message, data = null) {
                if (data) {
                    console.error(`[ERROR] ${message}:`, data);
                } else {
                    console.error(`[ERROR] ${message}`);
                }
            },

            // Game-specific logging with context
            game(action, details = null) {
                if (details) {
                    console.log(`[GAME] ${action}:`, details);
                } else {
                    console.log(`[GAME] ${action}`);
                }
            },

            // Batch import aware logging - only logs when not in batch mode
            gameAware(action, details = null, batchImporting = false) {
                if (!batchImporting) {
                    if (details) {
                        console.log(`[GAME] ${action}:`, details);
                    } else {
                        console.log(`[GAME] ${action}`);
                    }
                }
            },
        },

        // BOARD UTILITIES - Centralized board operations and piece management
        board: {
            // Get piece at square using proper coordinate parsing
            getPieceAt(board, squareId) {
                if (!squareId || !board) return null;

                // Use regex to parse Shogi notation (like "7g")
                const match = squareId.match(/^(\d+)([a-l])$/);
                if (!match) return null;

                const fileNumber = parseInt(match[1]);
                const rankChar = match[2];
                const rank = rankChar.charCodeAt(0) - 97; // a=0, b=1, etc.
                const file = 12 - fileNumber; // 12=0, 11=1, etc.

                return board[rank] && board[rank][file]
                    ? board[rank][file]
                    : null;
            },

            // Set piece at square using proper coordinate parsing
            setPieceAt(board, squareId, piece) {
                if (!squareId || !board) return false;

                const match = squareId.match(/^(\d+)([a-l])$/);
                if (!match) return false;

                const fileNumber = parseInt(match[1]);
                const rankChar = match[2];
                const rank = rankChar.charCodeAt(0) - 97;
                const file = 12 - fileNumber;

                if (board[rank] && file >= 0 && file < 12) {
                    board[rank][file] = piece;
                    return true;
                }
                return false;
            },

            // Create deep copy of board state
            deepCopy(board) {
                return board.map((row) =>
                    row.map((piece) => (piece ? { ...piece } : null)),
                );
            },

            // Check if square has piece of specific color
            hasPieceOfColor(board, squareId, color) {
                const piece = this.getPieceAt(board, squareId);
                return piece && piece.color === color;
            },

            // Check if square is empty
            isEmpty(board, squareId) {
                return !this.getPieceAt(board, squareId);
            },
        },

        // PIECE UTILITIES - Centralized piece operations and lookups
        piece: {
            // Generate piece HTML consistently across all UI components
            generateHTML(piece) {
                if (!piece) return "";

                const isWhite = piece.color === "w";
                const isPromoted = piece.promoted || false;

                // For piece display, use the piece type directly for lookup
                let lookupType = piece.type;

                // Special handling for Kings to use correct kanji based on color
                if (piece.type.toUpperCase() === "K") {
                    lookupType = isWhite ? "K" : "k"; // White King uses "K" (\u738b), Black King uses "k" (\u7389)
                }

                const pieceData =
                    PIECE_DEFINITIONS[lookupType] ||
                    PIECE_DEFINITIONS[piece.type.toUpperCase()] ||
                    PIECE_DEFINITIONS[piece.type];

                return `
          <div class="chushogi-piece ${isWhite ? "white" : ""} ${isPromoted ? "promoted" : ""}" 
               data-piece="${piece.type}" data-color="${piece.color}">
            ${pieceData ? pieceData.kanji : piece.type}
          </div>
        `;
            },

            // Get piece definition data
            getDefinition(pieceType) {
                return PIECE_DEFINITIONS[pieceType] || null;
            },

            // Check if piece can promote
            canPromote(pieceType) {
                const definition = this.getDefinition(pieceType);
                return definition && definition.promotes;
            },

            // Get promoted version of piece type
            getPromotedType(pieceType) {
                const definition = this.getDefinition(pieceType);
                return definition ? definition.promotes : null;
            },

            // Create piece object with validation
            create(type, color, promoted = false) {
                const definition = this.getDefinition(type);
                if (!definition) {
                    utils.log.warn(`Unknown piece type: ${type}`);
                    return null;
                }

                return {
                    type,
                    color,
                    promoted: promoted && this.canPromote(type),
                };
            },
        },
    };

    class ChuShogiBoard {
        // Static property to track the currently focused instance
        static focusedInstance = null;
        // Track whether global click handler has been added
        static globalClickHandlerAdded = false;

        constructor(container, config = {}) {
            this.container = container;
            // Generate unique instance ID to prevent ID conflicts with multiple instances
            this.instanceId =
                "chushogi_" + Math.random().toString(36).substr(2, 9);
            this.config = {
                boardSize: "large",
                showCoordinates: true,
                showMoveablePieces: true,
                allowIllegalMoves: false,
                showLegalMoves: true,
                showLastMove: true,
                showInfluenceDisplay: false,
                showPromotionZones: false,
                flipView: false,
                startGame: null, // SFEN string for custom starting position, null = standard Chu Shogi
                appletMode: "sandbox", // "sandbox" (default), "fixedStart", "fixedRules", "fixedStartAndRules", "fixedSettings", "fixedStartAndSettings", "puzzle", or "viewOnly"
                midpointProtection: false, // Enhanced bridge-capture: Pawn/Go-Between as sole defender prevents Lion capture
                trappedLancePromotion: false, // Lishogi rule: allows Lances to promote on last rank on non-capture (like Pawns under historic rules)
                repetitionHandling: "strict", // "strict" (ban first repeat), "lenient" (ban third repeat), or "relaxed" (allow all repeats)
                displaySFEN: false, // Display SFEN instead of comment in the SFEN/comment display
                displayInlineNotation: false, // Display move history in a single line instead of individual rows
                ...config,
            };

            // Backward compatibility: migrate showSFEN to displaySFEN
            if (!("displaySFEN" in config) && "showSFEN" in config) {
                this.config.displaySFEN = config.showSFEN;
            }

            // Force allowCustomComments to false for viewOnly/puzzle modes (fixed setting, cannot be overridden)
            if (
                this.config.appletMode === "viewOnly" ||
                this.config.appletMode === "puzzle"
            ) {
                this.config.allowCustomComments = false;
            } else if (this.config.allowCustomComments === undefined) {
                // Default to true for other modes if not explicitly set
                this.config.allowCustomComments = true;
            }

            // Apply mode-specific restrictions
            if (this.config.appletMode === "viewOnly") {
                // Note: allowIllegalMoves should respect the configured value
                this.config.showLegalMoves = false;
                this.config.showMoveablePieces = false; // Pieces cannot be moved in viewOnly mode
            } else if (this.config.appletMode === "puzzle") {
                // Puzzle mode enforces specific settings
                this.config.allowIllegalMoves = false;
            }
            // fixedStart mode has no automatic config restrictions, but blocks certain features

            this.board = this.createEmptyBoard();
            this.currentPlayer = "b";
            this.startingPlayer = "b"; // Remember the starting player for proper undo behavior
            this.moveHistory = [];
            // Move tree: a sentinel root node whose children are the first moves.
            // Each node in moveHistory is also a MoveNode (has parent, children, ply, id).
            // moveHistory always reflects the path from root to the live leaf of the
            // currently-active branch; the tree preserves alternate branches.
            this.moveTree = { id: "root", children: [], parent: null, ply: 0 };
            this.selectedSquare = null;
            this.validMoves = [];
            this.repeatPromotionMoves = []; // Moves that violate repetition but are promotion-eligible
            this.illegalMoves = []; // Illegal moves when allowIllegalMoves is true
            this.lastMove = null;
            this.gameStatus = "playing";
            this.currentTab = "moves"; // Track current active tab
            this.currentInfoSubTab = "game-info"; // Track active sub-tab in Info panel
            this.currentPieceSubTab = "piece"; // Track active sub-tab in Piece Info panel
            this.lastDiagramPieceType = null; // Reset piece sub-tab when piece changes
            this.inspectedSquare = null; // Square inspected for info without selecting
            this.currentExportSubTab = "csl"; // Track active sub-tab in Export/Import panel
            this.lastLionCapture = null; // Track last Lion capture location for SFEN
            this.startingLionCapture = null; // Track Lion capture state from starting position
            this.startingSFEN = null; // Track the initial starting position for New Game button
            this.startingComment = ""; // Track comment for the starting position

            // Navigation state for move browsing
            this.navigationPosition = null; // null = current position, -1 = start position, 0+ = after move N
            this.isNavigating = false; // Whether we're in navigation mode (not at current position)

            // Lion double move state
            this.lionFirstMoves = [];
            this.doubleMoveMidpoint = null;
            this.doubleMoveOrigin = null;
            this.doubleMoveDestinations = [];
            this.doubleMoveRepeatToOrigin = false; // Flag if return to origin would violate repetition
            this.currentNavigationIndex = null; // Track current move index during navigation
            // Primary navigation cursor into the move tree.
            // null  = at the live leaf (normal gameplay / end of branch).
            // moveTree = at the starting position (before any moves).
            // moveHistory[k] = viewing the position after the k-th move in the current branch.
            this.currentNode = null;
            this._moveNodeCounter = 0; // Monotonically-increasing ID source for MoveNodes.

            // Puzzle mode state
            this.puzzleSolution = []; // Stores the complete solution moves for puzzle mode
            this.puzzleSolver = null; // The player who is solving the puzzle ('b' or 'w')
            this.puzzleOpponent = null; // The opponent player ('b' or 'w')

            // Edit mode state
            this.editMode = {
                selectedPiece: null, // Currently selected piece from selector table
                preEditPosition: null, // Position before entering edit mode for reverting
                counterStrikeSelection: false, // Whether Counter-strike selection mode is active
                preEditCounterStrike: null, // Store Counter-strike state before editing
            };

            // Resize state tracking
            this.lastSidebarFloatingDown = undefined; // Track sidebar layout state for immediate breakpoint updates

            // Double move logic removed

            // Lion return prompt state
            this.lionReturnPromptActive = false;
            this.lionReturnAlternateSquare = null;

            // Promotion prompt state
            this.promotionPromptActive = false;
            this.promotionDestinationSquare = null;
            this.promotionDeferralSquare = null;
            this.promotionAlternateSquare = null;
            this.promotionMove = null; // Store the move details

            // Drawing state (circles and arrows)
            this.drawingState = {
                isDrawing: false,
                startSquare: null,
                currentSquare: null,
                longPressTimer: null,
                longPressDelay: 500, // 500ms for long press
                shiftPressed: false,
                altPressed: false,
                hasMoved: false,
                startX: 0,
                startY: 0,
                updatingCheckboxes: false, // Flag to prevent recursive checkbox updates
                movementThreshold: 10, // pixels - movement less than this is considered a tap
                scrollThreshold: 15, // pixels - movement more than this during initial window cancels touch
                isScrolling: false, // Track if user is scrolling
                scrollDetectionTimer: null,
                touchHandled: false, // Track if touch was handled to prevent click events
                lastTouchTime: 0, // Track last touch time to prevent duplicate clicks
            };
            this.drawings = {
                circles: new Map(), // Map of square IDs to color (for backward compatibility)
                arrows: new Map(), // Map of "fromSquare->toSquare" to {color: string} (for backward compatibility)
                orderedShapes: [], // Array of {type: 'circle'|'arrow', ...data} in draw order
            };

            // Color mapping based on key combinations
            this.drawingColors = {
                "false,false": "#00af0e", // Green (default)
                "true,false": "#ef4444", // Red (Shift)
                "false,true": "#3b82f6", // Blue (Alt)
                "true,true": "#d39f27", // Gold (Shift + Alt)
            };

            // Keyboard navigation state
            this.keyboardNavigation = {
                pressedKeys: new Set(), // Set of currently pressed arrow keys
                lastPressedKey: null, // The last arrow key that was pressed
                keyToButton: {
                    // Map arrow keys to navigation button types
                    ArrowUp: "start", // |< button
                    ArrowLeft: "prev", // < button
                    ArrowRight: "next", // > button
                    ArrowDown: "end", // >| button
                },
            };

            // Focus tracking for this instance
            this.hasFocus = false;

            this.init();
        }

        createEmptyBoard() {
            const board = [];
            for (let rank = 0; rank < 12; rank++) {
                board[rank] = new Array(12).fill(null);
            }
            return board;
        }

        init() {
            try {
                console.log("Starting ChuShogi init method");

                // Initialize the flip view data attribute
                this.container.setAttribute(
                    "data-flip-view",
                    this.config.flipView.toString(),
                );

                console.log("Starting render");
                this.render();
                console.log("Render completed");

                console.log("Attaching event listeners");
                this.attachEventListeners();
                console.log("Event listeners attached");

                console.log("Adding keyboard listeners");
                this.addKeyboardEventListeners();
                console.log("Keyboard listeners added");

                console.log("Adding focus tracking");
                this.addFocusTracking();
                console.log("Focus tracking added");

                // Initialize centralized game state management
                console.log("Initializing GameStateManager");
                this.gameStateManager.initialize();
                console.log("GameStateManager initialized");
            } catch (error) {
                console.error("Error in init method:", error);
                throw error;
            }

            // Resize handling now managed by EventManager
            console.log("Post-init: Setting up default game");

            const defaultSFEN =
                "lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b - 1";

            // Handle startGame configuration (Game Export/Import format)
            if (this.config.startGame) {
                console.log("Post-init: Loading startGame configuration");
                // startGame uses the same format as Game Export/Import (SFEN + USI moves)
                if (this.config.appletMode === "puzzle") {
                    if (this.initializePuzzle(this.config.startGame)) {
                        console.log("Successfully loaded puzzle configuration");
                    } else {
                        console.error(
                            "Failed to load puzzle configuration, using default position",
                        );
                        this.loadSFEN(defaultSFEN);
                    }
                } else {
                    console.log(
                        "DEBUG: Attempting to import startGame:",
                        this.config.startGame,
                    );
                    if (this.importGame(this.config.startGame)) {
                        console.log(
                            "Successfully loaded startGame configuration",
                        );
                    } else {
                        console.error(
                            "Failed to load startGame configuration, using default position",
                        );
                        this.loadSFEN(defaultSFEN);
                    }
                }
            } else {
                console.log("Post-init: Using default starting position");
                // Use default starting position
                this.startingSFEN = this.sanitizeSFEN(defaultSFEN);
                this.loadSFEN(defaultSFEN);
            }
            console.log("Post-init: Calling updateDisplay");
            this.updateDisplay();
            console.log("Post-init: Calling updateButtonStates");
            this.updateButtonStates();

            // Initialize resize state tracking
            this.initializeResizeState();

            console.log("Post-init: All initialization completed successfully");
        }

        // Remove all ( … ) variation groups from a CSL string, preserving
        // { … } comments and handling arbitrarily nested parentheses.
        _stripCSLVariations(str) {
            let result = "";
            let depth = 0;
            let inComment = false;
            for (let i = 0; i < str.length; i++) {
                const ch = str[i];
                if (inComment) {
                    result += ch;
                    if (ch === "}") inComment = false;
                } else if (ch === "{") {
                    inComment = true;
                    result += ch;
                } else if (ch === "(") {
                    depth++;
                } else if (ch === ")") {
                    if (depth > 0) depth--;
                } else if (depth === 0) {
                    result += ch;
                }
            }
            return result.replace(/\s+/g, " ").trim();
        }

        // PUZZLE MODE FUNCTIONALITY
        initializePuzzle(gameData) {
            try {
                // Strip variations before any parsing so puzzle mode only sees
                // the main line.
                const strippedData = this._stripCSLVariations(gameData);

                console.log(
                    "Puzzle: Initializing puzzle mode with data:",
                    strippedData,
                );

                // Use unified loader to parse game data (same logic as importGame)
                const loadResult = this.loadGame(strippedData);

                if (!loadResult.success) {
                    console.error("Puzzle: Load error:", loadResult.error);
                    return false;
                }

                const {
                    sfen,
                    moves,
                    startingComment,
                    moveComments,
                    commentOnly,
                    hasNoData,
                } = loadResult;

                // Reject comment-only or empty input for puzzle mode
                if (commentOnly || hasNoData) {
                    console.error(
                        "Puzzle: Invalid data - puzzles require SFEN and moves",
                    );
                    return false;
                }

                // Store the complete solution without preprocessing disambiguation
                // Disambiguation will be applied during move execution when the board state is correct
                this.puzzleSolution = moves;
                console.log(
                    "Puzzle: Stored solution with",
                    moves.length,
                    "moves:",
                    moves.slice(0, 10),
                    "...",
                );

                // Store comments for the puzzle (normalize to prevent undefined errors)
                this.startingComment = startingComment || "";
                this.puzzleSolutionComments = Array.isArray(moveComments)
                    ? moveComments
                    : [];
                console.log(
                    "Puzzle: Stored",
                    this.puzzleSolutionComments.length,
                    "move comments and starting comment:",
                    this.startingComment
                        ? `"${this.startingComment.substring(0, 50)}..."`
                        : "(none)",
                );

                // Load only the starting position (without moves)
                if (!this.loadSFEN(sfen)) {
                    console.error("Puzzle: Failed to load starting position");
                    return false;
                }

                // Set puzzle players (solver is the player to move in starting position)
                this.puzzleSolver = this.currentPlayer;
                this.puzzleOpponent = this.puzzleSolver === "b" ? "w" : "b";
                this.puzzleOpponentThinking = false; // Initialize blocking state
                this.puzzleWaitingForAdvance = false; // Initialize pause state for comments
                console.log(
                    "Puzzle: Solver is",
                    this.puzzleSolver,
                    "opponent is",
                    this.puzzleOpponent,
                );

                // Clear move history since we're only showing the starting position
                this.moveHistory = [];
                this.moveTree = { id: "root", children: [], parent: null, ply: 0 };
                this.currentNode = null;
                this.lastMove = null;

                // Set the starting position
                this.startingSFEN = this.sanitizeSFEN(sfen);
                this.startingLionCapture = this.lastLionCapture;

                console.log("Puzzle: Successfully initialized puzzle mode");
                return true;
            } catch (error) {
                console.error("Puzzle: Error initializing puzzle:", error);
                console.error("Puzzle: Error stack:", error.stack);
                return false;
            }
        }

        validatePuzzleMove(moveNotation) {
            if (this.config.appletMode !== "puzzle") {
                return { valid: true, isTargetMove: false };
            }

            console.log(
                "Puzzle: Validating move",
                moveNotation,
                "at position",
                this.moveHistory.length,
            );
            console.log(
                "Puzzle: Solution has",
                this.puzzleSolution.length,
                "moves",
            );

            // Check if we have a target move at this position
            if (this.moveHistory.length >= this.puzzleSolution.length) {
                console.log("Puzzle: No more moves in solution");
                return { valid: false, isTargetMove: false };
            }

            let targetMove = this.puzzleSolution[this.moveHistory.length];

            // Apply disambiguation to target move at validation time (checks current board state)
            targetMove = utils.disambiguation.disambiguateMove(
                this,
                targetMove,
            );

            console.log("Puzzle: Target move is", targetMove);

            // Convert move notation to USI format for comparison
            let usiMove = this.convertNotationToUSI(moveNotation);
            console.log("Puzzle: Move in USI format:", usiMove);

            // Removed automatic promotion logic to allow proper deferral of promotion
            // The puzzle solution should explicitly include or exclude "+" based on intended behavior
            // This allows puzzles to test deferral of promotion correctly

            // Compare the moves (normalize notation if needed)
            const isMatch = usiMove === targetMove;
            console.log(
                "Puzzle: Move matches target:",
                isMatch,
                "Final USI:",
                usiMove,
            );

            return {
                valid: isMatch,
                isTargetMove: true,
                targetMove: targetMove,
            };
        }

        convertNotationToUSI(moveNotation) {
            // Convert move notation like "Dragon King 8a-5d" to USI format "8a5d"
            if (moveNotation.startsWith("Error")) {
                return moveNotation; // Return as-is for error cases
            }

            // Extract move components from notation like "Dragon King 8a-5d" or "Side Mover 3dx5d+"
            const parts = moveNotation.split(" ");
            if (parts.length < 2) {
                console.error("Invalid move notation format:", moveNotation);
                return moveNotation;
            }

            // Get the move part (everything after the piece name)
            const moveString = parts.slice(1).join(" "); // Handle multi-word piece names like "Side Mover"

            // Extract squares from the move string using regex to find coordinate patterns
            // Pattern matches: 1-digit file + 1-digit rank OR 2-digit file + 1-letter rank
            const coordinatePattern = /[1-9][0-9]?[a-l]/g;
            const coordinates = moveString.match(coordinatePattern);

            if (!coordinates || coordinates.length < 2) {
                console.error(
                    "Could not extract coordinates from move:",
                    moveString,
                );
                return moveNotation;
            }

            // Build USI move: handle both regular and double moves
            let usiMove;

            if (coordinates.length === 2) {
                // Regular move: from + to
                usiMove = coordinates[0] + coordinates[1];
            } else if (coordinates.length === 3) {
                // Double move: from + midpoint + to
                usiMove = coordinates[0] + coordinates[1] + coordinates[2];
            } else {
                console.error(
                    "Unexpected number of coordinates:",
                    coordinates.length,
                    coordinates,
                );
                return moveNotation;
            }

            // Handle promotion (+ at the end)
            if (moveString.endsWith("+")) {
                usiMove += "+";
            }
            // Removed automatic promotion eligibility check to allow proper deferral of promotion
            // Moves should only include "+" if explicitly specified in the notation

            return usiMove;
        }

        executeOpponentResponseInPuzzle() {
            if (this.config.appletMode !== "puzzle") {
                return;
            }

            // Check if there's an opponent response in the solution
            const nextMoveIndex = this.moveHistory.length;
            if (nextMoveIndex >= this.puzzleSolution.length) {
                console.log(
                    "Puzzle: No opponent response available, puzzle complete",
                );
                return;
            }

            let opponentMove = this.puzzleSolution[nextMoveIndex];

            // Apply disambiguation to opponent move at execution time
            opponentMove = utils.disambiguation.disambiguateMove(
                this,
                opponentMove,
            );

            console.log("Puzzle: Executing opponent response:", opponentMove);

            // Import and execute the opponent's move
            // Use the same logic as importGame for individual moves
            try {
                // This will execute the move and update game state
                this.importAndExecuteMove(opponentMove);
                console.log("Puzzle: Opponent response executed successfully");
            } catch (error) {
                console.error(
                    "Puzzle: Error executing opponent response:",
                    error,
                );
            }
        }

        importAndExecuteMove(moveNotation) {
            // Import a single move and execute it using the same logic as Game Import
            console.log("Importing and executing move:", moveNotation);

            try {
                // Apply disambiguation before importing (disambiguation logic checks current board state)
                const disambiguatedMove = utils.disambiguation.disambiguateMove(
                    this,
                    moveNotation,
                );

                // Set import mode flag to bypass promotion prompts, like Game Import does
                const wasImporting = this.isImporting;
                this.isImporting = true;

                // Use the exact same executeUSIMove function that Game Import uses
                const result = this.executeUSIMove(disambiguatedMove);

                // Restore import mode state
                this.isImporting = wasImporting;

                // In puzzle mode, attach the comment from the solution
                if (
                    result &&
                    this.config.appletMode === "puzzle" &&
                    this.puzzleSolutionComments
                ) {
                    const lastMoveIndex = this.moveHistory.length - 1;
                    if (
                        lastMoveIndex >= 0 &&
                        lastMoveIndex < this.puzzleSolutionComments.length
                    ) {
                        this.moveHistory[lastMoveIndex].comment =
                            this.puzzleSolutionComments[lastMoveIndex];
                        console.log(
                            "Puzzle: Attached comment to opponent move",
                            lastMoveIndex,
                            ":",
                            this.puzzleSolutionComments[lastMoveIndex]
                                ? `"${this.puzzleSolutionComments[lastMoveIndex].substring(0, 30)}..."`
                                : "(none)",
                        );
                        // Update display to show the newly attached comment
                        if (!this.isBatchImporting) {
                            console.log(
                                "Puzzle: Updating display after attaching comment",
                            );
                            this.updateDisplay();
                        }
                    }
                }

                return result;
            } catch (error) {
                console.error("Error executing opponent move:", error);
                return false;
            }
        }

        initializeResizeState() {
            // Initialize resize state tracking based on current viewport
            const currentBoardSize = this.config.boardSize;
            let breakpoint;

            switch (currentBoardSize) {
                case "small":
                    breakpoint = 844; // 820 + 24px sidebar right padding
                    break;
                case "medium":
                    breakpoint = 904; // 880 + 24px sidebar right padding
                    break;
                case "large":
                default:
                    breakpoint = 964; // 940 + 24px sidebar right padding
                    break;
            }

            this.lastSidebarFloatingDown = window.innerWidth < breakpoint;
            console.log("Resize state initialized:", {
                boardSize: currentBoardSize,
                breakpoint: breakpoint,
                windowWidth: window.innerWidth,
                sidebarFloatingDown: this.lastSidebarFloatingDown,
            });
        }

        addKeyboardEventListeners() {
            // Handle keyboard navigation with arrow keys
            const handleKeyDown = (e) => {
                const key = e.key;
                const buttonType = this.keyboardNavigation.keyToButton[key];

                // Only handle arrow keys
                if (!buttonType) return;

                // Only respond if this instance has focus
                if (ChuShogiBoard.focusedInstance !== this) return;

                // Don't interfere with typing in input fields
                const activeElement = document.activeElement;
                const isTyping =
                    activeElement &&
                    (activeElement.tagName === "INPUT" ||
                        activeElement.tagName === "TEXTAREA" ||
                        activeElement.tagName === "SELECT" ||
                        activeElement.isContentEditable);
                if (isTyping) return;

                // Prevent default scrolling behavior for arrow keys
                e.preventDefault();

                // Block keyboard navigation during Edit mode or puzzle opponent thinking
                const isEditMode = this.currentTab === "edit";
                const isPuzzleOpponentThinking =
                    this.config.appletMode === "puzzle" &&
                    this.puzzleOpponentThinking;
                const isPuzzleWaitingForAdvance =
                    this.config.appletMode === "puzzle" &&
                    this.puzzleWaitingForAdvance;

                // Block all navigation in edit mode or during opponent thinking
                if (isEditMode || isPuzzleOpponentThinking) {
                    return;
                }

                // During pause, only allow forward (next) navigation
                if (isPuzzleWaitingForAdvance && buttonType !== "next") {
                    return;
                }

                // If this key is already pressed, ignore (prevent key repeat)
                if (this.keyboardNavigation.pressedKeys.has(key)) return;

                // Add to pressed keys set
                this.keyboardNavigation.pressedKeys.add(key);

                // Update last pressed key
                const previousKey = this.keyboardNavigation.lastPressedKey;
                this.keyboardNavigation.lastPressedKey = key;

                // If there was a different key active, release it first
                if (previousKey && previousKey !== key) {
                    this.releaseNavigationKey(previousKey);
                }

                // Trigger the corresponding button press
                this.triggerNavigationKey(buttonType);
            };

            const handleKeyUp = (e) => {
                const key = e.key;
                const buttonType = this.keyboardNavigation.keyToButton[key];

                // Only handle arrow keys
                if (!buttonType) return;

                // Remove from pressed keys set
                this.keyboardNavigation.pressedKeys.delete(key);

                // If this was the active key, release it
                if (this.keyboardNavigation.lastPressedKey === key) {
                    this.releaseNavigationKey(key);
                    this.keyboardNavigation.lastPressedKey = null;

                    // If there are other keys still pressed, activate the most recent one
                    if (this.keyboardNavigation.pressedKeys.size > 0) {
                        // Get the last key in the set (most recently added)
                        const keysArray = Array.from(
                            this.keyboardNavigation.pressedKeys,
                        );
                        const newActiveKey = keysArray[keysArray.length - 1];
                        this.keyboardNavigation.lastPressedKey = newActiveKey;
                        const newButtonType =
                            this.keyboardNavigation.keyToButton[newActiveKey];
                        this.triggerNavigationKey(newButtonType);
                    }
                }
            };

            // Add event listeners to document
            document.addEventListener("keydown", handleKeyDown);
            document.addEventListener("keyup", handleKeyUp);

            console.log(
                "addKeyboardEventListeners: Arrow key navigation enabled",
            );
        }

        addFocusTracking() {
            // Track focus on this applet instance
            const setFocus = (e) => {
                // Stop propagation so document click handler doesn't clear focus
                if (e) {
                    e.stopPropagation();
                }

                // Clear focus from previous instance
                if (
                    ChuShogiBoard.focusedInstance &&
                    ChuShogiBoard.focusedInstance !== this
                ) {
                    ChuShogiBoard.focusedInstance.hasFocus = false;
                }
                // Set focus to this instance
                this.hasFocus = true;
                ChuShogiBoard.focusedInstance = this;
            };

            // Set focus when user clicks anywhere in the applet
            this.container.addEventListener("mousedown", setFocus);

            // Set focus when any element within the applet gets focus
            this.container.addEventListener("focusin", setFocus);

            // Set up global click handler to clear focus when clicking outside (only once for all instances)
            if (!ChuShogiBoard.globalClickHandlerAdded) {
                document.addEventListener("mousedown", () => {
                    // Clear focus from any instance
                    if (ChuShogiBoard.focusedInstance) {
                        ChuShogiBoard.focusedInstance.hasFocus = false;
                        ChuShogiBoard.focusedInstance = null;
                    }
                });
                ChuShogiBoard.globalClickHandlerAdded = true;
            }

            // Give focus to the first instance by default
            if (!ChuShogiBoard.focusedInstance) {
                setFocus();
            }
        }

        isMouseOverBoard() {
            // Check if mouse is within the board container
            const boardElement = utils.dom.querySelector(
                this.container,
                "[data-board]",
            );
            if (!boardElement) return false;

            const rect = boardElement.getBoundingClientRect();
            const mouseX = this.lastMouseX || 0;
            const mouseY = this.lastMouseY || 0;

            return (
                mouseX >= rect.left &&
                mouseX <= rect.right &&
                mouseY >= rect.top &&
                mouseY <= rect.bottom
            );
        }

        getCurrentDrawingColor() {
            const key = `${this.drawingState.shiftPressed},${this.drawingState.altPressed}`;
            return this.drawingColors[key];
        }

        updateColorCheckboxOutlines() {
            const shiftCheckbox = utils.dom.querySelector(
                this.container,
                "[data-drawing-shift]",
            );
            const altCheckbox = utils.dom.querySelector(
                this.container,
                "[data-drawing-alt]",
            );

            // Update outline colors based on individual checkbox DOM states
            if (shiftCheckbox && altCheckbox) {
                // Use individual checkbox states to respect their current checked status
                const shiftChecked = shiftCheckbox.checked;
                const altChecked = altCheckbox.checked;

                // Determine color based on combination of checkbox states
                let outlineColor;
                if (!shiftChecked && !altChecked) {
                    // Green - default state (neither checked)
                    outlineColor = "#00af0e";
                } else if (shiftChecked && !altChecked) {
                    // Red - shift only
                    outlineColor = "#ef4444";
                } else if (!shiftChecked && altChecked) {
                    // Blue - alt only
                    outlineColor = "#3b82f6";
                } else if (shiftChecked && altChecked) {
                    // Bright Yellow - both checked
                    outlineColor = "#d39f27";
                }

                // Apply the same color to both checkboxes to show current drawing color
                shiftCheckbox.style.setProperty(
                    "outline",
                    `3px solid ${outlineColor}`,
                    "important",
                );
                altCheckbox.style.setProperty(
                    "outline",
                    `3px solid ${outlineColor}`,
                    "important",
                );
            }
        }

        // Parse USI coordinates from move strings like "11g11f11g" for double moves
        parseUSICoordinates(moveString) {
            if (!moveString || typeof moveString !== "string") {
                return null;
            }

            // Remove promotion indicator for parsing
            const cleanMove = moveString.replace("+", "");

            // Pattern for Shogi notation: 1-2 digits followed by a letter (a-l)
            const coordinatePattern = /([1-9][0-9]?)([a-l])/g;
            const matches = [];
            let match;

            while ((match = coordinatePattern.exec(cleanMove)) !== null) {
                matches.push(match[1] + match[2]); // file + rank (e.g., "11g")
            }

            if (matches.length === 2) {
                // Regular move: from + to
                return {
                    fromSquare: matches[0],
                    toSquare: matches[1],
                    midpointSquare: null,
                    hasPromotion: moveString.endsWith("+"),
                };
            } else if (matches.length === 3) {
                // Double move: from + midpoint + to
                return {
                    fromSquare: matches[0],
                    toSquare: matches[2],
                    midpointSquare: matches[1],
                    hasPromotion: moveString.endsWith("+"),
                };
            }

            return null;
        }

        initializeCanvas() {
            // Use requestAnimationFrame to ensure DOM is fully rendered
            requestAnimationFrame(() => {
                const canvas = utils.dom.querySelector(
                    this.container,
                    ".drawing-canvas",
                );

                if (canvas) {
                    this.drawCanvas(false);

                    // Redraw existing drawings after canvas initialization
                    this.redrawAllDrawings();

                    // Canvas resize handling now managed by EventManager
                } else {
                    // Add canvas to existing board element if it doesn't exist
                    const boardElement = utils.dom.querySelector(
                        this.container,
                        "[data-board]",
                    );
                    if (
                        boardElement &&
                        !utils.dom.querySelector(
                            boardElement,
                            ".drawing-canvas",
                        )
                    ) {
                        const canvas = document.createElement("canvas");
                        canvas.className = "drawing-canvas";
                        canvas.width = 480;
                        canvas.height = 480;
                        boardElement.appendChild(canvas);
                        setTimeout(() => {
                            this.drawCanvas(false);
                            this.redrawAllDrawings();
                        }, 100);
                    }
                }
            });
        }

        render() {
            try {
                console.log("Starting render method");

                // Store current drawings to preserve them during render (unless it's initial render)
                const hasExistingCircles =
                    this.drawings &&
                    this.drawings.circles &&
                    ((this.drawings.circles instanceof Set &&
                        this.drawings.circles.size > 0) ||
                        (this.drawings.circles instanceof Map &&
                            this.drawings.circles.size > 0));
                const hasExistingArrows =
                    this.drawings &&
                    this.drawings.arrows &&
                    this.drawings.arrows.size > 0;
                const hasExistingShapes =
                    this.drawings &&
                    this.drawings.orderedShapes &&
                    this.drawings.orderedShapes.length > 0;
                let currentCircles, currentArrows, currentOrderedShapes;

                if (hasExistingCircles) {
                    if (this.drawings.circles instanceof Set) {
                        // Convert Set to Map with default color
                        currentCircles = new Map();
                        Array.from(this.drawings.circles).forEach((id) =>
                            currentCircles.set(id, "#00af0e"),
                        );
                    } else {
                        currentCircles = new Map(this.drawings.circles);
                    }
                }

                if (hasExistingArrows) {
                    currentArrows = new Map(this.drawings.arrows);
                }

                if (hasExistingShapes) {
                    currentOrderedShapes = [...this.drawings.orderedShapes];
                }

                console.log("Generating HTML");
                const html = this.generateHTML();
                console.log("Setting innerHTML");
                this.container.innerHTML = html;
                this.container.className = `chuShogiLite chushogi-container ${this.config.boardSize}`;
                console.log("HTML set successfully");

                // Restore drawings after render if they existed
                if (hasExistingCircles) {
                    this.drawings.circles = currentCircles;
                }
                if (hasExistingArrows) {
                    this.drawings.arrows = currentArrows;
                }
                if (hasExistingShapes) {
                    this.drawings.orderedShapes = currentOrderedShapes;
                }

                console.log("Initializing canvas");
                // Initialize canvas after DOM is ready
                this.initializeCanvas();

                console.log("Updating color checkboxes");
                // Initialize color checkboxes
                this.updateColorCheckboxOutlines();

                console.log("Render method completed successfully");
            } catch (error) {
                console.error("Error in render method:", error);
                this.container.innerHTML =
                    '<div style="padding: 20px; color: red;">Render error: ' +
                    error.message +
                    "</div>";
            }
        }

        generateHTML() {
            return `
        <div class="chushogi-main">
          <div class="chushogi-board-section">
            ${this.generateBoardControlsHTML()}
            ${this.generateBoardHTML()}
          </div>
          ${this.generateSidebarHTML()}
        </div>`;
        }

        generateBoardControlsHTML() {
            const isViewOnly = this.config.appletMode === "viewOnly";
            const isFixedStart =
                this.config.appletMode === "fixedStart" ||
                this.config.appletMode === "fixedStartAndRules" ||
                this.config.appletMode === "fixedStartAndSettings";
            const isPuzzle = this.config.appletMode === "puzzle";
            return `
        <div class="chushogi-header">
          <div class="chushogi-turn-info">
            <span class="chushogi-turn-label">Turn:</span>
            <div class="chushogi-turn-display">
              <div class="chushogi-turn-indicator ${this.currentPlayer === "w" ? "white" : ""}"></div>
              <span class="chushogi-turn-text">${this.currentPlayer === "b" ? "Black (\u5148\u624b)" : "White (\u5f8c\u624b)"}</span>
            </div>
          </div>
          <div class="chushogi-credit">
            ChuShogiLite by A. M. DeWitt
          </div>
        </div>
        <div class="chushogi-controls">
          <div class="chushogi-action-buttons">
            <div class="chushogi-drawing-controls">
              <input type="checkbox" data-drawing-shift title="Neither = Green shapes, Left = Red shapes,\nRight = Blue shapes, Both = Gold shapes" style="outline: 3px solid #00af0e;">
              <input type="checkbox" data-drawing-alt title="Neither = Green shapes, Left = Red shapes,\nRight = Blue shapes, Both = Gold shapes" style="outline: 3px solid #00af0e;">
            </div>
            <button class="chushogi-btn" onclick="this.closest('.chushogi-container').chuShogiInstance.flipBoard()" title="Flip board view">\ud83d\udd04
            </button>
            <button class="chushogi-btn" data-nav-start onclick="this.closest('.chushogi-container').chuShogiInstance.goToStart()" title="Go to start position">|&lt;
            </button>
            <button class="chushogi-btn" data-nav-prev onclick="this.closest('.chushogi-container').chuShogiInstance.goBackOneMove()" title="Go back one move (hold to navigate continuously)">&lt;
            </button>
            <button class="chushogi-btn" data-nav-next onclick="this.closest('.chushogi-container').chuShogiInstance.goForwardOneMove()" title="Go forward one move (hold to navigate continuously)">&gt;
            </button>
            <button class="chushogi-btn" data-nav-end onclick="this.closest('.chushogi-container').chuShogiInstance.goToCurrent()" title="Go to current position">&gt;|
            </button>
            ${
                !isViewOnly
                    ? `<button class="chushogi-btn" onclick="this.closest('.chushogi-container').chuShogiInstance.undo()">\u21b6
            </button>`
                    : ""
            }
            ${
                !isViewOnly
                    ? `<button class="chushogi-btn" onclick="this.closest('.chushogi-container').chuShogiInstance.confirmNewGame()" title="Start a new game">\u232b
            </button>`
                    : ""
            }
            ${
                !isPuzzle
                    ? `<button class="chushogi-btn" onclick="this.closest('.chushogi-container').chuShogiInstance.confirmReset()" title="Reset board state">\u27f3
            </button>`
                    : ""
            }
          </div>
        </div>
      `;
        }

        generateBoardHTML() {
            const sizeClass = this.config.boardSize;

            return `
        <div class="chushogi-game ${this.config.showCoordinates ? "show-coordinates" : "hide-coordinates"}" translate="no">
          ${this.generateCoordinatesHTML()}
          <div class="chushogi-board-container">
            ${this.generateRankLabelsHTML()}
            <div class="chushogi-board ${sizeClass}" data-board>
              ${this.generateSquaresHTML()}
              ${this.generatePromotionZonesHTML()}
              <canvas class="drawing-canvas" width="480" height="480"></canvas>
            </div>
            ${this.generateRightRankLabelsHTML()}
          </div>
          ${this.generateBottomCoordinatesHTML()}
        </div>
      `;
        }

        generateCoordinatesHTML() {
            const files = [
                "12",
                "11",
                "10",
                "9",
                "8",
                "7",
                "6",
                "5",
                "4",
                "3",
                "2",
                "1",
            ];
            const displayFiles = this.config.flipView
                ? [...files].reverse()
                : files;
            return `
        <div class="chushogi-coordinates chushogi-coordinates-top">
          ${displayFiles.map((file) => `<div class="chushogi-file-label">${file}</div>`).join("")}
        </div>
      `;
        }

        generateRankLabelsHTML() {
            const ranks = [
                "a",
                "b",
                "c",
                "d",
                "e",
                "f",
                "g",
                "h",
                "i",
                "j",
                "k",
                "l",
            ];
            const displayRanks = this.config.flipView
                ? [...ranks].reverse()
                : ranks;
            return `
        <div class="chushogi-rank-labels">
          ${displayRanks.map((rank) => `<div class="chushogi-rank-label">${rank}</div>`).join("")}
        </div>
      `;
        }

        generateRightRankLabelsHTML() {
            const ranks = [
                "a",
                "b",
                "c",
                "d",
                "e",
                "f",
                "g",
                "h",
                "i",
                "j",
                "k",
                "l",
            ];
            const displayRanks = this.config.flipView
                ? [...ranks].reverse()
                : ranks;
            return `
        <div class="chushogi-rank-labels chushogi-rank-labels-right">
          ${displayRanks.map((rank) => `<div class="chushogi-rank-label">${rank}</div>`).join("")}
        </div>
      `;
        }

        generateBottomCoordinatesHTML() {
            const files = [
                "12",
                "11",
                "10",
                "9",
                "8",
                "7",
                "6",
                "5",
                "4",
                "3",
                "2",
                "1",
            ];
            const displayFiles = this.config.flipView
                ? [...files].reverse()
                : files;
            return `
        <div class="chushogi-coordinates chushogi-coordinates-bottom">
          ${displayFiles.map((file) => `<div class="chushogi-file-label">${file}</div>`).join("")}
        </div>
      `;
        }

        generateSquaresHTML() {
            let html = "";
            const rankOrder = this.config.flipView
                ? Array.from({ length: 12 }, (_, i) => 11 - i)
                : Array.from({ length: 12 }, (_, i) => i);
            const fileOrder = this.config.flipView
                ? Array.from({ length: 12 }, (_, i) => 11 - i)
                : Array.from({ length: 12 }, (_, i) => i);

            for (let displayRank = 0; displayRank < 12; displayRank++) {
                for (let displayFile = 0; displayFile < 12; displayFile++) {
                    const actualRank = rankOrder[displayRank];
                    const actualFile = fileOrder[displayFile];
                    const squareId = this.getSquareId(actualRank, actualFile);
                    const piece = utils.board.getPieceAt(this.board, squareId);
                    const pieceHTML = piece
                        ? this.generatePieceHTML(piece)
                        : "";

                    html += `
            <div class="chushogi-square" data-square="${squareId}" data-rank="${actualRank}" data-file="${actualFile}">
              ${pieceHTML}
            </div>
          `;
                }
            }
            return html;
        }

        generatePieceHTML(piece) {
            // CENTRALIZED: Use utils.piece for consistent piece HTML generation
            return utils.piece.generateHTML(piece);
        }

        generatePromotionZonesHTML() {
            if (!this.config.showPromotionZones) return "";
            return `
        <div class="chushogi-promotion-zone white"></div>
        <div class="chushogi-promotion-zone black"></div>
      `;
        }

        generateSidebarHTML() {
            return `
        <div class="chushogi-sidebar">
          ${this.generateTabsHTML()}
          ${this.generatePanelsHTML()}
        </div>
      `;
        }

        generateTabsHTML() {
            const isViewOnly = this.config.appletMode === "viewOnly";
            const isFixedStart =
                this.config.appletMode === "fixedStart" ||
                this.config.appletMode === "fixedStartAndRules" ||
                this.config.appletMode === "fixedStartAndSettings";
            const isFixedSettings =
                this.config.appletMode === "fixedSettings" ||
                this.config.appletMode === "fixedStartAndSettings";
            const isPuzzle = this.config.appletMode === "puzzle";
            return `
        <div class="chushogi-tabs">
          <div class="chushogi-tab-list">
            <div class="chushogi-tab ${this.currentTab === "moves" ? "active" : ""}" data-tab="moves">\ud83d\udccb</div>
            ${!isFixedSettings ? `<div class="chushogi-tab ${this.currentTab === "settings" ? "active" : ""}" data-tab="settings">\u2699\ufe0f</div>` : ""}
            <div class="chushogi-tab ${this.currentTab === "export" ? "active" : ""}" data-tab="export">\u21c5</div>
            ${!isViewOnly && !isFixedStart && !isPuzzle ? `<div class="chushogi-tab ${this.currentTab === "edit" ? "active" : ""}" data-tab="edit">\u270f\ufe0f</div>` : ""}
            <div class="chushogi-tab ${this.currentTab === "rules" ? "active" : ""}" data-tab="rules">\u2139\ufe0f</div>
            <div class="chushogi-tab ${this.currentTab === "help" ? "active" : ""}" data-tab="help">\u2753</div>
          </div>
        </div>
      `;
        }

        generatePanelsHTML() {
            const isViewOnly = this.config.appletMode === "viewOnly";
            const isFixedStart =
                this.config.appletMode === "fixedStart" ||
                this.config.appletMode === "fixedStartAndRules" ||
                this.config.appletMode === "fixedStartAndSettings";
            const isPuzzle = this.config.appletMode === "puzzle";
            return `
        <div class="chushogi-panel ${this.currentTab === "moves" ? "active" : ""}" data-panel="moves">
          ${this.generateMovesPanel()}
        </div>
        <div class="chushogi-panel ${this.currentTab === "settings" ? "active" : ""}" data-panel="settings">
          ${this.generateSettingsPanel()}
        </div>
        <div class="chushogi-panel ${this.currentTab === "export" ? "active" : ""}" data-panel="export">
          ${this.generateExportPanel()}
        </div>
        ${
            !isViewOnly && !isFixedStart && !isPuzzle
                ? `<div class="chushogi-panel ${this.currentTab === "edit" ? "active" : ""}" data-panel="edit">
          ${this.generateEditPanel()}
        </div>`
                : ""
        }
        <div class="chushogi-panel ${this.currentTab === "rules" ? "active" : ""}" data-panel="rules">
          ${this.generateRulesPanel()}
        </div>
        <div class="chushogi-panel ${this.currentTab === "help" ? "active" : ""}" data-panel="help">
          ${this.generateHelpPanel()}
        </div>
      `;
        }

        generateMovesPanel() {
            return `
        <div class="chushogi-info-sub-tab-list">
          <div class="chushogi-info-sub-tab ${this.currentInfoSubTab === "game-info" ? "active" : ""}" data-info-subtab="game-info" onclick="this.closest('.chushogi-container').chuShogiInstance.switchInfoSubTab('game-info')">Game Info</div>
          <div class="chushogi-info-sub-tab ${this.currentInfoSubTab === "piece-info" ? "active" : ""}" data-info-subtab="piece-info" onclick="this.closest('.chushogi-container').chuShogiInstance.switchInfoSubTab('piece-info')">Piece Info</div>
        </div>
        <div class="chushogi-info-subpanel ${this.currentInfoSubTab === "game-info" ? "active" : ""}" data-info-subpanel="game-info">
          <div class="chushogi-game-log">
            <h4>Game Log</h4>
            <div class="chushogi-checkbox" style="margin-bottom: 8px;">
              <input type="checkbox" id="show-sfen-${this.instanceId}" ${this.config.displaySFEN ? "checked" : ""}>
              <label for="show-sfen-${this.instanceId}">Display SFEN</label>
            </div>
            <div class="chushogi-checkbox" style="margin-bottom: 8px;">
              <input type="checkbox" id="use-inline-notation-${this.instanceId}" ${this.config.displayInlineNotation ? "checked" : ""}>
              <label for="use-inline-notation-${this.instanceId}">Display inline notation</label>
            </div>
            <div class="chushogi-displayed-position-section">
              <div class="chushogi-position-display" translate="no" data-position-display>
              </div>
            </div>
            <div class="chushogi-sfen-section">
              <textarea class="chushogi-sfen-display" translate="no" data-current-sfen readonly placeholder="Loading..."></textarea>
            </div>
            <div class="chushogi-move-list" translate="no" data-move-list>
              <div class="chushogi-move-item">Starting Position</div>
              ${this.buildMoveHistorySANLabels()
                  .map(
                      (label, index) =>
                          `<div class="chushogi-move-item" data-move="${index}">${label}</div>`,
                  )
                  .join("")}
            </div>
          </div>
        </div>
        <div class="chushogi-info-subpanel ${this.currentInfoSubTab === "piece-info" ? "active" : ""}" data-info-subpanel="piece-info">
          <div class="chushogi-piece-legend">
            <div class="chushogi-legend-title">Move Types</div>
            <div class="chushogi-legend-items">
              <div class="chushogi-legend-item" title="Jump to this square, ignoring other pieces">
                <span class="chushogi-legend-swatch chushogi-legend-jump"></span>
                <span class="chushogi-legend-label">Jump</span>
              </div>
              <div class="chushogi-legend-item" title="Move any number of squares in a straight line,\nstopping at the first obstacle">
                <span class="chushogi-legend-swatch chushogi-legend-slide"></span>
                <span class="chushogi-legend-label">Slide</span>
              </div>
              <div class="chushogi-legend-item" title="Move to this square, then optionally move to\nany adjacent square along the same line">
                <span class="chushogi-legend-swatch chushogi-legend-lion-linear"></span>
                <span class="chushogi-legend-label">Linear Lion Move</span>
              </div>
              <div class="chushogi-legend-item" title="Move to this square, then optionally\nmove to any adjacent square">
                <span class="chushogi-legend-swatch chushogi-legend-lion-full"></span>
                <span class="chushogi-legend-label">Full Lion Move</span>
              </div>
            </div>
          </div>
          <div data-piece-info-display>
            <div class="chushogi-piece-info-placeholder">Click a piece to see its moves.</div>
          </div>
        </div>
      `;
        }

        generateSettingsPanel() {
            const isViewOnly = this.config.appletMode === "viewOnly";
            const isFixedRules =
                this.config.appletMode === "fixedRules" ||
                this.config.appletMode === "fixedStartAndRules";
            const isPuzzle = this.config.appletMode === "puzzle";
            return `
        <div class="chushogi-settings">
          <div class="chushogi-setting-group">
            <h4>Board Settings</h4>
            <div class="chushogi-setting-options">
              <div class="chushogi-setting-group">
                <label for="board-size-select-${this.instanceId}">Board Size</label>
                <select class="chushogi-select" id="board-size-select-${this.instanceId}" data-board-size>
                  <option value="small" ${this.config.boardSize === "small" ? "selected" : ""}>Small</option>
                  <option value="medium" ${this.config.boardSize === "medium" ? "selected" : ""}>Medium</option>
                  <option value="large" ${this.config.boardSize === "large" ? "selected" : ""}>Large</option>
                </select>
              </div>
              <div class="chushogi-checkbox">
                <input type="checkbox" id="show-coords-${this.instanceId}" ${this.config.showCoordinates ? "checked" : ""}>
                <label for="show-coords-${this.instanceId}">Show coordinates</label>
              </div>
              ${
                  !isViewOnly
                      ? `<div class="chushogi-checkbox">
                <input type="checkbox" id="show-moveable-pieces-${this.instanceId}" ${this.config.showMoveablePieces ? "checked" : ""}>
                <label for="show-moveable-pieces-${this.instanceId}">Show moveable pieces</label>
              </div>`
                      : ""
              }
              ${
                  !isViewOnly
                      ? `<div class="chushogi-checkbox">
                <input type="checkbox" id="show-legal-moves-${this.instanceId}" ${this.config.showLegalMoves ? "checked" : ""}>
                <label for="show-legal-moves-${this.instanceId}">Show legal moves</label>
              </div>`
                      : ""
              }
              <div class="chushogi-checkbox">
                <input type="checkbox" id="highlight-last-${this.instanceId}" ${this.config.showLastMove ? "checked" : ""}>
                <label for="highlight-last-${this.instanceId}">Show last move</label>
              </div>
              <div class="chushogi-checkbox">
                <input type="checkbox" id="show-promotion-zones-${this.instanceId}" ${this.config.showPromotionZones ? "checked" : ""}>
                <label for="show-promotion-zones-${this.instanceId}">Show promotion zones</label>
              </div>
              <div class="chushogi-checkbox">
                <input type="checkbox" id="show-influence-display-${this.instanceId}" ${this.config.showInfluenceDisplay ? "checked" : ""}>
                <label for="show-influence-display-${this.instanceId}">Show influence display</label>
              </div>
            </div>
          </div>
          ${
              !isViewOnly && !isFixedRules && !isPuzzle
                  ? `<div class="chushogi-setting-group">
            <h4>Rules Settings</h4>
            <div class="chushogi-setting-options">
              <div class="chushogi-checkbox">
                <input type="checkbox" id="allow-illegal-${this.instanceId}" ${this.config.allowIllegalMoves ? "checked" : ""}>
                <label for="allow-illegal-${this.instanceId}">Allow illegal moves</label>
              </div>
              <div class="chushogi-checkbox">
                <input type="checkbox" id="midpoint-protection-${this.instanceId}" ${this.config.midpointProtection ? "checked" : ""}>
                <label for="midpoint-protection-${this.instanceId}">Midpoint protection</label>
              </div>
              <div class="chushogi-checkbox">
                <input type="checkbox" id="trapped-lance-promotion-${this.instanceId}" ${this.config.trappedLancePromotion ? "checked" : ""}>
                <label for="trapped-lance-promotion-${this.instanceId}">Trapped Lance promotion</label>
              </div>
              <div class="chushogi-setting-group">
                <label for="repetition-handling-select-${this.instanceId}">Repetition Handling</label>
                <select class="chushogi-select" id="repetition-handling-select-${this.instanceId}" data-repetition-handling>
                  <option value="strict" ${this.config.repetitionHandling === "strict" ? "selected" : ""}>Strict (ban 1st repeat)</option>
                  <option value="lenient" ${this.config.repetitionHandling === "lenient" ? "selected" : ""}>Lenient (ban 3rd repeat)</option>
                  <option value="relaxed" ${this.config.repetitionHandling === "relaxed" ? "selected" : ""}>Relaxed (allow all repeats)</option>
                </select>
              </div>
            </div>
          </div>`
                  : ""
          }
        </div>
      `;
        }

        generateExportPanel() {
            const isViewOnly = this.config.appletMode === "viewOnly";
            const isFixedStart =
                this.config.appletMode === "fixedStart" ||
                this.config.appletMode === "fixedStartAndRules" ||
                this.config.appletMode === "fixedStartAndSettings";
            const isPuzzle = this.config.appletMode === "puzzle";
            return `
        <div class="chushogi-settings">
          <div class="chushogi-export-sub-tab-list">
            <div class="chushogi-export-sub-tab${this.currentExportSubTab === "csl" ? " active" : ""}" data-export-subtab="csl" onclick="this.closest('.chushogi-container').chuShogiInstance.switchExportSubTab('csl')">CSL</div>
            <div class="chushogi-export-sub-tab${this.currentExportSubTab === "kif" ? " active" : ""}" data-export-subtab="kif" onclick="this.closest('.chushogi-container').chuShogiInstance.switchExportSubTab('kif')">KIF</div>
            <div class="chushogi-export-sub-tab${this.currentExportSubTab === "pgn" ? " active" : ""}" data-export-subtab="pgn" onclick="this.closest('.chushogi-container').chuShogiInstance.switchExportSubTab('pgn')">PGN</div>
          </div>
          <div class="chushogi-export-subpanel${this.currentExportSubTab === "csl" ? " active" : ""}" data-export-subpanel="csl">
          <div class="chushogi-setting-group">
            <h4>CSL Export</h4>
            <textarea class="chushogi-textarea" translate="no" data-game-export readonly>Loading...</textarea>
            <button class="chushogi-btn-primary" onclick="this.closest('.chushogi-container').chuShogiInstance.exportGame()" title="Copy current CSL notation to clipboard">
              \u2193 Export CSL
            </button>
          </div>

          ${
              isPuzzle
                  ? `<div class="chushogi-setting-group">
            <h4>Puzzle Solution</h4>
            <button class="chushogi-btn-primary" onclick="this.closest('.chushogi-container').chuShogiInstance.viewPuzzleSolution()" data-view-solution-btn>
              \ud83d\udc41 View Solution
            </button>
          </div>`
                  : ""
          }

          ${
              !isViewOnly && !isPuzzle
                  ? `<div class="chushogi-setting-group">
            <h4>CSL Import${isFixedStart ? " (Restricted)" : ""}</h4>
            <textarea class="chushogi-textarea" placeholder="Paste game in CSL notation (i. e. SFEN {StartComment} USIMove1 USIMove2 {Comment2}... or USIMove1 USIMove2...) here..." data-game-import=""></textarea>
            <button class="chushogi-btn-primary" onclick="this.closest('.chushogi-container').chuShogiInstance.importGameFromInput()" title="Import game from CSL notation">
              \u2191 Import CSL
            </button>
            ${isFixedStart ? `<p class="chushogi-help-text">Only moves-only games or games with a matching starting SFEN are allowed.</p>` : ""}
          </div>`
                  : ""
          }
          </div>
          <div class="chushogi-export-subpanel${this.currentExportSubTab === "kif" ? " active" : ""}" data-export-subpanel="kif">
          <div class="chushogi-setting-group">
            <h4>KIF Export</h4>
            <textarea class="chushogi-textarea" translate="no" data-kif-export readonly>Loading...</textarea>
            <button class="chushogi-btn-primary" onclick="this.closest('.chushogi-container').chuShogiInstance.exportKIF()" title="Copy current KIF to clipboard">
              \u2193 Export KIF
            </button>
          </div>
          ${
              !isViewOnly && !isPuzzle
                  ? `<div class="chushogi-setting-group">
            <h4>KIF Import${isFixedStart ? " (Restricted)" : ""}</h4>
            <textarea class="chushogi-textarea" placeholder="Paste KIF input here..." data-kif-import=""></textarea>
            <button class="chushogi-btn-primary" onclick="this.closest('.chushogi-container').chuShogiInstance.importKIFFromInput()" title="Import game from KIF notation">
              \u2191 Import KIF
            </button>
            ${isFixedStart ? `<p class="chushogi-help-text">Only moves-only games or games with a matching starting SFEN are allowed.</p>` : ""}
          </div>`
                  : ""
          }
          </div>
          <div class="chushogi-export-subpanel${this.currentExportSubTab === "pgn" ? " active" : ""}" data-export-subpanel="pgn">
          <div class="chushogi-setting-group">
            <h4>PGN Export</h4>
            <textarea class="chushogi-textarea" translate="no" data-pgn-export readonly>Loading...</textarea>
            <button class="chushogi-btn-primary" onclick="this.closest('.chushogi-container').chuShogiInstance.exportPGN()" title="Copy current PGN to clipboard">
              \u2193 Export PGN
            </button>
          </div>
          ${
              !isViewOnly && !isPuzzle
                  ? `<div class="chushogi-setting-group">
            <h4>PGN Import${isFixedStart ? " (Restricted)" : ""}</h4>
            <textarea class="chushogi-textarea" placeholder="Paste PGN input here..." data-pgn-import=""></textarea>
            <button class="chushogi-btn-primary" onclick="this.closest('.chushogi-container').chuShogiInstance.importPGNFromInput()" title="Import game from PGN notation">
              \u2191 Import PGN
            </button>
            ${isFixedStart ? `<p class="chushogi-help-text">Only moves-only games or games with a matching starting SFEN are allowed.</p>` : ""}
          </div>`
                  : ""
          }
          </div>
        </div>
      `;
        }

        generatePieceSelectorTable() {
            // Check if sidebar is floating down or floating right based on actual CSS breakpoints
            // These match the media queries in chushogi-lite.css for when flex-direction changes to row
            const currentBoardSize = this.config.boardSize;
            let breakpoint;

            switch (currentBoardSize) {
                case "small":
                    breakpoint = 844; // Small boards: sidebar floats right when viewport >= 844px (820 + 24px sidebar right padding)
                    break;
                case "medium":
                    breakpoint = 904; // Medium boards: sidebar floats right when viewport >= 904px (880 + 24px sidebar right padding)
                    break;
                case "large":
                default:
                    breakpoint = 964; // Large boards: sidebar floats right when viewport >= 964px (940 + 24px sidebar right padding)
                    break;
            }

            const isSidebarFloatingDown = window.innerWidth < breakpoint;

            let selectorRows;

            if (isSidebarFloatingDown) {
                // 8x10 layout: when sidebar floats down (viewport below breakpoint)
                selectorRows = [
                    ["", "", "P", "p", "I", "i", "C", "c", "S", "s"],
                    ["G", "g", "F", "f", "T", "t", "E", "e", "X", "x"],
                    ["O", "o", "L", "l", "A", "a", "M", "m", "V", "v"],
                    ["B", "b", "R", "r", "H", "h", "D", "d", "Q", "q"],
                    ["N", "n", "K", "k", "+P", "+p", "+I", "+i", "+C", "+c"],
                    [
                        "+S",
                        "+s",
                        "+G",
                        "+g",
                        "+F",
                        "+f",
                        "+T",
                        "+t",
                        "+E",
                        "+e",
                    ],
                    [
                        "+X",
                        "+x",
                        "+O",
                        "+o",
                        "+L",
                        "+l",
                        "+A",
                        "+a",
                        "+M",
                        "+m",
                    ],
                    [
                        "+V",
                        "+v",
                        "+B",
                        "+b",
                        "+R",
                        "+r",
                        "+H",
                        "+h",
                        "+D",
                        "+d",
                    ],
                ];
            } else {
                // 10x8 layout: when sidebar floats right (viewport at or above breakpoint)
                selectorRows = [
                    ["", "", "P", "p", "I", "i", "C", "c"],
                    ["S", "s", "G", "g", "F", "f", "T", "t"],
                    ["E", "e", "X", "x", "O", "o", "L", "l"],
                    ["A", "a", "M", "m", "V", "v", "B", "b"],
                    ["R", "r", "H", "h", "D", "d", "Q", "q"],
                    ["N", "n", "K", "k", "+P", "+p", "+I", "+i"],
                    ["+C", "+c", "+S", "+s", "+G", "+g", "+F", "+f"],
                    ["+T", "+t", "+E", "+e", "+X", "+x", "+O", "+o"],
                    ["+L", "+l", "+A", "+a", "+M", "+m", "+V", "+v"],
                    ["+B", "+b", "+R", "+r", "+H", "+h", "+D", "+d"],
                ];
            }

            let html = '<div class="chushogi-selector-table">';

            selectorRows.forEach((row, rowIndex) => {
                html += '<div class="chushogi-selector-row">';
                row.forEach((piece, colIndex) => {
                    if (piece === "") {
                        // Make the first empty square selectable for piece removal
                        if (rowIndex === 0 && colIndex === 0) {
                            html += `<div class="chushogi-selector-square" 
                         data-piece="remove" 
                         onclick="this.closest('.chushogi-container').chuShogiInstance.selectPieceFromTable('remove')"
                         title="Remove piece">
                         \u00d7
                       </div>`;
                        } else if (rowIndex === 0 && colIndex === 1) {
                            // Second empty square for Counter-strike rule selection
                            html += `<div class="chushogi-selector-square ${this.editMode.counterStrikeSelection ? "selected" : ""}" 
                         data-piece="counterstrike" 
                         onclick="this.closest('.chushogi-container').chuShogiInstance.selectPieceFromTable('counterstrike')"
                         oncontextmenu="event.preventDefault(); this.closest('.chushogi-container').chuShogiInstance.relaxCounterStrikeRule()"
                         title="Counter-strike Rule Selection">
                         \ud83d\udee1\ufe0f
                       </div>`;
                        } else {
                            html +=
                                '<div class="chushogi-selector-square empty"></div>';
                        }
                    } else {
                        const isBlack = piece === piece.toUpperCase();
                        const isPromoted = piece.startsWith("+");
                        const baseType = isPromoted
                            ? piece.slice(1).toUpperCase()
                            : piece.toUpperCase();

                        // Get the kanji from PIECE_DEFINITIONS
                        let lookupType = baseType;
                        if (baseType.toUpperCase() === "K") {
                            lookupType = isBlack ? "k" : "K"; // Black King uses "k" (\u7389), White King uses "K" (\u738b)
                        }

                        // For promoted pieces, use the promoted piece definition
                        let pieceDefinitionKey = isPromoted
                            ? piece
                            : lookupType;

                        // Handle white promoted pieces - they should use the promoted piece definition
                        if (isPromoted && !isBlack) {
                            // Convert white promoted piece code to uppercase (e.g., "+p" -> "+P")
                            pieceDefinitionKey = piece.toUpperCase();
                        }

                        const pieceData =
                            PIECE_DEFINITIONS[pieceDefinitionKey] ||
                            PIECE_DEFINITIONS[baseType];
                        const displayPiece = pieceData
                            ? pieceData.kanji
                            : baseType;

                        // Create a temporary piece object for display
                        const tempPiece = {
                            type: isPromoted ? piece : baseType,
                            color: isBlack ? "b" : "w",
                            promoted: isPromoted,
                        };

                        const pieceHTML = this.generatePieceHTML(tempPiece);

                        html += `<div class="chushogi-selector-square" 
                       data-piece="${piece}" 
                       onclick="this.closest('.chushogi-container').chuShogiInstance.selectPieceFromTable('${piece}')"
                       title="${pieceData ? pieceData.name : baseType} (${isBlack ? "Black" : "White"}${isPromoted ? ", Promoted" : ""})">
                       ${pieceHTML}
                     </div>`;
                    }
                });
                html += "</div>";
            });

            html += "</div>";
            return html;
        }

        generateEditPanel() {
            const panel = `
        <div class="chushogi-edit">
          <div class="chushogi-setting-group">
            <h4>Setup Box</h4>
            <div class="chushogi-piece-selector" translate="no">
              ${this.generatePieceSelectorTable()}
            </div>
          </div>

          <div class="chushogi-setting-group">
            <h4>Position Setup</h4>
            <div class="chushogi-edit-controls">
              <button class="chushogi-btn-primary" onclick="this.closest('.chushogi-container').chuShogiInstance.clearBoard()" title="Empty the board">
                \ud83d\uddd1\ufe0f Clear Board
              </button>

              <button class="chushogi-btn-primary" onclick="this.closest('.chushogi-container').chuShogiInstance.confirmSetStartPosition()" title="Start a new game from the displayed position,\nwith the selected player moving first">
                \ud83d\udccd Set Start Position
              </button>

              <div class="chushogi-edit-row">
                <label for="player-to-move">Player to Move:</label>
                <select class="chushogi-select" id="player-to-move" data-player-to-move>
                  <option value="b">Black (\u5148\u624b)</option>
                  <option value="w">White (\u5f8c\u624b)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      `;

            // Schedule highlighting restoration after panel is added to DOM
            // Use a longer timeout to ensure DOM is fully rendered
            // Immediate highlighting - delay removed per user request
            this.restorePieceSelection();
            // CRITICAL: Restore counter-strike highlighting after panel regeneration
            this.updateSquareHighlights();

            return panel;
        }

        // Helper method to update edit panel content with proper highlight restoration
        updateEditPanelContent(editPanel) {
            editPanel.innerHTML = this.generateEditPanel();

            // Reattach event listeners after HTML regeneration
            this.eventManager.attachUIListeners();

            // Restore selection states after HTML regeneration
            setTimeout(() => {
                this.restorePieceSelection();

                // Restore all highlights after HTML regeneration
                this.highlightManager.updateAll();
            }, 5);

            // Restore Counter-strike selection highlighting for shield icon
            if (this.editMode.counterStrikeSelection) {
                const counterStrikeSquare = utils.dom.querySelector(
                    this.container,
                    '[data-piece="counterstrike"]',
                );
                if (counterStrikeSquare) {
                    counterStrikeSquare.classList.add("selected");
                }
            }
        }

        // Helper method to update rules panel content when settings change
        updateRulesPanel() {
            const rulesPanel = this.container.querySelector(
                '[data-panel="rules"]',
            );
            if (rulesPanel) {
                rulesPanel.innerHTML = this.generateRulesPanel();
            }
        }

        getRepetitionHandlingValue() {
            if (this.config.repetitionHandling === "lenient")
                return "Lenient (ban 3rd repeat)";
            if (this.config.repetitionHandling === "relaxed")
                return "Relaxed (allow all repeats)";
            return "Strict (ban 1st repeat)";
        }

        generateRulesPanel() {
            return `
        <div class="chushogi-help">
          <div class="chushogi-setting-group">
            <h4>Rules of Chu Shogi</h4>
            <h4>Current Rules Settings</h4>
            <ul>
            <li>Midpoint protection: ${this.config.midpointProtection ? "Yes" : "No"}</li>
            <li>Trapped Lance promotion: ${this.config.trappedLancePromotion ? "Yes" : "No"}</li>
            <li>Repetition handling: ${this.getRepetitionHandlingValue()}</li>
            </ul>
            <h4>Introduction</h4>
            <p>Chu Shogi (<span translate="no">\u4e2d\u5c06\u68cb <i>ch\u016b sh\u014dgi</i></span>) is a two-player abstract strategy game native to Japan which is essentially 
a bigger version of Chess, which has been played since at least the 14th century. It is famous for its Lion 
piece, which moves as a King up to twice per turn.</p>
            <h4>Setup</h4>
            <p>Chu Shogi is played on a board of 12 ranks (rows) and 12 files (columns). The setup is as follows. Pieces are oriented with the top side facing the enemy, showing who controls what.</p>
            <table class="chuRulesDiagramTable">
            <tr>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u9999</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u8c79</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u9285</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u9280</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u91d1</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u8c61</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u738b</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u91d1</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u9280</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u9285</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u8c79</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u9999</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u53cd</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u89d2</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u864e</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u9cf3</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u9e92</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u864e</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u89d2</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u53cd</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u6a2a</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u7aea</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u98db</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u99ac</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u9f8d</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u5954</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u7345</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u9f8d</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u99ac</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u98db</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u7aea</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u6a2a</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u6b69</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u4ef2</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">\u4ef2</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">&#12288;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">&#12288;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u4ef2</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u4ef2</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u6b69</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u6a2a</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u7aea</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u98db</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u99ac</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u9f8d</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u7345</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u5954</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u9f8d</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u99ac</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u98db</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u7aea</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u6a2a</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u53cd</td>
            <td class="chuRulesDiagramTableCell" translate="no">&#160;</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u89d2</td>
            <td class="chuRulesDiagramTableCell" translate="no">&#160;</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u864e</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u9e92</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u9cf3</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u864e</td>
            <td class="chuRulesDiagramTableCell" translate="no">&#160;</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u89d2</td>
            <td class="chuRulesDiagramTableCell" translate="no">&#160;</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u53cd</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u9999</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u8c79</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u9285</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u9280</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u91d1</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u7389</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u8c61</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u91d1</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u9280</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u9285</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u8c79</td>
            <td class="chuRulesDiagramTableCell" translate="no">\u9999</td>
            </tr>
            </table>
            <h4>Piece Legend</h4>
            <table class="chuRulesDiagramTable">
            <tr>
            <th class="chuRulesDiagramTableCell">Piece</th>
            <th class="chuRulesDiagramTableCell">Name</th>
            <th class="chuRulesDiagramTableCell">Promotion</th>
            <th class="chuRulesDiagramTableCell">Prom. Name</th>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u6b69</td>
            <td class="chuRulesDiagramTableCell">Pawn</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u91d1</i></td>
            <td class="chuRulesDiagramTableCell">Gold General</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u4ef2</td>
            <td class="chuRulesDiagramTableCell">Go-Between</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u8c61</i></td>
            <td class="chuRulesDiagramTableCell">Drunk Elephant</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u9285</td>
            <td class="chuRulesDiagramTableCell">Copper General</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u6a2a</i></td>
            <td class="chuRulesDiagramTableCell">Side Mover</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u9280</td>
            <td class="chuRulesDiagramTableCell">Silver General</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u7aea</i></td>
            <td class="chuRulesDiagramTableCell">Vertical Mover</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u91d1</td>
            <td class="chuRulesDiagramTableCell">Gold General</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u98db</i></td>
            <td class="chuRulesDiagramTableCell">Rook</td>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u8c79</td>
            <td class="chuRulesDiagramTableCell">Ferocious Leopard</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u89d2</i></td>
            <td class="chuRulesDiagramTableCell">Bishop</td>
            </tr>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u864e</td>
            <td class="chuRulesDiagramTableCell">Blind Tiger</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u9e7f</i></td>
            <td class="chuRulesDiagramTableCell">Flying Stag</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u8c61</td>
            <td class="chuRulesDiagramTableCell">Drunk Elephant</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u592a</i></td>
            <td class="chuRulesDiagramTableCell">Prince</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u9cf3</td>
            <td class="chuRulesDiagramTableCell">Phoenix</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u5954</i></td>
            <td class="chuRulesDiagramTableCell">Queen</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u9e92</td>
            <td class="chuRulesDiagramTableCell">Kirin</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u7345</i></td>
            <td class="chuRulesDiagramTableCell">Lion</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u9999</td>
            <td class="chuRulesDiagramTableCell">Lance</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u99d2</i></td>
            <td class="chuRulesDiagramTableCell">White Horse</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u53cd</td>
            <td class="chuRulesDiagramTableCell">Reverse Chariot</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u9be8</i></td>
            <td class="chuRulesDiagramTableCell">Whale</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u6a2a</td>
            <td class="chuRulesDiagramTableCell">Side Mover</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u732a</i></td>
            <td class="chuRulesDiagramTableCell">Free Boar</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u7aea</td>
            <td class="chuRulesDiagramTableCell">Vertical Mover</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u725b</i></td>
            <td class="chuRulesDiagramTableCell">Flying Ox</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u89d2</td>
            <td class="chuRulesDiagramTableCell">Bishop</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u99ac</i></td>
            <td class="chuRulesDiagramTableCell">Dragon Horse</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u98db</td>
            <td class="chuRulesDiagramTableCell">Rook</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u9f8d</i></td>
            <td class="chuRulesDiagramTableCell">Dragon King</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u99ac</td>
            <td class="chuRulesDiagramTableCell">Dragon Horse</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u9df9</i></td>
            <td class="chuRulesDiagramTableCell">Horned Falcon</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u9f8d</td>
            <td class="chuRulesDiagramTableCell">Dragon King</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>\u9df2</i></td>
            <td class="chuRulesDiagramTableCell">Soaring Eagle</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u5954</td>
            <td class="chuRulesDiagramTableCell">Queen</td>
            <td class="chuRulesDiagramTableCell">-</td>
            <td class="chuRulesDiagramTableCell">-</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u7345</td>
            <td class="chuRulesDiagramTableCell">Lion</td>
            <td class="chuRulesDiagramTableCell">-</td>
            <td class="chuRulesDiagramTableCell">-</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">\u7389<br>\u738b</td>
            <td class="chuRulesDiagramTableCell">King</td>
            <td class="chuRulesDiagramTableCell">-</td>
            <td class="chuRulesDiagramTableCell">-</td>
            </tr>
            </table>
            <h4>Deciding who goes first</h4>
            <p>Traditionally, the least skilled player goes first. However, the players may also decide who goes first through a game of chance or mutual agreement. The player who goes first is called Black (<span translate="no">\u5148\u624b <i>sente</i></span>) and the other player is called White (<span translate="no">\u5f8c\u624b <i>gote</i></span>). Black gets the King with the extra mark and vice versa.</p>
            <h4>Gameplay</h4>
            <p>Black moves first, and then players alternate making moves. Making a move is required - it is illegal to skip a move, even if having to move is detrimental. Only one piece may be moved per turn, and captured pieces are permanently removed from the game.</p>
            <h4>Object of the Game</h4>
            <p>The object of the game is to capture all of your opponent's royal pieces. The royal pieces are the King and Prince.</p>
            <h4>Movement</h4>
            <p>The following table describe the different movements a piece might have.</p>
            <table class="chuRulesDiagramTable" style="width:250px;">
            <tr>
            <th class="chuRulesDiagramTableCell">Symbol</th>
            <th class="chuRulesDiagramTableCell">Description</th>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">\u25cf</td>
            <td class="chuRulesDiagramTableCell">Jumps to this square, ignoring any intervening piece</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">\u2502</td>
            <td class="chuRulesDiagramTableCell" rowspan="4">Slide any number of squares in a straight line, stopping at the first capture or short of the first friendly piece.</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">\u2015</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">\u2572</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">\u2571</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell"><b>\u203b</b></td>
            <td class="chuRulesDiagramTableCell">Moves to this square, then optionally moves to any orthogonally or diagonally adjacent square in the same turn.</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">\u2021</td>
            <td class="chuRulesDiagramTableCell">Moves to this square, then optionally moves to the starting square or the next square in the same direction in the same turn.</td>
            </tr>
            </table>
            <h4>Movement Diagrams</h4>
            <p>Promoted pieces that appear in the setup move identically to their unpromoted counterparts.</p>
            <table class="chuRulesDiagramTable" style="width:250px;">
            <tr>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Pawn</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u6b69</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Go-Between</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u4ef2</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Copper General</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u9285</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                </table>
            </td>
            </tr>
            <tr>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Silver General</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u9280</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Gold General</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u91d1</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Ferocious Leopard</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u8c79</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                </table>
            </td>
            </tr>
            <tr>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Blind Tiger</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u864e</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Drunk Elephant</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u8c61</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Lance</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u9999</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                </table>
            </td>
            </tr>
            <tr>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Reverse Chariot</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u53cd</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Side Mover</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u6a2a</td>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Vertical Mover</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u7aea</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                </table>
            </td>
            </tr>
            <tr>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Bishop</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u89d2</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Rook</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u98db</td>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Dragon Horse</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u99ac</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                </tr>
                </table>
            </td>
            </tr>
            <tr>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Dragon King</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u9f8d</td>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Queen</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u5954</td>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">King<br><span translate="no">\u7389</span> / <span translate="no">\u738b</span></th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u738b</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                </table>
            </td>
            </tr>
            <tr>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Prince</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>\u592a</i></td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">White Horse</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>\u99d2</i></td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Whale</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>\u9be8</i></td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                </tr>
                </table>
            </td>
            </tr>
                        <tr>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Flying Stag</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>\u9e7f</i></td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Free Boar</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>\u732a</i></td>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Flying Ox</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>\u725b</i></td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                </tr>
                </table>
            </td>
            </tr>
            </table>
            <table class="chuRulesDiagramTable" style="width:254px;">
            <tr>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="5">Phoenix</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u9cf3</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="5">Kirin</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u9e92</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                </table>
            </td>
            </tr>
            <tr>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="5">Horned Falcon</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                <td class="chuRulesLargeDiagramTableCell">\u2021</td>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>\u9df9</i></td>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="5">Soaring Eagle</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2021</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">\u2021</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>\u9df2</i></td>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                <td class="chuRulesLargeDiagramTableCell">\u2015</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u2571</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2502</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">\u2572</td>
                </tr>
                </table>
            </td>
            </tr>
            <tr>
            <td colspan="2">
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="5">Lion</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell"><b>\u203b</b></td>
                <td class="chuRulesLargeDiagramTableCell"><b>\u203b</b></td>
                <td class="chuRulesLargeDiagramTableCell"><b>\u203b</b></td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell"><b>\u203b</b></td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">\u7345</td>
                <td class="chuRulesLargeDiagramTableCell"><b>\u203b</b></td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell"><b>\u203b</b></td>
                <td class="chuRulesLargeDiagramTableCell"><b>\u203b</b></td>
                <td class="chuRulesLargeDiagramTableCell"><b>\u203b</b></td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                <td class="chuRulesLargeDiagramTableCell">\u25cf</td>
                </tr>
                </table>
            </td>
            </tr>
            </table>
            <h4>Promotion</h4>
            <p>The player's promotion zone consists of the farthest four ranks of the board. A piece can be promoted if:</p>
            <ul>
            <li>it enters the zone (starts outside, ends within).</li>
            <li>it starts inside the zone and captures something.</li>
            <li>it is a Pawn${this.config.trappedLancePromotion ? " or Lance" : ""} moving to the last rank.</li>
            </ul>
            <p>Promoted pieces have their kanji italicized to indicatea their promoted status.</p>
            <p>The King, Queen, and Lion do not promote, nor can already promoted pieces promote further.</p>
            <h4>Lion-Trading Rules</h4>
            <p>Lions cannot be captured in situations where this would in general trade two Lions out of the game.</p>
            <p>These rules do not differentiate between Lions and promoted Kirins, nor do they apply recursively in the
case of multiple Lions.</p>
            <ul>
            <li>Bridge-capture - A Lion cannot capture another Lion unless:
                <ul>
                <li>The two Lions stand on orthogonally or diagonally adjacent squares.</li>
                <li>The moving Lion is not exposed to capture on the next turn${this.config.midpointProtection ? ", including from other pieces it captures during the move" : ""}.</li>
                <li>The moving Lion first captures a piece other than a Pawn or Go-Between.</li>
                </ul>
            </li>
            </ul>
            <ul>
            <li>Counter-strike - A non-Lion cannot capture a Lion when in the immediately preceding turn a Lion
was captured by a non-Lion on another square.
                <ul>
                <li>This includes double moves from Horned Falcons and Soaring Eagles.</li>
                <li>The stipulation \u201canother square\u201d means that if a Kirin captures a Lion, it can always be
captured, even if it had simultaneously promoted to Lion.</li>
                </ul>
            </li>
            </ul>
            <h4>Repetition</h4>
            <p>${this.getRepetitionRuleText()}</p>
            <h4>Illegal Move</h4>
            <p>A player who makes an illegal move loses immediately. This rule may be relaxed in casual games, where
the offending player can take back the move and make a legal move.</p>
            <h4>Check and Mate</h4>
            <p>A player is in check when all their royal pieces (Kings and Princes) could be captured on the opponent\u2019s next move. Players are not required to keep their royal(s) out of check, and can even move into check, though this is almost always a blunder.</p>
            <p>A player with two royals (i.e. a King and a Prince) may sacrifice one of them without losing the game.</p>
            <p>If a player has no legal moves that will keep at least one of their Kings out of check, regardless of whether they are in check or not, that player is mated and has effectively lost the game.</p>
            <h4>End of the Game</h4>
            <p>A player wins when they capture all their opponent\u2019s royal pieces (Kings and Princes).</p>
            <h4>Resignation</h4>
            <p>At any time, a player may resign, and their opponent wins the game.</p>
            <h4>Draw</h4>
            <p>At any time, the players may agree to a draw. In positions where the winning condition is practically
impossible to fulfill for either player, the game is considered a draw.</p>
          </div>
        </div>
      `;
        }

        getRepetitionRuleText() {
            if (this.config.repetitionHandling === "lenient") {
                return "Repeating the same board position four times with the same player to move (including the original position) is forbidden, but this does not apply to a player who is in check (see Check and Mate for more information).";
            }
            if (this.config.repetitionHandling === "relaxed") {
                return "Repeating the same board position four times with the same player to move (including the original position) is considered a draw.";
            }
            return "Repeating the same board position two times with the same player to move (including the original position) is forbidden, but this does not apply to a player who is in check (see Check and Mate for more information).";
        }

        generateHelpPanel() {
            const isViewOnly = this.config.appletMode === "viewOnly";
            const isFixedStart =
                this.config.appletMode === "fixedStart" ||
                this.config.appletMode === "fixedStartAndRules" ||
                this.config.appletMode === "fixedStartAndSettings";
            const isFixedRules =
                this.config.appletMode === "fixedRules" ||
                this.config.appletMode === "fixedStartAndRules";
            const isPuzzle = this.config.appletMode === "puzzle";

            return `
        <div class="chushogi-help">
          <div class="chushogi-setting-group">
            <h4>About</h4>
            <div class="chushogi-help-content">
            <p><strong>ChuShogiLite</strong></p>
            <p>Made by A. M. DeWitt using the Replit.com Core Agent</p>
            </div>
          </div>
          ${
              isPuzzle
                  ? `<div class="chushogi-setting-group">
            <h4>\ud83e\udde9 Puzzle</h4>
            <div class="chushogi-help-content">
              <p><strong>About Puzzle Mode:</strong></p>
              <p>You are solving a Chu Shogi puzzle! This puzzle validates your moves against a predetermined solution sequence to help you learn tactics and strategy.</p>

              <p><strong>How the Puzzle Works:</strong></p>
              <ul>
                <li>Play moves as the solving player (highlighted in the turn indicator)</li>
                <li>The opponent's responses are usually played automatically according to the solution</li>
                <li>If your move has commentary, the opponent will wait until you press the > button or \u2192 key to play the next move.</li>
                <li>Your moves must match the expected solution sequence to progress</li>
                <li>Incorrect moves will be rejected and deselect the moving piece</li>
                <li>The Info tab shows your progress: current position / total solution length</li>
              </ul>

              <p><strong>Puzzle-Specific Features:</strong></p>
              <ul>
                <li><strong>View Solution:</strong> In the \u21c5 Export/Import tab, use "View Solution" to see the complete answer</li>
                <li><strong>Move Validation:</strong> Only solution moves are accepted - this helps ensure you understand the correct tactical sequence</li>
                <li><strong>Progress Display:</strong> Shows progress as "X / Y" in the \ud83d\udccb Info tab, where X is the number of moves made and Y is the total number of moves in the puzzle solution</li>
              </ul>

              <p><strong>Tips for Solving:</strong></p>
              <ul>
                <li>Take time to analyze the position before making moves</li>
                <li>If a move is rejected, look for alternative moves with the same piece or different pieces</li>
                <li>Use the drawing tools (right-click) to mark important squares and analyze patterns</li>
                <li>The influence display setting can help visualize piece attack patterns</li>
              </ul>
            </div>
          </div>`
                  : ""
          }
          <div class="chushogi-setting-group">
            <h4>How to Use</h4>
            <div class="chushogi-help-content">
              <p><strong>Basic Controls:</strong></p>
              <ul>
                ${
                    !isViewOnly
                        ? `<li>Click a piece to select it, then click a destination to move to
                <ul>
                <li>Click the same piece to deselect it</li>
                <li>Prompts are shown for double moves and promotions, which provide alternate deselection squares as needed</li>
                </ul>
                </li>`
                        : ""
                }
                <li>Right-click to draw circles, right-click and drag to another square to draw arrows
                <ul>
                <li>Use the Shift and Alt keys or the checkboxes at the top to change drawing colors
                </li>
                </ul>
                </li>
                <li>\ud83d\udd04 Flip View: Flips the board view</li>
                <li>|&lt; or \u2191 key: navigates to starting position</li>
                <li>&lt; or \u2190 key: navigates one move backward</li>
                <li>> or \u2192 key: navigates one move forward</li>
                <li>>| or \u2193 key: navigates to current position</li>
                ${!isViewOnly ? "<li>\u21b6: undoes the last move</li>" : ""}
                ${!isViewOnly ? "<li>\u2702: trims the game to the displayed position</li>" : ""}
                ${!isViewOnly ? "<li>\u232b: starts a new game</li>" : ""}
                ${!isPuzzle ? "<li>\u27f3: resets the board to its original state</li>" : ""}
              </ul>
              <p><strong>Sidebar:</strong></p>
              <p>Use the tabs to switch between different panels</p>
              <ul>
                <li>\ud83d\udccb Info: Shows information about the current game and the selected piece
                <ul>
                <li>Click a moves in the move history to jump to that point in the game</li>
                </ul>
                </li>
                <li>\u2699\ufe0f Settings: Shows available settings${isViewOnly ? " (some settings are restricted in view-only mode)" : ""}</li>
                <li>\u21c5 Export/Import: Allows for games to be exported to plaintext${!isViewOnly ? (isFixedStart ? " and imported from plaintext (imports restricted to same starting position)" : " and imported from plaintext") : " (Game imports not available in viewOnly mode)"}${isPuzzle ? " and has a 'View Solution' button to reveal the complete puzzle answer" : ""}</li>
                ${!isViewOnly && !isFixedStart && !isPuzzle ? "<li>\u270f\ufe0f Edit: Allows the board to be edited without importing a game</li>" : ""}
                <li>\u2139\ufe0f Rules: Explains the rules of Chu Shogi and displays the current Rules Settings</li>
                <li>\u2753 Help: This help window</li>
              </ul>
              <p><strong>Info:</strong></p>
              <p>The \ud83d\udccb Info tab shows all information relative to the game.</p>
              <ul>
              <li><strong>Display SFEN:</strong> checkbox - shows the current SFEN instead of the current comment if checked</li>
              <li><strong>Display inline notation:</strong> checkbox - puts all moves in the Game Log on a single line if checked</li>
              </ul>
              ${this.config.allowCustomComments ? "<p>When comments are shown, the current coomment can be edited by typing in the comment display window.</p>" : ""}
              ${
                  !isViewOnly
                      ? `<p><strong>Settings:</strong></p>
              <p>The \u2699\ufe0f Setting tab allows for various settings to be changed for a variety of effects.</p>
              <ul>
                <li><strong>Board Size:</strong> Small, Medium, Large - Controls the visual size of the board</li>
                <li><strong>Show coordinates:</strong> checkbox - Shows file/rank labels around the board if checked</li>
                <li><strong>Show moveable pieces:</strong> checkbox - Highlights all pieces that can be moved when no piece is selected if checked</li>
                <li><strong>Show legal moves:</strong> checkbox - Highlights valid moves when a piece is selected if checked</li>
                <li><strong>Show last move:</strong> checkbox - Highlights the squares involved in the last move if checked</li>
                <li><strong>Show promotion zones:</strong> checkbox - Highlights the promotion zones for both players if checked</li>
                <li><strong>Show influence display:</strong> checkbox - Shows attack patterns and piece influence on the board if checked</li>
                ${
                    !isFixedRules && !isPuzzle
                        ? `<li><strong>Allow illegal moves:</strong> checkbox - Allows pieces to move anywhere regardless of rules if checked</li>
                <li><strong>Midpoint protection:</strong> checkbox - Invokes the bridge-capture rule even if a Pawn or Go-Between at the midpoint is the sole defender if checked</li>
                <li><strong>Trapped Lance promotion:</strong> checkbox - Allows Lances to promote on the last rank during non-capture moves (similar to Pawns under historic rules) if checked</li>
                <li><strong>Repetition Handling:</strong> Strict (ban 1st repeat), Lenient (ban 3rd repeat, Relaxed (allow all repeats) - Controls how the applet handles repeated positions with the same player to move
                <ul>
                  <li>NOTE: repeats are always allowed for players that are in check</li>
                </ul>
                </li>`
                        : ""
                }
              </ul>`
                      : `<p><strong>Available Settings:</strong></p>
              <p>The \u2699\ufe0f Setting tab shows visual display settings (game-changing settings are restricted in view-only mode).</p>
              <ul>
                <li><strong>Board Size:</strong> Small, Medium, Large - Controls the visual size of the board</li>
                <li><strong>Show coordinates:</strong> checkbox - Shows file/rank labels around the board if checked</li>
                <li><strong>Show moveable pieces:</strong> checkbox - Highlights all pieces that can be moved. Pieces that were last moved show a border outline instead of background highlight if checked</li>
                <li><strong>Show last move:</strong> checkbox - Highlights the squares involved in the last move if checked</li>
                <li><strong>Show promotion zones:</strong> checkbox - Highlights the promotion zones for both players if checked</li>
                <li><strong>Show influence display:</strong> checkbox - Shows attack patterns and piece influence on the board if checked</li>
              </ul>`
              }
              <p><strong>Game Export${!isViewOnly && !isPuzzle ? "/Import" : ""}:</strong></p>
              <p>The \u21c5 Export/Import tab allows for games to be exported to plaintext${!isViewOnly && !isPuzzle ? (isFixedStart ? " and imported from plaintext (imports restricted)." : " and imported from plaintext.") : "."}${isPuzzle ? " For puzzles, a 'View Solution' button to reveal the complete puzzle answer, and imports are not available." : ""}</p><p>The format used for a game's plaintext is called CSL (short for ChuShogiLite) notation and is very simple: an SFEN followed by a sequence of moves in Universal Shogi Notation (USI) and optional comments enclosed in {} curly brackets, all separated by spaces. Alternatively, you can import just the moves (without SFEN) to continue from the current game's starting position.${isFixedStart ? " Imports are restricted to moves-only format or games that start from the same position." : ""} An example is provided in the CSL Export section.</p>
              <p>SFEN {StartComment} USIMove1 USIMove2 {Comment2}...</p>
              <p>A comment for a move is placed immediately after that move, and the comment for the starting position is placed just before the first move.</p>
              <ul>
                <li>To copy the current game's plaintext, click Export CSL</li>
                ${
                    !isViewOnly && !isPuzzle
                        ? `<li>To import a game, paste it's CSL notation into the CSL Import text area and press Import CSL
                <ul>
                  <li>Importing a game will overwrite the current game</li>
                </ul>
                </li>`
                        : ""
                }
              </ul>
              <p>Comments in CSL notation have three special escape characters used to encode certain characters within them:</p>
              <ul>
              <li><strong>\\}</strong>: } closing curly bracket within comment</li>
              <li><strong>\\\\</strong>: \\ backslash</li>
              <li><strong>\\n</strong>: newline character</li>
              </ul>
              <p>Games can also be exported to${!isViewOnly && !isPuzzle ? " and imported from" : ""} PGN (Portable Game Notation).</p>
              ${
                  !isViewOnly && !isFixedStart && !isPuzzle
                      ? `<p><strong>Editing the Board:</strong></p>
              <p>The \u270f\ufe0f Edit tab allows the board to be edited without importing a game.</p>
              <ul>
                <li>Pieces on the board can be moved anywhere, but double moves, promotions, and most highlights are disabled</li>
                <li>Select a piece from the Setup Box, then click on the board to place the piece on the desired squares
                  <ul>
                    <li>Click the same piece to deselect it</li>
                  </ul>
                </li>
                <li>To remove pieces, select the square with an X, and then click on the pieces to be removed</li>
                <li>To set the Counter-strike rule state, select the square with a shield
                <ul>
                  <li>Click a piece on the board to invoke the Counter-strike rule on its square</li>
                  <li>Click an empty board square or right-click the shield to relax the rule</li>
                  <li>A highlight will show the current state while the \u270f\ufe0f Edit tab is open</li>
                </ul>
                </li>
                <li>\u27f3: clears all board edits while the \u270f\ufe0f Edit tab is open</li>
                <li>\ud83d\uddd1\ufe0f Clear Board: empties the board</li>
                <li>\ud83d\udccd Set Start Position: starts a new game and sets the starting position to the current position
                  <ul>
                    <li>Player to Move: sets the player to move for the new starting position</li>
                  </ul>
                </li>
              </ul>`
                      : ""
              }
            </div>

            <h4>Embedding Instructions</h4>
            <div class="chushogi-help-content">
              <p><strong>Basic HTML:</strong></p>
              <p>To embed Chu Shogi Lite into your webpage, include the following HTML snippet and adjust the configuration options in the <code>data-config</code> attribute as needed. Settings that use their default values can be left out.</p>
              <textarea class="chushogi-textarea chushogi-code" translate="no" data-embedding-example readonly>&lt;!-- Include files --&gt;
&lt;link rel="stylesheet" href="chushogi-lite.css"&gt;
&lt;script src="chushogi-lite.js"&gt;&lt;/script&gt;

&lt;!-- Game container --&gt;
&lt;div class="chuShogiLite" data-config='{
  "appletMode": "sandbox",
  "startGame": null,
  "allowCustomComments": true,
  "flipView": false,
  "displaySFEN": false,
  "displayInlineNotation": false,
  "boardSize": "large",
  "showCoordinates": true,
  "showMoveablePieces": true,
  "showLegalMoves": true,
  "showLastMove": true,
  "showPromotionZones": false,
  "showInfluenceDisplay": false,
  "allowIllegalMoves": false,
  "midpointProtection": false,
  "trappedLancePromotion": false,
  "repetitionHandling": "strict"
}'&gt;&lt;/div&gt;

</textarea>

              <p><strong>Embedding Configuration Options:</strong></p>
              <p>All available configuration settings and their possible values are listed below (the underlined values are the defaults):</p>
              <ul translate="no">
                <li><strong>appletMode:</strong> <span style="text-decoration:underline">"sandbox"</span>, "fixedStart", "fixedRules", "fixedSettings", "fixedStartAndRules", "fixedStartAndSettings", "puzzle", "viewOnly"
                </li>
                <li><strong>startGame:</strong> CSL notation (i. e. SFEN {StartComment} USIMove1 USIMove2 {Comment2}... or USIMove1 USIMove2...), <span style="text-decoration:underline">null</span></li>
                <li><strong>allowCustomComments:</strong> <span style="text-decoration:underline">true</span>/false
                    <ul>
                    <li>Defaults to <span style="text-decoration:underline">false</span> when <strong>appletMode</strong> is "puzzle" or "viewOnly"</li>
                    </ul>
                </li>
                <li><strong>flipView:</strong> true/<span style="text-decoration:underline">false</span></li>
                <li><strong>displaySFEN:</strong> true/<span style="text-decoration:underline">false</span></li>
                <li><strong>displayInlineNotation:</strong> true/<span style="text-decoration:underline">false</span></li>
                <li><strong>boardSize:</strong> "small", "medium", <span style="text-decoration:underline">"large"</span></li>
                <li><strong>showCoordinates:</strong> <span style="text-decoration:underline">true</span>/false</li>
                <li><strong>showMoveablePieces:</strong> <span style="text-decoration:underline">true</span>/false</li>
                <li><strong>showLegalMoves:</strong> <span style="text-decoration:underline">true</span>/false</li>
                <li><strong>showLastMove:</strong> <span style="text-decoration:underline">true</span>/false</li>
                <li><strong>showPromotionZones:</strong> true/<span style="text-decoration:underline">false</span></li>
                <li><strong>showInfluenceDisplay:</strong> true/<span style="text-decoration:underline">false</span></li>
                <li><strong>allowIllegalMoves:</strong> true/<span style="text-decoration:underline">false</span></li>
                <li><strong>midpointProtection:</strong> true/<span style="text-decoration:underline">false</span></li>
                <li><strong>trappedLancePromotion:</strong> true/<span style="text-decoration:underline">false</span></li>
                <li><strong>repetitionHandling:</strong> <span style="text-decoration:underline">"strict"</span>, "lenient", "relaxed"</li>
              </ul>

              <p><strong>Custom Starting Position Example:</strong></p>
              <textarea class="chushogi-textarea chushogi-code" translate="no" readonly>&lt;div class="chuShogiLite" data-config='{
  "boardSize": "large",
  "startGame": "lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b - 1 7i7h 5d5e"
}'&gt;&lt;/div&gt;</textarea>
            </div>
          </div>
        </div>
      `;
        }

        attachEventListeners() {
            showDebugMessage("attachEventListeners: Starting");

            // Remove existing event listeners to prevent duplicates
            showDebugMessage(
                "attachEventListeners: Removing existing listeners",
            );

            // Save current form values before cloning to preserve state
            const formValues = new Map();
            utils.dom
                .querySelectorAll(this.container, "input, select")
                .forEach((element) => {
                    if (element.type === "checkbox") {
                        formValues.set(
                            element.id || element.dataset.boardSize,
                            element.checked,
                        );
                    } else {
                        formValues.set(
                            element.id || element.dataset.boardSize,
                            element.value,
                        );
                    }
                });

            // Remove all existing event listeners by cloning all interactive elements
            const elementsToClone = utils.dom.querySelectorAll(
                this.container,
                "[data-square], [data-tab], input, select, [data-promote], [data-close-modal], [data-promotion-modal]",
            );
            elementsToClone.forEach((element) => {
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            });

            // Restore form values after cloning
            utils.dom
                .querySelectorAll(this.container, "input, select")
                .forEach((element) => {
                    const key = element.id || element.dataset.boardSize;
                    if (formValues.has(key)) {
                        if (element.type === "checkbox") {
                            element.checked = formValues.get(key);
                        } else {
                            element.value = formValues.get(key);
                        }
                    }
                });

            // Use centralized EventManager for square event handling
            showDebugMessage(
                "attachEventListeners: Attaching square listeners",
            );
            this.eventManager.attachSquareListeners();

            // Use centralized EventManager for UI control handling
            showDebugMessage("attachEventListeners: Attaching UI listeners");
            this.eventManager.attachUIListeners();

            // All remaining event handlers are now managed by centralized EventManager
            this.eventManager.attachDrawingListeners();
            this.eventManager.attachBoardListeners();

            // Use centralized EventManager for modal handling
            showDebugMessage("attachEventListeners: Attaching modal listeners");
            this.eventManager.attachModalListeners();

            // Use centralized EventManager for keyboard handling
            showDebugMessage(
                "attachEventListeners: Attaching keyboard listeners",
            );
            this.eventManager.attachKeyboardListeners();

            showDebugMessage(
                "attachEventListeners: All listeners attached successfully",
            );
        }

        handleSquareClick(event) {
            // Prevent event bubbling that might cause duplicate calls
            event.stopPropagation();
            event.preventDefault();

            const square = event.currentTarget;
            const rank = parseInt(square.dataset.rank);
            const file = parseInt(square.dataset.file);
            const squareId = square.dataset.square;

            // Validate square data
            if (!squareId || isNaN(rank) || isNaN(file)) {
                console.error("Invalid square data:", squareId, rank, file);
                return;
            }

            // Clear all drawings on normal click/tap (works in all modes)
            this.clearAllDrawings();

            // Block all interactions during puzzle opponent thinking
            if (
                this.config.appletMode === "puzzle" &&
                this.puzzleOpponentThinking
            ) {
                console.log(
                    "Board clicks blocked during puzzle opponent response",
                );
                return;
            }

            // Block all interactions during puzzle pause (waiting for manual advance)
            if (
                this.config.appletMode === "puzzle" &&
                this.puzzleWaitingForAdvance
            ) {
                console.log("Board clicks blocked - press > or \u2192 to continue");
                return;
            }

            // Block piece movement clicks in viewOnly mode (but allow drawing clearing above)
            if (this.config.appletMode === "viewOnly") {
                console.log("Piece movement clicks blocked in viewOnly mode");
                return;
            }

            // Handle edit mode - check if we're in edit tab and handle piece placement
            // Edit mode should work regardless of navigation state
            if (this.currentTab === "edit") {
                if (this.editMode.counterStrikeSelection) {
                    // Handle Counter-strike square selection
                    this.setCounterStrikeSquare(squareId);
                    return;
                } else if (this.editMode.selectedPiece) {
                    // Place the selected piece on the clicked square
                    this.placePieceOnBoard(squareId);
                    return;
                } else {
                    // No piece selected from sidebar - handle arbitrary board editing
                    this.handleEditModeBoardClick(squareId);
                    return;
                }
            }

            // Lion return prompt clicks are now handled by the promotion system below
            // (Lion return reuses promotion UI for consistency)

            // Handle promotion prompt clicks (includes Lion return via promotion system)
            if (this.promotionPromptActive && this.promotionMove) {
                console.log("Promotion prompt active, checking click:", {
                    squareId,
                    destinationSquare: this.promotionDestinationSquare,
                    deferralSquare: this.promotionDeferralSquare,
                    promotionMove: this.promotionMove,
                });
                if (squareId === this.promotionDestinationSquare) {
                    // Clicked destination square - promote and move
                    console.log(
                        "Clicked promotion destination square:",
                        squareId,
                    );
                    this.executePromotionMove(true);
                    return;
                } else if (squareId === this.promotionDeferralSquare) {
                    // Clicked deferral square - move without promotion
                    console.log("Clicked promotion deferral square:", squareId);
                    this.executePromotionMove(false);
                    return;
                } else if (
                    squareId === this.promotionMove.from &&
                    !this.promotionAlternateSquare
                ) {
                    // Clicked origin square (when not covered) - cancel and deselect
                    this.closePromotionPrompt();
                    this.clearSelection();
                    return;
                } else if (squareId === this.promotionAlternateSquare) {
                    // Clicked alternate square (when origin is covered) - cancel and deselect
                    this.closePromotionPrompt();
                    this.clearSelection();
                    return;
                }
                // Ignore other clicks during promotion prompt
                return;
            }

            // Double move handling removed

            if (this.selectedSquare) {
                // Check if clicking on a friendly piece
                const pieceAtSquare = utils.board.getPieceAt(
                    this.board,
                    squareId,
                );
                const isFriendlyPiece =
                    pieceAtSquare &&
                    (this.config.allowIllegalMoves ||
                        pieceAtSquare.color === this.currentPlayer);

                if (isFriendlyPiece) {
                    // Check if clicking on the same square that's already selected
                    if (this.selectedSquare === squareId) {
                        // Deselect the piece
                        this.clearSelection();
                        return;
                    }

                    // Handle friendly piece click based on allowIllegalMoves setting
                    if (!this.config.allowIllegalMoves) {
                        // A) allowIllegalMoves = false: deselect current piece and select clicked piece
                        // First, properly clear any active double move state
                        if (this.doubleMoveMidpoint) {
                            console.log(
                                "Clearing double move state before friendly piece selection",
                            );
                            this.clearSelection(); // This clears double move state properly
                        }
                        this.selectSquare(squareId);
                        return;
                    }
                    // If allowIllegalMoves = true, continue with normal Lion logic below
                }

                // Try to move normally
                if (
                    this.config.allowIllegalMoves ||
                    this.selectedSquare === squareId ||
                    this.moveValidator.validateMove(
                        this.selectedSquare,
                        squareId,
                        utils.board.getPieceAt(this.board, this.selectedSquare),
                    ).valid
                ) {
                    this.executeSquareMove(this.selectedSquare, squareId);
                } else if (isFriendlyPiece && !this.config.allowIllegalMoves) {
                    // This case is already handled above, but keeping for clarity
                    this.selectSquare(squareId);
                } else {
                    this.clearSelection();
                }
            } else {
                // Select piece
                const piece = utils.board.getPieceAt(this.board, squareId);
                if (
                    piece &&
                    (this.config.allowIllegalMoves ||
                        piece.color === this.currentPlayer)
                ) {
                    // Check if clicking on the same square that's already selected
                    if (this.selectedSquare === squareId) {
                        // Deselect the piece
                        this.clearSelection();
                        return;
                    }

                    // Double move logic removed
                    this.selectSquare(squareId);
                }
            }
        }

        // Drawing event handlers
        handleRightClick(event) {
            event.preventDefault(); // Prevent context menu
            return false;
        }

        handleMouseDown(event) {
            if (event.button === 2) {
                // Right mouse button
                event.preventDefault();
                this.startDrawing(event.target.dataset.square);
            }
        }

        handleMouseUp(event) {
            if (event.button === 2 && this.drawingState.isDrawing) {
                // Right mouse button
                event.preventDefault();
                this.finishDrawing(event.target.dataset.square);
            }
        }

        handleMouseMove(event) {
            if (this.drawingState.isDrawing && event.buttons === 2) {
                // Right mouse button held
                event.preventDefault();
                this.updateDrawing(event.target.dataset.square);
            }
        }

        // LIH system completely removed per user request

        // Old touch handlers removed - now handled by EventManager system

        startDrawing(squareId) {
            if (!squareId) return;

            this.drawingState.isDrawing = true;
            this.drawingState.startSquare = squareId;
            // Don't reset currentSquare if we've already moved during long-press
            if (!this.drawingState.hasMoved) {
                this.drawingState.currentSquare = squareId;
            }

            // Clear selection to prevent game moves while drawing
            this.clearSelection();

            // Update highlights only (don't regenerate board HTML) to clear modal highlights
            // This preserves existing circle classes on the DOM
            this.updateSquareHighlights();

            // Only show visual feedback if we haven't moved (to avoid circle flash)
            if (!this.drawingState.hasMoved) {
                this.updateDrawingPreview();
            }
        }

        updateDrawing(squareId) {
            if (!squareId || !this.drawingState.isDrawing) return;

            this.drawingState.currentSquare = squareId;
            this.updateDrawingPreview();
        }

        finishDrawing(squareId) {
            if (!this.drawingState.isDrawing) return;

            const startSquare = this.drawingState.startSquare;
            const endSquare = squareId || this.drawingState.currentSquare;

            // Reset drawing state
            this.drawingState.isDrawing = false;
            this.drawingState.startSquare = null;
            this.drawingState.currentSquare = null;

            // Remove preview
            this.clearDrawingPreview();

            if (startSquare === endSquare) {
                // Circle
                this.toggleCircle(startSquare);
            } else {
                // Arrow
                this.toggleArrow(startSquare, endSquare);
            }

            this.updateDrawingDisplay();
        }

        cancelDrawing() {
            if (!this.drawingState.isDrawing) return;

            // Reset drawing state without creating a drawing
            this.drawingState.isDrawing = false;
            this.drawingState.startSquare = null;
            this.drawingState.currentSquare = null;

            // Remove preview
            this.clearDrawingPreview();
        }

        toggleCircle(squareId) {
            // Ensure circles is a Map (convert from Set if needed)
            if (this.drawings.circles instanceof Set) {
                const oldCircles = Array.from(this.drawings.circles);
                this.drawings.circles = new Map();
                oldCircles.forEach((id) =>
                    this.drawings.circles.set(id, "#00af0e"),
                );
            }

            const currentColor = this.getCurrentDrawingColor();
            const existingColor = this.drawings.circles.get(squareId);

            if (existingColor === currentColor) {
                // Same color - remove the circle
                this.drawings.circles.delete(squareId);
                // Remove from ordered shapes
                this.drawings.orderedShapes =
                    this.drawings.orderedShapes.filter(
                        (shape) =>
                            !(
                                shape.type === "circle" &&
                                shape.squareId === squareId
                            ),
                    );
            } else {
                // Different color or no circle - add/replace with current color
                this.drawings.circles.set(squareId, currentColor);
                // Remove existing circle at this square (if different color)
                this.drawings.orderedShapes =
                    this.drawings.orderedShapes.filter(
                        (shape) =>
                            !(
                                shape.type === "circle" &&
                                shape.squareId === squareId
                            ),
                    );
                // Add to ordered shapes
                this.drawings.orderedShapes.push({
                    type: "circle",
                    squareId: squareId,
                    color: currentColor,
                });
            }
        }

        toggleArrow(fromSquare, toSquare) {
            const arrowKey = `${fromSquare}->${toSquare}`;
            const currentColor = this.getCurrentDrawingColor();
            const existingArrow = this.drawings.arrows.get(arrowKey);

            if (existingArrow && existingArrow.color === currentColor) {
                // Same color - remove the arrow
                this.drawings.arrows.delete(arrowKey);
                // Remove from ordered shapes
                this.drawings.orderedShapes =
                    this.drawings.orderedShapes.filter(
                        (shape) =>
                            !(
                                shape.type === "arrow" &&
                                shape.from === fromSquare &&
                                shape.to === toSquare
                            ),
                    );
            } else {
                // Different color or no arrow - add/replace with current color
                this.drawings.arrows.set(arrowKey, {
                    from: fromSquare,
                    to: toSquare,
                    color: currentColor,
                });
                // Remove existing arrow from this square to that square (if different color)
                this.drawings.orderedShapes =
                    this.drawings.orderedShapes.filter(
                        (shape) =>
                            !(
                                shape.type === "arrow" &&
                                shape.from === fromSquare &&
                                shape.to === toSquare
                            ),
                    );
                // Add to ordered shapes
                this.drawings.orderedShapes.push({
                    type: "arrow",
                    from: fromSquare,
                    to: toSquare,
                    color: currentColor,
                });
            }
        }

        clearAllDrawings() {
            this.drawings.circles.clear();
            this.drawings.arrows.clear();
            this.drawings.orderedShapes = [];
            this.updateDrawingDisplay();
        }

        updateDrawingPreview() {
            // Clear existing preview
            this.clearDrawingPreview();

            if (!this.drawingState.isDrawing) return;

            const startSquare = this.drawingState.startSquare;
            const currentSquare = this.drawingState.currentSquare;

            if (startSquare === currentSquare) {
                // Show circle preview
                this.showCirclePreview(startSquare);
            } else {
                // Show arrow preview
                this.showArrowPreview(startSquare, currentSquare);
            }
        }

        showCirclePreview(squareId) {
            // Redraw canvas with preview circle
            this.drawCanvas(true, squareId, squareId);
        }

        showArrowPreview(fromSquare, toSquare) {
            // Redraw canvas with preview arrow
            this.drawCanvas(true, fromSquare, toSquare);
        }

        clearDrawingPreview() {
            // Redraw canvas without preview
            this.drawCanvas(false);
        }

        updateDrawingDisplay() {
            // Clear any legacy CSS circle styles (for backward compatibility)
            this.container
                .querySelectorAll(".drawing-circle")
                .forEach((element) => {
                    element.classList.remove("drawing-circle");
                    element.style.removeProperty("--circle-color");
                });

            // Redraw canvas with all shapes (circles and arrows) in order
            this.drawCanvas(false);
        }

        redrawAllDrawings() {
            // Clear any legacy CSS circle styles (for backward compatibility)
            this.container
                .querySelectorAll(".drawing-circle")
                .forEach((element) => {
                    element.classList.remove("drawing-circle");
                    element.style.removeProperty("--circle-color");
                });

            // Redraw canvas with all shapes (circles and arrows) in order
            this.drawCanvas(false);
        }

        drawCanvas(showPreview = false, previewFrom = null, previewTo = null) {
            const canvas = this.container.querySelector(".drawing-canvas");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            const rect = canvas.getBoundingClientRect();

            // Set canvas size to match actual display size with device pixel ratio
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.setProperty("width", rect.width + "px", "important");
            canvas.style.setProperty("height", rect.height + "px", "important");

            // Scale context for high DPI displays
            ctx.scale(dpr, dpr);

            // Clear canvas
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Draw all shapes in order (circles and arrows interleaved)
            for (const shape of this.drawings.orderedShapes) {
                if (shape.type === "circle") {
                    this.drawCircleOnCanvas(
                        ctx,
                        shape.squareId,
                        shape.color || "#00af0e",
                        false,
                    );
                } else if (shape.type === "arrow") {
                    this.drawArrowOnCanvas(
                        ctx,
                        shape.from,
                        shape.to,
                        shape.color || "#00af0e",
                        false,
                    );
                }
            }

            // Draw preview (circle or arrow) if needed
            if (showPreview && previewFrom) {
                const previewColor = this.getCurrentDrawingColor();
                if (previewFrom === previewTo) {
                    // Preview circle
                    this.drawCircleOnCanvas(
                        ctx,
                        previewFrom,
                        previewColor,
                        true,
                    );
                } else if (previewTo) {
                    // Preview arrow
                    this.drawArrowOnCanvas(
                        ctx,
                        previewFrom,
                        previewTo,
                        previewColor,
                        true,
                    );
                }
            }
        }

        drawArrowOnCanvas(ctx, fromSquare, toSquare, color, isPreview) {
            const fromCoords = this.getCanvasCoordinates(fromSquare);
            const toCoords = this.getCanvasCoordinates(toSquare);

            if (!fromCoords || !toCoords) return;

            // Set style
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 3;
            if (isPreview) {
                ctx.globalAlpha = 0.6;
            } else {
                ctx.globalAlpha = 1.0;
            }

            // Draw line
            ctx.beginPath();
            ctx.moveTo(fromCoords.x, fromCoords.y);
            ctx.lineTo(toCoords.x, toCoords.y);
            ctx.stroke();

            // Draw arrowhead
            this.drawArrowhead(ctx, fromCoords, toCoords);

            // Reset alpha
            ctx.globalAlpha = 1.0;
        }

        drawArrowhead(ctx, from, to) {
            const headlen = 15; // Length of arrowhead
            const angle = Math.atan2(to.y - from.y, to.x - from.x);

            ctx.beginPath();
            ctx.moveTo(to.x, to.y);
            ctx.lineTo(
                to.x - headlen * Math.cos(angle - Math.PI / 8),
                to.y - headlen * Math.sin(angle - Math.PI / 8),
            );
            ctx.moveTo(to.x, to.y);
            ctx.lineTo(
                to.x - headlen * Math.cos(angle + Math.PI / 8),
                to.y - headlen * Math.sin(angle + Math.PI / 8),
            );
            ctx.stroke();
        }

        drawCircleOnCanvas(ctx, squareId, color, isPreview) {
            const coords = this.getCanvasCoordinates(squareId);
            if (!coords) return;

            // Get square element to determine circle size
            const square = this.container.querySelector(
                `[data-square="${squareId}"]`,
            );
            if (!square) return;

            const squareRect = square.getBoundingClientRect();
            // Match CSS sizing: circle inset by 10% on all sides = 80% of square
            // Account for 3px stroke: canvas stroke is centered on path, so subtract half stroke width
            const diameter = squareRect.width * 0.8;
            const radius = diameter / 2 - 1.5; // Subtract half of 3px stroke width

            // Set style
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            if (isPreview) {
                ctx.globalAlpha = 0.6;
            } else {
                ctx.globalAlpha = 1.0;
            }

            // Draw circle
            ctx.beginPath();
            ctx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
            ctx.stroke();

            // Reset alpha
            ctx.globalAlpha = 1.0;
        }

        getCanvasCoordinates(squareId) {
            const square = this.container.querySelector(
                `[data-square="${squareId}"]`,
            );
            if (!square) return null;

            const canvas = this.container.querySelector(".drawing-canvas");
            if (!canvas) return null;

            const squareRect = square.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();

            // Get center of square relative to canvas (without DPI scaling as that's handled in drawCanvas)
            return {
                x: squareRect.left + squareRect.width / 2 - canvasRect.left,
                y: squareRect.top + squareRect.height / 2 - canvasRect.top,
            };
        }

        selectSquare(squareId) {
            // Clear any edit mode piece selection when selecting on board
            this.clearEditSelection();

            const validMoves = this.moveValidator.calculateValidMoves(squareId);

            // Debug logging removed - counter-strike issue resolved

            // Use centralized state management
            this.gameStateManager.updateGameState({
                selectedSquare: squareId,
                validMoves: validMoves,
            });

            // Update drawing display after highlighting changes
            this.updateDrawingDisplay();
        }

        clearSelection() {
            // Store if promotion prompt was active to determine if board update is needed
            const wasPromotionActive = this.promotionPromptActive;

            // Use centralized state management for all selection-related state
            this.gameStateManager.updateGameState({
                selectedSquare: null,
                validMoves: [],
                // Clear all prompt states through centralized management
                lionReturnPromptActive: false,
                lionReturnAlternateSquare: null,
                promotionPromptActive: false,
                promotionDestinationSquare: null,
                promotionDeferralSquare: null,
                promotionAlternateSquare: null,
                promotionMove: null,
                // Clear double move state
                doubleMoveMidpoint: null,
                doubleMoveOrigin: null,
                doubleMoveDestinations: [],
                lionFirstMoves: [],
            });

            // Also directly clear double move state to ensure it's properly reset
            this.doubleMoveMidpoint = null;
            this.doubleMoveOrigin = null;
            this.doubleMoveDestinations = [];
            this.doubleMoveRepeatToOrigin = false;

            // Clear repeat promotion and illegal move tracking
            this.repeatPromotionMoves = [];
            this.illegalMoves = [];

            console.log("clearSelection: Cleared double move state");

            // Invalidate influence cache when selection changes
            this.influenceManager.invalidate();

            // Update board display if promotion prompt was active to clear visual kanji
            if (wasPromotionActive) {
                this.updateBoard();
            }

            // Update drawing display after highlighting changes
            this.updateDrawingDisplay();
            this.updatePieceInfoPanel();
        }

        updateSquareHighlights() {
            // Reduce logging during batch import
            if (!this.isBatchImporting) {
                showDebugMessage(
                    "updateSquareHighlights: Starting, showInfluenceDisplay = " +
                        this.config.showInfluenceDisplay,
                );
            }
            // Use centralized HighlightManager
            this.highlightManager.updateAll();
            if (!this.isBatchImporting) {
                showDebugMessage("updateSquareHighlights: Completed");
            }
        }

        // Double move functions removed

        // Legacy wrapper for backward compatibility
        // Legacy function - use moveValidator.calculateValidMoves directly
        calculateValidMoves(squareId) {
            return this.moveValidator.calculateValidMoves(squareId);
        }

        // Get all pieces that can move for the current player (with caching)
        getMoveablePieces() {
            // Create cache key based on the currently displayed position.
            // Using the displayed node's id (not moveHistory.length) so that navigation
            // and variation play — both of which leave moveHistory.length unchanged —
            // correctly bust the cache and recompute for the new board state.
            const _displayedNode = this.currentNode ?? this.getLiveNode();
            const _displayedId = _displayedNode?.id ?? "root";
            const cacheKey = `${this.currentPlayer}_${_displayedId}_${this.config.allowIllegalMoves}`;

            // Return cached result if available
            if (
                this.moveablePiecesCache &&
                this.moveablePiecesCache.key === cacheKey
            ) {
                return this.moveablePiecesCache.pieces;
            }

            const moveablePieces = new Set();

            // Loop through all squares on the board
            for (let rank = 0; rank < 12; rank++) {
                for (let file = 0; file < 12; file++) {
                    const squareId = this.getSquareId(rank, file);
                    const piece = utils.board.getPieceAt(this.board, squareId);

                    if (piece) {
                        // When allowIllegalMoves is true, highlight ALL pieces from both sides
                        // since turn order is ignored
                        if (this.config.allowIllegalMoves) {
                            moveablePieces.add(squareId);
                        } else if (piece.color === this.currentPlayer) {
                            // Normal mode: only highlight current player's pieces with legal moves
                            const validMoves =
                                this.moveValidator.calculateValidMoves(
                                    squareId,
                                );

                            // If piece has at least one legal move, it's moveable
                            if (validMoves && validMoves.length > 0) {
                                moveablePieces.add(squareId);
                            }
                        }
                    }
                }
            }

            // Cache the result
            this.moveablePiecesCache = {
                key: cacheKey,
                pieces: moveablePieces,
            };

            return moveablePieces;
        }

        // Calculate all squares attacked by a given piece (for influence display)
        calculatePieceInfluence(squareId, piece, options = {}) {
            const { excludeSquares = new Set() } = options;
            const attackedSquares = [];
            const [rank, file] = this.parseSquareId(squareId);

            // For promoted pieces, use the current type (which is already the promoted form)
            // Pieces like Phoenix (X) promote to Queen (Q), not "+Q"
            // Pieces like Pawn (P) promote to enhanced form (+P)
            let pieceTypeForMovement = piece.type;

            // Debug logging can be enabled if needed
            // console.log("calculatePieceInfluence:", {
            //   squareId,
            //   currentType: piece.type,
            //   originalType: piece.originalType,
            //   promoted: piece.promoted,
            //   finalType: pieceTypeForMovement,
            //   excludeSquares: Array.from(excludeSquares)
            // });

            const directions = this.getPieceDirections(
                pieceTypeForMovement,
                piece.color,
            );

            // Enhanced influence calculation with exclusion support for sliding pieces
            directions.forEach((direction) => {
                for (let distance = 1; distance < 12; distance++) {
                    const newRank = rank + direction.rank * distance;
                    const newFile = file + direction.file * distance;

                    if (
                        newRank < 0 ||
                        newRank >= 12 ||
                        newFile < 0 ||
                        newFile >= 12
                    )
                        break;

                    const targetSquare = this.getSquareId(newRank, newFile);
                    attackedSquares.push(targetSquare);

                    // Check for piece obstruction, treating excluded squares as empty
                    const targetPiece = utils.board.getPieceAt(
                        this.board,
                        targetSquare,
                    );
                    if (targetPiece && !excludeSquares.has(targetSquare)) {
                        // Stop after hitting a non-excluded piece (influence still applies to that square)
                        break;
                    }

                    // For single-step pieces, break after first move
                    if (!direction.sliding) break;
                }
            });

            return attackedSquares;
        }

        // Calculate influence map for the entire board with optional exclusions
        calculateBoardInfluence(options = {}) {
            const {
                excludeSquares = new Set(), // Squares to treat as empty (for sliding through selections)
                excludePieces = new Set(), // Specific pieces to ignore completely
            } = options;

            const influence = {
                white: new Set(),
                black: new Set(),
            };

            // Calculate influence for all pieces on the board
            for (let rank = 0; rank < 12; rank++) {
                for (let file = 0; file < 12; file++) {
                    const squareId = this.getSquareId(rank, file);
                    const piece = utils.board.getPieceAt(this.board, squareId);

                    // Skip pieces at excluded squares AND pieces specified in excludePieces
                    if (
                        piece &&
                        !excludePieces.has(squareId) &&
                        !excludeSquares.has(squareId)
                    ) {
                        const attackedSquares = this.calculatePieceInfluence(
                            squareId,
                            piece,
                            { excludeSquares },
                        );
                        const color = piece.color === "w" ? "white" : "black";

                        attackedSquares.forEach((targetSquare) => {
                            influence[color].add(targetSquare);
                        });
                    }
                }
            }

            return influence;
        }

        // CENTRALIZED INFLUENCE MANAGER
        // Always maintains current influence state for protection detection
        influenceManager = {
            // Cached influence state (always up-to-date)
            currentInfluence: null,
            lastCalculatedState: null,

            // Calculate and cache influence with current game state
            updateInfluence: () => {
                const excludeSquares = new Set();

                // Note: No exclusions for influence display - all pieces should show their influence
                // This provides a complete view of piece attack patterns regardless of selection state

                // Calculate with exclusions for sliding piece accuracy
                this.influenceManager.currentInfluence =
                    this.calculateBoardInfluence({
                        excludeSquares,
                    });

                this.influenceManager.lastCalculatedState = {
                    boardHash: this.getBoardHash(),
                };
            },

            // Get current influence (calculate if needed)
            getInfluence: () => {
                if (
                    !this.influenceManager.currentInfluence ||
                    this.influenceManager.needsUpdate()
                ) {
                    this.influenceManager.updateInfluence();
                }
                return this.influenceManager.currentInfluence;
            },

            // Check if influence needs recalculation
            needsUpdate: () => {
                if (!this.influenceManager.lastCalculatedState) return true;

                const state = this.influenceManager.lastCalculatedState;
                return state.boardHash !== this.getBoardHash();
            },

            // Check if a square is protected by a given color
            isSquareProtected: (squareId, color) => {
                const influence = this.influenceManager.getInfluence();
                const colorKey = color === "w" ? "white" : "black";
                return influence[colorKey].has(squareId);
            },

            // Get all squares protected by a color
            getProtectedSquares: (color) => {
                const influence = this.influenceManager.getInfluence();
                const colorKey = color === "w" ? "white" : "black";
                return Array.from(influence[colorKey]);
            },

            // Check if a piece is protected (has friendly protection)
            isPieceProtected: (squareId) => {
                const piece = this.getPieceAt(squareId);
                if (!piece) return false;

                return this.influenceManager.isSquareProtected(
                    squareId,
                    piece.color,
                );
            },

            // Advanced protection analysis for Lion trading rules
            getProtectionAnalysis: (squareId) => {
                const piece = this.getPieceAt(squareId);
                if (!piece) return null;

                const influence = this.influenceManager.getInfluence();
                const enemyColor = piece.color === "w" ? "black" : "white";
                const friendlyColor = piece.color === "w" ? "white" : "black";

                return {
                    squareId,
                    piece: { ...piece },
                    isProtected: influence[friendlyColor].has(squareId),
                    isAttacked: influence[enemyColor].has(squareId),
                    isConflicted:
                        influence[friendlyColor].has(squareId) &&
                        influence[enemyColor].has(squareId),
                    protectionStatus: this.influenceManager.isPieceProtected(
                        squareId,
                    )
                        ? "protected"
                        : "unprotected",
                };
            },

            // Test if a target square is protected by a specific side with X-ray capability
            // Used for Bridge-capture rule: prevents Lions from capturing non-adjacent protected Lions
            isSquareProtectedWithXRay: (
                targetSquareId,
                protectingSide,
                originSquareId = null,
                midpointSquareId = null,
            ) => {
                // Build exclusion set for X-ray protection calculation
                const excludeSquares = new Set();
                if (originSquareId) excludeSquares.add(originSquareId);
                if (midpointSquareId) excludeSquares.add(midpointSquareId);

                // Calculate influence with excluded squares for X-ray effect
                const influence = this.calculateBoardInfluence({
                    excludeSquares,
                });
                const colorKey = protectingSide === "w" ? "white" : "black";

                return influence[colorKey].has(targetSquareId);
            },

            // Reset influence cache (called after moves)
            invalidate: () => {
                this.influenceManager.currentInfluence = null;
                this.influenceManager.lastCalculatedState = null;
                console.log("InfluenceManager: Cache invalidated");
            },
        };

        // Generate a simple hash of the board state for change detection
        getBoardHash() {
            let hash = "";
            for (let rank = 0; rank < 12; rank++) {
                for (let file = 0; file < 12; file++) {
                    const piece = this.board[rank][file];
                    hash += piece
                        ? `${piece.type}${piece.color}${piece.promoted ? "+" : ""}`
                        : "0";
                }
            }
            return hash;
        }

        // Get influence class for a square based on control
        getInfluenceClass(squareId, influence) {
            const whiteControls = influence.white.has(squareId);
            const blackControls = influence.black.has(squareId);

            if (whiteControls && blackControls) {
                return "influence-contested"; // Light grey - both sides control
            } else if (whiteControls) {
                return "influence-white"; // Near white - white controls
            } else if (blackControls) {
                return "influence-black"; // Dark grey - black controls
            }

            return ""; // No influence
        }

        // Lion-trading rule methods removed - will be re-implemented soon

        // Enhanced safety check for double moves that accounts for midpoint captures
        // Legacy wrapper for backward compatibility
        // isLionSafeFromRecaptureInDoubleMove function removed

        // Legacy function - replaced by direct highlightManager.clearAll calls
        clearSquareHighlights() {
            this.highlightManager.clearAll();
        }

        // Legacy function - use highlightManager.clearAll() directly
        clearHighlights() {
            this.highlightManager.clearAll();
        }

        getPieceDirections(pieceType, pieceColor) {
            const piece =
                PIECE_DEFINITIONS[pieceType.toUpperCase()] ||
                PIECE_DEFINITIONS[pieceType];
            if (!piece) return [];

            const directions = this.parseMoveDefinition(piece.movement);

            // Flip directions for white pieces (they face opposite direction)
            if (pieceColor === "w") {
                return directions.map((dir) => ({
                    rank: -dir.rank,
                    file: dir.file,
                    sliding: dir.sliding,
                }));
            }

            return directions;
        }

        parseMoveDefinition(type) {
            const directions = [];

            // Handle specific piece movements based on Wikipedia definitions
            // Positive integers go right or down, negative ones go left or up
            switch (type) {
                case "K": // King - one step in any direction
                    return [
                        { rank: -1, file: -1, sliding: false },
                        { rank: -1, file: 0, sliding: false },
                        { rank: -1, file: 1, sliding: false },
                        { rank: 0, file: -1, sliding: false },
                        { rank: 0, file: 1, sliding: false },
                        { rank: 1, file: -1, sliding: false },
                        { rank: 1, file: 0, sliding: false },
                        { rank: 1, file: 1, sliding: false },
                    ];

                case "Q": // Queen - slide in any direction
                    return [
                        { rank: -1, file: -1, sliding: true },
                        { rank: -1, file: 0, sliding: true },
                        { rank: -1, file: 1, sliding: true },
                        { rank: 0, file: -1, sliding: true },
                        { rank: 0, file: 1, sliding: true },
                        { rank: 1, file: -1, sliding: true },
                        { rank: 1, file: 0, sliding: true },
                        { rank: 1, file: 1, sliding: true },
                    ];

                case "R": // Rook - slide orthogonally
                    return [
                        { rank: -1, file: 0, sliding: true },
                        { rank: 1, file: 0, sliding: true },
                        { rank: 0, file: -1, sliding: true },
                        { rank: 0, file: 1, sliding: true },
                    ];

                case "B": // Bishop - slide diagonally
                    return [
                        { rank: -1, file: -1, sliding: true },
                        { rank: -1, file: 1, sliding: true },
                        { rank: 1, file: -1, sliding: true },
                        { rank: 1, file: 1, sliding: true },
                    ];

                case "P": // Pawn - one step forward
                    return [{ rank: -1, file: 0, sliding: false }];

                case "L": // Lance - slide forward
                    return [{ rank: -1, file: 0, sliding: true }];

                case "G": // Gold General - King move but not backward diagonals
                    return [
                        { rank: -1, file: -1, sliding: false },
                        { rank: -1, file: 0, sliding: false },
                        { rank: -1, file: 1, sliding: false },
                        { rank: 0, file: -1, sliding: false },
                        { rank: 0, file: 1, sliding: false },
                        { rank: 1, file: 0, sliding: false },
                    ];

                case "S": // Silver General - forward King move + backward Ferz
                    return [
                        { rank: -1, file: -1, sliding: false },
                        { rank: -1, file: 0, sliding: false },
                        { rank: -1, file: 1, sliding: false },
                        { rank: 1, file: -1, sliding: false },
                        { rank: 1, file: 1, sliding: false },
                    ];

                case "C": // Copper General - forward King move + backward Wazir
                    return [
                        { rank: -1, file: -1, sliding: false },
                        { rank: -1, file: 0, sliding: false },
                        { rank: -1, file: 1, sliding: false },
                        { rank: 1, file: 0, sliding: false },
                    ];

                case "V": // Vertical Mover - sideways Wazir + slide forward/backward
                    return [
                        { rank: -1, file: 0, sliding: true },
                        { rank: 1, file: 0, sliding: true },
                        { rank: 0, file: -1, sliding: false },
                        { rank: 0, file: 1, sliding: false },
                    ];

                case "M": // Side Mover - vertical Wazir + slide left/right
                    return [
                        { rank: -1, file: 0, sliding: false },
                        { rank: 1, file: 0, sliding: false },
                        { rank: 0, file: -1, sliding: true },
                        { rank: 0, file: 1, sliding: true },
                    ];

                case "A": // Reverse Chariot - slide forward and backward
                    return [
                        { rank: -1, file: 0, sliding: true },
                        { rank: 1, file: 0, sliding: true },
                    ];

                case "I": // Go-Between - vertical Wazir
                    return [
                        { rank: -1, file: 0, sliding: false },
                        { rank: 1, file: 0, sliding: false },
                    ];

                case "D": // Dragon King - Rook + Ferz
                    return [
                        { rank: -1, file: 0, sliding: true },
                        { rank: 1, file: 0, sliding: true },
                        { rank: 0, file: -1, sliding: true },
                        { rank: 0, file: 1, sliding: true },
                        { rank: -1, file: -1, sliding: false },
                        { rank: -1, file: 1, sliding: false },
                        { rank: 1, file: -1, sliding: false },
                        { rank: 1, file: 1, sliding: false },
                    ];

                case "H": // Dragon Horse - Bishop + Wazir
                    return [
                        { rank: -1, file: -1, sliding: true },
                        { rank: -1, file: 1, sliding: true },
                        { rank: 1, file: -1, sliding: true },
                        { rank: 1, file: 1, sliding: true },
                        { rank: -1, file: 0, sliding: false },
                        { rank: 1, file: 0, sliding: false },
                        { rank: 0, file: -1, sliding: false },
                        { rank: 0, file: 1, sliding: false },
                    ];

                case "O": // Kirin - ferz + dabbaba
                    return [
                        { rank: -1, file: -1, sliding: false },
                        { rank: -1, file: 1, sliding: false },
                        { rank: 1, file: -1, sliding: false },
                        { rank: 1, file: 1, sliding: false },
                        { rank: -2, file: 0, sliding: false },
                        { rank: 2, file: 0, sliding: false },
                        { rank: 0, file: -2, sliding: false },
                        { rank: 0, file: 2, sliding: false },
                    ];

                case "X": // Phoenix - wazir + alfil
                    return [
                        { rank: -1, file: 0, sliding: false },
                        { rank: 1, file: 0, sliding: false },
                        { rank: 0, file: -1, sliding: false },
                        { rank: 0, file: 1, sliding: false },
                        { rank: -2, file: -2, sliding: false },
                        { rank: -2, file: 2, sliding: false },
                        { rank: 2, file: -2, sliding: false },
                        { rank: 2, file: 2, sliding: false },
                    ];

                case "E": // Drunk Elephant - ferz + forward/right/left wazir
                    return [
                        { rank: -1, file: -1, sliding: false },
                        { rank: -1, file: 1, sliding: false },
                        { rank: 1, file: -1, sliding: false },
                        { rank: 1, file: 1, sliding: false },
                        { rank: -1, file: 0, sliding: false },
                        { rank: 0, file: -1, sliding: false },
                        { rank: 0, file: 1, sliding: false },
                    ];

                case "T": // Blind Tiger - ferz + right/left/backward wazir
                    return [
                        { rank: -1, file: -1, sliding: false },
                        { rank: -1, file: 1, sliding: false },
                        { rank: 1, file: -1, sliding: false },
                        { rank: 1, file: 1, sliding: false },
                        { rank: 0, file: -1, sliding: false },
                        { rank: 0, file: 1, sliding: false },
                        { rank: 1, file: 0, sliding: false },
                    ];

                case "F": // Ferocious Leopard - ferz + forward/backward wazir
                    return [
                        { rank: -1, file: -1, sliding: false },
                        { rank: -1, file: 1, sliding: false },
                        { rank: 1, file: -1, sliding: false },
                        { rank: 1, file: 1, sliding: false },
                        { rank: -1, file: 0, sliding: false },
                        { rank: 1, file: 0, sliding: false },
                    ];

                case "N": // Lion - Knight + Alfil + Dabbaba + King + double King step (complex move implemented elsewhere)
                    return [
                        // Knight moves
                        { rank: -2, file: -1, sliding: false },
                        { rank: -2, file: 1, sliding: false },
                        { rank: -1, file: -2, sliding: false },
                        { rank: -1, file: 2, sliding: false },
                        { rank: 1, file: -2, sliding: false },
                        { rank: 1, file: 2, sliding: false },
                        { rank: 2, file: -1, sliding: false },
                        { rank: 2, file: 1, sliding: false },
                        // Alfil moves
                        { rank: -2, file: -2, sliding: false },
                        { rank: -2, file: 2, sliding: false },
                        { rank: 2, file: -2, sliding: false },
                        { rank: 2, file: 2, sliding: false },
                        // Dabbaba moves
                        { rank: -2, file: 0, sliding: false },
                        { rank: 2, file: 0, sliding: false },
                        { rank: 0, file: -2, sliding: false },
                        { rank: 0, file: 2, sliding: false },
                        // King moves
                        { rank: -1, file: -1, sliding: false },
                        { rank: -1, file: 0, sliding: false },
                        { rank: -1, file: 1, sliding: false },
                        { rank: 0, file: -1, sliding: false },
                        { rank: 0, file: 1, sliding: false },
                        { rank: 1, file: -1, sliding: false },
                        { rank: 1, file: 0, sliding: false },
                        { rank: 1, file: 1, sliding: false },
                    ];

                // Promoted pieces
                case "+T": // Flying Stag
                    return [
                        { rank: -1, file: 0, sliding: true },
                        { rank: 1, file: 0, sliding: true },
                        { rank: -1, file: -1, sliding: false },
                        { rank: -1, file: 0, sliding: false },
                        { rank: -1, file: 1, sliding: false },
                        { rank: 0, file: -1, sliding: false },
                        { rank: 0, file: 1, sliding: false },
                        { rank: 1, file: -1, sliding: false },
                        { rank: 1, file: 0, sliding: false },
                        { rank: 1, file: 1, sliding: false },
                    ];

                case "+M": // Free Boar
                    return [
                        { rank: -1, file: -1, sliding: true },
                        { rank: -1, file: 1, sliding: true },
                        { rank: 1, file: -1, sliding: true },
                        { rank: 1, file: 1, sliding: true },
                        { rank: 0, file: -1, sliding: true },
                        { rank: 0, file: 1, sliding: true },
                    ];

                case "+V": // Flying Ox
                    return [
                        { rank: -1, file: -1, sliding: true },
                        { rank: -1, file: 1, sliding: true },
                        { rank: 1, file: -1, sliding: true },
                        { rank: 1, file: 1, sliding: true },
                        { rank: -1, file: 0, sliding: true },
                        { rank: 1, file: 0, sliding: true },
                    ];

                case "+A": // Whale
                    return [
                        { rank: -1, file: 0, sliding: true },
                        { rank: 1, file: -1, sliding: true },
                        { rank: 1, file: 0, sliding: true },
                        { rank: 1, file: 1, sliding: true },
                    ];

                case "+L": // White Horse
                    return [
                        { rank: -1, file: -1, sliding: true },
                        { rank: -1, file: 0, sliding: true },
                        { rank: -1, file: 1, sliding: true },
                        { rank: 1, file: 0, sliding: true },
                    ];

                case "+H": // Horned Falcon
                    return [
                        { rank: -1, file: -1, sliding: true },
                        { rank: -1, file: 1, sliding: true },
                        { rank: 1, file: -1, sliding: true },
                        { rank: 1, file: 1, sliding: true },
                        { rank: 0, file: -1, sliding: true },
                        { rank: 0, file: 1, sliding: true },
                        { rank: 1, file: 0, sliding: true },
                        { rank: -1, file: 0, sliding: false },
                        { rank: -2, file: 0, sliding: false },
                    ];

                case "+D": // Soaring Eagle
                    return [
                        { rank: 1, file: -1, sliding: true },
                        { rank: 1, file: 1, sliding: true },
                        { rank: 0, file: -1, sliding: true },
                        { rank: 0, file: 1, sliding: true },
                        { rank: -1, file: 0, sliding: true },
                        { rank: 1, file: 0, sliding: true },
                        { rank: -1, file: -1, sliding: false },
                        { rank: -2, file: -2, sliding: false },
                        { rank: -1, file: 1, sliding: false },
                        { rank: -2, file: 2, sliding: false },
                    ];

                default:
                    // Fallback to king move for unknown pieces
                    return [
                        { rank: -1, file: -1, sliding: false },
                        { rank: -1, file: 0, sliding: false },
                        { rank: -1, file: 1, sliding: false },
                        { rank: 0, file: -1, sliding: false },
                        { rank: 0, file: 1, sliding: false },
                        { rank: 1, file: -1, sliding: false },
                        { rank: 1, file: 0, sliding: false },
                        { rank: 1, file: 1, sliding: false },
                    ];
            }
        }

        // DEPRECATED: Legacy executeMove function - use moveExecutor.executeMove() directly
        // This function contains direct board manipulation and should be phased out
        executeMove(fromSquare, toSquare, promote = false) {
            const [fromRank, fromFile] = this.parseSquareId(fromSquare);
            const [toRank, toFile] = this.parseSquareId(toSquare);

            const movingPiece = utils.board.getPieceAt(this.board, fromSquare);
            const capturedPiece = utils.board.getPieceAt(this.board, toSquare);

            // Update Lion capture field based on this move
            if (
                capturedPiece &&
                (capturedPiece.type === "N" || capturedPiece.type === "+O")
            ) {
                // Lion was captured - only set field if capturing piece is not a Lion
                // Important: Check ORIGINAL piece type before promotion (promote happens later)
                if (movingPiece.type !== "N" && movingPiece.type !== "+O") {
                    this.lastLionCapture = toSquare;
                    console.log(
                        `Counter-strike activated: ${movingPiece.type} captured Lion at ${toSquare}`,
                    );
                } else {
                    // Lion captures Lion - clear the field
                    this.lastLionCapture = null;
                    console.log(
                        `Lion captured Lion at ${toSquare} - Counter-strike cleared`,
                    );
                }
            } else {
                // No Lion was captured - clear the field (includes no capture and non-Lion capture)
                this.lastLionCapture = null;
            }

            // If this exact move already exists as a child of the parent node,
            // navigate to that existing node instead of creating a duplicate variation.
            if (!this.isImporting && !this.isBatchImporting) {
                const _earlyParentNode = this.currentNode ?? this.getLiveNode();
                const _duplicateChild = _earlyParentNode.children.find(child =>
                    child.from === fromSquare &&
                    child.to === toSquare &&
                    !!child.promoted === !!promote &&
                    child.piece?.type === movingPiece?.type
                );
                if (_duplicateChild) {
                    // If the duplicate is on the main line, use navigateToPosition so
                    // currentNavigationIndex advances correctly and back/forward remain sane.
                    // For off-branch nodes navigateToNode is fine (it intentionally leaves
                    // currentNavigationIndex pointing at the main-line anchor).
                    const _dupMainIdx = this.moveHistory.indexOf(_duplicateChild);
                    if (_dupMainIdx !== -1) {
                        this.navigateToPosition(_dupMainIdx);
                    } else {
                        this.navigateToNode(_duplicateChild);
                    }
                    return _duplicateChild;
                }
            }

            // Move piece
            utils.board.setPieceAt(this.board, toSquare, { ...movingPiece });
            utils.board.setPieceAt(this.board, fromSquare, null);

            // Handle promotion or reverse promotion
            if (promote) {
                if (this.config.allowIllegalMoves && movingPiece.promoted) {
                    // Reverse promotion - unpromote the piece
                    const originalType = this.getOriginalType(movingPiece.type);
                    if (originalType) {
                        const unpromoted = utils.board.getPieceAt(
                            this.board,
                            toSquare,
                        );
                        if (unpromoted) {
                            unpromoted.type = originalType;
                            unpromoted.promoted = false;
                            delete unpromoted.originalType;
                        }
                    }
                } else {
                    // Normal promotion
                    const promoted = utils.board.getPieceAt(
                        this.board,
                        toSquare,
                    );
                    if (promoted) {
                        promoted.type = "+" + movingPiece.type;
                        promoted.promoted = true;
                        promoted.originalType = movingPiece.type;
                    }
                }
            }

            // Record move with validation
            if (!fromSquare || !toSquare || !movingPiece) {
                console.error(
                    "Attempted to record invalid move:",
                    fromSquare,
                    toSquare,
                    movingPiece,
                );
                return;
            }

            const moveNotation = this.generateMoveNotation(
                fromSquare,
                toSquare,
                movingPiece,
                capturedPiece,
                promote,
            );
            // Determine parent node before building the record (needed for previousLionCapture).
            // currentNode is null when at the live leaf (normal play), or a tree node when
            // navigating — in which case we extend (leaf) or create a variation (non-leaf).
            const _parentNode = this.currentNode ?? this.getLiveNode();
            // Capture whether the parent is a leaf BEFORE the new node is prepended.
            // If it already has children, the new move is an alternative (isBranch).
            const _parentWasLeaf = _parentNode.children.length === 0;
            const _newNode = this.makeMoveNode({
                from: fromSquare,
                to: toSquare,
                piece: { ...movingPiece }, // Store original piece state for undo
                captured: capturedPiece,
                promoted: promote,
                notation: moveNotation,
                lionCapture: this.lastLionCapture, // Store Lion capture state with each move
                previousLionCapture:
                    _parentNode !== this.moveTree
                        ? _parentNode.lionCapture
                        : this.lastLionCapture, // Preserve previous state for proper tracking
                resultingSFEN: "", // Will be set after player update
                comment: "", // Comment for this move
            }, _parentNode);
            // Prepend so this move becomes the preferred (first) continuation of its parent.
            _parentNode.children.unshift(_newNode);
            if (this.currentNode !== null) {
                // Never rebuild moveHistory — the original main line must stay.
                // Tag isBranch only when the parent is ON the main line (i.e. the
                // new move is the first step of a new variation).  If the parent is
                // already inside a variation, the new move is a plain continuation
                // of that variation and should not be flagged as a branch root.
                if (this.moveHistory.includes(_parentNode)) {
                    _newNode.isBranch = true;
                }
            } else {
                this.moveHistory.push(_newNode);
            }
            this.lastMove = _newNode;

            // Update current player based on last move
            // allowIllegalMoves should only affect move validation, not turn order
            this.updateCurrentPlayer();

            // Store SFEN with the correct next player.  Always derive from the piece
            // that just moved — exportSFEN() reads isNavigating + currentNavigationIndex
            // which are stale during a variation play and return the wrong player.
            if (this.lastMove.piece) {
                this.lastMove.resultingSFEN = this.exportSFENWithPlayer(
                    this.lastMove.piece.color === "b" ? "w" : "b",
                );
            } else {
                this.lastMove.resultingSFEN = this.exportSFEN();
            }

            // Clear all drawings when position changes
            this.drawings.arrows.clear();
            this.drawings.circles.clear();

            // Clear selection after normal move
            this.clearSelection();

            // After any variation play, stay pinned at the new leaf so the user
            // sees the new move and can continue extending it.
            this.currentNavigationIndex = null;
            if (this.currentNode !== null) {
                this._viewedNode = _newNode;
                this.isNavigating = true;
                this.currentNode = _newNode;
            } else {
                this.isNavigating = false;
                this.currentNode = null; // null = at live leaf
            }

            // Update display
            this.updateBoard();
            this.updateDisplay();
            this.updateButtonStates();
        }

        // CENTRALIZED HIGHLIGHT MANAGER
        // Handles all board highlighting consistently across all game states
        // including selection, valid moves, last moves, promotion prompts, and Lion return prompts
        highlightManager = {
            // All possible highlight classes used throughout the game
            allHighlightClasses: [
                "selected",
                "valid-move",
                "last-move",
                "last-move-outline",
                "lion-first-move",
                "lion-double-origin",
                "lion-double-midpoint",
                "lion-king-move",
                "lion-return-choice",
                "promotion-choice",
                "promotion-source",
                "promotion-origin-highlight",
                "promotion-midpoint",
                "influence-white",
                "influence-black",
                "influence-contested",
                "counterstrike-highlight",
            ],

            // Clear all highlights from all squares
            clearAll: () => {
                // CENTRALIZED: Use utils.dom for DOM operations
                // Clear board squares but preserve piece selector highlighting
                const boardSquares = utils.dom.querySelectorAll(
                    this.container,
                    "[data-square]",
                );
                boardSquares.forEach((square) => {
                    utils.dom.removeClass(
                        square,
                        ...this.highlightManager.allHighlightClasses,
                    );
                });

                // Clear only non-selected highlights from piece selector squares
                const selectorSquares = utils.dom.querySelectorAll(
                    this.container,
                    ".chushogi-selector-square",
                );
                const selectorHighlightClasses =
                    this.highlightManager.allHighlightClasses.filter(
                        (cls) => cls !== "selected",
                    );
                selectorSquares.forEach((square) => {
                    utils.dom.removeClass(square, ...selectorHighlightClasses);
                });

                // Force DOM update
                this.container.offsetHeight;
            },

            // Apply highlights based on current game state
            updateAll: () => {
                // Reduce logging during batch import
                if (!this.isBatchImporting) {
                    showDebugMessage(
                        "highlightManager.updateAll: Starting, showInfluenceDisplay = " +
                            this.config.showInfluenceDisplay,
                    );
                }
                // Use intelligent square-by-square highlighting to prevent flash
                this.highlightManager.updateAllIntelligent();
                // Apply counter-strike highlights in edit mode
                this.highlightManager.applyCounterStrikeHighlights();
                if (!this.isBatchImporting) {
                    showDebugMessage("highlightManager.updateAll: Completed");
                }
            },

            // Intelligent highlighting that updates each square individually
            updateAllIntelligent: () => {
                const squares =
                    this.container.querySelectorAll(".chushogi-square");

                // Pre-calculate all highlight states using centralized influence manager
                const influenceMap = this.config.showInfluenceDisplay
                    ? this.influenceManager.getInfluence()
                    : null;
                const displayMove =
                    this.config.showLastMove && this.currentTab !== "edit"
                        ? this.getNavigationDisplayMove()
                        : null;
                const lastMoveClass = this.config.showInfluenceDisplay
                    ? "last-move-outline"
                    : "last-move";

                // Pre-calculate moveable pieces if setting is enabled.
                // Moves are always allowed (from any position they create a variation
                // or extend a leaf branch), so show highlights whenever the mode permits.
                const _isAtPlayableLeaf =
                    this.currentTab !== "edit";
                const moveablePieces =
                    this.config.showMoveablePieces &&
                    this.currentTab !== "edit" &&
                    _isAtPlayableLeaf
                        ? this.getMoveablePieces()
                        : null;

                squares.forEach((square) => {
                    const squareId = square.dataset.square;
                    const currentClasses = Array.from(square.classList);
                    const highlightClasses = [
                        "selected",
                        "valid-move",
                        "repeat-promotion-move",
                        "valid-illegal-move",
                        "last-move",
                        "last-move-outline",
                        "moveable-piece",
                        "moveable-piece-outline",
                        "moveable-last-moved",
                        "moveable-last-moved-outline",
                        "lion-first-move",
                        "lion-double-origin",
                        "lion-double-midpoint",
                        "lion-king-move",
                        "lion-return-choice",
                        "promotion-choice",
                        "promotion-source",
                        "promotion-origin-highlight",
                        "influence-black",
                        "influence-white",
                        "influence-contested",
                    ];

                    // Determine what highlights this square should have
                    const shouldHaveHighlights = [];

                    // Influence highlighting (lowest priority)
                    if (influenceMap) {
                        const influenceClass = this.getInfluenceClass(
                            squareId,
                            influenceMap,
                        );
                        if (influenceClass)
                            shouldHaveHighlights.push(influenceClass);
                    }

                    // Check if this square is a last move square
                    const isLastMoveSquare =
                        displayMove &&
                        (squareId === displayMove.from ||
                            squareId === displayMove.to ||
                            (displayMove.midpoint &&
                                squareId === displayMove.midpoint));

                    // Moveable piece highlighting (only when no piece is selected and no prompts active)
                    if (
                        moveablePieces &&
                        moveablePieces.has(squareId) &&
                        !this.selectedSquare &&
                        !this.doubleMoveMidpoint &&
                        !this.lionReturnPromptActive &&
                        !this.promotionPromptActive
                    ) {
                        // Determine if this square has influence highlighting
                        const hasInfluence = shouldHaveHighlights.some(
                            (cls) =>
                                cls === "influence-white" ||
                                cls === "influence-black" ||
                                cls === "influence-contested",
                        );

                        // Determine appropriate moveable highlight class based on context:
                        let moveableClass;

                        if (this.config.showInfluenceDisplay && hasInfluence) {
                            // Influence mode with influenced square
                            if (isLastMoveSquare) {
                                // Combined border: blue (top/left) + yellow (bottom/right)
                                moveableClass = "moveable-last-moved-outline";
                            } else {
                                // Yellow border outline
                                moveableClass = "moveable-piece-outline";
                            }
                        } else {
                            // Non-influence mode or plain square
                            moveableClass = "moveable-piece";

                            // In non-influence mode, add blue border for last-moved pieces
                            if (
                                isLastMoveSquare &&
                                !this.config.showInfluenceDisplay
                            ) {
                                shouldHaveHighlights.push(
                                    "moveable-last-moved",
                                );
                            }
                        }

                        shouldHaveHighlights.push(moveableClass);
                    }

                    // Last move highlighting (only if not already handled by combined moveable-last-moved-outline)
                    if (
                        isLastMoveSquare &&
                        !(
                            moveablePieces &&
                            moveablePieces.has(squareId) &&
                            !this.selectedSquare &&
                            !this.doubleMoveMidpoint &&
                            !this.lionReturnPromptActive &&
                            !this.promotionPromptActive &&
                            this.config.showInfluenceDisplay &&
                            shouldHaveHighlights.some(
                                (cls) => cls === "moveable-last-moved-outline",
                            )
                        )
                    ) {
                        shouldHaveHighlights.push(lastMoveClass);
                    }

                    // Selection highlighting
                    if (
                        this.selectedSquare === squareId &&
                        !this.promotionPromptActive &&
                        !this.lionReturnPromptActive
                    ) {
                        shouldHaveHighlights.push("selected");
                    }

                    // Lion first move highlighting (violet) - only show when NOT in double move mode and NOT in edit mode
                    if (
                        this.config.showLegalMoves &&
                        this.selectedSquare &&
                        !this.promotionPromptActive &&
                        !this.lionReturnPromptActive &&
                        !this.doubleMoveMidpoint &&
                        this.currentTab !== "edit" &&
                        this.lionFirstMoves &&
                        this.lionFirstMoves.includes(squareId)
                    ) {
                        shouldHaveHighlights.push("lion-first-move");
                    }

                    // Lion double move highlighting - origin and midpoint always visible, destinations respect showLegalMoves
                    if (this.doubleMoveMidpoint) {
                        if (squareId === this.doubleMoveOrigin) {
                            // If moving to origin would violate repetition, show as deselection square
                            if (this.doubleMoveRepeatToOrigin) {
                                shouldHaveHighlights.push("selected");
                            } else {
                                // Always add the base origin class
                                shouldHaveHighlights.push("lion-double-origin");

                                // Add valid-move class when showLegalMoves is enabled and origin is a valid destination
                                if (
                                    this.config.showLegalMoves &&
                                    this.doubleMoveDestinations &&
                                    this.doubleMoveDestinations.includes(
                                        squareId,
                                    )
                                ) {
                                    shouldHaveHighlights.push("valid-move");
                                }
                            }
                        }
                        if (squareId === this.doubleMoveMidpoint) {
                            // Check if clicking midpoint (completing move there) would violate repetition
                            let midpointBlocked = false;
                            if (
                                this.config.showLegalMoves &&
                                !this.config.allowIllegalMoves &&
                                this.config.repetitionHandling !== "relaxed"
                            ) {
                                const [originRank, originFile] =
                                    this.parseSquareId(this.doubleMoveOrigin);
                                const piece =
                                    this.board[originRank][originFile];
                                if (piece) {
                                    midpointBlocked =
                                        this.moveValidator.wouldMoveViolateRepetition(
                                            this.doubleMoveOrigin,
                                            this.doubleMoveMidpoint,
                                            piece,
                                        );
                                }
                            }

                            // Always add the base midpoint class
                            shouldHaveHighlights.push("lion-double-midpoint");

                            // Add valid-move class if not blocked (CSS will override amber with green)
                            if (
                                this.config.showLegalMoves &&
                                !midpointBlocked
                            ) {
                                shouldHaveHighlights.push("valid-move");
                            }
                        }
                        // Only destination highlights respect showLegalMoves setting
                        if (
                            this.config.showLegalMoves &&
                            this.doubleMoveDestinations &&
                            this.doubleMoveDestinations.includes(squareId)
                        ) {
                            // Don't highlight origin as a destination if it would violate repetition
                            // (it will already have the "selected" highlight from above)
                            if (
                                !(
                                    squareId === this.doubleMoveOrigin &&
                                    this.doubleMoveRepeatToOrigin
                                )
                            ) {
                                shouldHaveHighlights.push("valid-move");
                            }
                        }
                    }

                    // Valid move highlighting (regular moves) - show when NOT a Lion first move or when in double move mode, and NOT in edit mode
                    if (
                        this.config.showLegalMoves &&
                        this.selectedSquare &&
                        !this.promotionPromptActive &&
                        !this.lionReturnPromptActive &&
                        !this.doubleMoveMidpoint &&
                        this.currentTab !== "edit" &&
                        this.validMoves &&
                        this.validMoves.includes(squareId) &&
                        (!this.lionFirstMoves ||
                            !this.lionFirstMoves.includes(squareId))
                    ) {
                        // Check if this is an illegal move (amber), repeat-promotion move (amber), or normal move (green)
                        if (
                            this.illegalMoves &&
                            this.illegalMoves.includes(squareId)
                        ) {
                            shouldHaveHighlights.push("valid-illegal-move");
                        } else if (
                            this.repeatPromotionMoves &&
                            this.repeatPromotionMoves.includes(squareId)
                        ) {
                            shouldHaveHighlights.push("repeat-promotion-move");
                        } else {
                            shouldHaveHighlights.push("valid-move");
                        }
                    }

                    // Promotion highlighting
                    if (this.promotionPromptActive) {
                        if (squareId === this.promotionDestinationSquare) {
                            shouldHaveHighlights.push("promotion-choice");
                        }
                        if (squareId === this.promotionDeferralSquare) {
                            shouldHaveHighlights.push("promotion-choice");
                        }
                        if (squareId === this.promotionAlternateSquare) {
                            shouldHaveHighlights.push("promotion-source");
                        }
                        // Origin square gets selection highlight (for deselection) but NOT the \u00d7 symbol.
                        // Only apply after destination and deferral squares are set to avoid premature highlighting.
                        // Skip for Lion double-move promotions: promotion-origin-highlight uses the same
                        // --highlight-selected-background (yellow) as lion-double-origin, so leaving the origin
                        // yellow makes it visually indistinguishable from the double-move state that just ended.
                        if (
                            this.promotionMove &&
                            squareId === this.promotionMove.from &&
                            this.promotionDestinationSquare !== null &&
                            this.promotionDestinationSquare !== undefined &&
                            this.promotionDeferralSquare !== null &&
                            this.promotionDeferralSquare !== undefined &&
                            !this.promotionMove.isDoubleMove
                        ) {
                            const isCoveredByDestination =
                                squareId === this.promotionDestinationSquare;
                            const isCoveredByDeferral =
                                squareId === this.promotionDeferralSquare;
                            if (
                                !isCoveredByDestination &&
                                !isCoveredByDeferral
                            ) {
                                // Use dedicated class for highlight without \u00d7 symbol
                                shouldHaveHighlights.push(
                                    "promotion-origin-highlight",
                                );
                            }
                        }
                    }

                    // Lion return highlighting
                    if (this.lionReturnPromptActive) {
                        if (this.selectedSquare === squareId) {
                            shouldHaveHighlights.push("lion-return-choice");
                        }
                        if (this.lionReturnAlternateSquare === squareId) {
                            shouldHaveHighlights.push("lion-return-choice");
                        }
                    }

                    // Lion-trading rule highlighting removed

                    // Update classes efficiently
                    const currentHighlights = currentClasses.filter((cls) =>
                        highlightClasses.includes(cls),
                    );
                    const toRemove = currentHighlights.filter(
                        (cls) => !shouldHaveHighlights.includes(cls),
                    );
                    const toAdd = shouldHaveHighlights.filter(
                        (cls) => !currentHighlights.includes(cls),
                    );

                    // Only modify DOM if changes are needed
                    if (toRemove.length > 0) {
                        square.classList.remove(...toRemove);
                    }
                    if (toAdd.length > 0) {
                        square.classList.add(...toAdd);
                    }
                });
            },

            // Apply influence highlighting (lowest priority)
            applyInfluenceHighlights: () => {
                if (!this.config.showInfluenceDisplay) return;

                const influence = this.calculateBoardInfluence();
                const squares =
                    this.container.querySelectorAll(".chushogi-square");
                squares.forEach((square) => {
                    const squareId = square.dataset.square;
                    const influenceClass = this.getInfluenceClass(
                        squareId,
                        influence,
                    );
                    if (influenceClass) {
                        square.classList.add(influenceClass);
                    }
                });
            },

            // Apply last move highlighting
            applyLastMoveHighlights: () => {
                if (!this.config.showLastMove) return;

                // Hide last move highlights in edit mode since they're game-specific
                if (this.currentTab === "edit") return;

                // Use navigation-aware last move detection
                const displayMove = this.getNavigationDisplayMove();
                if (!displayMove) return;

                // Use circles when showInfluenceDisplay is enabled, otherwise use background highlighting
                const lastMoveClass = this.config.showInfluenceDisplay
                    ? "last-move-outline"
                    : "last-move";

                const fromElement = this.container.querySelector(
                    `[data-square="${displayMove.from}"]`,
                );
                const toElement = this.container.querySelector(
                    `[data-square="${displayMove.to}"]`,
                );

                if (fromElement) fromElement.classList.add(lastMoveClass);
                if (toElement) toElement.classList.add(lastMoveClass);

                // Always highlight midpoint for Lion double moves
                if (displayMove.midpoint) {
                    const midpointElement = this.container.querySelector(
                        `[data-square="${displayMove.midpoint}"]`,
                    );
                    if (midpointElement)
                        midpointElement.classList.add(lastMoveClass);
                }
            },

            // Apply selection highlighting
            applySelectionHighlights: () => {
                if (
                    !this.selectedSquare ||
                    this.promotionPromptActive ||
                    this.lionReturnPromptActive
                )
                    return;

                const selectedElement = this.container.querySelector(
                    `[data-square="${this.selectedSquare}"]`,
                );
                if (selectedElement) {
                    selectedElement.classList.add("selected");
                }
            },

            // Apply valid move highlighting
            applyValidMoveHighlights: () => {
                if (
                    !this.selectedSquare ||
                    this.promotionPromptActive ||
                    this.lionReturnPromptActive
                )
                    return;
                if (!this.validMoves || this.validMoves.length === 0) return;
                if (!this.config.showLegalMoves) return; // Respect showLegalMoves setting

                const [rank, file] = this.parseSquareId(this.selectedSquare);
                const piece = this.board[rank][file];
                const isLion =
                    piece && (piece.type === "N" || piece.type === "+O");

                this.validMoves.forEach((move) => {
                    const moveElement = this.container.querySelector(
                        `[data-square="${move}"]`,
                    );
                    if (!moveElement) return;

                    // Check if this move is a repeat-promotion move
                    const isRepeatPromotion =
                        this.repeatPromotionMoves &&
                        this.repeatPromotionMoves.includes(move);

                    if (isRepeatPromotion) {
                        // Amber highlight for promotion-eligible repeat moves
                        moveElement.classList.add("repeat-promotion-move");
                    } else {
                        // Normal green highlight for non-repeat moves
                        moveElement.classList.add("valid-move");
                    }
                });
            },

            // Apply promotion prompt highlighting
            applyPromotionHighlights: () => {
                if (!this.promotionPromptActive) return;

                // Destination square
                if (this.promotionDestinationSquare) {
                    const destElement = this.container.querySelector(
                        `[data-square="${this.promotionDestinationSquare}"]`,
                    );
                    if (destElement) {
                        destElement.classList.add("promotion-choice");
                    }
                }

                // Deferral square
                if (this.promotionDeferralSquare) {
                    const deferralElement = this.container.querySelector(
                        `[data-square="${this.promotionDeferralSquare}"]`,
                    );
                    if (deferralElement) {
                        deferralElement.classList.add("promotion-choice");
                    }
                }

                // Highlight the origin square during promotion prompts, except for Lion double-move
                // promotions where promotion-origin-highlight (yellow) is visually identical to
                // lion-double-origin and makes the board look like the double-move is still active.
                if (
                    this.promotionMove &&
                    this.promotionMove.from &&
                    !this.promotionMove.isDoubleMove
                ) {
                    const originElement = this.container.querySelector(
                        `[data-square="${this.promotionMove.from}"]`,
                    );
                    if (originElement) {
                        // Check if origin square is covered by destination or deferral highlighting
                        const isCoveredByDestination =
                            this.promotionMove.from ===
                            this.promotionDestinationSquare;
                        const isCoveredByDeferral =
                            this.promotionMove.from ===
                            this.promotionDeferralSquare;

                        if (isCoveredByDestination) {
                            // Origin is covered by destination - use destination highlighting
                            originElement.classList.add("promotion-choice");
                        } else if (isCoveredByDeferral) {
                            // Origin is covered by deferral - use deferral highlighting
                            originElement.classList.add("promotion-choice");
                        } else {
                            // Normal origin highlighting when not covered
                            originElement.classList.add("promotion-source");
                        }
                    }
                }

                // Alternate square
                if (this.promotionAlternateSquare) {
                    const altElement = this.container.querySelector(
                        `[data-square="${this.promotionAlternateSquare}"]`,
                    );
                    if (altElement) {
                        altElement.classList.add("promotion-source");
                    }
                }
            },

            // Apply Lion return prompt highlighting
            applyLionReturnHighlights: () => {
                if (!this.lionReturnPromptActive) return;

                // Double move origin highlighting removed

                // Alternate square
                if (this.lionReturnAlternateSquare) {
                    const altElement = this.container.querySelector(
                        `[data-square="${this.lionReturnAlternateSquare}"]`,
                    );
                    if (altElement) {
                        altElement.classList.add("lion-return-choice");
                    }
                }
            },

            // Apply Counter-strike rule highlighting
            applyCounterStrikeHighlights: () => {
                // CENTRALIZED: Always clear existing counter-strike highlights first
                const allHighlightedElements = utils.dom.querySelectorAll(
                    this.container,
                    ".counterstrike-highlight",
                );
                allHighlightedElements.forEach((el) =>
                    utils.dom.removeClass(el, "counterstrike-highlight"),
                );

                // Only apply new highlights if in edit mode
                if (this.currentTab !== "edit") return;

                // In edit mode, always show counter-strike highlighting
                if (this.lastLionCapture) {
                    // Check if counter-strike square is now empty and snap to non-active if so
                    const [rank, file] = this.parseSquareId(
                        this.lastLionCapture,
                    );
                    const pieceAtSquare = this.board[rank][file];

                    if (!pieceAtSquare) {
                        // Square is empty, snap to non-active state
                        this.lastLionCapture = null;
                        console.log(
                            "Counter-strike square became empty - snapping to non-active state",
                        );

                        // CENTRALIZED: Apply non-active highlighting logic
                        const removeSquare = utils.dom.querySelector(
                            this.container,
                            '[data-piece="remove"]',
                        );
                        const shieldIcon = utils.dom.querySelector(
                            this.container,
                            '[data-piece="counterstrike"]',
                        );

                        if (
                            shieldIcon &&
                            shieldIcon.classList.contains("selected")
                        ) {
                            // Shield icon is selected and no counter-strike rule is active
                            // Highlight remove square with amber, shield icon keeps normal selection
                            if (removeSquare) {
                                utils.dom.addClass(
                                    removeSquare,
                                    "counterstrike-highlight",
                                );
                            }
                        } else {
                            // Normal case - highlight shield icon to show non-active state
                            if (shieldIcon) {
                                utils.dom.addClass(
                                    shieldIcon,
                                    "counterstrike-highlight",
                                );
                            }
                        }
                    } else {
                        // Active counter-strike rule - highlight the board square
                        const counterStrikeSquare =
                            this.container.querySelector(
                                `[data-square="${this.lastLionCapture}"]`,
                            );
                        if (counterStrikeSquare) {
                            counterStrikeSquare.classList.add(
                                "counterstrike-highlight",
                            );
                        }
                    }
                } else {
                    // Non-active state - apply appropriate highlighting based on selection
                    const removeSquare = this.container.querySelector(
                        '[data-piece="remove"]',
                    );
                    const shieldIcon = this.container.querySelector(
                        '[data-piece="counterstrike"]',
                    );

                    if (
                        shieldIcon &&
                        shieldIcon.classList.contains("selected")
                    ) {
                        // Shield icon is selected and no counter-strike rule is active
                        // Highlight remove square with amber, shield icon keeps normal selection
                        if (removeSquare) {
                            removeSquare.classList.add(
                                "counterstrike-highlight",
                            );
                        }
                    } else {
                        // Normal case - highlight shield icon to show non-active state
                        if (shieldIcon) {
                            shieldIcon.classList.add("counterstrike-highlight");
                        }
                    }
                }
            },
        };

        // CENTRALIZED MOVE EXECUTOR
        // Handles all move execution consistently across all move types
        // ensuring proper navigation state and SFEN record management
        moveExecutor = {
            // Execute a move and update all game state consistently
            executeMove: (moveData, context = {}) => {
                const {
                    from,
                    to,
                    piece,
                    captured,
                    promoted = false,
                    midpoint = null,
                    capturedAtMidpoint = null,
                    isLionReturn = false,
                } = moveData;

                // Reduce logging during batch import
                if (!this.isBatchImporting) {
                    console.log("MoveExecutor.executeMove called:", {
                        from,
                        to,
                        piece: piece?.type,
                        captured: captured?.type,
                        promoted,
                        midpoint,
                        isLionReturn,
                    });
                }

                // Check for Lion return moves (double moves that return to starting square) BEFORE puzzle validation
                // This allows Lion return prompts to be shown even for invalid moves in puzzle mode
                const isLionReturnMove = midpoint && from === to;

                if (
                    isLionReturnMove &&
                    !context.skipPromotionPrompt &&
                    !context.skipLionReturnPrompt
                ) {
                    console.log(
                        "MoveExecutor: Showing Lion return prompt for:",
                        from,
                        "->",
                        midpoint,
                        "->",
                        to,
                    );

                    // Always show prompt for Lion return moves (regardless of promotion eligibility)
                    // Get the piece captured at midpoint for counter-strike detection
                    const [midpointRank, midpointFile] =
                        this.parseSquareId(midpoint);
                    const capturedAtMidpoint =
                        this.board[midpointRank][midpointFile];

                    const additionalData = {
                        midpoint,
                        capturedAtMidpoint,
                        isDoubleMove: true,
                        isLionReturn: true,
                    };

                    this.showPromotionPrompt(from, to, piece, additionalData);
                    return true; // Prompt shown, will continue when user clicks
                }

                // Check for promotion eligibility BEFORE puzzle validation
                // This allows promotion prompts to be shown even for invalid moves in puzzle mode
                if (
                    !promoted &&
                    !context.skipPromotionCheck &&
                    !context.skipPromotionPrompt
                ) {
                    const [fromRank] = this.parseSquareId(from);
                    const [toRank] = this.parseSquareId(to);

                    const needsPromotion =
                        this.promotionManager.checkEligibility(
                            piece,
                            fromRank,
                            toRank,
                            captured,
                            {},
                        );
                    if (!this.isBatchImporting) {
                        console.log("Promotion eligibility check:", {
                            from,
                            to,
                            piece: piece?.type,
                            needsPromotion,
                            fromRank,
                            toRank,
                            captured: captured?.type,
                        });
                    }

                    if (needsPromotion) {
                        console.log(
                            "MoveExecutor: Showing promotion prompt for:",
                            from,
                            "->",
                            to,
                            midpoint ? "(Lion double move)" : "(regular move)",
                        );

                        // Pass additional data for Lion double moves
                        const additionalData = midpoint
                            ? {
                                  midpoint,
                                  capturedAtMidpoint,
                                  isDoubleMove: true,
                              }
                            : {};

                        this.showPromotionPrompt(
                            from,
                            to,
                            piece,
                            additionalData,
                        );
                        return true; // Don't execute the move, wait for promotion choice
                    }
                }

                // Generate move notation for puzzle validation (after checking for prompts)
                const moveNotation = this.generateMoveNotation(
                    from,
                    to,
                    piece,
                    captured,
                    promoted,
                    midpoint,
                    capturedAtMidpoint,
                );
                console.log(
                    "Generated move notation for validation:",
                    moveNotation,
                );

                // Validate move in puzzle mode (after promotion prompt handling).
                // Skip during import — imported moves (including variation branches)
                // must not be checked against the active puzzle solution.
                if (this.config.appletMode === "puzzle" && !context.skipPromotionPrompt) {
                    const validation = this.validatePuzzleMove(moveNotation);
                    if (!validation.valid) {
                        console.log(
                            "Puzzle: Move rejected -",
                            moveNotation,
                            "is not the correct solution",
                        );
                        if (validation.isTargetMove && validation.targetMove) {
                            console.log(
                                "Puzzle: Expected move was:",
                                validation.targetMove,
                            );
                        }

                        // Clear promotion prompt and highlighting immediately when move is rejected
                        this.closePromotionPrompt();
                        this.clearSelection();
                        this.highlightManager.updateAllIntelligent();

                        return false; // Reject the move
                    }
                    console.log(
                        "Puzzle: Move accepted -",
                        moveNotation,
                        "matches solution",
                    );
                }

                // Handle promotion logic
                if (promoted) {
                    // Explicit promotion requested (from USI import)
                    console.log(
                        "MoveExecutor: Applying explicit promotion from USI",
                    );
                    moveData.piece = this.promotionManager.applyPromotion(
                        piece,
                        true,
                    );
                } else if (
                    !context.skipPromotionCheck &&
                    !context.skipPromotionPrompt
                ) {
                    const [fromRank] = this.parseSquareId(from);
                    const [toRank] = this.parseSquareId(to);

                    const needsPromotion =
                        this.promotionManager.checkEligibility(
                            piece,
                            fromRank,
                            toRank,
                            captured,
                            {},
                        );
                    if (!this.isBatchImporting) {
                        console.log("MoveExecutor promotion check:", {
                            needsPromotion,
                            from,
                            to,
                            piece: piece?.type,
                            midpoint,
                            isLionReturn: from === to && midpoint,
                        });
                    }

                    // Lion return logic moved up before puzzle validation

                    // Check for promotion-eligible moves BEFORE puzzle validation
                    // This allows promotion prompts to be shown even for invalid moves in puzzle mode
                    if (needsPromotion && !context.skipPromotionPrompt) {
                        console.log(
                            "MoveExecutor: Showing promotion prompt for:",
                            from,
                            "->",
                            to,
                            midpoint ? "(Lion double move)" : "(regular move)",
                        );

                        // Pass additional data for Lion double moves
                        const additionalData = midpoint
                            ? {
                                  midpoint,
                                  capturedAtMidpoint,
                                  isDoubleMove: true,
                              }
                            : {};

                        this.showPromotionPrompt(
                            from,
                            to,
                            piece,
                            additionalData,
                        );
                        return; // Don't execute the move, wait for promotion choice
                    }

                    // Force promotion during import without prompts
                    if (needsPromotion && context.skipPromotionPrompt) {
                        if (!this.isBatchImporting) {
                            console.log(
                                "MoveExecutor: Force-promoting piece during import",
                            );
                        }
                        moveData.promoted = true;
                        moveData.piece = this.promotionManager.applyPromotion(
                            piece,
                            true,
                        );
                    }
                }

                // REPEAT POSITION CHECK - forbid moves that would repeat a position with same player to move
                // Exception: Allow repetitions when player has exactly one royal and it's under attack
                if (!this.config.allowIllegalMoves) {
                    // Create the same board copy used for SFEN generation to ensure state alignment
                    const {
                        from,
                        to,
                        piece: movingPiece,
                        promoted = false,
                        midpoint = null,
                    } = moveData;
                    const boardCopy = this.board.map((row) =>
                        row.map((cell) => (cell ? { ...cell } : null)),
                    );

                    // Apply the move to the board copy (same logic as getResultingSFEN)
                    const [fromRank, fromFile] = this.parseSquareId(from);
                    const [toRank, toFile] = this.parseSquareId(to);

                    if (midpoint) {
                        const [midRank, midFile] = this.parseSquareId(midpoint);
                        boardCopy[fromRank][fromFile] = null;
                        boardCopy[midRank][midFile] = null;
                        const finalPiece = { ...movingPiece };
                        if (promoted) {
                            finalPiece.type = this.getPromotedType(
                                movingPiece.type,
                            );
                            finalPiece.promoted = true;
                            if (movingPiece.type !== finalPiece.type) {
                                finalPiece.originalType = movingPiece.type;
                            }
                        }
                        boardCopy[toRank][toFile] = finalPiece;
                    } else {
                        boardCopy[fromRank][fromFile] = null;
                        const finalPiece = { ...movingPiece };
                        if (promoted) {
                            finalPiece.type = this.getPromotedType(
                                movingPiece.type,
                            );
                            finalPiece.promoted = true;
                            if (movingPiece.type !== finalPiece.type) {
                                finalPiece.originalType = movingPiece.type;
                            }
                        }
                        boardCopy[toRank][toFile] = finalPiece;
                    }

                    // Generate SFEN from the resulting board
                    const originalBoard = this.board;
                    this.board = boardCopy;
                    const resultingSFEN = this.exportSFENWithPlayer(
                        movingPiece.color === "b" ? "w" : "b",
                    );
                    this.board = originalBoard;

                    if (resultingSFEN) {
                        const parts = resultingSFEN.split(" ");
                        const boardPosition = parts[0];
                        const playerToMove = parts[1];

                        console.log("SFEN DEBUG:", {
                            movingPieceColor: movingPiece.color,
                            expectedNextPlayer:
                                movingPiece.color === "b" ? "w" : "b",
                            resultingSFEN,
                            parts,
                            playerToMove,
                        });

                        // Check for simple check exception: exactly one royal under attack
                        // Check if the MOVING player (not playerToMove) has exactly one royal under attack in CURRENT position
                        const movingPlayer = movingPiece.color;
                        const royalInfo = this.countRoyals(
                            this.board,
                            movingPlayer,
                        ); // Check current board, not resulting board
                        const attackerColor = movingPlayer === "b" ? "w" : "b";
                        const royalUnderAttack =
                            royalInfo.count === 1 && royalInfo.firstRoyal
                                ? this.isRoyalUnderAttack(
                                      this.board,
                                      royalInfo.firstRoyal.squareId,
                                      attackerColor,
                                  )
                                : false;

                        console.log("Repeat detection check:", {
                            movingPlayer,
                            playerToMoveAfter: playerToMove,
                            movingPlayerRoyalCount: royalInfo.count,
                            movingPlayerRoyalSquare: royalInfo.firstRoyal
                                ? royalInfo.firstRoyal.squareId
                                : null,
                            attackerColor,
                            movingPlayerRoyalUnderAttack: royalUnderAttack,
                            willBypass:
                                royalInfo.count === 1 && royalUnderAttack,
                        });

                        if (royalInfo.count === 1 && royalUnderAttack) {
                            console.log(
                                "Repeat detection bypassed: single royal is under attack",
                            );
                        } else if (royalInfo.count === 2) {
                            // Check for double mover attack on two adjacent royals
                            const royal1 = royalInfo.firstRoyal;
                            const royal2 = royalInfo.secondRoyal;

                            if (this.areRoyalsAdjacent(royal1, royal2)) {
                                const adjacentRoyalsUnderAttack =
                                    this.areAdjacentRoyalsUnderDoubleMoverAttack(
                                        this.board,
                                        royal1,
                                        royal2,
                                        attackerColor,
                                    );

                                console.log(
                                    "Repeat detection check (two adjacent royals):",
                                    {
                                        royal1Position: royal1.squareId,
                                        royal2Position: royal2.squareId,
                                        areAdjacent: true,
                                        underDoubleMoverAttack:
                                            adjacentRoyalsUnderAttack,
                                        willBypass: adjacentRoyalsUnderAttack,
                                    },
                                );

                                if (adjacentRoyalsUnderAttack) {
                                    console.log(
                                        "Repeat detection bypassed: two adjacent royals under double mover attack",
                                    );
                                } else {
                                    // Check repetition using centralized logic
                                    if (
                                        this.wouldViolateRepetitionRules(
                                            boardPosition,
                                            playerToMove,
                                        )
                                    ) {
                                        return false;
                                    }
                                }
                            } else {
                                console.log(
                                    "Repeat detection check (two non-adjacent royals): not in check",
                                );
                                // Check repetition using centralized logic
                                if (
                                    this.wouldViolateRepetitionRules(
                                        boardPosition,
                                        playerToMove,
                                    )
                                ) {
                                    return false;
                                }
                            }
                        } else {
                            // Check repetition using centralized logic
                            if (
                                this.wouldViolateRepetitionRules(
                                    boardPosition,
                                    playerToMove,
                                )
                            ) {
                                return false;
                            }
                        }
                    }
                }

                // If this exact move already exists as a child of the parent node,
                // navigate to that existing node instead of creating a duplicate variation.
                if (!this.isImporting && !this.isBatchImporting) {
                    const _earlyParentNode = this.currentNode ?? this.getLiveNode();
                    const _duplicateChild = _earlyParentNode.children.find(child =>
                        child.from === from &&
                        child.to === to &&
                        !!child.promoted === !!moveData.promoted &&
                        child.piece?.type === piece?.type
                    );
                    if (_duplicateChild) {
                        // If the duplicate is on the main line, use navigateToPosition so
                        // currentNavigationIndex advances correctly and back/forward remain sane.
                        // For off-branch nodes navigateToNode is fine (it intentionally leaves
                        // currentNavigationIndex pointing at the main-line anchor).
                        const _dupMainIdx = this.moveHistory.indexOf(_duplicateChild);
                        if (_dupMainIdx !== -1) {
                            this.navigateToPosition(_dupMainIdx);
                        } else {
                            this.navigateToNode(_duplicateChild);
                        }
                        return _duplicateChild;
                    }
                }

                // Apply the move to the board
                if (!this.isBatchImporting) {
                    console.log(
                        "Before applyMoveToBoard - piece at destination:",
                        this.board[this.parseSquareId(to)[0]][
                            this.parseSquareId(to)[1]
                        ],
                    );
                }
                this.moveExecutor.applyMoveToBoard(moveData);
                if (!this.isBatchImporting) {
                    console.log(
                        "After applyMoveToBoard - piece at destination:",
                        this.board[this.parseSquareId(to)[0]][
                            this.parseSquareId(to)[1]
                        ],
                    );
                }

                // Update Lion capture tracking - pass original piece state
                this.moveExecutor.updateLionCapture({
                    ...moveData,
                    originalPiece: piece, // Store original piece before any promotion
                });

                // Generate move notation (use original piece before promotion)
                const notation = this.generateMoveNotation(
                    from,
                    to,
                    piece, // Use original piece before promotion for correct notation
                    captured,
                    moveData.promoted, // Use updated promotion flag
                    midpoint,
                    capturedAtMidpoint,
                );

                // Resolve parent before building the move record (needed for previousLionCapture).
                const _parentNode = this.currentNode ?? this.getLiveNode();

                // Create move record with proper SFEN
                const moveRecord = {
                    from,
                    to,
                    piece: { ...piece }, // Store original piece state
                    captured,
                    promoted: moveData.promoted, // Use updated promotion flag
                    notation,
                    lionCapture: this.lastLionCapture,
                    previousLionCapture:
                        _parentNode !== this.moveTree
                            ? _parentNode.lionCapture
                            : this.startingLionCapture,
                    resultingSFEN: "", // Will be set after player update
                    comment: "", // Comment for this move
                    ...(midpoint && {
                        midpoint,
                        capturedAtMidpoint,
                    }),
                    ...(isLionReturn && { isLionDouble: true }),
                };

                // Capture whether the parent is a leaf BEFORE the new node is prepended.
                // If it already has children, the new move is an alternative (isBranch).
                const _parentWasLeaf = _parentNode.children.length === 0;

                // Wrap record in a tree node and link into the move tree.
                const _newNode = this.makeMoveNode(moveRecord, _parentNode);
                _parentNode.children.unshift(_newNode); // prepend → new move is main continuation
                if (this.currentNode !== null) {
                    if (this.isImporting) {
                        // Inside import — rebuild moveHistory through the new node.
                        // (The importer batch-tags isBranch; don't set it here.)
                        const _parentPath = [];
                        let _pathCur = _parentNode;
                        while (_pathCur !== this.moveTree) {
                            _parentPath.unshift(_pathCur);
                            _pathCur = _pathCur.parent;
                        }
                        this.moveHistory = [..._parentPath, _newNode];
                    } else {
                        // Interactive play while navigating — never rebuild moveHistory.
                        // Tag isBranch only when the parent is on the main line (first
                        // step of a new variation).  If the parent is already inside a
                        // variation, the move continues that branch without a new flag.
                        if (this.moveHistory.includes(_parentNode)) {
                            _newNode.isBranch = true;
                        }
                    }
                } else {
                    this.moveHistory.push(_newNode);
                }
                this.lastMove = _newNode;

                // Handle puzzle mode - attach comment and execute opponent response
                if (this.config.appletMode === "puzzle") {
                    // Attach comment to the move just added
                    const lastMoveIndex = this.moveHistory.length - 1;
                    if (
                        !this.isImporting &&
                        this.puzzleSolutionComments &&
                        lastMoveIndex >= 0 &&
                        lastMoveIndex < this.puzzleSolutionComments.length
                    ) {
                        this.moveHistory[lastMoveIndex].comment =
                            this.puzzleSolutionComments[lastMoveIndex];
                        console.log(
                            "Puzzle: Attached comment to player move",
                            lastMoveIndex,
                            ":",
                            this.puzzleSolutionComments[lastMoveIndex]
                                ? `"${this.puzzleSolutionComments[lastMoveIndex].substring(0, 30)}..."`
                                : "(none)",
                        );
                    }

                    // Check if solver just made a move (before player switch)
                    const wasSolverMove = piece.color === this.puzzleSolver;
                    console.log(
                        "Puzzle: Move executed, wasSolverMove:",
                        wasSolverMove,
                        "puzzleSolver:",
                        this.puzzleSolver,
                        "piece.color:",
                        piece.color,
                    );
                    if (wasSolverMove) {
                        const lastMove =
                            this.moveHistory[this.moveHistory.length - 1];
                        const moveHasComment =
                            lastMove?.comment &&
                            lastMove.comment.trim().length > 0;

                        if (moveHasComment) {
                            // Move has a comment - pause and wait for manual advancement
                            console.log(
                                "Puzzle: Paused - waiting for player to press > or \u2192",
                            );
                            this.puzzleWaitingForAdvance = true;
                            this.updateButtonStates(); // Enable forward navigation button
                        } else {
                            // No comment - proceed with automatic opponent response
                            console.log(
                                "Puzzle: Scheduling opponent response in 500ms",
                            );
                            // Block all user interactions during opponent response
                            this.puzzleOpponentThinking = true;
                            this.updateButtonStates(); // Disable navigation buttons

                            // Solver just made a move, schedule opponent's response after player switch
                            setTimeout(() => {
                                console.log(
                                    "Puzzle: Timeout triggered, executing opponent response",
                                );
                                this.executeOpponentResponseInPuzzle();
                                // Re-enable interactions after opponent move
                                this.puzzleOpponentThinking = false;
                                this.updateButtonStates(); // Re-enable navigation buttons
                            }, 500); // Small delay for visual feedback
                        }
                    }
                }

                // Update current player (always update when making moves to track game state)
                // allowIllegalMoves should only affect move validation, not turn order
                this.updateCurrentPlayer();

                // Store SFEN with the correct next player.  Always derive from the piece
                // that just moved — exportSFEN() reads isNavigating + currentNavigationIndex
                // which are stale during a variation play and return the wrong player.
                this.lastMove.resultingSFEN = this.exportSFENWithPlayer(
                    piece.color === "b" ? "w" : "b",
                );

                // Reset navigation state after a move.
                // Skip during import — state is managed by the importer.
                if (!this.isImporting) {
                    this.currentNavigationIndex = null;
                    if (this.currentNode !== null) {
                        // Played from inside a variation — stay pinned at the new leaf.
                        this._viewedNode = _newNode;
                        this.isNavigating = true;
                        this.currentNode = _newNode;
                    } else {
                        this.isNavigating = false;
                        this.currentNode = null; // null = at live leaf
                        this._viewedNode = null;
                    }
                }

                // Clear selection and update display (skip expensive operations during batch import)
                this.clearSelection();
                console.log(
                    "moveExecutor.executeMove: Cleared selection and double move state",
                );

                // Skip expensive DOM updates during batch import for performance
                if (!this.isBatchImporting) {
                    console.log(
                        "Before updateBoard - piece at destination:",
                        this.board[this.parseSquareId(to)[0]][
                            this.parseSquareId(to)[1]
                        ],
                    );
                    this.updateBoard();
                    console.log(
                        "After updateBoard - piece at destination:",
                        this.board[this.parseSquareId(to)[0]][
                            this.parseSquareId(to)[1]
                        ],
                    );
                    console.log(
                        "About to call updateDisplay after move execution",
                    );
                    this.updateDisplay();
                    this.updateButtonStates();
                    console.log("updateDisplay completed after move execution");
                }

                return true;
            },

            // Apply move changes to the board
            applyMoveToBoard: (moveData) => {
                const {
                    from,
                    to,
                    piece,
                    promoted = false,
                    midpoint = null,
                    isLionReturn = false,
                } = moveData;

                const [fromRank, fromFile] = this.parseSquareId(from);
                const [toRank, toFile] = this.parseSquareId(to);

                // Use moveData.piece (which may be the promoted version) instead of destructured piece
                const finalPiece = moveData.piece || piece;

                if (isLionReturn) {
                    // Lion return: go to midpoint, then back to start
                    const [midRank, midFile] = this.parseSquareId(midpoint);
                    this.board[fromRank][fromFile] = null;
                    this.board[midRank][midFile] = { ...finalPiece };
                    this.board[fromRank][fromFile] = { ...finalPiece };
                    this.board[midRank][midFile] = null;
                } else if (midpoint) {
                    // Double move: remove from start, clear midpoint, place at end
                    const [midRank, midFile] = this.parseSquareId(midpoint);
                    this.board[fromRank][fromFile] = null;
                    this.board[midRank][midFile] = null;
                    this.board[toRank][toFile] = { ...finalPiece };
                } else {
                    // Regular move
                    this.board[fromRank][fromFile] = null;
                    this.board[toRank][toFile] = { ...finalPiece };
                }

                // Note: Promotion is already handled by MoveExecutor before calling this method.
                // The finalPiece variable above contains the correctly promoted piece if needed.
                // No additional promotion logic required here.
            },

            // Update Lion capture tracking based on comprehensive counter-strike rules
            updateLionCapture: (moveData) => {
                const {
                    piece,
                    captured,
                    capturedAtMidpoint,
                    to,
                    midpoint,
                    from,
                    promoted,
                    originalPiece,
                    isLionReturn,
                } = moveData;

                // Determine the original piece type (before promotion/deferral)
                // For counter-strike purposes, promotions and deferrals are treated the same
                const originalPieceType = originalPiece
                    ? originalPiece.type
                    : piece.type;

                // Helper function to check if a piece is a Lion
                const isLion = (p) => p && (p.type === "N" || p.type === "+O");
                const isNonLion = (p) => p && p.type !== "N" && p.type !== "+O";

                // Check all counter-strike conditions according to user specification

                // Case 1a: Normal capture of a Lion (non-Lion x Lion)
                if (
                    captured &&
                    isLion(captured) &&
                    isNonLion({ type: originalPieceType })
                ) {
                    this.lastLionCapture = to;
                    console.log(
                        `Counter-strike activated (1a): ${originalPieceType} captured Lion at ${to}`,
                    );
                    return;
                }

                // Case 1c: Capture of a Lion without moving (non-Lion x Lion - non-Lion's origin square)
                // Case 1c debug logging removed - issue resolved

                if (
                    capturedAtMidpoint &&
                    isLion(capturedAtMidpoint) &&
                    isNonLion({ type: originalPieceType }) &&
                    isLionReturn
                ) {
                    this.lastLionCapture = midpoint;
                    console.log(
                        `Counter-strike activated (1c): ${originalPieceType} captured Lion without moving at ${midpoint}`,
                    );
                    return;
                }

                // Case 1b: Hit-Lion-and-run (non-Lion x Lion x non-Lion or non-Lion x Lion - empty square)
                if (
                    capturedAtMidpoint &&
                    isLion(capturedAtMidpoint) &&
                    isNonLion({ type: originalPieceType }) &&
                    (!captured || (captured && !isLion(captured)))
                ) {
                    this.lastLionCapture = midpoint;
                    console.log(
                        `Counter-strike activated (1b): ${originalPieceType} hit-Lion-and-run at ${midpoint}`,
                    );
                    return;
                }

                // Case 1d: Double-capture landing on a Lion (non-Lion x non-Lion x Lion)
                if (
                    capturedAtMidpoint &&
                    !isLion(capturedAtMidpoint) &&
                    captured &&
                    isLion(captured) &&
                    isNonLion({ type: originalPieceType })
                ) {
                    this.lastLionCapture = to;
                    console.log(
                        `Counter-strike activated (1d): ${originalPieceType} double-capture landing on Lion at ${to}`,
                    );
                    return;
                }

                // Case 1e: Double-capture of two Lions (non-Lion x Lion x Lion)
                // Last Lion captured takes priority (destination square)
                if (
                    capturedAtMidpoint &&
                    isLion(capturedAtMidpoint) &&
                    captured &&
                    isLion(captured) &&
                    isNonLion({ type: originalPieceType })
                ) {
                    this.lastLionCapture = to;
                    console.log(
                        `Counter-strike activated (1e): ${originalPieceType} double-capture of two Lions, priority at ${to}`,
                    );
                    return;
                }

                // Clear counter-strike for Lion-captures-Lion scenarios
                if (
                    (captured &&
                        isLion(captured) &&
                        isLion({ type: originalPieceType })) ||
                    (capturedAtMidpoint &&
                        isLion(capturedAtMidpoint) &&
                        isLion({ type: originalPieceType }))
                ) {
                    this.lastLionCapture = null;
                    console.log(`Lion captured Lion - Counter-strike cleared`);
                    return;
                }

                // Case 1f: Any other move - unset the rule state
                this.lastLionCapture = null;
            },
        };

        // CENTRALIZED EVENT MANAGER
        // Handles all UI interactions and board events consistently
        // ensuring proper event delegation and clean event handling
        eventManager = {
            // Initialize all event listeners through centralized system
            initialize: () => {
                this.eventManager.attachSquareListeners();
                this.eventManager.attachUIListeners();
                this.eventManager.attachModalListeners();
                this.eventManager.attachDrawingListeners();
                this.eventManager.attachBoardListeners();
                // Keyboard listeners are managed by main attachEventListeners()
            },

            // Clean up all event listeners
            cleanup: () => {
                // Remove keyboard listeners if they exist
                if (this.eventManager.keydownHandler) {
                    document.removeEventListener(
                        "keydown",
                        this.eventManager.keydownHandler,
                    );
                }
                if (this.eventManager.keyupHandler) {
                    document.removeEventListener(
                        "keyup",
                        this.eventManager.keyupHandler,
                    );
                }

                // Remove global mouse listener if it exists
                if (this.globalMouseListener) {
                    document.removeEventListener(
                        "mousemove",
                        this.globalMouseListener,
                    );
                }

                // Remove resize listener if it exists
                if (this.resizeListener) {
                    window.removeEventListener("resize", this.resizeListener);
                }

                // Clear edit panel resize timeout if it exists
                if (this.editPanelResizeTimeout) {
                    clearTimeout(this.editPanelResizeTimeout);
                }

                // Remove scroll listener if it exists
                if (this.scrollListener) {
                    window.removeEventListener(
                        "scroll",
                        this.scrollListener,
                        true,
                    );
                }
            },

            // Centralized square event attachment
            attachSquareListeners: () => {
                try {
                    showDebugMessage(
                        "EventManager: attachSquareListeners starting",
                    );
                    const squares =
                        this.container.querySelectorAll("[data-square]");
                    showDebugMessage(
                        "EventManager: Found " + squares.length + " squares",
                    );

                    squares.forEach((square, index) => {
                        showDebugMessage(
                            "EventManager: Processing square " + index,
                        );
                        // Remove existing listeners by cloning
                        const newSquare = square.cloneNode(true);
                        square.parentNode.replaceChild(newSquare, square);

                        // Attach all square-related events
                        showDebugMessage(
                            "EventManager: Attaching click listener to square " +
                                index,
                        );
                        newSquare.addEventListener(
                            "click",
                            this.eventManager.handlers.squareClick,
                        );
                        newSquare.addEventListener(
                            "contextmenu",
                            this.eventManager.handlers.rightClick,
                        );
                        newSquare.addEventListener(
                            "mousedown",
                            this.eventManager.handlers.mouseDown,
                        );
                        newSquare.addEventListener(
                            "mouseup",
                            this.eventManager.handlers.mouseUp,
                        );
                        newSquare.addEventListener(
                            "mousemove",
                            this.eventManager.handlers.mouseMove,
                        );
                        // Touch events with conditional passive behavior
                        newSquare.addEventListener(
                            "touchstart",
                            this.eventManager.handlers.touchStart,
                            { passive: false },
                        );
                        newSquare.addEventListener(
                            "touchend",
                            this.eventManager.handlers.touchEnd,
                            { passive: false },
                        );
                        newSquare.addEventListener(
                            "touchmove",
                            this.eventManager.handlers.touchMove,
                            { passive: false },
                        );
                    });
                    showDebugMessage(
                        "EventManager: attachSquareListeners completed",
                    );
                } catch (error) {
                    console.error("Error in attachSquareListeners:", error);
                }
            },

            // Simple keyboard event attachment - updates both checkboxes based on current key state
            attachKeyboardListeners: () => {
                try {
                    showDebugMessage(
                        "EventManager: attachKeyboardListeners starting",
                    );
                    // Remove existing listeners
                    if (this.eventManager.keydownHandler) {
                        document.removeEventListener(
                            "keydown",
                            this.eventManager.keydownHandler,
                        );
                    }
                    if (this.eventManager.keyupHandler) {
                        document.removeEventListener(
                            "keyup",
                            this.eventManager.keyupHandler,
                        );
                    }

                    // Simple handlers that only update checkboxes based on current key state
                    this.eventManager.keydownHandler = (event) => {
                        if (this.isMouseOverBoard()) {
                            // Prevent default browser behavior for drawing keys
                            if (event.key === "Shift" || event.key === "Alt") {
                                event.preventDefault();
                            }

                            const shiftCheckbox = this.container.querySelector(
                                "[data-drawing-shift]",
                            );
                            const altCheckbox =
                                this.container.querySelector(
                                    "[data-drawing-alt]",
                                );

                            if (shiftCheckbox && altCheckbox) {
                                this.drawingState.updatingCheckboxes = true;

                                // Update both checkboxes to reflect current key state
                                shiftCheckbox.checked = event.shiftKey;
                                altCheckbox.checked = event.altKey;

                                // Update internal state to match (since checkbox events are skipped)
                                this.drawingState.shiftPressed = event.shiftKey;
                                this.drawingState.altPressed = event.altKey;

                                this.drawingState.updatingCheckboxes = false;

                                // Update colors when keyboard state changes
                                this.updateColorCheckboxOutlines();
                            }
                        }
                    };

                    this.eventManager.keyupHandler = (event) => {
                        if (this.isMouseOverBoard()) {
                            // Prevent default browser behavior for drawing keys
                            if (event.key === "Shift" || event.key === "Alt") {
                                event.preventDefault();
                            }

                            const shiftCheckbox = this.container.querySelector(
                                "[data-drawing-shift]",
                            );
                            const altCheckbox =
                                this.container.querySelector(
                                    "[data-drawing-alt]",
                                );

                            if (shiftCheckbox && altCheckbox) {
                                this.drawingState.updatingCheckboxes = true;

                                // Update both checkboxes to reflect current key state
                                shiftCheckbox.checked = event.shiftKey;
                                altCheckbox.checked = event.altKey;

                                // Update internal state to match (since checkbox events are skipped)
                                this.drawingState.shiftPressed = event.shiftKey;
                                this.drawingState.altPressed = event.altKey;

                                this.drawingState.updatingCheckboxes = false;

                                // Update colors when keyboard state changes
                                this.updateColorCheckboxOutlines();
                            }
                        }
                    };

                    // Attach new listeners
                    document.addEventListener(
                        "keydown",
                        this.eventManager.keydownHandler,
                    );
                    document.addEventListener(
                        "keyup",
                        this.eventManager.keyupHandler,
                    );
                    showDebugMessage(
                        "EventManager: attachKeyboardListeners completed",
                    );
                } catch (error) {
                    console.error("Error in attachKeyboardListeners:", error);
                }
            },

            // Centralized UI control event attachment
            attachUIListeners: () => {
                // Tab switching
                const tabs = this.container.querySelectorAll("[data-tab]");
                tabs.forEach((tab) => {
                    const newTab = tab.cloneNode(true);
                    tab.parentNode.replaceChild(newTab, tab);
                    newTab.addEventListener(
                        "click",
                        this.eventManager.handlers.tabClick,
                    );
                });

                // Settings changes
                const settingsInputs =
                    this.container.querySelectorAll("input, select");
                settingsInputs.forEach((input) => {
                    const newInput = input.cloneNode(true);
                    // Preserve current value
                    if (input.type === "checkbox") {
                        newInput.checked = input.checked;
                    } else {
                        newInput.value = input.value;
                    }
                    input.parentNode.replaceChild(newInput, input);
                    newInput.addEventListener(
                        "change",
                        this.eventManager.handlers.settingChange,
                    );
                });

                // Navigation buttons
                const navButtons =
                    this.container.querySelectorAll("[data-nav]");
                navButtons.forEach((button) => {
                    const newButton = button.cloneNode(true);
                    button.parentNode.replaceChild(newButton, button);
                    newButton.addEventListener(
                        "click",
                        this.eventManager.handlers.navigationClick,
                    );
                });

                // Game control buttons
                const gameButtons =
                    this.container.querySelectorAll("[data-game-action]");
                gameButtons.forEach((button) => {
                    const newButton = button.cloneNode(true);
                    button.parentNode.replaceChild(newButton, button);
                    newButton.addEventListener(
                        "click",
                        this.eventManager.handlers.gameActionClick,
                    );
                });

                // Comment textarea blur handler (for saving custom comments)
                // Add listener directly without cloning
                const commentTextarea = this.container.querySelector(
                    "[data-current-sfen]",
                );
                if (commentTextarea && this.config.allowCustomComments) {
                    // Remove any existing blur listener first to prevent duplicates
                    commentTextarea.removeEventListener(
                        "blur",
                        this.eventManager.handlers.commentBlur,
                    );
                    // Add the blur listener
                    commentTextarea.addEventListener(
                        "blur",
                        this.eventManager.handlers.commentBlur,
                    );
                }

                // Navigation hold functionality for < and > buttons
                // Don't clear existing hold state here - let the buttons manage their own state

                const navPrevButton =
                    this.container.querySelector("[data-nav-prev]");
                const navNextButton =
                    this.container.querySelector("[data-nav-next]");

                [navPrevButton, navNextButton].forEach((button) => {
                    if (!button) return;

                    // Clone and replace to remove old event listeners
                    const newButton = button.cloneNode(true);

                    // Preserve the holding class if it exists on the old button
                    if (button.classList.contains("holding")) {
                        newButton.classList.add("holding");
                    }

                    button.parentNode.replaceChild(newButton, button);

                    // Remove the onclick attribute as we'll handle all clicks through event listeners
                    newButton.removeAttribute("onclick");

                    // Update the stored button reference if this is the button being held
                    if (
                        this.navigationHold &&
                        this.navigationHold.button === button
                    ) {
                        this.navigationHold.button = newButton;
                    }

                    const isNext = newButton.hasAttribute("data-nav-next");

                    const startHold = (e) => {
                        e.preventDefault(); // Prevent default to avoid any conflicts

                        // Clear any existing timers first
                        this.clearNavigationHold();

                        // Initialize hold state
                        if (!this.navigationHold) {
                            this.navigationHold = {};
                        }
                        this.navigationHold.isHolding = false;
                        this.navigationHold.direction = isNext
                            ? "next"
                            : "prev";
                        this.navigationHold.button = newButton; // Store button reference

                        // Add holding class immediately to maintain pressed appearance through navigation
                        newButton.classList.add("holding");

                        // Perform single navigation immediately on press
                        if (isNext) {
                            this.goForwardOneMove();
                        } else {
                            this.goBackOneMove();
                        }

                        // Start timer for hold detection after 1 second
                        this.navigationHold.holdTimer = setTimeout(() => {
                            this.navigationHold.isHolding = true;

                            // Start continuous navigation at 4 times per second (every 250ms)
                            this.navigationHold.navigationInterval =
                                setInterval(() => {
                                    // Check if we can still navigate
                                    const canContinue = isNext
                                        ? this.canNavigateForward()
                                        : this.canNavigateBack();

                                    if (!canContinue) {
                                        // Stop the interval if we can't navigate anymore
                                        this.clearNavigationHold();
                                        return;
                                    }

                                    if (isNext) {
                                        this.goForwardOneMove();
                                    } else {
                                        this.goBackOneMove();
                                    }
                                }, 125);
                        }, 750);
                    };

                    const stopHold = (e) => {
                        if (!this.navigationHold) return;

                        // Clear timers and intervals (no additional navigation on release)
                        this.clearNavigationHold();
                    };

                    // Mouse events
                    newButton.addEventListener("mousedown", startHold);
                    newButton.addEventListener("mouseup", stopHold);
                    newButton.addEventListener("mouseleave", stopHold);

                    // Touch events
                    newButton.addEventListener("touchstart", startHold);
                    newButton.addEventListener("touchend", stopHold);
                    newButton.addEventListener("touchcancel", stopHold);
                });
            },

            // Centralized modal event attachment
            attachModalListeners: () => {
                // Promotion modal
                const promoteButtons =
                    this.container.querySelectorAll("[data-promote]");
                promoteButtons.forEach((button) => {
                    const newButton = button.cloneNode(true);
                    button.parentNode.replaceChild(newButton, button);
                    newButton.addEventListener(
                        "click",
                        this.eventManager.handlers.promotionChoice,
                    );
                });

                // Modal close buttons
                const closeButtons =
                    this.container.querySelectorAll("[data-close-modal]");
                closeButtons.forEach((button) => {
                    const newButton = button.cloneNode(true);
                    button.parentNode.replaceChild(newButton, button);
                    newButton.addEventListener(
                        "click",
                        this.eventManager.handlers.modalClose,
                    );
                });

                // Modal backdrop clicks
                const modals = this.container.querySelectorAll(
                    "[data-promotion-modal], [data-lion-return-modal]",
                );
                modals.forEach((modal) => {
                    const newModal = modal.cloneNode(true);
                    modal.parentNode.replaceChild(newModal, modal);
                    newModal.addEventListener(
                        "click",
                        this.eventManager.handlers.modalBackdropClick,
                    );
                });

                // Lion return modal buttons
                const lionReturnButtons = this.container.querySelectorAll(
                    "[data-confirm-lion-return], [data-close-lion-return], [data-cancel-lion-return]",
                );
                lionReturnButtons.forEach((button) => {
                    const newButton = button.cloneNode(true);
                    button.parentNode.replaceChild(newButton, button);
                    newButton.addEventListener(
                        "click",
                        this.eventManager.handlers.lionReturnAction,
                    );
                });
            },

            // Centralized drawing controls attachment
            attachDrawingListeners: () => {
                // Drawing color checkboxes - act independently of keyboard keys
                const shiftCheckbox = this.container.querySelector(
                    "[data-drawing-shift]",
                );
                const altCheckbox =
                    this.container.querySelector("[data-drawing-alt]");

                // Preserve current drawing state before any modifications
                const currentShiftState = this.drawingState.shiftPressed;
                const currentAltState = this.drawingState.altPressed;

                if (shiftCheckbox) {
                    // Remove existing listener by cloning
                    const newShiftCheckbox = shiftCheckbox.cloneNode(true);
                    shiftCheckbox.parentNode.replaceChild(
                        newShiftCheckbox,
                        shiftCheckbox,
                    );

                    // Preserve the current drawing state (not checkbox state which might be wrong)
                    newShiftCheckbox.checked = currentShiftState;
                    newShiftCheckbox.addEventListener("change", (e) => {
                        // Skip if this is a programmatic update from keyboard events
                        if (this.drawingState.updatingCheckboxes) return;

                        // For manual clicks: only update the clicked checkbox
                        this.drawingState.shiftPressed = e.target.checked;

                        this.updateColorCheckboxOutlines();
                    });
                }

                if (altCheckbox) {
                    // Remove existing listener by cloning
                    const newAltCheckbox = altCheckbox.cloneNode(true);
                    altCheckbox.parentNode.replaceChild(
                        newAltCheckbox,
                        altCheckbox,
                    );

                    // Preserve the current drawing state (not checkbox state which might be wrong)
                    newAltCheckbox.checked = currentAltState;
                    newAltCheckbox.addEventListener("change", (e) => {
                        // Skip if this is a programmatic update from keyboard events
                        if (this.drawingState.updatingCheckboxes) return;

                        // For manual clicks: only update the clicked checkbox
                        this.drawingState.altPressed = e.target.checked;

                        this.updateColorCheckboxOutlines();
                    });
                }
            },

            // Centralized board interaction listeners
            attachBoardListeners: () => {
                // Mouse tracking for board hover detection with enter/leave detection
                if (this.globalMouseListener) {
                    document.removeEventListener(
                        "mousemove",
                        this.globalMouseListener,
                    );
                }

                this.globalMouseListener = (e) => {
                    this.lastMouseX = e.clientX;
                    this.lastMouseY = e.clientY;

                    // Check if mouse state changed (entered or left board)
                    const isOverBoard = this.isMouseOverBoard();
                    if (isOverBoard !== this.drawingState.mouseOverBoard) {
                        this.drawingState.mouseOverBoard = isOverBoard;

                        if (isOverBoard) {
                            // Mouse entered board - update checkbox outlines
                            this.updateColorCheckboxOutlines();
                        } else {
                            // Mouse left board - update checkbox colors to show current drawing color
                            this.updateColorCheckboxOutlines();
                        }
                    }
                };

                document.addEventListener(
                    "mousemove",
                    this.globalMouseListener,
                );

                // Add direct board element listeners for immediate mouse tracking
                const boardElement =
                    this.container.querySelector("[data-board]");
                if (boardElement) {
                    // Remove existing listeners if they exist
                    if (this.boardMouseEnterListener) {
                        boardElement.removeEventListener(
                            "mouseenter",
                            this.boardMouseEnterListener,
                        );
                    }
                    if (this.boardMouseLeaveListener) {
                        boardElement.removeEventListener(
                            "mouseleave",
                            this.boardMouseLeaveListener,
                        );
                    }

                    this.boardMouseEnterListener = (e) => {
                        // Immediately update mouse coordinates and board state
                        this.lastMouseX = e.clientX;
                        this.lastMouseY = e.clientY;
                        this.drawingState.mouseOverBoard = true;
                        this.updateColorCheckboxOutlines();
                    };

                    this.boardMouseLeaveListener = (e) => {
                        // Immediately update mouse coordinates and board state
                        this.lastMouseX = e.clientX;
                        this.lastMouseY = e.clientY;
                        this.drawingState.mouseOverBoard = false;
                        this.updateColorCheckboxOutlines();
                    };

                    boardElement.addEventListener(
                        "mouseenter",
                        this.boardMouseEnterListener,
                    );
                    boardElement.addEventListener(
                        "mouseleave",
                        this.boardMouseLeaveListener,
                    );
                }

                // Add scroll detection to window for mobile scrolling
                if (this.scrollListener) {
                    window.removeEventListener(
                        "scroll",
                        this.scrollListener,
                        true,
                    );
                }

                this.scrollListener = () => {
                    // When scrolling occurs, mark as scrolling and disable touches
                    if (!this.drawingState.isDrawing) {
                        // Only cancel touch if we haven't started drawing yet
                        this.drawingState.isScrolling = true;

                        // Clear any active long press timer
                        if (this.drawingState.longPressTimer) {
                            clearTimeout(this.drawingState.longPressTimer);
                            this.drawingState.longPressTimer = null;
                        }
                    }

                    // Clear scroll detection timer
                    if (this.drawingState.scrollDetectionTimer) {
                        clearTimeout(this.drawingState.scrollDetectionTimer);
                    }

                    // Reset scrolling flag after a short delay (only if not drawing)
                    this.drawingState.scrollDetectionTimer = setTimeout(() => {
                        if (!this.drawingState.isDrawing) {
                            this.drawingState.isScrolling = false;
                        }
                    }, 100);
                };

                window.addEventListener("scroll", this.scrollListener, {
                    passive: true,
                    capture: true,
                });

                // Add resize listener to handle both edit panel and canvas resizing
                if (this.resizeListener) {
                    window.removeEventListener("resize", this.resizeListener);
                }

                this.resizeListener = () => {
                    // Check if layout breakpoint has changed (immediate update needed)
                    const currentBoardSize = this.config.boardSize;
                    let breakpoint;

                    switch (currentBoardSize) {
                        case "small":
                            breakpoint = 844; // 820 + 24px sidebar right padding
                            break;
                        case "medium":
                            breakpoint = 904; // 880 + 24px sidebar right padding
                            break;
                        case "large":
                        default:
                            breakpoint = 964; // 940 + 24px sidebar right padding
                            break;
                    }

                    const isFloatingDown = window.innerWidth < breakpoint;

                    // Initialize tracking on first resize if not set
                    if (this.lastSidebarFloatingDown === undefined) {
                        this.lastSidebarFloatingDown = isFloatingDown;
                    }

                    const wasFloatingDown = this.lastSidebarFloatingDown;

                    // Update immediately if layout breakpoint crossed
                    if (wasFloatingDown !== isFloatingDown) {
                        console.log("Breakpoint crossed - immediate update:", {
                            windowWidth: window.innerWidth,
                            breakpoint: breakpoint,
                            wasFloatingDown: wasFloatingDown,
                            isFloatingDown: isFloatingDown,
                            currentTab: this.currentTab,
                        });

                        this.lastSidebarFloatingDown = isFloatingDown;

                        if (this.currentTab === "edit") {
                            const editPanel = this.container.querySelector(
                                '[data-panel="edit"]',
                            );
                            if (
                                editPanel &&
                                editPanel.classList.contains("active")
                            ) {
                                this.updateEditPanelContent(editPanel);
                            }
                        }
                    } else {
                        // Same layout - debounce to prevent flashing during continuous resize
                        if (this.editPanelResizeTimeout) {
                            clearTimeout(this.editPanelResizeTimeout);
                        }

                        this.editPanelResizeTimeout = setTimeout(() => {
                            if (this.currentTab === "edit") {
                                const editPanel = this.container.querySelector(
                                    '[data-panel="edit"]',
                                );
                                if (
                                    editPanel &&
                                    editPanel.classList.contains("active")
                                ) {
                                    this.updateEditPanelContent(editPanel);
                                }
                            }
                        }, 150);
                    }

                    // Handle canvas resizing with debounce
                    setTimeout(() => {
                        this.drawCanvas(false);
                        this.redrawAllDrawings();
                    }, 100);
                };

                window.addEventListener("resize", this.resizeListener);
            },

            // Event handler functions
            handlers: {
                // Square click handler with touch conflict prevention
                squareClick: (event) => {
                    // Prevent click if touch was recently handled
                    const timeSinceTouch =
                        Date.now() - this.drawingState.lastTouchTime;
                    if (
                        this.drawingState.touchHandled &&
                        timeSinceTouch < 500
                    ) {
                        event.preventDefault();
                        event.stopPropagation();
                        return;
                    }

                    event.stopPropagation();
                    event.preventDefault();

                    const square = event.currentTarget;
                    const rank = parseInt(square.dataset.rank);
                    const file = parseInt(square.dataset.file);
                    const squareId = square.dataset.square;

                    // Validate square data
                    if (!squareId || isNaN(rank) || isNaN(file)) {
                        console.error(
                            "Invalid square data:",
                            squareId,
                            rank,
                            file,
                        );
                        return;
                    }

                    // Block all interactions during puzzle opponent thinking
                    if (
                        this.config.appletMode === "puzzle" &&
                        this.puzzleOpponentThinking
                    ) {
                        console.log(
                            "EventManager: Board clicks blocked during puzzle opponent response",
                        );
                        return;
                    }

                    // Block all interactions during puzzle pause (waiting for manual advance)
                    if (
                        this.config.appletMode === "puzzle" &&
                        this.puzzleWaitingForAdvance
                    ) {
                        console.log(
                            "EventManager: Board clicks blocked - press > or \u2192 to continue",
                        );
                        return;
                    }

                    // Delegate to centralized square interaction logic
                    this.handleSquareInteraction(squareId, rank, file, "click");
                },

                // Right click handler
                rightClick: (event) => {
                    event.preventDefault();
                    return false;
                },

                // Mouse down handler
                mouseDown: (event) => {
                    if (event.button === 2) {
                        event.preventDefault();
                        // If promotion prompt is active, deselect and then start drawing
                        if (this.promotionPromptActive) {
                            this.closePromotionPrompt();
                            this.clearSelection();
                            // Apply highlighting changes immediately to clean up alternate square
                            this.highlightManager.updateAllIntelligent();
                            // Continue to start drawing after deselection
                        }
                        this.startDrawing(event.target.dataset.square);
                    }
                },

                // Mouse up handler
                mouseUp: (event) => {
                    if (event.button === 2 && this.drawingState.isDrawing) {
                        event.preventDefault();
                        this.finishDrawing(event.target.dataset.square);
                    }
                },

                // Mouse move handler
                mouseMove: (event) => {
                    if (this.drawingState.isDrawing && event.buttons === 2) {
                        event.preventDefault();
                        this.updateDrawing(event.target.dataset.square);
                    }
                },

                // Touch start handler with scroll threshold
                touchStart: (event) => {
                    // Skip if currently scrolling
                    if (this.drawingState.isScrolling) {
                        return;
                    }

                    // Skip if this touch is on a checkbox or other input element
                    if (
                        event.target.matches(
                            'input[type="checkbox"], input, select, button, textarea',
                        )
                    ) {
                        return;
                    }

                    // A) DO NOT update LIH on touch start - clear existing highlights only
                    // Touch highlight references removed per user request

                    // Mark that touch interaction started to prevent click conflicts
                    this.drawingState.touchHandled = false;
                    this.drawingState.lastTouchTime = Date.now();

                    const touch = event.touches[0];
                    const square = event.target.dataset.square;

                    // Store touch start info for potential tap or long press
                    this.drawingState.startSquare = square;
                    this.drawingState.currentSquare = square;
                    this.drawingState.hasMoved = false;
                    this.drawingState.startX = touch.clientX;
                    this.drawingState.startY = touch.clientY;

                    // Start long press timer
                    this.drawingState.longPressTimer = setTimeout(() => {
                        if (
                            !this.drawingState.isScrolling &&
                            !this.drawingState.hasMoved
                        ) {
                            // If promotion prompt is active, deselect and then start drawing
                            if (this.promotionPromptActive) {
                                this.closePromotionPrompt();
                                this.clearSelection();
                                // Apply highlighting changes immediately to clean up alternate square
                                this.highlightManager.updateAllIntelligent();
                                // Continue to start drawing after deselection
                            }
                            // Long press completed - start drawing
                            this.startDrawing(this.drawingState.startSquare);
                        }
                    }, this.drawingState.longPressDelay);
                },

                // Touch move handler with scroll threshold
                touchMove: (event) => {
                    if (
                        !this.drawingState.startSquare ||
                        this.drawingState.isScrolling
                    )
                        return;

                    // Skip if this touch is on a checkbox or other input element
                    if (
                        event.target.matches(
                            'input[type="checkbox"], input, select, button, textarea',
                        )
                    ) {
                        return;
                    }

                    const touch = event.touches[0];
                    const deltaX = Math.abs(
                        touch.clientX - this.drawingState.startX,
                    );
                    const deltaY = Math.abs(
                        touch.clientY - this.drawingState.startY,
                    );
                    const distance = Math.sqrt(
                        deltaX * deltaX + deltaY * deltaY,
                    );

                    // Check for movement beyond thresholds
                    if (
                        !this.drawingState.hasMoved &&
                        distance > this.drawingState.movementThreshold
                    ) {
                        this.drawingState.hasMoved = true;

                        // If movement exceeds scroll threshold and we're not drawing yet, cancel touch
                        if (
                            !this.drawingState.isDrawing &&
                            distance > this.drawingState.scrollThreshold
                        ) {
                            this.drawingState.isScrolling = true;
                            if (this.drawingState.longPressTimer) {
                                clearTimeout(this.drawingState.longPressTimer);
                                this.drawingState.longPressTimer = null;
                            }
                            // Reset touch state to allow scrolling
                            this.drawingState.startSquare = null;
                            this.drawingState.currentSquare = null;
                            this.drawingState.hasMoved = false;
                            return;
                        }
                    }

                    // If we're drawing, prevent scrolling and update drawing
                    if (this.drawingState.isDrawing) {
                        event.preventDefault();
                        const elementAtPoint = document.elementFromPoint(
                            touch.clientX,
                            touch.clientY,
                        );
                        const currentSquare =
                            elementAtPoint?.closest("[data-square]")?.dataset
                                .square;

                        if (
                            currentSquare &&
                            currentSquare !== this.drawingState.currentSquare
                        ) {
                            this.drawingState.currentSquare = currentSquare;
                            this.updateDrawing(currentSquare);
                        }
                    }
                },

                // Touch end handler - unified implementation
                touchEnd: (event) => {
                    // Reset scrolling mode when all fingers are lifted
                    if (event.touches.length === 0) {
                        this.drawingState.isScrolling = false;
                    }

                    // Skip if this was part of scrolling - don't interfere at all
                    if (this.drawingState.isScrolling) {
                        return;
                    }

                    // Skip if there are still touches (multi-touch gesture) - but don't update LIH yet
                    if (event.touches.length > 0) {
                        return;
                    }

                    // Touch end processing - LIH removed per user request
                    const touch = event.changedTouches[0];
                    const elementAtPoint = document.elementFromPoint(
                        touch.clientX,
                        touch.clientY,
                    );

                    // Skip if we never started tracking this touch
                    if (!this.drawingState.startSquare) {
                        return;
                    }

                    const wasDrawing = this.drawingState.isDrawing;

                    if (this.drawingState.longPressTimer) {
                        clearTimeout(this.drawingState.longPressTimer);
                        this.drawingState.longPressTimer = null;
                    }

                    if (wasDrawing) {
                        // Long-tap drawing - finish drawing at release point
                        // Only prevent default for drawing interactions
                        if (event.cancelable) {
                            event.preventDefault();
                        }
                        const squareElement =
                            elementAtPoint?.closest("[data-square]");
                        const squareId = squareElement?.dataset.square;
                        if (squareId) {
                            this.finishDrawing(squareId);
                        } else {
                            this.cancelDrawing();
                        }
                    } else if (!this.drawingState.hasMoved) {
                        // Single tap - create synthetic click (LIH already set above)
                        if (event.cancelable) {
                            event.preventDefault();
                        }
                        const squareElement =
                            event.target.closest("[data-square]");
                        if (squareElement) {
                            const syntheticEvent = {
                                currentTarget: squareElement,
                                preventDefault: () => {},
                                stopPropagation: () => {},
                            };
                            this.handleSquareClick(syntheticEvent);
                        }
                    }

                    // Reset state
                    this.drawingState.startSquare = null;
                    this.drawingState.currentSquare = null;
                    this.drawingState.hasMoved = false;
                },

                // Keyboard handlers now implemented directly in attachKeyboardListeners

                // Tab click handler
                tabClick: (event) => {
                    const tab = event.target.dataset.tab;
                    if (tab) {
                        this.switchTab(tab);
                    }
                },

                // Settings change handler
                settingChange: (event) => {
                    this.handleSettingChange(event);
                },

                // Comment blur handler (for saving custom comments)
                commentBlur: (event) => {
                    // Only save when showing comments (not SFEN) and custom comments are allowed
                    if (
                        !this.config.displaySFEN &&
                        this.config.allowCustomComments
                    ) {
                        const newComment = event.target.value;

                        // Determine the current position
                        // null = current position (during live play)
                        // -1 = starting position (when navigating)
                        // >= 0 = specific move position (when navigating)
                        const position =
                            this.currentNavigationIndex === null
                                ? this.moveHistory.length > 0
                                    ? this.moveHistory.length - 1
                                    : -1
                                : this.currentNavigationIndex;

                        if (position === -1) {
                            // Save starting position comment
                            this.startingComment = newComment;
                        } else if (
                            position >= 0 &&
                            position < this.moveHistory.length
                        ) {
                            // Save move comment
                            this.moveHistory[position].comment = newComment;
                        }
                        // Update game export and PGN export to reflect the change
                        this.updateGameExport();
                        this.updatePGNExport();
                        this.updateKIFExport();
                    }
                },

                // Navigation click handler
                navigationClick: (event) => {
                    const action = event.target.dataset.nav;
                    switch (action) {
                        case "first":
                            this.navigateFirst();
                            break;
                        case "prev":
                            this.navigatePrevious();
                            break;
                        case "next":
                            this.navigateNext();
                            break;
                        case "last":
                            this.navigateLast();
                            break;
                    }
                },

                // Game action handler
                gameActionClick: (event) => {
                    const action = event.target.dataset.gameAction;
                    switch (action) {
                        case "new":
                            this.showNewGameConfirmation();
                            break;
                        case "reset":
                            this.showResetConfirmation();
                            break;
                        case "undo":
                            this.undoLastMove();
                            break;
                        case "flip":
                            this.flipBoard();
                            break;
                    }
                },

                // Promotion choice handler
                promotionChoice: (event) => {
                    const promote = event.target.dataset.promote === "yes";
                    this.handlePromotionChoice(promote);
                },

                // Modal close handler
                modalClose: (event) => {
                    event.stopPropagation();
                    this.cancelPromotion();
                },

                // Modal backdrop click handler
                modalBackdropClick: (event) => {
                    if (event.target === event.currentTarget) {
                        if (event.target.dataset.promotionModal !== undefined) {
                            this.cancelPromotion();
                        }
                    }
                },

                // Lion return is now handled through promotion system
                // (Legacy lion return action handler removed)
            },

            // Utility function to refresh all event listeners
            refresh: () => {
                this.eventManager.cleanup();
                this.eventManager.initialize();
            },
        };

        // CENTRALIZED GAME STATE MANAGER
        // Handles all game state changes consistently ensuring proper state synchronization
        // and preventing fragmented updates across different parts of the application
        gameStateManager = {
            // Initialize all state management systems
            initialize: () => {
                // Validate initial state consistency
                this.gameStateManager.validateState();
            },

            // Centralized state update method for all game state changes
            updateGameState: (updates = {}) => {
                try {
                    // Track what changed for proper event firing
                    const changes = {};

                    // Handle player turn changes
                    if (
                        updates.currentPlayer !== undefined &&
                        updates.currentPlayer !== this.currentPlayer
                    ) {
                        changes.currentPlayer = {
                            from: this.currentPlayer,
                            to: updates.currentPlayer,
                        };
                        this.currentPlayer = updates.currentPlayer;
                    }

                    // Handle board state changes
                    if (updates.board !== undefined) {
                        changes.board = { from: this.board, to: updates.board };
                        this.board = updates.board;
                    }

                    // Handle move history changes
                    if (updates.moveHistory !== undefined) {
                        changes.moveHistory = {
                            from: this.moveHistory,
                            to: updates.moveHistory,
                        };
                        this.moveHistory = updates.moveHistory;
                    }

                    // Handle Lion capture state
                    if (updates.lastLionCapture !== undefined) {
                        changes.lastLionCapture = {
                            from: this.lastLionCapture,
                            to: updates.lastLionCapture,
                        };
                        this.lastLionCapture = updates.lastLionCapture;
                    }

                    // Handle navigation state
                    if (updates.isNavigating !== undefined) {
                        changes.isNavigating = {
                            from: this.isNavigating,
                            to: updates.isNavigating,
                        };
                        this.isNavigating = updates.isNavigating;
                    }

                    if (updates.currentNavigationIndex !== undefined) {
                        changes.currentNavigationIndex = {
                            from: this.currentNavigationIndex,
                            to: updates.currentNavigationIndex,
                        };
                        this.currentNavigationIndex =
                            updates.currentNavigationIndex;
                        // Keep the tree cursor in sync with the integer index.
                        if (updates.currentNavigationIndex === null) {
                            this.currentNode = null; // live leaf
                        } else if (updates.currentNavigationIndex === -1) {
                            this.currentNode = this.moveTree; // start position
                        } else {
                            this.currentNode =
                                this.moveHistory[updates.currentNavigationIndex] ??
                                null;
                        }
                    }

                    // Handle moveTree changes (rarely needed; included for completeness)
                    if (updates.moveTree !== undefined) {
                        changes.moveTree = {
                            from: this.moveTree,
                            to: updates.moveTree,
                        };
                        this.moveTree = updates.moveTree;
                    }

                    // Handle edit mode state
                    if (updates.editMode !== undefined) {
                        changes.editMode = {
                            from: { ...this.editMode },
                            to: updates.editMode,
                        };
                        Object.assign(this.editMode, updates.editMode);
                    }

                    // Handle selection state
                    if (updates.selectedSquare !== undefined) {
                        changes.selectedSquare = {
                            from: this.selectedSquare,
                            to: updates.selectedSquare,
                        };
                        this.selectedSquare = updates.selectedSquare;
                    }

                    if (updates.validMoves !== undefined) {
                        changes.validMoves = {
                            from: this.validMoves,
                            to: updates.validMoves,
                        };
                        this.validMoves = updates.validMoves;
                    }

                    // Handle tab state
                    if (updates.currentTab !== undefined) {
                        changes.currentTab = {
                            from: this.currentTab,
                            to: updates.currentTab,
                        };
                        this.currentTab = updates.currentTab;
                    }

                    // Validate state consistency after updates
                    this.gameStateManager.validateState();

                    // Trigger appropriate UI updates based on what changed
                    this.gameStateManager.handleStateChanges(changes);

                    return changes;
                } catch (error) {
                    console.error("Error in updateGameState:", error);
                    throw error;
                }
            },

            // Handle state change effects
            handleStateChanges: (changes) => {
                // Update display if game state changed
                if (
                    changes.currentPlayer ||
                    changes.moveHistory ||
                    changes.isNavigating ||
                    changes.currentNavigationIndex
                ) {
                    this.updateDisplay();
                }

                // Update board rendering if board state changed
                if (changes.board) {
                    this.updateBoard();
                }

                // Update square highlights if selection changed
                if (changes.selectedSquare || changes.validMoves) {
                    this.updateSquareHighlights();
                }

                // Update tab display if tab changed
                if (changes.currentTab) {
                    // Tab switching UI updates are handled in switchTab method
                    // No additional action needed here
                }

                // Update edit mode display if edit state changed
                if (changes.editMode) {
                    this.updateEditModeDisplay();
                }
            },

            // Validate state consistency
            validateState: () => {
                // Ensure currentPlayer is valid
                if (!["w", "b"].includes(this.currentPlayer)) {
                    console.warn(
                        `Invalid currentPlayer: ${this.currentPlayer}, resetting to 'b'`,
                    );
                    this.currentPlayer = "b";
                }

                // Ensure board is valid 12x12 array
                if (!Array.isArray(this.board) || this.board.length !== 12) {
                    console.warn("Invalid board structure detected");
                    return false;
                }

                // Ensure moveHistory is valid array
                if (!Array.isArray(this.moveHistory)) {
                    console.warn("Invalid moveHistory structure detected");
                    this.moveHistory = [];
                    this.moveTree = { id: "root", children: [], parent: null, ply: 0 };
                    this.currentNode = null;
                }

                // Ensure moveTree sentinel is present and valid
                if (!this.moveTree || typeof this.moveTree !== "object") {
                    console.warn("Invalid moveTree detected, reinitializing");
                    this.moveTree = { id: "root", children: [], parent: null, ply: 0 };
                    this.moveHistory = [];
                    this.currentNode = null;
                }

                // Ensure navigation state consistency.
                // isNavigating=true with currentNavigationIndex=null is valid when
                // _viewedNode is set — it means we are viewing an off-branch variation
                // node (not a main-line position).  Only treat it as an inconsistency
                // when _viewedNode is also absent.
                if (this.isNavigating && this.currentNavigationIndex === null && !this._viewedNode) {
                    console.warn("Navigation state inconsistency detected");
                    this.isNavigating = false;
                }

                return true;
            },

            // Centralized settings update
            updateSettings: (newSettings) => {
                try {
                    const oldConfig = { ...this.config };
                    Object.assign(this.config, newSettings);

                    // Handle specific setting changes that require special processing
                    if (
                        newSettings.flipView !== undefined &&
                        newSettings.flipView !== oldConfig.flipView
                    ) {
                        this.container.setAttribute(
                            "data-flip-view",
                            newSettings.flipView.toString(),
                        );
                    }

                    if (
                        newSettings.boardSize !== undefined &&
                        newSettings.boardSize !== oldConfig.boardSize
                    ) {
                        this.container.className = `chushogi-container ${this.config.boardSize}`;
                    }

                    // Re-render if significant changes (boardSize, flipView, showPromotionZones affect HTML structure)
                    if (
                        newSettings.boardSize ||
                        newSettings.flipView ||
                        newSettings.showPromotionZones !== undefined
                    ) {
                        // Store current game state to preserve highlights and promotion state
                        const currentSelected = this.selectedSquare;
                        const currentValidMoves = [...this.validMoves];

                        const currentPromotionState = {
                            active: this.promotionPromptActive,
                            move: this.promotionMove,
                            destination: this.promotionDestinationSquare,
                            deferral: this.promotionDeferralSquare,
                            alternate: this.promotionAlternateSquare,
                        };
                        const currentLionReturnState = {
                            active: this.lionReturnPromptActive,
                            alternate: this.lionReturnAlternateSquare,
                        };

                        this.render();
                        this.attachEventListeners();
                        this.updateDisplay();

                        // Restore game state
                        this.selectedSquare = currentSelected;
                        this.validMoves = currentValidMoves;

                        this.promotionPromptActive =
                            currentPromotionState.active;
                        this.promotionMove = currentPromotionState.move;
                        this.promotionDestinationSquare =
                            currentPromotionState.destination;
                        this.promotionDeferralSquare =
                            currentPromotionState.deferral;
                        this.promotionAlternateSquare =
                            currentPromotionState.alternate;
                        this.lionReturnPromptActive =
                            currentLionReturnState.active;
                        this.lionReturnAlternateSquare =
                            currentLionReturnState.alternate;

                        // Restore highlights after full re-render
                        this.updateSquareHighlights();

                        // Restore piece previews if promotion prompt was active
                        if (
                            currentPromotionState.active &&
                            currentPromotionState.move
                        ) {
                            this.recreatePromotionPreviews(
                                currentPromotionState.move,
                            );
                        }

                        // Restore piece previews if Lion return prompt was active
                        if (currentLionReturnState.active) {
                            this.recreateLionReturnPreviews();
                        }
                    } else if (
                        newSettings.showLastMove !== undefined ||
                        newSettings.showInfluenceDisplay !== undefined ||
                        newSettings.showLegalMoves !== undefined ||
                        newSettings.showMoveablePieces !== undefined ||
                        newSettings.allowIllegalMoves !== undefined ||
                        newSettings.midpointProtection !== undefined ||
                        newSettings.trappedLancePromotion !== undefined ||
                        newSettings.repetitionHandling !== undefined ||
                        newSettings.showCoordinates !== undefined ||
                        newSettings.displaySFEN !== undefined ||
                        newSettings.displayInlineNotation !== undefined
                    ) {
                        // Handle showCoordinates with CSS class toggle (more efficient than full re-render)
                        if (newSettings.showCoordinates !== undefined) {
                            const gameElement =
                                this.container.querySelector(".chushogi-game");
                            if (gameElement) {
                                gameElement.classList.remove(
                                    "show-coordinates",
                                    "hide-coordinates",
                                );
                                gameElement.classList.add(
                                    this.config.showCoordinates
                                        ? "show-coordinates"
                                        : "hide-coordinates",
                                );
                            }
                        }

                        // Clear selection and close promotion prompt when rule settings are toggled
                        if (
                            newSettings.allowIllegalMoves !== undefined ||
                            newSettings.midpointProtection !== undefined ||
                            newSettings.trappedLancePromotion !== undefined
                        ) {
                            this.clearSelection();
                            this.closePromotionPrompt();
                        }

                        // Update move history display when inline notation setting changes
                        if (newSettings.displayInlineNotation !== undefined) {
                            this.updateMoveHistory();
                            this.updateMoveHistoryHighlight();
                        }

                        // Update SFEN/Comment display when displaySFEN setting changes
                        if (newSettings.displaySFEN !== undefined) {
                            this.updateDisplay();
                        }

                        // Update Rules panel when rule settings change
                        if (
                            newSettings.midpointProtection !== undefined ||
                            newSettings.trappedLancePromotion !== undefined ||
                            newSettings.repetitionHandling !== undefined
                        ) {
                            this.updateRulesPanel();
                        }

                        // Update highlights for highlight-related settings
                        this.highlightManager.updateAll();

                        // If showLastMove changed, also update the position display
                        if (newSettings.showLastMove !== undefined) {
                            this.updateDisplay();
                        }
                    }

                    return true;
                } catch (error) {
                    console.error("Error updating settings:", error);
                    return false;
                }
            },

            // Reset game state to initial position
            resetGameState: () => {
                this.gameStateManager.updateGameState({
                    currentPlayer: this.startingPlayer || "b",
                    moveHistory: [],
                    lastLionCapture: this.startingLionCapture || null,
                    isNavigating: false,
                    currentNavigationIndex: null,
                    selectedSquare: null,
                    validMoves: null,
                });

                // Reset board to starting position
                const defaultSFEN =
                    "lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b - 1";
                this.loadSFEN(this.startingSFEN || defaultSFEN);

                // Clear any promotion or drawing states
                this.clearSelection();
                this.clearAllDrawings();
                this.closePromotionPrompt();
            },
        };

        // Centralized square interaction handler
        // Consolidates all square click/touch logic
        handleSquareInteraction(
            squareId,
            rank,
            file,
            interactionType = "click",
        ) {
            // Clear all drawings on normal click/tap (works in all modes)
            this.clearAllDrawings();

            // Block piece movement clicks in viewOnly mode (but allow drawing clearing above).
            // Pieces are not movable in viewOnly mode, so clicks are treated the
            // same way as clicking an immovable piece: show its info instead of
            // allowing selection/movement.
            if (this.config.appletMode === "viewOnly") {
                console.log("Piece movement clicks blocked in viewOnly mode");
                const viewOnlyPiece = this.board[rank][file];
                if (viewOnlyPiece) {
                    this.inspectSquare(squareId);
                } else {
                    this.inspectedSquare = null;
                    this.updatePieceInfoPanel();
                }
                return;
            }

            // In puzzle mode, force allowIllegalMoves to false
            if (this.config.appletMode === "puzzle") {
                this.config.allowIllegalMoves = false;
            }

            // Handle edit mode - check if we're in edit tab and handle piece placement
            // Edit mode should work regardless of navigation state
            if (this.currentTab === "edit") {
                if (this.editMode.counterStrikeSelection) {
                    // Handle Counter-strike square selection
                    this.setCounterStrikeSquare(squareId);
                    return;
                } else if (this.editMode.selectedPiece) {
                    // Place the selected piece on the clicked square
                    this.placePieceOnBoard(squareId);
                    return;
                } else {
                    // No piece selected from sidebar - handle arbitrary board editing
                    this.handleEditModeBoardClick(squareId);
                    return;
                }
            }

            // Lion return prompt clicks are now handled by the promotion system below
            // (Lion return reuses promotion UI for consistency)

            // Handle promotion prompt clicks (includes Lion return via promotion system)
            if (this.promotionPromptActive && this.promotionMove) {
                console.log("Promotion prompt active, checking click:", {
                    squareId,
                    destinationSquare: this.promotionDestinationSquare,
                    deferralSquare: this.promotionDeferralSquare,
                    promotionMove: this.promotionMove,
                });
                if (squareId === this.promotionDestinationSquare) {
                    // Clicked destination square - promote and move
                    console.log(
                        "Clicked promotion destination square:",
                        squareId,
                    );
                    this.executePromotionMove(true);
                    return;
                } else if (squareId === this.promotionDeferralSquare) {
                    // Clicked deferral square - move without promotion
                    console.log("Clicked promotion deferral square:", squareId);
                    this.executePromotionMove(false);
                    return;
                } else if (
                    squareId === this.promotionMove.from &&
                    !this.promotionAlternateSquare
                ) {
                    // Clicked origin square (when not covered) - cancel and deselect
                    this.closePromotionPrompt();
                    this.clearSelection();
                    return;
                } else if (squareId === this.promotionAlternateSquare) {
                    // Clicked alternate square (when origin is covered) - cancel and deselect
                    this.closePromotionPrompt();
                    this.clearSelection();
                    return;
                }
                // Clicked somewhere else during promotion prompt - ignore
                return;
            }

            // Normal game interaction - handle piece selection and moves
            const piece = this.board[rank][file];

            // Check if we're in Lion double move midpoint selection mode
            if (this.doubleMoveMidpoint) {
                if (this.doubleMoveDestinations.includes(squareId)) {
                    // Check if clicking origin when it's blocked by repetition - just deselect
                    if (
                        squareId === this.doubleMoveOrigin &&
                        this.doubleMoveRepeatToOrigin
                    ) {
                        console.log(
                            "Clicked origin during double move modal but blocked by repetition - deselecting",
                        );
                        this.deselectSquare();
                        return;
                    }

                    console.log(
                        "Executing Lion double move from modal state:",
                        this.doubleMoveOrigin,
                        "->",
                        this.doubleMoveMidpoint,
                        "->",
                        squareId,
                    );
                    // Execute Lion double move
                    this.executeLionDoubleMove(
                        this.doubleMoveOrigin,
                        this.doubleMoveMidpoint,
                        squareId,
                    );
                    return;
                } else if (squareId === this.doubleMoveMidpoint) {
                    console.log(
                        "Clicked midpoint during double move modal - executing normal move to midpoint",
                    );
                    // Execute normal move to the midpoint and cancel double move
                    this.executeSquareMove(
                        this.doubleMoveOrigin,
                        this.doubleMoveMidpoint,
                    );
                    return;
                } else {
                    console.log(
                        "Canceling Lion double move - clicked outside valid destinations",
                    );
                    this.deselectSquare(); // This will clear double move state
                    // Continue with normal selection logic below
                }
            }

            if (this.selectedSquare) {
                // A square is already selected - handle move or reselection
                if (this.selectedSquare === squareId) {
                    // Clicked same square - deselect
                    this.deselectSquare();
                    return;
                }

                // Check if clicking on a valid move square
                if (this.validMoves && this.validMoves.includes(squareId)) {
                    // Check if this is a double move first move (violet square) that could start a double move
                    if (
                        this.lionFirstMoves &&
                        this.lionFirstMoves.includes(squareId)
                    ) {
                        showDebugMessage(
                            false,
                            "DEBUG: Valid Lion first move clicked:",
                            {
                                squareId,
                                selectedSquare: this.selectedSquare,
                                lionFirstMoves: this.lionFirstMoves,
                            },
                        );

                        // Determine the piece type and calculate appropriate second moves
                        const [selectedRank, selectedFile] = this.parseSquareId(
                            this.selectedSquare,
                        );
                        const piece = this.board[selectedRank][selectedFile];
                        let potentialSecondMoves = [];

                        if (this.isLionPiece(piece)) {
                            potentialSecondMoves =
                                this.calculateLionSecondMoves(
                                    squareId,
                                    this.selectedSquare,
                                );
                        } else if (this.isHornedFalconPiece(piece)) {
                            potentialSecondMoves =
                                this.calculateHornedFalconSecondMoves(
                                    squareId,
                                    this.selectedSquare,
                                    piece,
                                );
                        } else if (this.isSoaringEaglePiece(piece)) {
                            potentialSecondMoves =
                                this.calculateSoaringEagleSecondMoves(
                                    squareId,
                                    this.selectedSquare,
                                    piece,
                                );
                        }

                        // Allow double move if there are any valid second moves (even just return to origin)
                        if (potentialSecondMoves.length > 0) {
                            // More than just returning to origin - offer double move option
                            const pieceName = this.isLionPiece(piece)
                                ? "Lion"
                                : this.isHornedFalconPiece(piece)
                                  ? "Horned Falcon"
                                  : "Soaring Eagle";
                            console.log(
                                `${pieceName} first move with multiple second move options, entering double move mode`,
                            );
                            this.startLionDoubleMove(
                                this.selectedSquare,
                                squareId,
                            );
                            return;
                        } else {
                            console.log(
                                "Not enough second moves to trigger double move mode",
                            );
                        }
                    }

                    // Execute as normal move (this includes clicking violet squares to make normal moves to midpoint)
                    console.log(
                        "Executing normal move:",
                        this.selectedSquare,
                        "->",
                        squareId,
                    );
                    this.executeSquareMove(this.selectedSquare, squareId);
                    return;
                }

                // Check if clicking on own piece for reselection
                if (
                    piece &&
                    (this.config.allowIllegalMoves ||
                        piece.color === this.currentPlayer)
                ) {
                    this.selectSquare(squareId);
                    return;
                }

                // Invalid move - deselect and potentially select new piece
                // But first check if we're in double move mode and need to cancel it
                if (this.doubleMoveMidpoint) {
                    console.log(
                        "Canceling double move - invalid square clicked",
                    );
                    this.deselectSquare(); // This will clear double move state
                } else {
                    this.deselectSquare();
                }

                if (
                    piece &&
                    (this.config.allowIllegalMoves ||
                        piece.color === this.currentPlayer)
                ) {
                    this.selectSquare(squareId);
                } else if (piece) {
                    this.inspectSquare(squareId);
                }
            } else {
                // No square selected - select if it's current player's piece
                if (
                    piece &&
                    (this.config.allowIllegalMoves ||
                        piece.color === this.currentPlayer)
                ) {
                    this.selectSquare(squareId);
                } else if (piece) {
                    this.inspectSquare(squareId);
                } else {
                    // Empty square clicked - clear any passively inspected piece
                    this.inspectedSquare = null;
                    this.updatePieceInfoPanel();
                }
            }
        }

        // Removed duplicate - using the executeSquareMove method in the legacy wrapper section

        // ======================
        // LEGACY WRAPPER FUNCTIONS
        // These provide backward compatibility for existing event handler references
        // ======================

        // Legacy square click handler - forwards to centralized system
        handleSquareClick(event) {
            const square = event.currentTarget;
            const rank = parseInt(square.dataset.rank);
            const file = parseInt(square.dataset.file);
            const squareId = square.dataset.square;

            if (!squareId || isNaN(rank) || isNaN(file)) {
                console.error("Invalid square data:", squareId, rank, file);
                return;
            }

            this.handleSquareInteraction(squareId, rank, file, "click");
        }

        // Legacy drawing event handlers - forward to centralized system
        handleRightClick(event) {
            return this.eventManager.handlers.rightClick(event);
        }
        handleMouseDown(event) {
            return this.eventManager.handlers.mouseDown(event);
        }
        handleMouseUp(event) {
            return this.eventManager.handlers.mouseUp(event);
        }
        handleMouseMove(event) {
            return this.eventManager.handlers.mouseMove(event);
        }
        handleTouchStart(event) {
            return this.eventManager.handlers.touchStart(event);
        }
        handleTouchEnd(event) {
            return this.eventManager.handlers.touchEnd(event);
        }
        handleTouchMove(event) {
            return this.eventManager.handlers.touchMove(event);
        }

        // Legacy game action methods - these need to be implemented to support the square interaction logic
        // DEPRECATED: Use clearSelection() or gameStateManager.updateGameState directly
        deselectSquare() {
            this.gameStateManager.updateGameState({
                selectedSquare: null,
                validMoves: [],
                lionFirstMoves: [],
                // Clear ALL double move state properly - same as clearSelection()
                doubleMoveMidpoint: null,
                doubleMoveOrigin: null,
                doubleMoveDestinations: [],
                // Clear all prompt states
                lionReturnPromptActive: false,
                lionReturnAlternateSquare: null,
                promotionPromptActive: false,
                promotionDestinationSquare: null,
                promotionDeferralSquare: null,
                promotionAlternateSquare: null,
                promotionMove: null,
            });

            // Also directly clear double move state to ensure consistency
            this.doubleMoveMidpoint = null;
            this.doubleMoveOrigin = null;
            this.doubleMoveDestinations = [];
            this.doubleMoveRepeatToOrigin = false;

            console.log(
                "deselectSquare: Cleared all selection and double move state",
            );
            this.highlightManager.updateAll();
            this.updateBoard();
            this.inspectedSquare = null;
            this.updatePieceInfoPanel();
        }

        selectSquare(squareId) {
            const [rank, file] = this.parseSquareId(squareId);
            const piece = this.board[rank][file];

            if (
                !piece ||
                (!this.config.allowIllegalMoves &&
                    piece.color !== this.currentPlayer)
            ) {
                return;
            }

            this.inspectedSquare = null; // Clear any passive inspection when selecting

            // Calculate moves with repetition info
            const movesInfo =
                this.moveValidator.calculateMovesWithRepetitionInfo(
                    squareId,
                    piece,
                );

            // Use centralized state management
            this.gameStateManager.updateGameState({
                selectedSquare: squareId,
                validMoves: [
                    ...movesInfo.normalMoves,
                    ...movesInfo.repeatPromotionMoves,
                    ...movesInfo.illegalMoves,
                ], // All moves (including illegal when allowIllegalMoves is true) for backward compatibility
                // Clear any existing double move state
                doubleMoveMidpoint: null,
                doubleMoveOrigin: null,
                doubleMoveDestinations: [],
            });

            // Store repeat promotion moves and illegal moves separately for highlighting
            this.repeatPromotionMoves = movesInfo.repeatPromotionMoves;
            this.illegalMoves = movesInfo.illegalMoves;

            // Invalidate influence cache when midpoint is cleared
            this.influenceManager.invalidate();

            // Check if this is a piece that can make double moves
            console.log(
                "Piece selected:",
                piece.type,
                "Double move piece?",
                this.isDoubleMovePiece(piece),
            );
            if (this.isDoubleMovePiece(piece)) {
                if (this.isLionPiece(piece)) {
                    this.lionFirstMoves = this.calculateLionFirstMoves(
                        squareId,
                        piece,
                    );
                    console.log(
                        "Lion selected, first moves:",
                        this.lionFirstMoves,
                    );
                } else if (this.isHornedFalconPiece(piece)) {
                    this.lionFirstMoves = this.calculateHornedFalconFirstMoves(
                        squareId,
                        piece,
                    );
                    console.log(
                        "Horned Falcon selected, first moves:",
                        this.lionFirstMoves,
                    );
                } else if (this.isSoaringEaglePiece(piece)) {
                    this.lionFirstMoves = this.calculateSoaringEagleFirstMoves(
                        squareId,
                        piece,
                    );
                    console.log(
                        "Soaring Eagle selected, first moves:",
                        this.lionFirstMoves,
                    );
                }

                // Filter first moves based on Counter-strike rule
                // For double move pieces, only filter if the first move itself is a capture that violates Counter-strike
                // Don't filter based on potential second move destinations
                console.log(
                    "Before Counter-strike filter:",
                    this.lionFirstMoves.length,
                    "moves",
                );
                console.log(
                    "Counter-strike state active:",
                    this.lastLionCapture,
                );
                this.lionFirstMoves = this.lionFirstMoves.filter((move) => {
                    // For Lion pieces, apply full Counter-strike validation
                    if (this.isLionPiece(piece)) {
                        const counterStrikeResult =
                            this.moveValidator.validateCounterStrike(
                                squareId,
                                move,
                                piece,
                            );
                        if (!counterStrikeResult.valid) {
                            console.log(
                                "Counter-strike blocked Lion move:",
                                squareId,
                                "->",
                                move,
                                counterStrikeResult.reason,
                            );
                        }
                        return counterStrikeResult.valid;
                    }

                    // For Horned Falcon/Soaring Eagle, only block if the FIRST move itself captures a Lion illegally
                    const [toRank, toFile] = this.parseSquareId(move);
                    const targetPiece = this.board[toRank][toFile];

                    if (
                        targetPiece &&
                        (targetPiece.type === "N" || targetPiece.type === "+O")
                    ) {
                        // First move is capturing a Lion - apply Counter-strike validation
                        const counterStrikeResult =
                            this.moveValidator.validateCounterStrike(
                                squareId,
                                move,
                                piece,
                            );
                        if (!counterStrikeResult.valid) {
                            console.log(
                                "Counter-strike blocked Falcon/Eagle first move capture:",
                                squareId,
                                "->",
                                move,
                                counterStrikeResult.reason,
                            );
                        }
                        return counterStrikeResult.valid;
                    }

                    // First move is not capturing a Lion - always allow
                    return true;
                });
                console.log(
                    "After Counter-strike filter:",
                    this.lionFirstMoves.length,
                    "moves",
                );

                // Filter first moves based on repetition rules
                // Only block a purple highlight if NO moves that visit that square are legal
                if (
                    !this.config.allowIllegalMoves &&
                    this.config.repetitionHandling !== "relaxed"
                ) {
                    console.log(
                        "Before repetition filter:",
                        this.lionFirstMoves.length,
                        "moves",
                    );

                    this.lionFirstMoves = this.lionFirstMoves.filter(
                        (midpointSquare) => {
                            // Check if normal move to this square would be legal
                            const normalMoveBlocked =
                                this.moveValidator.wouldMoveViolateRepetition(
                                    squareId,
                                    midpointSquare,
                                    piece,
                                );

                            // If normal move is legal, keep the purple highlight
                            if (!normalMoveBlocked) {
                                return true;
                            }

                            // Normal move is blocked, check if ANY double move through this square is legal
                            let allSecondMoves = [];
                            if (this.isLionPiece(piece)) {
                                allSecondMoves = this.calculateLionSecondMoves(
                                    midpointSquare,
                                    squareId,
                                    piece,
                                );
                            } else if (this.isHornedFalconPiece(piece)) {
                                allSecondMoves =
                                    this.calculateHornedFalconSecondMoves(
                                        midpointSquare,
                                        squareId,
                                        piece,
                                    );
                            } else if (this.isSoaringEaglePiece(piece)) {
                                allSecondMoves =
                                    this.calculateSoaringEagleSecondMoves(
                                        midpointSquare,
                                        squareId,
                                        piece,
                                    );
                            }

                            // Check if any double move destination would be legal
                            const hasLegalDoubleMove = allSecondMoves.some(
                                (destSquare) => {
                                    const doubleMoveBlocked =
                                        this.moveValidator.wouldDoubleMoveViolateRepetition(
                                            squareId,
                                            midpointSquare,
                                            destSquare,
                                            piece,
                                        );
                                    return !doubleMoveBlocked;
                                },
                            );

                            // Keep the purple highlight if there's at least one legal double move
                            if (hasLegalDoubleMove) {
                                console.log(
                                    "First move blocked by repetition but has legal double moves:",
                                    squareId,
                                    "->",
                                    midpointSquare,
                                );
                                return true;
                            }

                            // Both normal move and all double moves are blocked - remove purple highlight
                            console.log(
                                "First move blocked by repetition (no legal moves visit this square):",
                                squareId,
                                "->",
                                midpointSquare,
                            );
                            return false;
                        },
                    );

                    console.log(
                        "After repetition filter:",
                        this.lionFirstMoves.length,
                        "moves",
                    );
                }

                // Add first moves to valid moves so they can be treated as normal moves too
                this.lionFirstMoves.forEach((move) => {
                    if (!this.validMoves.includes(move)) {
                        this.validMoves.push(move);
                    }
                });
            } else {
                this.lionFirstMoves = [];
            }

            // Update highlights through centralized HighlightManager
            this.highlightManager.updateAll();
            this.updateBoard();
            this.updatePieceInfoPanel();
        }

        // Double move helper functions
        isLionPiece(piece) {
            if (!piece) return false;
            // Lion is 'N' or promoted Kirin is '+O' which becomes a Lion
            return piece.type === "N" || piece.type === "+O";
        }

        isHornedFalconPiece(piece) {
            if (!piece) return false;
            // Horned Falcon is '+H' (promoted Bishop)
            return piece.type === "+H";
        }

        isSoaringEaglePiece(piece) {
            if (!piece) return false;
            // Soaring Eagle is '+D' (promoted Dragon King)
            return piece.type === "+D";
        }

        isDoubleMovePiece(piece) {
            return (
                this.isLionPiece(piece) ||
                this.isHornedFalconPiece(piece) ||
                this.isSoaringEaglePiece(piece)
            );
        }

        // Check if a square is eligible for Lion double moves (adjacent to any Lion)
        isLionDoubleSquare(squareId, targetPiece) {
            if (!targetPiece) return false;

            const [targetRank, targetFile] = this.parseSquareId(squareId);

            // Check all squares on the board for Lions
            for (let rank = 0; rank < 12; rank++) {
                for (let file = 0; file < 12; file++) {
                    const piece = this.board[rank][file];
                    if (piece && this.isLionPiece(piece)) {
                        // Check if this Lion is adjacent to the target square
                        const rankDiff = Math.abs(targetRank - rank);
                        const fileDiff = Math.abs(targetFile - file);
                        const isAdjacent =
                            rankDiff <= 1 &&
                            fileDiff <= 1 &&
                            rankDiff + fileDiff > 0;

                        if (isAdjacent) {
                            return true; // Target square is adjacent to a Lion, so it's double-move-eligible
                        }
                    }
                }
            }

            return false; // No Lions are adjacent to this square
        }

        calculateLionFirstMoves(squareId, piece) {
            // Lion can move to any adjacent square as first move (King-like movement)
            const [rank, file] = this.parseSquareId(squareId);
            const firstMoves = [];

            // Check all 8 adjacent squares
            const directions = [
                [-1, -1],
                [-1, 0],
                [-1, 1],
                [0, -1],
                [0, 1],
                [1, -1],
                [1, 0],
                [1, 1],
            ];

            directions.forEach(([rankOffset, fileOffset]) => {
                const newRank = rank + rankOffset;
                const newFile = file + fileOffset;

                if (
                    newRank >= 0 &&
                    newRank < 12 &&
                    newFile >= 0 &&
                    newFile < 12
                ) {
                    const targetSquare = this.getSquareId(newRank, newFile);
                    const targetPiece = this.board[newRank][newFile];

                    // Can move to empty squares or capture opponent pieces
                    if (
                        !targetPiece ||
                        this.config.allowIllegalMoves ||
                        targetPiece.color !== piece.color
                    ) {
                        firstMoves.push(targetSquare);
                    }
                }
            });

            return firstMoves;
        }

        calculateHornedFalconFirstMoves(squareId, piece) {
            // Horned Falcon has double moves in directions it doesn't slide in
            // Movement: BrlbRlf[av2]fW
            // B = slides diagonally (all diagonals)
            // rlbR = slides laterally (left/right) and backward orthogonally
            // lf[av2]fW = single steps forward orthogonally
            // So it slides in: all diagonals + lateral + backward = only NON-sliding direction is forward orthogonal
            const [rank, file] = this.parseSquareId(squareId);
            const firstMoves = [];

            // Horned Falcon's ONLY non-sliding direction (where double moves are possible)
            // Forward orthogonal: (-1, 0) for black, (1, 0) for white
            const doubleMoveDirections = [
                [-1, 0], // Forward orthogonal only
            ];

            // Adjust for piece color (white pieces face opposite direction)
            const adjustedDirections =
                piece.color === "w"
                    ? doubleMoveDirections.map(([r, f]) => [-r, f])
                    : doubleMoveDirections;

            adjustedDirections.forEach(([rankOffset, fileOffset]) => {
                const newRank = rank + rankOffset;
                const newFile = file + fileOffset;

                if (
                    newRank >= 0 &&
                    newRank < 12 &&
                    newFile >= 0 &&
                    newFile < 12
                ) {
                    const targetSquare = this.getSquareId(newRank, newFile);
                    const targetPiece = this.board[newRank][newFile];

                    // Can move to empty squares or capture opponent pieces
                    if (
                        !targetPiece ||
                        this.config.allowIllegalMoves ||
                        targetPiece.color !== piece.color
                    ) {
                        firstMoves.push(targetSquare);
                    }
                }
            });

            return firstMoves;
        }

        calculateSoaringEagleFirstMoves(squareId, piece) {
            // Soaring Eagle has double moves in directions it doesn't slide in
            // Movement: RrlbRbB[av2]fF - slides orthogonally and backward diagonally, single steps in other directions
            // Double moves are available in forward diagonal directions (non-sliding directions)
            const [rank, file] = this.parseSquareId(squareId);
            const firstMoves = [];

            // Soaring Eagle's non-sliding directions (where double moves are possible)
            // Forward diagonals: (-1, -1) and (-1, 1)
            const doubleMoveDirections = [
                [-1, -1],
                [-1, 1], // Forward diagonals only
            ];

            // Adjust for piece color (white pieces face opposite direction)
            const adjustedDirections =
                piece.color === "w"
                    ? doubleMoveDirections.map(([r, f]) => [-r, f])
                    : doubleMoveDirections;

            adjustedDirections.forEach(([rankOffset, fileOffset]) => {
                const newRank = rank + rankOffset;
                const newFile = file + fileOffset;

                if (
                    newRank >= 0 &&
                    newRank < 12 &&
                    newFile >= 0 &&
                    newFile < 12
                ) {
                    const targetSquare = this.getSquareId(newRank, newFile);
                    const targetPiece = this.board[newRank][newFile];

                    // Can move to empty squares or capture opponent pieces
                    if (
                        !targetPiece ||
                        this.config.allowIllegalMoves ||
                        targetPiece.color !== piece.color
                    ) {
                        firstMoves.push(targetSquare);
                    }
                }
            });

            return firstMoves;
        }

        calculateLionSecondMoves(midpointSquare, originSquare, piece) {
            // Get piece type - use passed piece or try to get from midpoint
            const currentPiece =
                piece ||
                this.board[this.parseSquareId(midpointSquare)[0]][
                    this.parseSquareId(midpointSquare)[1]
                ];

            // Delegate to specialized functions for Falcon and Eagle
            if (currentPiece && currentPiece.type === "+H") {
                return this.calculateHornedFalconSecondMoves(
                    midpointSquare,
                    originSquare,
                    currentPiece,
                );
            } else if (currentPiece && currentPiece.type === "+D") {
                return this.calculateSoaringEagleSecondMoves(
                    midpointSquare,
                    originSquare,
                    currentPiece,
                );
            }

            // Lion logic: can move to any adjacent square from midpoint
            const [rank, file] = this.parseSquareId(midpointSquare);
            const [originRank, originFile] = this.parseSquareId(originSquare);
            const secondMoves = [];

            // Check all 8 adjacent squares from midpoint
            const directions = [
                [-1, -1],
                [-1, 0],
                [-1, 1],
                [0, -1],
                [0, 1],
                [1, -1],
                [1, 0],
                [1, 1],
            ];

            directions.forEach(([rankOffset, fileOffset]) => {
                const newRank = rank + rankOffset;
                const newFile = file + fileOffset;

                if (
                    newRank >= 0 &&
                    newRank < 12 &&
                    newFile >= 0 &&
                    newFile < 12
                ) {
                    const targetSquare = this.getSquareId(newRank, newFile);
                    const targetPiece = this.board[newRank][newFile];

                    // Can move to empty squares or capture opponent pieces
                    // Allow return to origin square (it will be empty after the Lion moves)
                    if (
                        !targetPiece ||
                        this.config.allowIllegalMoves ||
                        targetPiece.color !== this.currentPlayer ||
                        (newRank === originRank && newFile === originFile)
                    ) {
                        secondMoves.push(targetSquare);
                    }
                }
            });

            // Filter moves based on Counter-strike and Bridge-capture rules
            const validSecondMoves = secondMoves.filter((targetSquare) => {
                // Return to origin is always allowed (origin will be empty after first move)
                if (targetSquare === originSquare) {
                    return true;
                }

                // Apply Counter-strike validation
                const counterStrikeResult =
                    this.moveValidator.validateCounterStrike(
                        midpointSquare,
                        targetSquare,
                        currentPiece || {
                            type: "N",
                            color: this.currentPlayer,
                        }, // Assume Lion if piece not found
                    );
                if (!counterStrikeResult.valid) {
                    return false;
                }

                // Apply Bridge-capture validation for double moves
                const bridgeCaptureResult =
                    this.moveValidator.validateBridgeCapture(
                        originSquare, // Use origin square as 'from' for Bridge-capture calculation
                        targetSquare,
                        currentPiece || {
                            type: "N",
                            color: this.currentPlayer,
                        },
                        midpointSquare, // Pass midpoint for double move X-ray calculation
                    );
                if (!bridgeCaptureResult.valid) {
                    return false;
                }

                return true;
            });

            return validSecondMoves;
        }

        calculateHornedFalconSecondMoves(midpointSquare, originSquare, piece) {
            // Horned Falcon's second moves are restricted to the same line as the first move
            const [rank, file] = this.parseSquareId(midpointSquare);
            const [originRank, originFile] = this.parseSquareId(originSquare);
            const secondMoves = [];

            // Always allow return to origin (will be empty after first move)
            secondMoves.push(originSquare);

            // Calculate the direction of the first move
            const firstMoveRankDir = rank - originRank;
            const firstMoveFileDir = file - originFile;

            // Normalize direction (should be -1, 0, or 1)
            const dirRank =
                firstMoveRankDir === 0 ? 0 : firstMoveRankDir > 0 ? 1 : -1;
            const dirFile =
                firstMoveFileDir === 0 ? 0 : firstMoveFileDir > 0 ? 1 : -1;

            // Second move can only be in the same direction as the first move
            const newRank = rank + dirRank;
            const newFile = file + dirFile;

            if (newRank >= 0 && newRank < 12 && newFile >= 0 && newFile < 12) {
                const targetSquare = this.getSquareId(newRank, newFile);
                const targetPiece = this.board[newRank][newFile];

                // Can move to empty squares or capture opponent pieces
                if (
                    !targetPiece ||
                    this.config.allowIllegalMoves ||
                    targetPiece.color !== piece.color
                ) {
                    secondMoves.push(targetSquare);
                }
            }

            // Filter moves based on Counter-strike rule only (Bridge-capture only applies to Lions)
            const validSecondMoves = secondMoves.filter((targetSquare) => {
                // Return to origin is always allowed (origin will be empty after first move)
                if (targetSquare === originSquare) {
                    return true;
                }

                // Apply Counter-strike validation
                const counterStrikeResult =
                    this.moveValidator.validateCounterStrike(
                        midpointSquare,
                        targetSquare,
                        piece,
                    );
                return counterStrikeResult.valid;
            });

            return validSecondMoves;
        }

        calculateSoaringEagleSecondMoves(midpointSquare, originSquare, piece) {
            // Soaring Eagle's second moves are restricted to the same line as the first move
            const [rank, file] = this.parseSquareId(midpointSquare);
            const [originRank, originFile] = this.parseSquareId(originSquare);
            const secondMoves = [];

            // Always allow return to origin (will be empty after first move)
            secondMoves.push(originSquare);

            // Calculate the direction of the first move
            const firstMoveRankDir = rank - originRank;
            const firstMoveFileDir = file - originFile;

            // Normalize direction (should be -1, 0, or 1)
            const dirRank =
                firstMoveRankDir === 0 ? 0 : firstMoveRankDir > 0 ? 1 : -1;
            const dirFile =
                firstMoveFileDir === 0 ? 0 : firstMoveFileDir > 0 ? 1 : -1;

            // Second move can only be in the same direction as the first move
            const newRank = rank + dirRank;
            const newFile = file + dirFile;

            if (newRank >= 0 && newRank < 12 && newFile >= 0 && newFile < 12) {
                const targetSquare = this.getSquareId(newRank, newFile);
                const targetPiece = this.board[newRank][newFile];

                // Can move to empty squares or capture opponent pieces
                if (
                    !targetPiece ||
                    this.config.allowIllegalMoves ||
                    targetPiece.color !== piece.color
                ) {
                    secondMoves.push(targetSquare);
                }
            }

            // Filter moves based on Counter-strike rule only (Bridge-capture only applies to Lions)
            const validSecondMoves = secondMoves.filter((targetSquare) => {
                // Return to origin is always allowed (origin will be empty after first move)
                if (targetSquare === originSquare) {
                    return true;
                }

                // Apply Counter-strike validation
                const counterStrikeResult =
                    this.moveValidator.validateCounterStrike(
                        midpointSquare,
                        targetSquare,
                        piece,
                    );
                return counterStrikeResult.valid;
            });

            return validSecondMoves;
        }

        // Start double move mode for any double-move piece
        startLionDoubleMove(originSquare, midpointSquare) {
            console.log(
                "Starting double move:",
                originSquare,
                "->",
                midpointSquare,
            );
            this.doubleMoveOrigin = originSquare;
            this.doubleMoveMidpoint = midpointSquare;

            // Determine piece type and calculate appropriate second moves with repetition checking
            const [originRank, originFile] = this.parseSquareId(originSquare);
            const piece = this.board[originRank][originFile];

            const destinationsInfo =
                this.moveValidator.calculateDoubleDestinationsWithRepetitionInfo(
                    originSquare,
                    midpointSquare,
                    piece,
                );

            this.doubleMoveDestinations = destinationsInfo.normalDestinations;
            this.doubleMoveRepeatToOrigin = destinationsInfo.repeatToOrigin;

            const pieceName = this.isLionPiece(piece)
                ? "Lion"
                : this.isHornedFalconPiece(piece)
                  ? "Horned Falcon"
                  : "Soaring Eagle";
            console.log(
                `${pieceName} double move destinations:`,
                this.doubleMoveDestinations,
                "repeatToOrigin:",
                this.doubleMoveRepeatToOrigin,
            );

            // Clear normal selection state but keep double move state - use centralized management
            this.gameStateManager.updateGameState({
                selectedSquare: null,
                validMoves: [],
                lionFirstMoves: [],
            });

            console.log(
                "Double move state active - click green squares to complete double move, or click anywhere else to cancel",
            );

            // Invalidate influence cache since midpoint is now set
            this.influenceManager.invalidate();

            // Update highlights to show the double move state
            this.highlightManager.updateAll();
            this.updateBoard();
        }

        // Execute Lion double move
        executeLionDoubleMove(fromSquare, midpointSquare, toSquare) {
            console.log(
                "DEBUG: executeLionDoubleMove called with:",
                fromSquare,
                "->",
                midpointSquare,
                "->",
                toSquare,
            );

            const [fromRank, fromFile] = this.parseSquareId(fromSquare);
            const [midRank, midFile] = this.parseSquareId(midpointSquare);
            const [toRank, toFile] = this.parseSquareId(toSquare);

            const movingPiece = utils.board.getPieceAt(this.board, fromSquare);
            const capturedAtMidpoint = utils.board.getPieceAt(
                this.board,
                midpointSquare,
            );
            const capturedAtDestination = utils.board.getPieceAt(
                this.board,
                toSquare,
            );

            if (!movingPiece) {
                console.error("No piece found at selected square:", fromSquare);
                this.deselectSquare();
                return;
            }

            // Apply move disambiguation logic when enabled (use centralized logic)
            // Only disambiguate normal double moves (fromSquare !== toSquare) here.
            // Turn skips (fromSquare === toSquare with empty midpoint) are disambiguated in executePromotionMove
            // after the Lion return prompt is confirmed, preserving the user's ability to deselect.
            if (
                disambiguateMoves &&
                !capturedAtMidpoint &&
                fromSquare !== toSquare
            ) {
                console.log(
                    "Move disambiguation: Converting double move to normal move (empty midpoint)",
                );

                // Execute as normal move from origin to destination (skip midpoint)
                this.moveExecutor.executeMove({
                    from: fromSquare,
                    to: toSquare,
                    piece: movingPiece,
                    captured: capturedAtDestination,
                    promoted: false, // Will be determined by promotion system if needed
                });
            } else {
                // Execute as Lion double move using centralized MoveExecutor
                const isLionReturn = fromSquare === toSquare;
                const moveData = {
                    from: fromSquare,
                    to: toSquare,
                    midpoint: midpointSquare,
                    piece: movingPiece,
                    captured: capturedAtDestination,
                    capturedAtMidpoint: capturedAtMidpoint,
                    isLionReturn: isLionReturn,
                };

                showDebugMessage(false, "DEBUG Click moveData:", {
                    ...moveData,
                    pieceType: moveData.piece?.type,
                    capturedType: moveData.captured?.type,
                    capturedAtMidpointType: moveData.capturedAtMidpoint?.type,
                });

                this.moveExecutor.executeMove(moveData);
            }

            // Clear double move state, but only if a promotion prompt wasn't triggered.
            // When showPromotionPrompt fires inside moveExecutor.executeMove it already:
            //   • clears doubleMoveMidpoint / doubleMoveOrigin / doubleMoveDestinations
            //   • calls clearSquareHighlights() + updateBoard() + updateSquareHighlights()
            //   • sets promotionPromptActive = true
            // Calling deselectSquare() on top of that schedules an extra updateBoard() whose
            // inner updateSquareHighlights() runs while promotionPromptActive is still false
            // (the board is regenerated before the flag is read), which can re-apply
            // valid-illegal-move / moveable-piece highlights that then linger on screen.
            if (!this.promotionPromptActive) {
                this.deselectSquare();
            }
        }

        // Execute a move from one square to another
        executeSquareMove(fromSquare, toSquare) {
            const [fromRank, fromFile] = this.parseSquareId(fromSquare);
            const [toRank, toFile] = this.parseSquareId(toSquare);
            const movingPiece = this.board[fromRank][fromFile];

            if (!movingPiece) {
                console.error("No piece found at selected square:", fromSquare);
                this.deselectSquare();
                return;
            }

            // Check if this is a repeat-promotion move that should be auto-promoted
            const isRepeatPromotion =
                this.repeatPromotionMoves &&
                this.repeatPromotionMoves.includes(toSquare);

            if (isRepeatPromotion) {
                console.log(
                    "Auto-promoting repeat-promotion move:",
                    fromSquare,
                    "->",
                    toSquare,
                );
            }

            // Execute as regular move using centralized MoveExecutor
            this.moveExecutor.executeMove(
                {
                    from: fromSquare,
                    to: toSquare,
                    piece: movingPiece,
                    captured: this.board[toRank][toFile],
                    promoted: isRepeatPromotion ? true : false, // Force promotion for repeat moves
                },
                {
                    skipPromotionPrompt: isRepeatPromotion, // Skip prompt if auto-promoting
                },
            );
        }

        // CENTRALIZED MOVE VALIDATOR
        // Handles all move validation logic consistently across all move types
        // ensuring proper rule enforcement and special case handling
        moveValidator = {
            // Core move validation function - used by all move execution paths
            validateMove: (fromSquare, toSquare, piece, context = {}) => {
                const { allowIllegalMoves = this.config.allowIllegalMoves } =
                    context;

                // Basic validation - can't move to same square
                if (fromSquare === toSquare) {
                    return {
                        valid: false,
                        reason: "Cannot move to same square",
                    };
                }

                // If illegal moves are allowed, bypass most validation
                if (allowIllegalMoves) {
                    return { valid: true };
                }

                // Double move validation removed

                // Check Counter-strike rule first
                const counterStrikeResult =
                    this.moveValidator.validateCounterStrike(
                        fromSquare,
                        toSquare,
                        piece,
                    );
                if (!counterStrikeResult.valid) {
                    return counterStrikeResult;
                }

                // Check Bridge-capture rule
                const bridgeCaptureResult =
                    this.moveValidator.validateBridgeCapture(
                        fromSquare,
                        toSquare,
                        piece,
                    );
                if (!bridgeCaptureResult.valid) {
                    return bridgeCaptureResult;
                }

                // Regular move validation
                return this.moveValidator.validateRegularMove(
                    fromSquare,
                    toSquare,
                    piece,
                );
            },

            // Validate regular moves using piece movement patterns
            validateRegularMove: (fromSquare, toSquare, piece) => {
                const validMoves = this.moveValidator.calculateValidMoves(
                    fromSquare,
                    piece,
                );
                if (!validMoves.includes(toSquare)) {
                    return {
                        valid: false,
                        reason: "Move not in valid moves for piece",
                    };
                }
                return { valid: true };
            },

            // Calculate all valid moves for a piece at a given square
            calculateValidMoves: (
                squareId,
                piece = null,
                includeFriendlyCaptures = false,
            ) => {
                const [rank, file] = this.parseSquareId(squareId);
                const currentPiece = piece || this.board[rank][file];
                if (!currentPiece) return [];

                // If illegal moves are allowed, return all squares except the current one
                if (this.config.allowIllegalMoves && !includeFriendlyCaptures) {
                    const allMoves = [];
                    for (let r = 0; r < 12; r++) {
                        for (let f = 0; f < 12; f++) {
                            const targetSquare = this.getSquareId(r, f);
                            if (targetSquare !== squareId) {
                                allMoves.push(targetSquare);
                            }
                        }
                    }
                    return allMoves;
                }

                const moves = [];
                const directions = this.getPieceDirections(
                    currentPiece.type,
                    currentPiece.color,
                );

                directions.forEach((direction) => {
                    for (let distance = 1; distance < 12; distance++) {
                        const newRank = rank + direction.rank * distance;
                        const newFile = file + direction.file * distance;

                        if (
                            newRank < 0 ||
                            newRank >= 12 ||
                            newFile < 0 ||
                            newFile >= 12
                        )
                            break;

                        const targetPiece = this.board[newRank][newFile];
                        if (targetPiece) {
                            const targetSquare = this.getSquareId(
                                newRank,
                                newFile,
                            );

                            // Always include captures (even friendly) when includeFriendlyCaptures is true
                            if (
                                includeFriendlyCaptures ||
                                targetPiece.color !== currentPiece.color
                            ) {
                                // Lion-trading rule validation removed
                                moves.push(targetSquare);
                            }
                            break;
                        } else {
                            moves.push(this.getSquareId(newRank, newFile));
                        }

                        // For single-step pieces, break after first move
                        if (!direction.sliding) break;
                    }
                });

                // Filter moves based on Counter-strike and Bridge-capture rules
                // Skip these filters when includeFriendlyCaptures is true (allowIllegalMoves mode)
                if (includeFriendlyCaptures) {
                    return moves;
                }

                const validMoves = moves.filter((targetSquare) => {
                    const counterStrikeResult =
                        this.moveValidator.validateCounterStrike(
                            squareId,
                            targetSquare,
                            currentPiece,
                        );
                    if (!counterStrikeResult.valid) return false;

                    const bridgeCaptureResult =
                        this.moveValidator.validateBridgeCapture(
                            squareId,
                            targetSquare,
                            currentPiece,
                        );
                    return bridgeCaptureResult.valid;
                });

                return validMoves;
            },

            // Calculate repetition info for valid moves
            // Returns an object with:
            //   - normalMoves: array of moves that don't violate repetition rules
            //   - repeatPromotionMoves: array of moves that violate repetition but are promotion-eligible
            //   - illegalMoves: array of illegal moves (when allowIllegalMoves is true)
            calculateMovesWithRepetitionInfo: (squareId, piece = null) => {
                const [rank, file] = this.parseSquareId(squareId);
                const currentPiece = piece || this.board[rank][file];
                if (!currentPiece) {
                    return {
                        normalMoves: [],
                        repeatPromotionMoves: [],
                        illegalMoves: [],
                    };
                }

                // If illegal moves are allowed, calculate legal moves and show illegal moves as amber
                if (this.config.allowIllegalMoves) {
                    // Temporarily disable allowIllegalMoves to get actual legal moves
                    const originalSetting = this.config.allowIllegalMoves;
                    this.config.allowIllegalMoves = false;

                    // Calculate legal moves including friendly captures for consistency
                    const legalMoves = this.moveValidator.calculateValidMoves(
                        squareId,
                        currentPiece,
                        true, // includeFriendlyCaptures
                    );

                    // Restore setting
                    this.config.allowIllegalMoves = originalSetting;

                    // Get all possible squares
                    const allMoves = [];
                    for (let r = 0; r < 12; r++) {
                        for (let f = 0; f < 12; f++) {
                            const targetSquare = this.getSquareId(r, f);
                            if (targetSquare !== squareId) {
                                allMoves.push(targetSquare);
                            }
                        }
                    }

                    // Illegal moves are those not in legalMoves
                    const illegalMoves = allMoves.filter(
                        (move) => !legalMoves.includes(move),
                    );

                    return {
                        normalMoves: legalMoves,
                        repeatPromotionMoves: [],
                        illegalMoves: illegalMoves,
                    };
                }

                // Get all valid moves first
                const allValidMoves = this.moveValidator.calculateValidMoves(
                    squareId,
                    currentPiece,
                );

                // If repetition handling is relaxed, all moves are normal
                if (this.config.repetitionHandling === "relaxed") {
                    return {
                        normalMoves: allValidMoves,
                        repeatPromotionMoves: [],
                        illegalMoves: [],
                    };
                }

                const normalMoves = [];
                const repeatPromotionMoves = [];

                allValidMoves.forEach((targetSquare) => {
                    // Check if this move would violate repetition rules
                    const wouldRepeat =
                        this.moveValidator.wouldMoveViolateRepetition(
                            squareId,
                            targetSquare,
                            currentPiece,
                        );

                    if (!wouldRepeat) {
                        normalMoves.push(targetSquare);
                    } else {
                        // Check if the move is promotion-eligible
                        const [toRank, toFile] =
                            this.parseSquareId(targetSquare);
                        const captured = this.board[toRank][toFile];
                        const isPromotionEligible =
                            this.promotionManager.checkEligibility(
                                currentPiece,
                                rank,
                                toRank,
                                captured,
                                {},
                            );

                        if (isPromotionEligible) {
                            repeatPromotionMoves.push(targetSquare);
                        }
                        // Non-promotion-eligible repeat moves are simply excluded
                    }
                });

                return { normalMoves, repeatPromotionMoves, illegalMoves: [] };
            },

            // Calculate double move destinations with repetition info
            // Returns an object with:
            //   - normalDestinations: destinations that don't violate repetition
            //   - repeatToOrigin: if moving to origin would violate repetition (for deselection logic)
            calculateDoubleDestinationsWithRepetitionInfo: (
                originSquare,
                midpointSquare,
                piece,
            ) => {
                // Get all potential second moves
                let allDestinations = [];
                if (this.isLionPiece(piece)) {
                    allDestinations = this.calculateLionSecondMoves(
                        midpointSquare,
                        originSquare,
                        piece,
                    );
                } else if (this.isHornedFalconPiece(piece)) {
                    allDestinations = this.calculateHornedFalconSecondMoves(
                        midpointSquare,
                        originSquare,
                        piece,
                    );
                } else if (this.isSoaringEaglePiece(piece)) {
                    allDestinations = this.calculateSoaringEagleSecondMoves(
                        midpointSquare,
                        originSquare,
                        piece,
                    );
                }

                // If illegal moves allowed or repetition is relaxed, return all as normal
                if (
                    this.config.allowIllegalMoves ||
                    this.config.repetitionHandling === "relaxed"
                ) {
                    return {
                        normalDestinations: allDestinations,
                        repeatToOrigin: false,
                    };
                }

                const normalDestinations = [];
                let repeatToOrigin = false;

                allDestinations.forEach((targetSquare) => {
                    // Check if this double move would violate repetition
                    const wouldRepeat =
                        this.moveValidator.wouldDoubleMoveViolateRepetition(
                            originSquare,
                            midpointSquare,
                            targetSquare,
                            piece,
                        );

                    if (!wouldRepeat) {
                        normalDestinations.push(targetSquare);
                    } else if (targetSquare === originSquare) {
                        // Moving back to origin violates repetition - mark for special handling
                        repeatToOrigin = true;
                        // Still include origin in destinations so it's clickable for deselection
                        normalDestinations.push(targetSquare);
                    }
                    // Other repeat destinations are simply excluded (blocked)
                });

                return { normalDestinations, repeatToOrigin };
            },

            // Check if a double move would violate repetition rules
            wouldDoubleMoveViolateRepetition: (
                fromSquare,
                midpointSquare,
                toSquare,
                piece,
            ) => {
                // Simulate the double move to check repetition
                const [fromRank, fromFile] = this.parseSquareId(fromSquare);
                const [midRank, midFile] = this.parseSquareId(midpointSquare);
                const [toRank, toFile] = this.parseSquareId(toSquare);

                const boardCopy = this.board.map((row) =>
                    row.map((cell) => (cell ? { ...cell } : null)),
                );
                boardCopy[fromRank][fromFile] = null;
                boardCopy[midRank][midFile] = null; // Clear midpoint capture
                boardCopy[toRank][toFile] = { ...piece };

                // Generate SFEN from the resulting board
                const originalBoard = this.board;
                this.board = boardCopy;
                const resultingSFEN = this.exportSFENWithPlayer(
                    piece.color === "b" ? "w" : "b",
                );
                this.board = originalBoard;

                if (!resultingSFEN) return false;

                const parts = resultingSFEN.split(" ");
                const boardPosition = parts[0];
                const playerToMove = parts[1];

                // Check for check exceptions (same as normal moves)
                const movingPlayer = piece.color;
                const royalInfo = this.countRoyals(this.board, movingPlayer);
                const attackerColor = movingPlayer === "b" ? "w" : "b";
                const royalUnderAttack =
                    royalInfo.count === 1 && royalInfo.firstRoyal
                        ? this.isRoyalUnderAttack(
                              this.board,
                              royalInfo.firstRoyal.squareId,
                              attackerColor,
                          )
                        : false;

                if (royalInfo.count === 1 && royalUnderAttack) {
                    return false; // Exception applies
                }

                if (royalInfo.count === 2) {
                    const royal1 = royalInfo.firstRoyal;
                    const royal2 = royalInfo.secondRoyal;

                    if (this.areRoyalsAdjacent(royal1, royal2)) {
                        const adjacentRoyalsUnderAttack =
                            this.areAdjacentRoyalsUnderDoubleMoverAttack(
                                this.board,
                                royal1,
                                royal2,
                                attackerColor,
                            );
                        if (adjacentRoyalsUnderAttack) {
                            return false; // Exception applies
                        }
                    }
                }

                // Check repetition using centralized logic
                return this.wouldViolateRepetitionRules(
                    boardPosition,
                    playerToMove,
                );
            },

            // Check if a move would violate repetition rules
            wouldMoveViolateRepetition: (fromSquare, toSquare, piece) => {
                // Create a hypothetical board after the move
                const [fromRank, fromFile] = this.parseSquareId(fromSquare);
                const [toRank, toFile] = this.parseSquareId(toSquare);

                const boardCopy = this.board.map((row) =>
                    row.map((cell) => (cell ? { ...cell } : null)),
                );
                boardCopy[fromRank][fromFile] = null;
                boardCopy[toRank][toFile] = { ...piece };

                // Generate SFEN from the resulting board
                const originalBoard = this.board;
                this.board = boardCopy;
                const resultingSFEN = this.exportSFENWithPlayer(
                    piece.color === "b" ? "w" : "b",
                );
                this.board = originalBoard;

                if (!resultingSFEN) return false;

                const parts = resultingSFEN.split(" ");
                const boardPosition = parts[0];
                const playerToMove = parts[1];

                // Check for check exception: exactly one royal under attack
                const movingPlayer = piece.color;
                const royalInfo = this.countRoyals(this.board, movingPlayer);
                const attackerColor = movingPlayer === "b" ? "w" : "b";
                const royalUnderAttack =
                    royalInfo.count === 1 && royalInfo.firstRoyal
                        ? this.isRoyalUnderAttack(
                              this.board,
                              royalInfo.firstRoyal.squareId,
                              attackerColor,
                          )
                        : false;

                if (royalInfo.count === 1 && royalUnderAttack) {
                    return false; // Exception applies
                }

                if (royalInfo.count === 2) {
                    const royal1 = royalInfo.firstRoyal;
                    const royal2 = royalInfo.secondRoyal;

                    if (this.areRoyalsAdjacent(royal1, royal2)) {
                        const adjacentRoyalsUnderAttack =
                            this.areAdjacentRoyalsUnderDoubleMoverAttack(
                                this.board,
                                royal1,
                                royal2,
                                attackerColor,
                            );
                        if (adjacentRoyalsUnderAttack) {
                            return false; // Exception applies
                        }
                    }
                }

                // Check repetition using centralized logic
                return this.wouldViolateRepetitionRules(
                    boardPosition,
                    playerToMove,
                );
            },

            // Calculate valid moves for a piece without applying special rules (used for safety checks)
            calculateBasicMoves: (piece, squareId) => {
                const [rank, file] = this.parseSquareId(squareId);
                const moves = [];
                const directions = this.getPieceDirections(
                    piece.type,
                    piece.color,
                );

                directions.forEach((direction) => {
                    for (let distance = 1; distance < 12; distance++) {
                        const newRank = rank + direction.rank * distance;
                        const newFile = file + direction.file * distance;

                        if (
                            newRank < 0 ||
                            newRank >= 12 ||
                            newFile < 0 ||
                            newFile >= 12
                        )
                            break;

                        const targetPiece = this.board[newRank][newFile];
                        if (targetPiece) {
                            if (targetPiece.color !== piece.color) {
                                const targetSquare = this.getSquareId(
                                    newRank,
                                    newFile,
                                );
                                // Lion-trading rule validation removed
                                moves.push(targetSquare);
                            }
                            break;
                        } else {
                            moves.push(this.getSquareId(newRank, newFile));
                        }

                        if (!direction.sliding) break;
                    }
                });

                return moves;
            },

            // Double move validation functions removed

            // Counter-strike rule validation
            // Blocks non-Lion-takes-Lion captures when counter-strike is active
            validateCounterStrike: (fromSquare, toSquare, piece) => {
                // Skip all validation if illegal moves are allowed
                if (this.config.allowIllegalMoves) {
                    return { valid: true };
                }

                // Counter-strike only applies when there's an active Lion capture location
                if (!this.lastLionCapture) {
                    return { valid: true };
                }

                // Get target square details
                const [toRank, toFile] = this.parseSquareId(toSquare);
                const targetPiece = this.board[toRank][toFile];

                // If no piece to capture, move is allowed
                if (!targetPiece) {
                    return { valid: true };
                }

                // If moving piece is a Lion, move is always allowed (Lion can capture anything)
                if (piece.type === "N" || piece.type === "+O") {
                    return { valid: true };
                }

                // If target is a Lion, check if on the counter-strike square
                if (targetPiece.type === "N" || targetPiece.type === "+O") {
                    // Non-Lion taking Lion is only allowed on the counter-strike square
                    if (toSquare === this.lastLionCapture) {
                        return { valid: true };
                    } else {
                        return {
                            valid: false,
                            reason: "Counter-strike rule: Can only capture Lion on the counter-strike square",
                        };
                    }
                }

                // Non-Lion piece capturing non-Lion piece is always allowed
                return { valid: true };
            },

            // Bridge-capture rule: Lions cannot capture non-adjacent protected Lions
            validateBridgeCapture: (
                fromSquare,
                toSquare,
                piece,
                midpointSquare = null,
            ) => {
                // Skip all validation if illegal moves are allowed
                if (this.config.allowIllegalMoves) {
                    return { valid: true };
                }

                // Bridge-capture rule only applies to Lions
                if (!this.isLionPiece(piece)) {
                    return { valid: true };
                }

                // Get target square details
                const [toRank, toFile] = this.parseSquareId(toSquare);
                const targetPiece = this.board[toRank][toFile];

                // If no target piece or target is not a Lion, move is allowed
                if (!targetPiece || !this.isLionPiece(targetPiece)) {
                    return { valid: true };
                }

                // Check if target Lion is adjacent (Bridge-capture rule allows adjacent Lion captures)
                const [fromRank, fromFile] = this.parseSquareId(fromSquare);
                const rankDiff = Math.abs(toRank - fromRank);
                const fileDiff = Math.abs(toFile - fromFile);
                const isAdjacent =
                    rankDiff <= 1 && fileDiff <= 1 && rankDiff + fileDiff > 0;

                if (isAdjacent) {
                    return { valid: true };
                }

                // For double moves, check midpoint piece to potentially lift bridge-capture restriction
                if (midpointSquare) {
                    const [midRank, midFile] =
                        this.parseSquareId(midpointSquare);
                    const midpointPiece = this.board[midRank][midFile];

                    // Lift bridge-capture restriction if midpoint contains anything other than:
                    // - Empty square
                    // - Pawn (P/\u6b69)
                    // - Go-between (I/\u4ef2)
                    if (
                        midpointPiece &&
                        midpointPiece.type !== "P" &&
                        midpointPiece.type !== "I"
                    ) {
                        console.log(
                            "Bridge-capture restriction lifted for double move - midpoint contains:",
                            midpointPiece.type,
                        );
                        return { valid: true };
                    }
                }

                // For non-adjacent Lions, check if target is protected by its own side
                const targetColor = targetPiece.color;
                const isProtected =
                    this.influenceManager.isSquareProtectedWithXRay(
                        toSquare,
                        targetColor,
                        fromSquare, // Origin square for X-ray calculation
                        midpointSquare, // Pass midpoint for double move X-ray calculation
                    );

                if (isProtected) {
                    return {
                        valid: false,
                        reason: "Bridge-capture rule: Cannot capture non-adjacent protected Lion",
                    };
                }

                // Midpoint protection: if enabled, check if Pawn or Go-Between is sole defender
                if (this.config.midpointProtection) {
                    const renmeiCheck =
                        this.moveValidator.validateMidpointProtection(
                            fromSquare,
                            toSquare,
                            targetPiece,
                            midpointSquare,
                        );
                    if (!renmeiCheck.valid) {
                        return renmeiCheck;
                    }
                }

                return { valid: true };
            },

            // Midpoint protection: Pawn or Go-Between as sole defender prevents Lion capture
            validateMidpointProtection: (
                fromSquare,
                toSquare,
                targetPiece,
                midpointSquare = null,
            ) => {
                // Skip all validation if illegal moves are allowed
                if (this.config.allowIllegalMoves) {
                    return { valid: true };
                }

                // Only apply this rule if it's enabled
                if (!this.config.midpointProtection) {
                    return { valid: true };
                }

                // Only applies to Lion targets
                if (!this.isLionPiece(targetPiece)) {
                    return { valid: true };
                }

                const targetColor = targetPiece.color;
                const [toRank, toFile] = this.parseSquareId(toSquare);

                // Check all 8 adjacent squares to the target Lion for potential Pawn/Go-Between defenders
                const directions = [
                    [-1, -1],
                    [-1, 0],
                    [-1, 1],
                    [0, -1],
                    [0, 1],
                    [1, -1],
                    [1, 0],
                    [1, 1],
                ];

                for (const [rankDelta, fileDelta] of directions) {
                    const defenderRank = toRank + rankDelta;
                    const defenderFile = toFile + fileDelta;

                    // Check bounds
                    if (
                        defenderRank < 0 ||
                        defenderRank >= 12 ||
                        defenderFile < 0 ||
                        defenderFile >= 12
                    ) {
                        continue;
                    }

                    const defenderPiece =
                        this.board[defenderRank][defenderFile];

                    // Check if this is a Pawn or Go-Between of the same color as the target Lion
                    if (
                        defenderPiece &&
                        defenderPiece.color === targetColor &&
                        (defenderPiece.type === "P" ||
                            defenderPiece.type === "I")
                    ) {
                        // Check if this Pawn/Go-Between is the sole defender of the Lion
                        const defenderSquareId = `${defenderRank}_${defenderFile}`;

                        // Temporarily remove the Pawn/Go-Between and check if Lion is still protected
                        const tempPiece =
                            this.board[defenderRank][defenderFile];
                        this.board[defenderRank][defenderFile] = null;

                        // Also exclude the attacking square and midpoint for X-ray calculation
                        const excludeSquares = new Set();
                        excludeSquares.add(fromSquare);
                        if (midpointSquare) excludeSquares.add(midpointSquare);

                        const stillProtected =
                            this.influenceManager.isSquareProtectedWithXRay(
                                toSquare,
                                targetColor,
                                fromSquare,
                                midpointSquare,
                            );

                        // Restore the Pawn/Go-Between
                        this.board[defenderRank][defenderFile] = tempPiece;

                        // If the Lion is no longer protected without this Pawn/Go-Between,
                        // then this P/I is the sole defender and the capture is blocked
                        if (!stillProtected) {
                            return {
                                valid: false,
                                reason: "Midpoint protection: Cannot capture Lion when Pawn/Go-Between is sole defender",
                            };
                        }
                    }
                }

                return { valid: true };
            },
        };

        // CENTRALIZED PROMOTION MANAGER
        // Handles all promotion logic consistently across regular/double/Lion return moves
        // and interactive/USI execution paths
        promotionManager = {
            // Core promotion eligibility check
            checkEligibility: (
                piece,
                fromRank,
                toRank,
                capturedPiece = null,
                context = {},
            ) => {
                if (!piece) return false;

                // Reduce logging during batch import
                if (!this.isBatchImporting) {
                    console.log("PromotionManager.checkEligibility called:", {
                        piece,
                        fromRank,
                        toRank,
                        capturedPiece,
                        context,
                        allowIllegalMoves: this.config.allowIllegalMoves,
                        isPiecePromoted: piece.promoted,
                    });
                }

                // Double move promotion logic removed

                // Check for reverse promotion when allowIllegalMoves is true and piece is promoted
                if (this.config.allowIllegalMoves && piece.promoted) {
                    return true; // Allow reverse promotion anywhere when allowIllegalMoves is true
                }

                // Normal promotion logic for unpromoted pieces
                if (piece.promoted) return false;

                const promotedType = this.getPromotedType(piece.type);
                if (!promotedType) return false;

                // Allow promotion anywhere when allowIllegalMoves is true
                if (this.config.allowIllegalMoves) {
                    return true;
                }

                return this.promotionManager.checkNormalPromotionEligibility(
                    piece,
                    fromRank,
                    toRank,
                    capturedPiece,
                );
            },

            // Check reverse promotion eligibility (promoted piece -> unpromoted)
            checkReversePromotionEligibility: (
                piece,
                fromRank,
                toRank,
                capturedPiece,
            ) => {
                console.log("Checking reverse promotion for promoted piece:", {
                    piece,
                    fromRank,
                    toRank,
                    capturedPiece,
                    allowIllegalMoves: this.config.allowIllegalMoves,
                });

                const originalType = this.getOriginalType(piece.type);
                if (!originalType) {
                    console.log("No original type found for reverse promotion");
                    return false;
                }

                const { promotionZone, lastRank } =
                    this.promotionManager.getPromotionZones(piece.color);
                const fromInZone = promotionZone.includes(fromRank);
                const toInZone = promotionZone.includes(toRank);

                console.log("Reverse promotion zone check:", {
                    originalType,
                    isBlack: piece.color === "b",
                    promotionZone,
                    fromInZone,
                    toInZone,
                    fromRank,
                    toRank,
                    pieceType: piece.type,
                });

                // Rule a) Piece enters the promotion zone (starts outside, ends within)
                if (!fromInZone && toInZone) {
                    console.log(
                        "Reverse promotion triggered: piece enters promotion zone",
                    );
                    return true;
                }

                // Rule b) Piece starts within the promotion zone and makes a capture
                if (fromInZone && capturedPiece) {
                    console.log(
                        "Reverse promotion triggered: piece in zone makes capture",
                    );
                    return true;
                }

                // Rule c) Pawn moves to the last rank (check if original type was pawn)
                if (originalType.toLowerCase() === "p" && toRank === lastRank) {
                    console.log(
                        "Reverse promotion triggered: pawn reaches last rank",
                    );
                    return true;
                }

                console.log("No reverse promotion conditions met");
                return false;
            },

            // Check normal promotion eligibility (unpromoted piece -> promoted)
            checkNormalPromotionEligibility: (
                piece,
                fromRank,
                toRank,
                capturedPiece,
            ) => {
                const { promotionZone, lastRank } =
                    this.promotionManager.getPromotionZones(piece.color);
                const fromInZone = promotionZone.includes(fromRank);
                const toInZone = promotionZone.includes(toRank);

                // Rule a) Piece enters the promotion zone (starts outside, ends within)
                if (!fromInZone && toInZone) {
                    return true;
                }

                // Rule b) Piece starts within the promotion zone and makes a capture
                if (fromInZone && capturedPiece) {
                    return true;
                }

                // Rule c) Pawn moves to the last rank
                if (piece.type.toLowerCase() === "p" && toRank === lastRank) {
                    return true;
                }

                // Rule d) Trapped Lance promotion: Lance moves to the last rank on non-capture
                if (
                    this.config.trappedLancePromotion &&
                    piece.type.toLowerCase() === "l" &&
                    toRank === lastRank &&
                    !capturedPiece
                ) {
                    return true;
                }

                return false;
            },

            // Get promotion zones for a color
            getPromotionZones: (color) => {
                const isBlack = color === "b";
                return {
                    promotionZone: isBlack ? [0, 1, 2, 3] : [8, 9, 10, 11],
                    lastRank: isBlack ? 0 : 11,
                };
            },

            // Apply promotion to a piece (returns new piece state)
            applyPromotion: (piece, shouldPromote) => {
                if (!shouldPromote) {
                    return { ...piece };
                }

                if (this.config.allowIllegalMoves && piece.promoted) {
                    // Reverse promotion - unpromote the piece
                    const originalType = this.getOriginalType(piece.type);
                    if (originalType) {
                        const newPiece = {
                            ...piece,
                            type: originalType,
                            promoted: false,
                        };
                        delete newPiece.originalType;
                        return newPiece;
                    }
                } else {
                    // Normal promotion
                    const promotedType = this.getPromotedType(piece.type);
                    if (promotedType) {
                        return {
                            ...piece,
                            type: promotedType,
                            promoted: true,
                            originalType: piece.type,
                        };
                    }
                }

                return { ...piece };
            },

            // Process move with promotion logic (unified for all move types)
            processMove: (moveData) => {
                const {
                    piece,
                    fromRank,
                    toRank,
                    capturedPiece,
                    context = {},
                } = moveData;

                const needsPromotion = this.promotionManager.checkEligibility(
                    piece,
                    fromRank,
                    toRank,
                    capturedPiece,
                    context,
                );

                return {
                    needsPromotion,
                    requiresPrompt: needsPromotion,
                };
            },
        };

        checkReversePromotion(piece) {
            // Only allow reverse promotion if the piece is currently promoted
            if (!piece || !piece.promoted) return false;

            // Get the original (unpromoted) type
            const originalType = this.getOriginalType(piece.type);
            return originalType !== null;
        }

        getOriginalType(promotedType) {
            // Map promoted piece types back to their original types
            const reversePromotionMap = {
                "+H": "H", // Horned Falcon -> Dragon Horse
                "+D": "D", // Soaring Eagle -> Dragon King
                "+T": "T", // Flying Stag -> Blind Tiger
                "+M": "M", // Free Boar -> Side Mover
                "+E": "E", // Prince -> Drunk Elephant
                "+A": "A", // Whale -> Reverse Chariot
                "+L": "L", // White Horse -> Lance
                "+V": "V", // Flying Ox -> Vertical Mover
                "+P": "P", // Gold General -> Pawn
                "+B": "B", // Dragon Horse -> Bishop
                "+C": "C", // Side Mover -> Copper
                "+F": "F", // Bishop -> Ferocious Leopard
                "+I": "I", // Drunk Elephant -> Go-Between
                "+G": "G", // Rook -> Gold
                "+O": "O", // Lion -> Kirin
                "+R": "R", // Dragon King -> Rook
                "+S": "S", // Vertical Mover -> Silver
                "+X": "X", // Queen -> Phoenix
                H: "B", // Dragon Horse -> Bishop
                D: "R", // Dragon King -> Rook
                M: "C", // Side Mover -> Copper General
                V: "S", // Vertical Mover -> Silver General
                B: "F", // Bishop -> Ferocious Leopard
                E: "I", // Drunk Elephant -> Go-Between
                R: "G", // Rook -> Gold General
                N: "O", // Lion -> Kirin
                Q: "X", // Queen -> Phoenix
            };

            return reversePromotionMap[promotedType] || null;
        }

        getPromotedType(pieceType) {
            // CENTRALIZED: Use utils.piece for piece definition lookups
            return utils.piece.getPromotedType(pieceType);
        }

        showPromotionModal(fromSquare, toSquare) {
            const modal = utils.dom.querySelector(
                this.container,
                "[data-promotion-modal]",
            );
            if (modal) {
                modal.classList.remove("hidden");
                modal.pendingMove = { from: fromSquare, to: toSquare };
            }
        }

        handlePromotionChoice(promote) {
            console.log("handlePromotionChoice called with promote:", promote);
            const modal = utils.dom.querySelector(
                this.container,
                "[data-promotion-modal]",
            );
            if (modal && modal.pendingMove) {
                console.log(
                    "Executing promotion move:",
                    modal.pendingMove,
                    "promote:",
                    promote,
                );

                // Use centralized MoveExecutor for consistency
                const move = modal.pendingMove;
                const [fromRank, fromFile] = this.parseSquareId(move.from);
                const [toRank, toFile] = this.parseSquareId(move.to);
                const movingPiece = utils.board.getPieceAt(
                    this.board,
                    move.from,
                );
                const capturedPiece = utils.board.getPieceAt(
                    this.board,
                    move.to,
                );

                const moveData = {
                    from: move.from,
                    to: move.to,
                    piece: movingPiece,
                    captured: capturedPiece,
                    promoted: promote,
                };

                // Add Lion double move data if present
                if (move.midpoint) {
                    moveData.midpoint = move.midpoint;
                    moveData.capturedAtMidpoint = move.capturedAtMidpoint;
                }

                this.moveExecutor.executeMove(moveData, {
                    skipPromotionCheck: true,
                });

                modal.classList.add("hidden");
                modal.pendingMove = null;
            }
        }

        cancelPromotion() {
            const modal = this.container.querySelector(
                "[data-promotion-modal]",
            );
            if (modal && modal.pendingMove) {
                // Hide modal and clear pending move
                modal.classList.add("hidden");
                modal.pendingMove = null;

                // Keep the piece selected by restoring square highlighting
                this.updateSquareHighlights();
            }
        }

        generateMoveNotation(
            fromSquare,
            toSquare,
            piece,
            captured,
            promoted,
            midpoint = null,
            capturedAtMidpoint = null,
        ) {
            // Simplified notation - full implementation would follow proper Chu Shogi notation
            if (!piece || !piece.type) {
                console.error(
                    "generateMoveNotation called with invalid piece:",
                    piece,
                    "from:",
                    fromSquare,
                    "to:",
                    toSquare,
                );
                return `Error ${fromSquare}-${toSquare}`;
            }

            const pieceNotation = piece.type;
            const promotionNotation = promoted ? "+" : "";

            // For double moves, use format: Piece origin-/x midpoint-/x destination
            if (midpoint) {
                const midpointNotation = capturedAtMidpoint ? "x" : "-";
                // For moves returning to starting square, always use hyphen (square is empty when returning)
                const endNotation =
                    fromSquare === toSquare ? "-" : captured ? "x" : "-";
                return `${pieceNotation} ${fromSquare}${midpointNotation}${midpoint}${endNotation}${toSquare}${promotionNotation}`;
            }

            // For regular moves, use the format: Piece origin-destination (or originxdestination if capture)
            const moveNotation = captured ? "x" : "-";
            return `${pieceNotation} ${fromSquare}${moveNotation}${toSquare}${promotionNotation}`;
        }

        switchTab(tabName) {
            // Block Edit tab in fixedStart mode
            if (
                tabName === "edit" &&
                (this.config.appletMode === "fixedStart" ||
                    this.config.appletMode === "fixedStartAndRules")
            ) {
                console.log("Edit tab blocked in fixedStart mode");
                return;
            }

            // Capture the current tab before updating state
            const previousTab = this.currentTab;

            // Check if leaving Edit tab with unsaved edits - require confirmation
            if (
                previousTab === "edit" &&
                tabName !== "edit" &&
                this.editMode.preEditPosition
            ) {
                const message =
                    "This will clear all edits made to the board position. Are you sure?";
                if (!confirm(message)) {
                    // User cancelled - stay on Edit tab
                    return;
                }
                // User confirmed - revert edits before switching tabs
                this.revertToPreEditPosition();
            }

            // Track current tab using centralized state management
            this.gameStateManager.updateGameState({
                currentTab: tabName,
            });

            // Invalidate moveable pieces cache when leaving edit mode
            // Edit mode can mutate the board without changing moveHistory.length or currentPlayer
            if (previousTab === "edit" || tabName === "edit") {
                this.moveablePiecesCache = null;
            }

            // Clear piece selections and close active prompts when switching tabs
            // This ensures a clean state when changing sidebar tabs
            this.clearSelection();

            // Force close any active promotion prompts
            if (this.promotionPromptActive) {
                console.log("Closing promotion prompt due to tab switch");
                this.closePromotionPrompt();
            }

            // Force close any active lion return prompts
            if (this.lionReturnPromptActive) {
                console.log("Closing lion return prompt due to tab switch");
                this.lionReturnPromptActive = false;
                this.lionReturnAlternateSquare = null;
            }

            // Hide all panels and deactivate all tabs
            const tabs = this.container.querySelectorAll("[data-tab]");
            const panels = this.container.querySelectorAll("[data-panel]");

            tabs.forEach((tab) => tab.classList.remove("active"));
            panels.forEach((panel) => panel.classList.remove("active"));

            // Activate selected tab and panel
            const selectedTab = this.container.querySelector(
                `[data-tab="${tabName}"]`,
            );
            const selectedPanel = this.container.querySelector(
                `[data-panel="${tabName}"]`,
            );

            if (selectedTab) selectedTab.classList.add("active");
            if (selectedPanel) selectedPanel.classList.add("active");

            // Clear selections when entering edit mode to prevent interaction conflicts
            if (tabName === "edit") {
                this.clearSelection();
                this.clearEditSelection();
                // Force close any active promotion prompts when entering edit mode
                if (this.promotionPromptActive) {
                    this.closePromotionPrompt();
                }
                // Explicitly clear lion double-move state that might cause purple highlights
                this.gameStateManager.updateGameState({
                    lionFirstMoves: [],
                    doubleMoveMidpoint: null,
                    doubleMoveOrigin: null,
                    doubleMoveDestinations: [],
                });
                // Force clear all highlights to ensure clean edit mode state
                this.highlightManager.clearAll();
                // Update highlights for edit mode
                this.updateSquareHighlights();
            } else {
                // Clear edit mode selections when leaving edit tab
                this.editMode.selectedPiece = null;
                this.editMode.counterStrikeSelection = false;
                // Also clear regular piece selections when leaving edit mode
                this.clearSelection();
                this.updateSquareHighlights();
            }

            // Clear edits when opening any non-edit tab
            if (tabName !== "edit" && this.editMode.preEditPosition) {
                this.revertToPreEditPosition();
            }

            // Regenerate edit panel content when switching to edit tab (for responsive piece selector)
            if (tabName === "edit" && selectedPanel) {
                selectedPanel.innerHTML = this.generateEditPanel();
                // Apply counter-strike highlights immediately after panel regeneration
                requestAnimationFrame(() => {
                    this.updateSquareHighlights();
                });
            }

            // Update button states based on tab
            this.updateButtonStates();

            // Update embedding examples with dynamic URLs when Help tab is activated
            if (tabName === "help") {
                this.updateEmbeddingExamples();
            }
        }

        switchInfoSubTab(subTabName) {
            this.currentInfoSubTab = subTabName;
            this.container
                .querySelectorAll("[data-info-subtab]")
                .forEach((el) => {
                    el.classList.toggle(
                        "active",
                        el.dataset.infoSubtab === subTabName,
                    );
                });
            this.container
                .querySelectorAll("[data-info-subpanel]")
                .forEach((el) => {
                    el.classList.toggle(
                        "active",
                        el.dataset.infoSubpanel === subTabName,
                    );
                });
        }

        switchPieceSubTab(tabName) {
            this.currentPieceSubTab = tabName;
            this.updatePieceInfoPanel();
        }

        switchExportSubTab(name) {
            this.currentExportSubTab = name;
            this.container
                .querySelectorAll("[data-export-subtab]")
                .forEach((el) => {
                    el.classList.toggle(
                        "active",
                        el.dataset.exportSubtab === name,
                    );
                });
            this.container
                .querySelectorAll("[data-export-subpanel]")
                .forEach((el) => {
                    el.classList.toggle(
                        "active",
                        el.dataset.exportSubpanel === name,
                    );
                });
        }

        inspectSquare(squareId) {
            this.inspectedSquare = squareId;
            // Just refresh the Piece Info panel's data \u2014 do NOT force-switch the
            // Info sub-tab. Clicking an immovable/opponent piece during normal
            // play shouldn't yank the user away from whichever sub-tab (e.g.
            // Game Info) they were already looking at.
            this.updatePieceInfoPanel();
        }

        buildMoveDiagram(pieceType) {
            // 5x5 grid: row 0 = rank -2 (forward/opponent side), row 4 = rank +2 (own side)
            //           col 0 = file -2 (left), col 4 = file +2 (right), center = [2][2]
            const grid = Array.from({ length: 5 }, () => Array(5).fill(null));
            const def = PIECE_DEFINITIONS[pieceType];
            if (!def) return grid;

            const dirs = this.parseMoveDefinition(def.movement);
            const isFullLion = pieceType === "N" || pieceType === "+O";
            const isLinearLionH = pieceType === "+H";
            const isLinearLionD = pieceType === "+D";

            // Higher priority wins when two move types share a cell
            const priority = {
                jump: 1,
                slide: 2,
                "lion-full": 3,
                "lion-linear": 4,
            };
            const trySet = (r, c, type) => {
                if (r < 0 || r > 4 || c < 0 || c > 4) return;
                if (!grid[r][c] || priority[type] > priority[grid[r][c]]) {
                    grid[r][c] = type;
                }
            };

            if (isFullLion) {
                // Adjacent squares (distance 1): lion-full double-move mechanic
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        trySet(2 + dr, 2 + dc, "lion-full");
                    }
                }
                // Distance-2 squares (knight, alfil, dabbaba): direct jumps
                for (const { rank: dr, file: dc } of dirs) {
                    if (Math.abs(dr) === 2 || Math.abs(dc) === 2) {
                        trySet(2 + dr, 2 + dc, "jump");
                    }
                }
            } else {
                for (const { rank: dr, file: dc, sliding } of dirs) {
                    // Lion-linear only applies to the distance-1 step; the distance-2
                    // landing square is a direct jump (green)
                    let moveType;
                    if (isLinearLionH && dc === 0 && dr < 0) {
                        moveType = Math.abs(dr) === 1 ? "lion-linear" : "jump";
                    } else if (
                        isLinearLionD &&
                        dr < 0 &&
                        Math.abs(dc) === Math.abs(dr)
                    ) {
                        moveType = Math.abs(dr) === 1 ? "lion-linear" : "jump";
                    } else {
                        moveType = sliding ? "slide" : "jump";
                    }

                    if (sliding) {
                        // Fill both reachable steps along this ray
                        for (let step = 1; step <= 2; step++) {
                            trySet(2 + dr * step, 2 + dc * step, moveType);
                        }
                    } else {
                        trySet(2 + dr, 2 + dc, moveType);
                    }
                }
            }

            return grid;
        }

        updatePieceInfoPanel() {
            const panel = this.container.querySelector(
                '[data-info-subpanel="piece-info"]',
            );
            if (!panel) return;
            const displayEl = panel.querySelector("[data-piece-info-display]");
            if (!displayEl) return;

            const sq = this.selectedSquare || this.inspectedSquare;
            const piece = sq ? utils.board.getPieceAt(this.board, sq) : null;
            const def = piece ? PIECE_DEFINITIONS[piece.type] : null;

            if (!piece || !def) {
                this.currentPieceSubTab = "piece";
                this.lastDiagramPieceType = null;
                displayEl.innerHTML =
                    '<div class="chushogi-piece-info-placeholder">Click a piece to see its moves.</div>';
                return;
            }

            // Reset to "piece" tab whenever a different piece type is selected
            if (piece.type !== this.lastDiagramPieceType) {
                this.currentPieceSubTab = "piece";
                this.lastDiagramPieceType = piece.type;
            }

            const typeClass = {
                jump: "chushogi-diagram-jump",
                slide: "chushogi-diagram-slide",
                "lion-linear": "chushogi-diagram-lion-linear",
                "lion-full": "chushogi-diagram-lion-full",
            };

            const PIECE_TRAITS = {
                k: ["Royal piece (No royal pieces = loss)"],
                K: ["Royal piece (No royal pieces = loss)"],
                "+E": ["Royal piece (No royal pieces = loss)"],
                P: [
                    "Promotion always allowed on last rank",
                    "Cannot be used as a bridge-capture",
                ],
                I: ["Cannot be used as a bridge-capture"],
                N: [
                    "Cannot capture non-adjacent protected Lions without a bridge-capture",
                ],
                "+O": [
                    "Cannot capture non-adjacent protected Lions without a bridge-capture",
                ],
            };

            if (this.config.trappedLancePromotion) {
                PIECE_TRAITS["L"] = ["Promotion always allowed on last rank"];
            }

            const renderTraits = (type) => {
                const traits = [...(PIECE_TRAITS[type] || [])];
                const isLion = type === "N" || type === "+O";
                if (!isLion && this.lastLionCapture) {
                    traits.push(
                        `Can only capture a Lion on ${this.lastLionCapture} this turn`,
                    );
                }
                if (isLion && this.lastLionCapture) {
                    traits.push(
                        `Immune to non-Lion captures this turn, except on ${this.lastLionCapture}`,
                    );
                }
                if (traits.length === 0) return "";
                return `<ul class="chushogi-piece-traits">${traits.map((t) => `<li>${t}</li>`).join("")}</ul>`;
            };

            const buildCells = (type, kanji) => {
                const g = this.buildMoveDiagram(type);
                let c = "";
                for (let row = 0; row < 5; row++) {
                    for (let col = 0; col < 5; col++) {
                        if (row === 2 && col === 2) {
                            c += `<div class="chushogi-diagram-cell chushogi-diagram-piece">${kanji}</div>`;
                        } else {
                            const t = g[row][col];
                            c += t
                                ? `<div class="chushogi-diagram-cell ${typeClass[t]}"></div>`
                                : '<div class="chushogi-diagram-cell chushogi-diagram-empty"></div>';
                        }
                    }
                }
                return c;
            };

            const renderPanel = (type, pDef) =>
                `<div class="chushogi-piece-info-name">${pDef.kanji} \u2014 ${pDef.name}</div>` +
                `<div class="chushogi-move-diagram">${buildCells(type, pDef.kanji)}</div>` +
                renderTraits(type);

            let html;
            if (def.promotes) {
                const promDef = PIECE_DEFINITIONS[def.promotes];
                const isPiece = this.currentPieceSubTab === "piece";
                const tab = (name, label, active) =>
                    `<div class="chushogi-piece-diagram-tab${active ? " active" : ""}" ` +
                    `onclick="this.closest('.chushogi-container').chuShogiInstance.switchPieceSubTab('${name}')">${label}</div>`;
                html =
                    `<div class="chushogi-piece-diagram-tab-list">${tab("piece", "Piece", isPiece)}${tab("promotion", "Promotion", !isPiece)}</div>` +
                    `<div class="chushogi-piece-diagram-panel${isPiece ? " active" : ""}">${renderPanel(piece.type, def)}</div>` +
                    `<div class="chushogi-piece-diagram-panel${!isPiece ? " active" : ""}">${renderPanel(def.promotes, promDef)}</div>`;
            } else {
                html = renderPanel(piece.type, def);
            }

            displayEl.innerHTML = html;
        }

        updateButtonStates() {
            const isEditTab = this.currentTab === "edit";
            const isPuzzleOpponentThinking =
                this.config.appletMode === "puzzle" &&
                this.puzzleOpponentThinking;
            const isPuzzleWaitingForAdvance =
                this.config.appletMode === "puzzle" &&
                this.puzzleWaitingForAdvance;

            // Check if undo should be blocked in puzzle mode during navigation
            // Match the condition used in undoPuzzleMove() - check currentNavigationIndex only
            let isPuzzleUndoBlocked = false;
            if (
                this.config.appletMode === "puzzle" &&
                this.currentNavigationIndex !== null
            ) {
                const positionPlayer = this.getPlayerAtPosition(
                    this.currentNavigationIndex,
                );
                isPuzzleUndoBlocked = positionPlayer === this.puzzleOpponent;
            }

            // Get the control buttons
            const undoBtn = this.container.querySelector(
                'button[onclick*="undo()"]',
            );
            const newGameBtn = this.container.querySelector(
                'button[onclick*="confirmNewGame()"]',
            );
            const resetBtn = this.container.querySelector(
                'button[onclick*="confirmReset()"]',
            );

            // Get the navigation buttons using data attributes
            const goToStartBtn =
                this.container.querySelector("[data-nav-start]");
            const goBackBtn = this.container.querySelector("[data-nav-prev]");
            const goForwardBtn =
                this.container.querySelector("[data-nav-next]");
            const goToCurrentBtn =
                this.container.querySelector("[data-nav-end]");

            // Get the View Solution button (puzzle mode only)
            const viewSolutionBtn = this.container.querySelector(
                "[data-view-solution-btn]",
            );

            // When paused waiting for advance, enable only forward navigation
            if (isPuzzleWaitingForAdvance) {
                // Disable most buttons during pause
                [
                    undoBtn,
                    newGameBtn,
                    goToStartBtn,
                    goBackBtn,
                    goToCurrentBtn,
                ].forEach((btn) => {
                    if (btn) {
                        btn.disabled = true;
                        btn.style.setProperty("opacity", "0.5", "important");
                        btn.style.setProperty(
                            "cursor",
                            "not-allowed",
                            "important",
                        );
                    }
                });

                // Enable forward button to allow manual advancement
                if (goForwardBtn) {
                    goForwardBtn.disabled = false;
                    goForwardBtn.style.setProperty("opacity", "1", "important");
                    goForwardBtn.style.setProperty(
                        "cursor",
                        "pointer",
                        "important",
                    );
                }

                // Disable View Solution button during pause
                if (viewSolutionBtn) {
                    viewSolutionBtn.disabled = true;
                    viewSolutionBtn.style.setProperty(
                        "opacity",
                        "0.5",
                        "important",
                    );
                    viewSolutionBtn.style.setProperty(
                        "cursor",
                        "not-allowed",
                        "important",
                    );
                }

                if (resetBtn) {
                    resetBtn.disabled = true;
                    resetBtn.style.setProperty("opacity", "0.5", "important");
                    resetBtn.style.setProperty(
                        "cursor",
                        "not-allowed",
                        "important",
                    );
                }

                // Return early to prevent subsequent logic from re-enabling buttons
                return;
            } else {
                // Normal behavior for non-pause states
                const shouldDisableButtons =
                    isEditTab || isPuzzleOpponentThinking;

                // Handle undo button separately to account for puzzle navigation blocking
                if (undoBtn) {
                    const shouldDisableUndo =
                        shouldDisableButtons || isPuzzleUndoBlocked;
                    undoBtn.disabled = shouldDisableUndo;
                    undoBtn.style.setProperty(
                        "opacity",
                        shouldDisableUndo ? "0.5" : "1",
                        "important",
                    );
                    undoBtn.style.setProperty(
                        "cursor",
                        shouldDisableUndo ? "not-allowed" : "pointer",
                        "important",
                    );
                    // Show ✂ when pressing undo would clip/trim moves, ↶ when it
                    // simply removes the last move.
                    let isTrimmingMode;
                    let undoTitle;
                    if (this._viewedNode && this.isNavigating) {
                        // Off-branch variation node.
                        // Leaf  → ↶ (undo the one variation move)
                        // Non-leaf → ✂ (clip children of this node)
                        isTrimmingMode = this._viewedNode.children.length > 0;
                        undoTitle = isTrimmingMode
                            ? "Clip variation to displayed position"
                            : "Undo last variation move";
                    } else {
                        // Main-line navigation.
                        isTrimmingMode =
                            this.isNavigating &&
                            this.currentNavigationIndex !== null &&
                            (this.currentNavigationIndex === -1
                                ? this.moveHistory.length > 0
                                : this.currentNavigationIndex <
                                  this.moveHistory.length - 1);
                        undoTitle = isTrimmingMode
                            ? "Trim game to displayed position"
                            : "Undo last move";
                    }
                    undoBtn.textContent = isTrimmingMode ? "\u2702" : "\u21b6";
                    undoBtn.title = undoTitle;
                }

                // Disable/enable other buttons based on edit mode or puzzle opponent thinking
                [
                    newGameBtn,
                    goToStartBtn,
                    goBackBtn,
                    goForwardBtn,
                    goToCurrentBtn,
                ].forEach((btn) => {
                    if (btn) {
                        btn.disabled = shouldDisableButtons;
                        btn.style.setProperty(
                            "opacity",
                            shouldDisableButtons ? "0.5" : "1",
                            "important",
                        );
                        btn.style.setProperty(
                            "cursor",
                            shouldDisableButtons ? "not-allowed" : "pointer",
                            "important",
                        );
                    }
                });

                // View Solution button should only be disabled during puzzle opponent thinking (not edit mode)
                if (viewSolutionBtn) {
                    viewSolutionBtn.disabled = isPuzzleOpponentThinking;
                    viewSolutionBtn.style.setProperty(
                        "opacity",
                        isPuzzleOpponentThinking ? "0.5" : "1",
                        "important",
                    );
                    viewSolutionBtn.style.setProperty(
                        "cursor",
                        isPuzzleOpponentThinking ? "not-allowed" : "pointer",
                        "important",
                    );
                }

                // Reset button stays enabled in edit mode with different functionality, but disabled during puzzle opponent thinking
                if (resetBtn) {
                    resetBtn.disabled = isPuzzleOpponentThinking;
                    resetBtn.style.setProperty(
                        "opacity",
                        isPuzzleOpponentThinking ? "0.5" : "1",
                        "important",
                    );
                    resetBtn.style.setProperty(
                        "cursor",
                        isPuzzleOpponentThinking ? "not-allowed" : "pointer",
                        "important",
                    );
                }
            }
        }

        updateEmbeddingExamples() {
            // Get the current script URL
            const scripts = document.querySelectorAll(
                'script[src*="chushogi-lite.js"]',
            );
            let scriptSrc = "chushogi-lite.js"; // fallback
            let cssSrc = "chushogi-lite.css"; // fallback

            if (scripts.length > 0) {
                const fullScriptSrc = scripts[0].src;
                scriptSrc = fullScriptSrc;

                // Derive CSS path from JS path
                cssSrc = fullScriptSrc.replace(".js", ".css");
            }

            // Update the embedding example textarea
            const embeddingTextarea = this.container.querySelector(
                "[data-embedding-example]",
            );
            if (embeddingTextarea) {
                embeddingTextarea.value = `<!-- Include files -->
<link rel="stylesheet" href="${cssSrc}">
<script src="${scriptSrc}"></script>

<!-- Game container -->
<div class="chuShogiLite" data-config='{
  "appletMode": "sandbox",
  "startGame": null,
  "allowCustomComments": true,
  "flipView": false,
  "displaySFEN": false,
  "displayInlineNotation": false,
  "boardSize": "large",
  "showCoordinates": true,
  "showMoveablePieces": true,
  "showLegalMoves": true,
  "showLastMove": true,
  "showPromotionZones": false,
  "showInfluenceDisplay": false,
  "allowIllegalMoves": false,
  "midpointProtection": false,
  "trappedLancePromotion": false,
  "repetitionHandling": "strict"
}'>
</div>`;
            }
        }

        handleSettingChange(event) {
            const { type, checked, value } = event.target;
            const isViewOnly = this.config.appletMode === "viewOnly";
            const isFixedRules =
                this.config.appletMode === "fixedRules" ||
                this.config.appletMode === "fixedStartAndRules";
            const isFixedSettings =
                this.config.appletMode === "fixedSettings" ||
                this.config.appletMode === "fixedStartAndSettings";

            // Extract base ID by removing instance suffix (e.g., "show-coords-chushogi_abc123" -> "show-coords")
            const getBaseId = (fullId) => {
                const instanceSuffixMatch = fullId.match(
                    /^(.*)-chushogi_[a-z0-9]+$/,
                );
                return instanceSuffixMatch ? instanceSuffixMatch[1] : fullId;
            };
            const baseId = getBaseId(event.target.id);

            // Block all settings changes in fixedSettings mode
            if (isFixedSettings) {
                // Revert the checkbox state if it was somehow changed
                if (type === "checkbox") {
                    event.target.checked = !checked;
                }
                console.log("Settings changes blocked in fixedSettings mode");
                return; // Don't process the change
            }

            // Block restricted settings in viewOnly mode
            const viewOnlyRestrictedSettings = [
                "allow-illegal",
                "midpoint-protection",
                "show-legal-moves",
            ];
            if (isViewOnly && viewOnlyRestrictedSettings.includes(baseId)) {
                // Revert the checkbox state if it was somehow changed
                if (type === "checkbox") {
                    event.target.checked = !checked;
                }
                return; // Don't process the change
            }

            // Block rule settings in fixedRules mode
            const ruleSettings = [
                "allow-illegal",
                "midpoint-protection",
                "trapped-lance-promotion",
                "repetition-handling-select",
            ];
            if (isFixedRules && ruleSettings.includes(baseId)) {
                // Revert the checkbox state if it was somehow changed
                if (type === "checkbox") {
                    event.target.checked = !checked;
                }
                console.log("Rule settings blocked in fixedRules mode");
                return; // Don't process the change
            }

            // Use centralized settings management
            const newSettings = {};

            // Handle different setting types using base IDs
            if (baseId === "show-coords") {
                newSettings.showCoordinates = checked;
            } else if (baseId === "show-moveable-pieces") {
                newSettings.showMoveablePieces = checked;
            } else if (baseId === "allow-illegal") {
                newSettings.allowIllegalMoves = checked;
                // Clear selection when toggling rule settings
                this.clearSelection();
            } else if (baseId === "show-legal-moves") {
                newSettings.showLegalMoves = checked;
            } else if (baseId === "highlight-last") {
                newSettings.showLastMove = checked;
            } else if (baseId === "show-promotion-zones") {
                newSettings.showPromotionZones = checked;
            } else if (baseId === "show-influence-display") {
                newSettings.showInfluenceDisplay = checked;
            } else if (baseId === "show-sfen") {
                newSettings.displaySFEN = checked;
            } else if (baseId === "use-inline-notation") {
                newSettings.displayInlineNotation = checked;
            } else if (baseId === "midpoint-protection") {
                newSettings.midpointProtection = checked;
                // Clear selection when toggling rule settings
                this.clearSelection();
            } else if (baseId === "trapped-lance-promotion") {
                newSettings.trappedLancePromotion = checked;
                // Clear selection when toggling rule settings
                this.clearSelection();
            } else if (event.target.dataset.repetitionHandling !== undefined) {
                newSettings.repetitionHandling = value;
                // Clear selection when toggling rule settings
                this.clearSelection();
            } else if (event.target.dataset.boardSize !== undefined) {
                newSettings.boardSize = value;
            }

            // Apply settings through centralized manager
            this.gameStateManager.updateSettings(newSettings);
        }

        updateBoardSize() {
            // Store current drawings to preserve them during size change
            const currentCircles = new Map(this.drawings.circles);
            const currentArrows = new Map(this.drawings.arrows);

            // Store current game state to preserve highlights
            const currentSelected = this.selectedSquare;
            const currentValidMoves = [...this.validMoves];

            const currentPromotionState = {
                active: this.promotionPromptActive,
                move: this.promotionMove,
                destination: this.promotionDestinationSquare,
                deferral: this.promotionDeferralSquare,
                alternate: this.promotionAlternateSquare,
            };
            const currentLionReturnState = {
                active: this.lionReturnPromptActive,
                alternate: this.lionReturnAlternateSquare,
            };

            // Re-render the entire container to apply new size class
            this.render();

            // Restore drawings after render
            this.drawings.circles = currentCircles;
            this.drawings.arrows = currentArrows;

            // Restore game state
            this.selectedSquare = currentSelected;
            this.validMoves = currentValidMoves;

            this.promotionPromptActive = currentPromotionState.active;
            this.promotionMove = currentPromotionState.move;
            this.promotionDestinationSquare = currentPromotionState.destination;
            this.promotionDeferralSquare = currentPromotionState.deferral;
            this.promotionAlternateSquare = currentPromotionState.alternate;
            this.lionReturnPromptActive = currentLionReturnState.active;
            this.lionReturnAlternateSquare = currentLionReturnState.alternate;

            this.attachEventListeners();
            this.updateDisplay();

            // Restore the current tab state after re-rendering
            if (this.currentTab !== "moves") {
                this.switchTab(this.currentTab);
            }

            // Redraw all elements including highlights
            this.redrawAllDrawings();
            this.updateSquareHighlights();

            // Restore piece previews if promotion prompt was active
            if (currentPromotionState.active && currentPromotionState.move) {
                this.recreatePromotionPreviews(currentPromotionState.move);
            }

            // Restore piece previews if Lion return prompt was active
            if (currentLionReturnState.active) {
                this.recreateLionReturnPreviews();
            }

            // Additional verification - ensure highlights are actually applied
            setTimeout(() => {
                // Verify highlights after DOM has settled
                if (this.promotionPromptActive) {
                    const originEl = this.container.querySelector(
                        `[data-square="${this.promotionMove?.from}"]`,
                    );
                    const destEl = this.container.querySelector(
                        `[data-square="${this.promotionDestinationSquare}"]`,
                    );
                    const defEl = this.container.querySelector(
                        `[data-square="${this.promotionDeferralSquare}"]`,
                    );

                    console.log("Post-resize promotion verification:", {
                        originHasClass:
                            originEl?.classList.contains("promotion-source"),
                        destHasClass:
                            destEl?.classList.contains("promotion-choice"),
                        deferralHasClass:
                            defEl?.classList.contains("promotion-choice"),
                    });
                }

                if (this.lionReturnPromptActive) {
                    const originEl = this.container
                        .querySelector
                        // Double move start square highlighting removed
                        ();
                    const altEl = this.container.querySelector(
                        `[data-square="${this.lionReturnAlternateSquare}"]`,
                    );

                    console.log("Post-resize Lion return verification:", {
                        originHasClass:
                            originEl?.classList.contains("lion-return-choice"),
                        alternateHasClass:
                            altEl?.classList.contains("lion-return-choice"),
                    });
                }
            }, 0);
        }

        recreatePromotionPreviews(promotionMove) {
            if (!this.promotionPromptActive || !promotionMove) return;

            const { from, to, piece } = promotionMove;
            const isReversePromotion =
                piece.promoted && this.config.allowIllegalMoves;

            // Recreate destination piece preview
            if (this.promotionDestinationSquare) {
                const destElement = this.container.querySelector(
                    `[data-square="${this.promotionDestinationSquare}"]`,
                );
                if (destElement) {
                    const targetType = isReversePromotion
                        ? this.getOriginalType(piece.type)
                        : this.getPromotedType(piece.type);
                    let pieceElement =
                        destElement.querySelector(".chushogi-piece");

                    if (targetType && PIECE_DEFINITIONS[targetType]) {
                        const targetSymbol =
                            PIECE_DEFINITIONS[targetType].kanji;
                        if (pieceElement) {
                            pieceElement.dataset.originalText =
                                pieceElement.textContent;
                            pieceElement.dataset.originalClass =
                                pieceElement.className;
                            pieceElement.textContent = targetSymbol;
                            const colorClass =
                                piece.color === "w" ? "white" : "black";
                            const promotedClass = isReversePromotion
                                ? ""
                                : "promoted";
                            pieceElement.className =
                                `chushogi-piece ${colorClass} ${promotedClass}`.trim();
                        } else {
                            // Create new piece element
                            pieceElement = document.createElement("div");
                            const colorClass =
                                piece.color === "w" ? "white" : "black";
                            const promotedClass = isReversePromotion
                                ? ""
                                : "promoted";
                            pieceElement.className =
                                `chushogi-piece ${colorClass} ${promotedClass}`.trim();
                            pieceElement.textContent = targetSymbol;
                            pieceElement.dataset.originalText = "";
                            pieceElement.dataset.temporaryPiece = "true";
                            destElement.appendChild(pieceElement);
                        }
                    }
                }
            }

            // Recreate deferral piece preview
            if (this.promotionDeferralSquare) {
                const deferralElement = this.container.querySelector(
                    `[data-square="${this.promotionDeferralSquare}"]`,
                );
                if (deferralElement) {
                    let pieceElement =
                        deferralElement.querySelector(".chushogi-piece");

                    // Always set up deferral piece preview properly, regardless of existing piece
                    if (pieceElement) {
                        // Store original content if not already stored
                        if (!pieceElement.dataset.originalText) {
                            pieceElement.dataset.originalText =
                                pieceElement.textContent;
                            pieceElement.dataset.originalClass =
                                pieceElement.className;
                        }
                        // Set to show the deferral piece (current piece unchanged)
                        const colorClass =
                            piece.color === "w" ? "white" : "black";
                        const promotedClass = piece.promoted ? "promoted" : "";
                        pieceElement.className =
                            `chushogi-piece ${colorClass} ${promotedClass}`.trim();
                        pieceElement.textContent =
                            PIECE_DEFINITIONS[piece.type]?.kanji || piece.type;
                    } else {
                        // Create new piece element showing current piece (what stays the same)
                        pieceElement = document.createElement("div");
                        const colorClass =
                            piece.color === "w" ? "white" : "black";
                        const promotedClass = piece.promoted ? "promoted" : "";
                        pieceElement.className =
                            `chushogi-piece ${colorClass} ${promotedClass}`.trim();
                        pieceElement.textContent =
                            PIECE_DEFINITIONS[piece.type]?.kanji || piece.type;
                        pieceElement.dataset.originalText = "";
                        pieceElement.dataset.temporaryPiece = "true";
                        deferralElement.appendChild(pieceElement);
                    }
                }
            }

            // Recreate promotion alternate square (for deselection) - should always be blank
            if (this.promotionAlternateSquare) {
                const alternateElement = this.container.querySelector(
                    `[data-square="${this.promotionAlternateSquare}"]`,
                );
                if (alternateElement) {
                    let pieceElement =
                        alternateElement.querySelector(".chushogi-piece");

                    if (pieceElement) {
                        // Store original content before making it appear empty (exactly like original logic)
                        pieceElement.dataset.originalText =
                            pieceElement.textContent;
                        pieceElement.dataset.originalClass =
                            pieceElement.className;
                        // Make the square appear empty (alternate squares should be blank for deselection)
                        pieceElement.textContent = "";
                        pieceElement.className = "chushogi-piece";
                    }
                }
            }
        }

        getPieceTypeFromSymbol(symbol) {
            // Find piece type by matching the kanji symbol
            for (const [type, definition] of Object.entries(
                PIECE_DEFINITIONS,
            )) {
                if (definition.kanji === symbol) {
                    return type;
                }
            }
            return symbol; // Fallback to symbol if not found
        }

        recreateLionReturnPreviews() {
            if (!this.lionReturnPromptActive) return;

            // Recreate Lion return alternate square (for deselection) - should always be blank
            // This should match exactly the original showLionReturnPrompt logic
            if (this.lionReturnAlternateSquare) {
                const alternateElement = this.container.querySelector(
                    `[data-square="${this.lionReturnAlternateSquare}"]`,
                );
                if (alternateElement) {
                    let pieceElement =
                        alternateElement.querySelector(".chushogi-piece");

                    if (pieceElement) {
                        // Store original content before making it appear empty (exactly like original logic)
                        pieceElement.dataset.originalText =
                            pieceElement.textContent;
                        pieceElement.dataset.originalClass =
                            pieceElement.className;
                        // Make the square appear empty (alternate squares should be blank for deselection)
                        pieceElement.textContent = "";
                        pieceElement.className = "chushogi-piece";
                    }
                }
            }
        }

        updateBoard() {
            // Store current drawings to preserve them during board update
            const currentCircles = new Set(this.drawings.circles);
            const currentArrows = new Map(this.drawings.arrows);

            // Regenerate the entire board structure to handle coordinate visibility
            const gameElement = this.container.querySelector(".chushogi-game");
            if (gameElement) {
                gameElement.innerHTML = this.generateBoardHTML();
            }

            const boardElement = this.container.querySelector("[data-board]");
            if (boardElement) {
                boardElement.innerHTML =
                    this.generateSquaresHTML() +
                    this.generatePromotionZonesHTML();
            }

            // Restore drawings after board regeneration
            this.drawings.circles = currentCircles;
            this.drawings.arrows = currentArrows;

            // Reattach event listeners (this handles all events including squares)
            this.attachEventListeners();

            // Invalidate influence cache after board changes
            this.influenceManager.invalidate();
            this.updateSquareHighlights();

            // Reinitialize canvas after board update
            this.initializeCanvas();
        }

        updateDisplay() {
            try {
                // Reduce logging during batch import
                if (!this.isBatchImporting) {
                    console.log("updateDisplay: Starting");
                }

                // Update turn display
                const turnIndicator = this.container.querySelector(
                    ".chushogi-turn-indicator",
                );
                const turnText = this.container.querySelector(
                    ".chushogi-turn-text",
                );

                if (turnIndicator) {
                    turnIndicator.className = `chushogi-turn-indicator ${this.currentPlayer === "w" ? "white" : ""}`;
                }

                if (turnText) {
                    turnText.textContent =
                        this.currentPlayer === "b" ? "Black" : "White";
                }

                if (!this.isBatchImporting) {
                    console.log("updateDisplay: Turn display updated");
                }

                // Update move number - navigation-aware
                const moveNumber =
                    this.container.querySelector("[data-move-number]");
                if (moveNumber) {
                    if (this._viewedNode) {
                        // Off-branch: show 1-based position within the current branch.
                        moveNumber.textContent = this._branchPosition(this._viewedNode).current.toString();
                    } else if (this.currentNavigationIndex === -1) {
                        // At starting position
                        moveNumber.textContent = "1";
                    } else if (
                        this.currentNavigationIndex >= 0 &&
                        this.currentNavigationIndex < this.moveHistory.length
                    ) {
                        // At a specific move position
                        moveNumber.textContent = (
                            this.currentNavigationIndex + 2
                        ).toString();
                    } else {
                        // At current position
                        moveNumber.textContent = (
                            this.moveHistory.length + 1
                        ).toString();
                    }
                }

                if (!this.isBatchImporting) {
                    console.log("updateDisplay: Move number updated");
                }

                // Update move history
                this.updateMoveHistory();

                if (!this.isBatchImporting) {
                    console.log("updateDisplay: Move history updated");
                }

                // Update move highlighting
                this.updateMoveHistoryHighlight();

                if (!this.isBatchImporting) {
                    console.log("updateDisplay: Move highlighting updated");
                }

                // Update displayed position info
                const positionDisplay = this.container.querySelector(
                    "[data-position-display]",
                );
                if (positionDisplay) {
                    try {
                        const fullText = this.getFullPositionDisplayText();

                        if (
                            this.config.showLastMove &&
                            fullText.includes("\n")
                        ) {
                            // Split content into separate lines and create HTML
                            const lines = fullText.split("\n");
                            positionDisplay.innerHTML = lines
                                .map(
                                    (line) =>
                                        `<div translate="no">${line}</div>`,
                                )
                                .join("");
                        } else {
                            positionDisplay.innerHTML = fullText;
                        }
                    } catch (error) {
                        console.error(
                            "Error updating position display:",
                            error,
                        );
                        positionDisplay.textContent = "Error loading position";
                    }
                }

                if (!this.isBatchImporting) {
                    console.log("updateDisplay: Position display updated");
                }

                // Update SFEN/Comment display - use navigation-aware SFEN or comment
                const sfenExport = this.container.querySelector(
                    "[data-current-sfen]",
                );
                if (sfenExport) {
                    try {
                        if (this.config.displaySFEN) {
                            // Show SFEN when checkbox is checked
                            sfenExport.placeholder = "Loading...";
                            sfenExport.value =
                                "SFEN\n" + this.getNavigationDisplaySFEN();
                            sfenExport.readOnly = true; // SFEN is always readonly
                        } else {
                            // Show comment when checkbox is unchecked (default)
                            sfenExport.placeholder =
                                "(No Comment)" +
                                (this.config.allowCustomComments
                                    ? " - Click to add"
                                    : "");
                            const comment = this.getNavigationDisplayComment();
                            sfenExport.value = comment || "";
                            sfenExport.readOnly =
                                !this.config.allowCustomComments; // Editable if allowed
                        }
                    } catch (error) {
                        console.error(
                            "Error updating SFEN/Comment display:",
                            error,
                        );
                        sfenExport.value = "Error loading display";
                    }
                }

                if (!this.isBatchImporting) {
                    console.log("updateDisplay: SFEN display updated");
                }

                // Update game export automatically
                this.updateGameExport();
                this.updatePGNExport();
                this.updateKIFExport();

                if (!this.isBatchImporting) {
                    console.log("updateDisplay: Game export updated");
                    console.log("updateDisplay: Completed successfully");
                }
            } catch (error) {
                console.error("Error in updateDisplay:", error);
            }
        }

        updateMoveHistory() {
            const moveList = this.container.querySelector("[data-move-list]");
            if (!moveList) return;

            if (this.config.displayInlineNotation) {
                // Inline: starting position + moves/variations as spans
                const startSpan =
                    '<span class="chushogi-move-item-inline clickable" data-move="start" title="Click to navigate here">Starting Position</span>';
                const movesHtml = this.buildMoveTreeInlineHTML();
                moveList.innerHTML =
                    startSpan + (movesHtml ? " " + movesHtml : "");
            } else {
                // Default: starting position + lishogi-style tree rows
                const startDiv =
                    '<div class="chushogi-move-item clickable" data-move="start" title="Click to navigate here">Starting Position</div>';
                moveList.innerHTML = startDiv + this.buildMoveTreeHTML();
            }

            // Click: starting position
            const startEl = moveList.querySelector('[data-move="start"]');
            if (startEl) {
                startEl.addEventListener("click", () =>
                    this.navigateToPosition("start"),
                );
            }

            // Click: every tree node (main-line and variation)
            moveList.querySelectorAll("[data-node-id]").forEach((el) => {
                el.addEventListener("click", () => {
                    const nodeId = parseInt(
                        el.getAttribute("data-node-id"),
                        10,
                    );
                    const node = this._nodeMap?.get(nodeId);
                    if (!node) return;
                    // If the node is on the current main line, use the index-based
                    // navigator so isNavigating behaves correctly.
                    const mainLineIdx = this.moveHistory.indexOf(node);
                    if (mainLineIdx >= 0) {
                        this.navigateToPosition(mainLineIdx);
                    } else {
                        this.navigateToNode(node);
                    }
                });
            });
        }

        clearHighlights() {
            // Remove all visual highlights from the board
            const squares = this.container.querySelectorAll(".chushogi-square");
            squares.forEach((square) => {
                square.classList.remove(
                    "selected",
                    "valid-move",
                    "last-move",
                    "lion-return-choice",
                );
            });
        }

        // SFEN (Shogi Forsyth\u2013Edwards Notation) support
        loadSFEN(sfen) {
            // Validate SFEN before making any changes
            if (!this.validateSFEN(sfen)) {
                console.warn("Invalid SFEN provided:", sfen);
                return false;
            }

            const parts = sfen.split(" ");
            const position = parts[0];
            const newCurrentPlayer = parts[1];

            // Use unified board parsing function
            const tempBoard = this.parseSFENBoard(position);
            if (!tempBoard) {
                console.warn("Failed to parse SFEN board:", position);
                return false;
            }

            // Parse Lion capture field (third field) if present
            const lionCapture = parts.length >= 3 ? parts[2] : "-";

            // Use centralized state management for complete SFEN loading
            this.gameStateManager.updateGameState({
                board: tempBoard,
                currentPlayer: newCurrentPlayer,
                selectedSquare: null,
                validMoves: [],
                moveHistory: [],
                moveTree: { id: "root", children: [], parent: null, ply: 0 },
                isNavigating: false,
                currentNavigationIndex: null,
                editMode: {
                    selectedPiece: null,
                    counterStrikeSelection: false,
                    preEditPosition: this.editMode.preEditPosition, // Preserve if set
                    preEditCounterStrike: this.editMode.preEditCounterStrike, // Preserve if set
                },
            });

            // Invalidate moveable pieces cache when board state changes
            this.moveablePiecesCache = null;

            // Update related state variables
            this.lastLionCapture = lionCapture === "-" ? null : lionCapture;
            this.startingLionCapture = this.lastLionCapture;
            this.startingPlayer = newCurrentPlayer;
            this.startingSFEN = this.sanitizeSFEN(sfen);
            this.lastMove = null;
            this.gameStatus = "playing";

            // Clear prompt states
            this.lionReturnPromptActive = false;
            this.lionReturnAlternateSquare = null;
            this.promotionPromptActive = false;
            this.promotionDestinationSquare = null;
            this.promotionDeferralSquare = null;
            this.promotionAlternateSquare = null;
            this.promotionMove = null;

            // Clear visual elements
            this.highlightManager.clearAll();
            this.drawings.arrows.clear();
            this.drawings.circles.clear();

            // Update all displays
            this.updateBoard();
            this.updateDisplay();
            this.updateMoveHistory();
            this.updateMoveHistoryHighlight();
            this.updateSquareHighlights();
            this.initializeCanvas();

            return true;
        }

        // Unified SFEN board parsing function used by all SFEN interpreters
        parseSFENBoard(boardString) {
            const tempBoard = this.createEmptyBoard();
            const ranks = boardString.split("/");

            for (
                let rankIndex = 0;
                rankIndex < ranks.length && rankIndex < 12;
                rankIndex++
            ) {
                let fileIndex = 0;
                const rank = ranks[rankIndex];

                for (let i = 0; i < rank.length; i++) {
                    const char = rank[i];

                    if (char >= "0" && char <= "9") {
                        // Check if this is part of a two-digit number (10, 11, 12)
                        if (
                            char === "1" &&
                            i + 1 < rank.length &&
                            rank[i + 1] >= "0" &&
                            rank[i + 1] <= "2"
                        ) {
                            // Handle 10, 11, 12 (two-digit numbers)
                            i++;
                            const secondDigit = parseInt(rank[i]);
                            const emptySquares = 10 + secondDigit;
                            fileIndex += emptySquares;
                        } else {
                            // Single digit number (0-9, where 0 means no empty squares)
                            const emptySquares = parseInt(char);
                            fileIndex += emptySquares;
                        }
                    } else if (char === "+") {
                        // Promoted piece (next character)
                        i++;
                        if (i < rank.length) {
                            const pieceChar = rank[i];
                            const isWhite =
                                pieceChar === pieceChar.toLowerCase();
                            const promotedType = "+" + pieceChar.toUpperCase();

                            // Validate that this promoted piece type exists
                            if (!PIECE_DEFINITIONS[promotedType]) {
                                console.warn(
                                    "Invalid promoted piece type:",
                                    promotedType,
                                );
                                return null;
                            }

                            if (fileIndex < 12) {
                                tempBoard[rankIndex][fileIndex] = {
                                    type: promotedType,
                                    color: isWhite ? "w" : "b",
                                    promoted: true,
                                    originalType: pieceChar.toUpperCase(),
                                };
                                fileIndex++;
                            }
                        }
                    } else if (/[a-zA-Z]/.test(char)) {
                        // Regular piece
                        const isWhite = char === char.toLowerCase();
                        const pieceType = char.toUpperCase();

                        // Validate that this piece type exists
                        if (!PIECE_DEFINITIONS[pieceType]) {
                            console.warn("Invalid piece type:", pieceType);
                            return null;
                        }

                        if (fileIndex < 12) {
                            tempBoard[rankIndex][fileIndex] = {
                                type: pieceType,
                                color: isWhite ? "w" : "b",
                                promoted: false,
                            };
                            fileIndex++;
                        }
                    }
                }
            }

            return tempBoard;
        }

        validateSFEN(sfen) {
            const parts = sfen.split(" ");
            if (parts.length < 2) return false;

            const position = parts[0];
            const player = parts[1];

            // Validate player
            if (player !== "b" && player !== "w") return false;

            // Validate position format
            const ranks = position.split("/");
            if (ranks.length > 12) return false; // Can have up to 12 rows

            // Valid piece letters (case insensitive)
            const validPieces = new Set([
                "A",
                "B",
                "C",
                "D",
                "E",
                "F",
                "G",
                "H",
                "I",
                "K",
                "L",
                "M",
                "N",
                "O",
                "P",
                "Q",
                "R",
                "S",
                "T",
                "V",
                "X",
            ]);
            const nonPromotablePieces = new Set(["K", "N", "Q"]); // Cannot be promoted

            // Validate each rank
            for (const rank of ranks) {
                let fileCount = 0;
                for (let i = 0; i < rank.length; i++) {
                    const char = rank[i];

                    if (char >= "0" && char <= "9") {
                        // Check if this is part of a two-digit number (10, 11, 12)
                        if (
                            char === "1" &&
                            i + 1 < rank.length &&
                            rank[i + 1] >= "0" &&
                            rank[i + 1] <= "2"
                        ) {
                            // Handle 10, 11, 12 (two-digit numbers)
                            i++;
                            const secondDigit = parseInt(rank[i]);
                            const emptySquares = 10 + secondDigit;
                            if (emptySquares > 12) return false;
                            fileCount += emptySquares;
                        } else {
                            // Single digit number (0-9, where 0 means no empty squares)
                            const emptySquares = parseInt(char);
                            if (emptySquares < 0 || emptySquares > 9)
                                return false;
                            fileCount += emptySquares;
                        }
                    } else if (char === "+") {
                        // Must be followed by a valid piece character that can be promoted
                        i++;
                        if (i >= rank.length) return false;
                        const pieceChar = rank[i].toUpperCase();
                        if (
                            !validPieces.has(pieceChar) ||
                            nonPromotablePieces.has(pieceChar)
                        )
                            return false;
                        fileCount++;
                    } else if (/[a-zA-Z]/.test(char)) {
                        const pieceChar = char.toUpperCase();
                        if (!validPieces.has(pieceChar)) return false;
                        fileCount++;
                    } else {
                        // Invalid character
                        return false;
                    }
                }

                // Each rank can have up to 12 files
                if (fileCount > 12) return false;
            }

            // Validate counter-strike square (third field) if present
            if (parts.length >= 3) {
                const counterStrike = parts[2];
                if (counterStrike !== "-") {
                    // Should be a valid board coordinate (like 1a, 12l, etc.) - file first, then rank
                    if (!/^([1-9]|1[0-2])[a-l]$/.test(counterStrike))
                        return false;
                }
            }

            return true;
        }

        // Apply SFEN position without clearing move history (used for undo)
        applySFENPosition(sfen) {
            const parts = sfen.split(" ");
            if (parts.length < 2) return false;

            const boardString = parts[0];
            const currentPlayer = parts[1];

            // Use unified board parsing function
            const tempBoard = this.parseSFENBoard(boardString);
            if (!tempBoard) {
                console.warn("Failed to parse SFEN board:", boardString);
                return false;
            }

            // Parse Lion capture field
            const lionCapture = parts.length >= 3 ? parts[2] : "-";

            // Apply the position
            this.board = tempBoard;
            this.currentPlayer = currentPlayer;
            this.lastLionCapture = lionCapture === "-" ? null : lionCapture;

            // Update lastMove to match current history
            this.lastMove =
                this.moveHistory.length > 0
                    ? this.moveHistory[this.moveHistory.length - 1]
                    : null;

            // Update display - don't call updateCurrentPlayer() as we just set it from SFEN
            this.updateBoard();

            return true;
        }

        // Unified board-to-SFEN conversion function used by all SFEN generators
        boardToSFEN() {
            let sfen = "";

            // Board position
            for (let rank = 0; rank < 12; rank++) {
                let emptyCount = 0;
                let rankString = "";

                for (let file = 0; file < 12; file++) {
                    const piece = this.board[rank][file];

                    if (piece) {
                        if (emptyCount > 0) {
                            // Handle two-digit empty counts (10, 11, 12) properly for SFEN
                            rankString += emptyCount.toString();
                            emptyCount = 0;
                        }

                        if (piece.promoted || piece.type.startsWith("+")) {
                            // Promoted piece - use originalType if available, otherwise extract from type
                            const originalType =
                                piece.originalType ||
                                (piece.type.startsWith("+")
                                    ? piece.type.substring(1)
                                    : piece.type);
                            let pieceChar = originalType;
                            if (piece.color === "w") {
                                pieceChar = pieceChar.toLowerCase();
                            }
                            rankString += "+" + pieceChar;
                        } else {
                            // Regular piece
                            let pieceChar = piece.type;
                            if (piece.color === "w") {
                                pieceChar = pieceChar.toLowerCase();
                            }
                            rankString += pieceChar;
                        }
                    } else {
                        emptyCount++;
                    }
                }

                if (emptyCount > 0) {
                    // Handle two-digit empty counts (10, 11, 12) properly for SFEN
                    rankString += emptyCount.toString();
                }

                sfen += rankString;
                if (rank < 11) sfen += "/";
            }

            return sfen;
        }

        exportSFEN() {
            // Use unified board-to-SFEN conversion
            let sfen = this.boardToSFEN();

            // Current player - who needs to move next
            // Always determine based on move history to ensure accuracy
            let playerToMove;
            let completedMoves;

            if (this.isNavigating) {
                // When navigating: navigation index -1 = start (0 moves), 0 = after move 1 (1 move), etc.
                completedMoves = this.currentNavigationIndex + 1;

                if (completedMoves === 0) {
                    // At starting position
                    playerToMove = this.startingPlayer || "b";
                } else {
                    // After some moves - get the last move and determine next player
                    const lastMoveIndex = this.currentNavigationIndex;
                    const lastMove = this.moveHistory[lastMoveIndex];
                    if (lastMove && lastMove.piece) {
                        // Next player is opposite of who made the last move
                        playerToMove = lastMove.piece.color === "b" ? "w" : "b";
                    } else {
                        playerToMove = this.startingPlayer || "b";
                    }
                }
            } else {
                // When at current position, use move history length
                completedMoves = this.moveHistory.length;

                if (completedMoves === 0) {
                    // No moves made yet
                    playerToMove = this.startingPlayer || "b";
                } else {
                    // Get the last move and determine next player
                    const lastMove = this.moveHistory[completedMoves - 1];
                    if (lastMove && lastMove.piece) {
                        // Next player is opposite of who made the last move
                        playerToMove = lastMove.piece.color === "b" ? "w" : "b";
                    } else {
                        playerToMove = this.startingPlayer || "b";
                    }
                }
            }

            sfen += " " + playerToMove;

            // Last Lion capture location (third field)
            sfen += " " + (this.lastLionCapture || "-");

            // Move number should indicate the turn number for the NEXT move to be played
            const moveNumber = Math.abs(Math.trunc(completedMoves + 1));
            sfen += " " + moveNumber;

            // Debug logging to track SFEN generation
            console.log(
                `SFEN Debug: player=${playerToMove}, moves=${completedMoves}, number=${moveNumber}, navigating=${this.isNavigating}, navIndex=${this.currentNavigationIndex}, historyLength=${this.moveHistory.length}`,
            );

            return sfen;
        }

        // Export SFEN with a specific player override (for allowIllegalMoves mode)
        exportSFENWithPlayer(playerOverride) {
            // Use unified board-to-SFEN conversion
            let sfen = this.boardToSFEN();

            // Use the provided player override
            sfen += " " + playerOverride;

            // Last Lion capture location (third field)
            sfen += " " + (this.lastLionCapture || "-");

            // Move number should indicate the turn number for the NEXT move to be played
            let completedMoves;
            if (this.isNavigating) {
                completedMoves = this.currentNavigationIndex + 1;
            } else {
                completedMoves = this.moveHistory.length;
            }
            const moveNumber = Math.abs(Math.trunc(completedMoves + 1));
            sfen += " " + moveNumber;

            return sfen;
        }

        // Sanitize SFEN to ensure turn number is always a positive whole number
        sanitizeSFEN(sfen) {
            const parts = sfen.split(" ");
            if (parts.length >= 4) {
                // Parse the turn number (4th field)
                const turnNumber = parseFloat(parts[3]);
                // Ensure it's a positive whole number
                parts[3] = Math.abs(Math.trunc(turnNumber)).toString();
            }
            return parts.join(" ");
        }

        // Helper method to simulate a move and get the resulting SFEN without changing the actual board
        getResultingSFEN(moveData) {
            const {
                from,
                to,
                piece,
                promoted = false,
                midpoint = null,
            } = moveData;

            // Create a deep copy of the current board
            const boardCopy = this.board.map((row) =>
                row.map((cell) => (cell ? { ...cell } : null)),
            );

            // Apply the move to the copy
            const [fromRank, fromFile] = this.parseSquareId(from);
            const [toRank, toFile] = this.parseSquareId(to);

            // Handle double moves (Lion moves)
            if (midpoint) {
                const [midRank, midFile] = this.parseSquareId(midpoint);
                // Remove piece from origin
                boardCopy[fromRank][fromFile] = null;
                // Capture at midpoint
                boardCopy[midRank][midFile] = null;
                // Place at final destination
                const finalPiece = { ...piece };
                if (promoted) {
                    finalPiece.type = this.getPromotedType(piece.type);
                    finalPiece.promoted = true;
                    if (piece.type !== finalPiece.type) {
                        finalPiece.originalType = piece.type;
                    }
                }
                boardCopy[toRank][toFile] = finalPiece;
            } else {
                // Regular move
                boardCopy[fromRank][fromFile] = null;
                const finalPiece = { ...piece };
                if (promoted) {
                    finalPiece.type = this.getPromotedType(piece.type);
                    finalPiece.promoted = true;
                    if (piece.type !== finalPiece.type) {
                        finalPiece.originalType = piece.type;
                    }
                }
                boardCopy[toRank][toFile] = finalPiece;
            }

            // Temporarily replace the board and generate SFEN
            const originalBoard = this.board;
            this.board = boardCopy;

            // Generate SFEN with the opposite player to move (since the move was just made)
            const resultingSFEN = this.exportSFENWithPlayer(
                piece.color === "b" ? "w" : "b",
            );

            // Restore the original board
            this.board = originalBoard;

            return resultingSFEN;
        }

        // Count royal pieces (Kings and Princes) for a player and return first one found
        countRoyals(board, player) {
            const royals = [];
            const allPieces = [];

            // Iterate through the entire board
            for (let rank = 0; rank < 12; rank++) {
                for (let file = 0; file < 12; file++) {
                    const piece = board[rank][file];

                    if (piece) {
                        allPieces.push({
                            rank,
                            file,
                            color: piece.color,
                            type: piece.type,
                            squareId: this.getSquareId(rank, file),
                        });

                        if (piece.color === player) {
                            // Check if piece is a royal: King (K) or Prince (+E)
                            if (piece.type === "K" || piece.type === "+E") {
                                const squareId = this.getSquareId(rank, file);
                                royals.push({ squareId, piece, rank, file });
                            }
                        }
                    }
                }
            }

            console.log("countRoyals debug:", {
                player,
                totalPiecesOnBoard: allPieces.length,
                playerPieces: allPieces.filter((p) => p.color === player),
                foundRoyals: royals.length,
                allPieces: allPieces.slice(0, 10), // Just show first 10 pieces to avoid clutter
            });

            return {
                count: royals.length,
                firstRoyal: royals.length > 0 ? royals[0] : null,
                secondRoyal: royals.length > 1 ? royals[1] : null,
                allRoyals: royals,
            };
        }

        // Simple check: is a royal square under attack by the opponent on given board
        isRoyalUnderAttack(board, royalSquareId, attackerColor) {
            if (!board || !royalSquareId || !attackerColor) return false;

            // Temporarily replace the board to calculate influence on the resulting position
            const originalBoard = this.board;
            this.board = board;

            // Calculate influence of attacker pieces
            const influence = this.calculateBoardInfluence();
            const attackerInfluence =
                attackerColor === "w" ? influence.white : influence.black;

            // Restore the original board
            this.board = originalBoard;

            // Check if the royal's square is under attack
            return attackerInfluence.has(royalSquareId);
        }

        // Check if two royals are adjacent to each other
        areRoyalsAdjacent(royal1, royal2) {
            if (!royal1 || !royal2) return false;

            const rankDiff = Math.abs(royal1.rank - royal2.rank);
            const fileDiff = Math.abs(royal1.file - royal2.file);

            // Adjacent means rank/file difference of 1 in any direction (including diagonals)
            return (
                rankDiff <= 1 &&
                fileDiff <= 1 &&
                !(rankDiff === 0 && fileDiff === 0)
            );
        }

        // Check if a position would violate repetition rules based on repetitionHandling setting
        wouldViolateRepetitionRules(boardPosition, playerToMove) {
            // In relaxed mode, allow all repeats
            if (this.config.repetitionHandling === "relaxed") {
                return false;
            }

            // Count how many times this exact position (board + player to move) has occurred
            let repeatCount = 0;

            // Check starting position
            if (this.startingSFEN) {
                const startParts = this.startingSFEN.split(" ");
                if (
                    startParts[1] === playerToMove &&
                    startParts[0] === boardPosition
                ) {
                    repeatCount++;
                }
            }

            // When navigating, moveHistory contains "future" moves beyond the branch
            // point that haven't been reached from this position — checking them would
            // falsely flag the next main-line move as a repetition.  Instead, walk the
            // ancestor chain of currentNode, which is exactly the positions played so
            // far on the path leading to the current branch point.
            let historyToCheck;
            if (this.currentNode !== null) {
                const ancestorPath = [];
                let n = this.currentNode;
                while (n && n !== this.moveTree) {
                    ancestorPath.unshift(n);
                    n = n.parent;
                }
                historyToCheck = ancestorPath;
            } else {
                historyToCheck = this.moveHistory;
            }

            // Check the relevant history
            for (const move of historyToCheck) {
                if (move.resultingSFEN) {
                    const historyParts = move.resultingSFEN.split(" ");
                    if (
                        historyParts[1] === playerToMove &&
                        historyParts[0] === boardPosition
                    ) {
                        repeatCount++;
                    }
                }
            }

            // Apply repetition handling rules
            if (this.config.repetitionHandling === "strict") {
                // Ban first repeat (repeatCount >= 1)
                if (repeatCount >= 1) {
                    console.log(
                        `Move blocked: would repeat position (strict mode, count=${repeatCount})`,
                    );
                    return true;
                }
            } else if (this.config.repetitionHandling === "lenient") {
                // Ban third repeat (repeatCount >= 3)
                if (repeatCount >= 3) {
                    console.log(
                        `Move blocked: would repeat position 4th time (lenient mode, count=${repeatCount})`,
                    );
                    return true;
                }
            }

            return false;
        }

        // Check if double movers (Lions, Falcons, Eagles) can capture both adjacent royals
        areAdjacentRoyalsUnderDoubleMoverAttack(
            board,
            royal1,
            royal2,
            attackerColor,
        ) {
            if (!board || !royal1 || !royal2 || !attackerColor) return false;

            // Iterate through all enemy pieces to find double movers
            for (let rank = 0; rank < 12; rank++) {
                for (let file = 0; file < 12; file++) {
                    const piece = board[rank][file];

                    if (piece && piece.color === attackerColor) {
                        // Check if this piece can capture both royals in a double move
                        if (
                            this.canDoubleMoverCaptureAdjacentRoyals(
                                board,
                                piece,
                                rank,
                                file,
                                royal1,
                                royal2,
                            )
                        ) {
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        // Check if a specific double mover piece can capture both adjacent royals
        canDoubleMoverCaptureAdjacentRoyals(
            board,
            piece,
            pieceRank,
            pieceFile,
            royal1,
            royal2,
        ) {
            const pieceType = piece.type;

            // A. Lion (N/+O) - can capture if adjacent to either royal
            if (pieceType === "N" || pieceType === "+O") {
                return (
                    this.isLionAdjacentToRoyal(pieceRank, pieceFile, royal1) ||
                    this.isLionAdjacentToRoyal(pieceRank, pieceFile, royal2)
                );
            }

            // B. Falcon (+H) - one square directly in front of one royal, other royal directly behind
            if (pieceType === "+H") {
                return this.canFalconCaptureAdjacentRoyals(
                    piece.color,
                    pieceRank,
                    pieceFile,
                    royal1,
                    royal2,
                );
            }

            // C. Eagle (+D) - one square diagonally in front of one royal, other royal on adjacent square farthest from Eagle
            if (pieceType === "+D") {
                return this.canEagleCaptureAdjacentRoyals(
                    piece.color,
                    pieceRank,
                    pieceFile,
                    royal1,
                    royal2,
                );
            }

            return false;
        }

        // Check if Lion is adjacent to a royal
        isLionAdjacentToRoyal(lionRank, lionFile, royal) {
            const rankDiff = Math.abs(lionRank - royal.rank);
            const fileDiff = Math.abs(lionFile - royal.file);
            return (
                rankDiff <= 1 &&
                fileDiff <= 1 &&
                !(rankDiff === 0 && fileDiff === 0)
            );
        }

        // Get allowed lion-step deltas for asymmetric double movers
        getAllowedLionStepDeltas(pieceType, color) {
            // Determine forward direction:
            // White (\u5f8c\u624b): forward is down the board (a\u2192l) = increasing rank = +1
            // Black (\u5148\u624b): forward is up the board (l\u2192a) = decreasing rank = -1
            const forwardSign = color === "w" ? 1 : -1;

            if (pieceType === "+H") {
                // Horned Falcon: forward trio only
                return [
                    [0, forwardSign], // Forward
                    [1, forwardSign], // Forward-right
                    [-1, forwardSign], // Forward-left
                ];
            } else if (pieceType === "+D") {
                // Soaring Eagle: backward trio only
                return [
                    [0, -forwardSign], // Backward
                    [1, -forwardSign], // Backward-right
                    [-1, -forwardSign], // Backward-left
                ];
            }

            return []; // Not a valid asymmetric double mover
        }

        // Check if Falcon can capture adjacent royals using direct line attack
        canFalconCaptureAdjacentRoyals(
            falconColor,
            falconRank,
            falconFile,
            royal1,
            royal2,
        ) {
            // Try both royal arrangements: royal1 as target, royal2 as behind
            return (
                this.checkFalconDirectLineAttack(
                    falconColor,
                    falconRank,
                    falconFile,
                    royal1,
                    royal2,
                ) ||
                this.checkFalconDirectLineAttack(
                    falconColor,
                    falconRank,
                    falconFile,
                    royal2,
                    royal1,
                )
            );
        }

        // Check if Falcon is positioned for direct line attack: one square in front of target royal, other royal directly behind
        checkFalconDirectLineAttack(
            falconColor,
            falconRank,
            falconFile,
            targetRoyal,
            otherRoyal,
        ) {
            // Determine forward direction for this Falcon color
            // White (\u5f8c\u624b): forward is down the board (a\u2192l) = increasing rank
            // Black (\u5148\u624b): forward is up the board (l\u2192a) = decreasing rank
            const forwardDirection = falconColor === "w" ? 1 : -1; // White forward = +1, Black forward = -1

            // Check if Falcon is one square directly in front of the target royal
            const isFalconInFront =
                falconRank === targetRoyal.rank - forwardDirection &&
                falconFile === targetRoyal.file;

            // Check if other royal is one square directly behind the target royal (same file, opposite direction)
            const isOtherRoyalBehind =
                otherRoyal.rank === targetRoyal.rank + forwardDirection &&
                otherRoyal.file === targetRoyal.file;

            return isFalconInFront && isOtherRoyalBehind;
        }

        // Check if Eagle can capture adjacent royals using diagonal line attack
        canEagleCaptureAdjacentRoyals(
            eagleColor,
            eagleRank,
            eagleFile,
            royal1,
            royal2,
        ) {
            // Eagles move diagonally forward - check both diagonal directions
            return (
                this.checkEagleDiagonalAttack(
                    eagleColor,
                    eagleRank,
                    eagleFile,
                    royal1,
                    royal2,
                    1,
                ) || // forward-right diagonal
                this.checkEagleDiagonalAttack(
                    eagleColor,
                    eagleRank,
                    eagleFile,
                    royal1,
                    royal2,
                    -1,
                ) // forward-left diagonal
            );
        }

        // Check if Eagle is positioned for diagonal line attack: one royal one diagonal square forward, other royal two diagonal squares forward
        checkEagleDiagonalAttack(
            eagleColor,
            eagleRank,
            eagleFile,
            royal1,
            royal2,
            fileDirection,
        ) {
            // Determine forward direction for this Eagle color (Eagles move diagonally forward)
            // White (\u5f8c\u624b): forward is down the board (a\u2192l) = increasing rank = +1
            // Black (\u5148\u624b): forward is up the board (l\u2192a) = decreasing rank = -1
            const forwardDirection = eagleColor === "w" ? 1 : -1; // White forward = +1, Black forward = -1

            // Calculate positions one and two diagonal squares forward from Eagle
            const oneSquareForward = {
                rank: eagleRank + forwardDirection,
                file: eagleFile + fileDirection,
            };
            const twoSquaresForward = {
                rank: eagleRank + 2 * forwardDirection,
                file: eagleFile + 2 * fileDirection,
            };

            // Check if royals are positioned at these diagonal squares (try both arrangements)
            const arrangement1 =
                royal1.rank === oneSquareForward.rank &&
                royal1.file === oneSquareForward.file &&
                royal2.rank === twoSquaresForward.rank &&
                royal2.file === twoSquaresForward.file;

            const arrangement2 =
                royal2.rank === oneSquareForward.rank &&
                royal2.file === oneSquareForward.file &&
                royal1.rank === twoSquaresForward.rank &&
                royal1.file === twoSquaresForward.file;

            return arrangement1 || arrangement2;
        }

        // Generic function to check if asymmetric double mover can capture two adjacent royals
        canAsymmetricDoubleMoverCaptureRoyals(
            pieceType,
            pieceColor,
            pieceRank,
            pieceFile,
            royal1,
            royal2,
        ) {
            const allowedDeltas = this.getAllowedLionStepDeltas(
                pieceType,
                pieceColor,
            );

            // Try both royal capture orders: R1\u2192R2 and R2\u2192R1
            return (
                this.canCaptureRoyalsInOrder(
                    pieceRank,
                    pieceFile,
                    royal1,
                    royal2,
                    allowedDeltas,
                ) ||
                this.canCaptureRoyalsInOrder(
                    pieceRank,
                    pieceFile,
                    royal2,
                    royal1,
                    allowedDeltas,
                )
            );
        }

        // Check if piece can capture royals in specific order using allowed step deltas
        canCaptureRoyalsInOrder(
            pieceRank,
            pieceFile,
            firstRoyal,
            secondRoyal,
            allowedDeltas,
        ) {
            // Step 1: Check if piece can reach firstRoyal in one allowed step
            const step1RankDelta = firstRoyal.rank - pieceRank;
            const step1FileDelta = firstRoyal.file - pieceFile;

            const canReachFirst = allowedDeltas.some(
                ([dFile, dRank]) =>
                    dFile === step1FileDelta && dRank === step1RankDelta,
            );

            if (!canReachFirst) return false;

            // Step 2: Check if piece can reach secondRoyal from firstRoyal in one allowed step
            const step2RankDelta = secondRoyal.rank - firstRoyal.rank;
            const step2FileDelta = secondRoyal.file - firstRoyal.file;

            const canReachSecond = allowedDeltas.some(
                ([dFile, dRank]) =>
                    dFile === step2FileDelta && dRank === step2RankDelta,
            );

            return canReachSecond;
        }

        // Convert a move to USI notation (coordinates + optional promotion)
        moveToUSI(move) {
            if (!move.from || !move.to) {
                console.error("Invalid move for USI conversion:", move);
                return "";
            }

            let usi = move.from + move.to;

            // Handle double moves (Lion, Horned Falcon, Soaring Eagle)
            if (move.midpoint) {
                // For double moves, USI format is: start + midpoint + destination
                usi = move.from + move.midpoint + move.to;
            }

            // Add promotion indicator if the piece was promoted
            if (move.promoted) {
                usi += "+";
            }

            return usi;
        }

        // Escape special characters in comments for export
        escapeComment(comment) {
            if (!comment) return "";
            // Escape backslash first, then newlines, then closing bracket
            return comment
                .replace(/\\/g, "\\\\")
                .replace(/\n/g, "\\n")
                .replace(/\}/g, "\\}");
        }

        // Sanitize a raw (unescaped) comment for embedding in PGN { \u2026 } braces.
        // PGN uses { } as comment delimiters and % at line-start as an escape line,
        // so those characters must be replaced.  Newlines would break PGN line
        // semantics and are collapsed to "; ".
        //   {  \u2192  -(
        //   }  \u2192  )-
        //   \n \u2192  ;  (semicolon + space)
        //   %  \u2192  */o
        // Returns the sanitized text ready to be wrapped in { }.
        sanitizeCommentForPGN(comment) {
            if (!comment) return "";
            return comment
                .replace(/\{/g, "-(")
                .replace(/\}/g, ")-")
                .replace(/\n/g, "; ")
                .replace(/%/g, "*/o");
        }

        // Unescape special characters in comments during import
        unescapeComment(comment) {
            if (!comment) return "";

            // First, handle closing brackets
            comment = comment.replace(/\\}/g, "}");

            // Process all escape sequences including trailing backslashes
            // Regex matches: backslashes followed by optional character (handles end-of-string)
            return comment.replace(/\\+(.)?/g, (match, nextChar) => {
                const backslashCount = match.length - (nextChar ? 1 : 0);

                if (!nextChar) {
                    // Trailing backslashes at end of string
                    return "\\".repeat(Math.floor(backslashCount / 2));
                } else if (nextChar === "n") {
                    // Odd number of backslashes before n: it's an escaped newline
                    // Even number: it's literal backslash(es) + 'n'
                    if (backslashCount % 2 === 1) {
                        return "\\".repeat((backslashCount - 1) / 2) + "\n";
                    } else {
                        return "\\".repeat(backslashCount / 2) + "n";
                    }
                } else {
                    // Regular backslash escaping: \\ \u2192 \
                    return (
                        "\\".repeat(Math.floor(backslashCount / 2)) +
                        (backslashCount % 2 === 1 ? "\\" + nextChar : nextChar)
                    );
                }
            });
        }

        // ── CSL EXPORT (variation-aware) ─────────────────────────────────────────

        // Serialize the full game tree – main line + all alternate branches – to
        // a CSL string.  Alternate branches are emitted as ( … ) variation groups
        // immediately after the comment (if any) of the move they diverge from,
        // matching the PGN convention.
        buildCSLString() {
            let out = this.startingSFEN || this.exportSFEN();

            if (this.startingComment && this.startingComment.trim()) {
                out += " {" + this.escapeComment(this.startingComment) + "}";
            }

            // Walk the main line (moveHistory).  For each node, after its USI move
            // and optional comment, emit every sibling child of its parent as a
            // ( … ) variation.
            for (let i = 0; i < this.moveHistory.length; i++) {
                const node   = this.moveHistory[i];
                const parent = i === 0 ? this.moveTree : this.moveHistory[i - 1];

                const usi = this.moveToUSI(node);
                if (!usi) continue;

                out += " " + usi;

                if (node.comment && node.comment.trim()) {
                    out += " {" + this.escapeComment(node.comment) + "}";
                }

                // PGN-style sibling variations: other children of parent that
                // are alternatives to this node.  Skip isKIFBranch nodes —
                // those are responses to the *previous* node and are serialized
                // below after that node (when i-1 is processed).
                // children[] is newest-first (unshift), so iterate in reverse to
                // restore the original import order.
                for (let k = parent.children.length - 1; k >= 0; k--) {
                    const sibling = parent.children[k];
                    if (sibling === node) continue;
                    if (sibling.isKIFBranch) continue;
                    for (const body of this._serializeVariation(sibling)) {
                        out += " (" + body + ")";
                    }
                }

                // Raw PGN variations stored on parent (first move failed).
                if (parent.rawVariations) {
                    for (const rv of parent.rawVariations) {
                        const rawMoves = rv && rv.isKIF ? null : (rv.moves || rv);
                        if (!rawMoves) continue;
                        for (const body of this._serializeRawMoves(rawMoves)) {
                            out += " (" + body + ")";
                        }
                    }
                }

                // KIF-style variations: branch children of this node that are
                // responses to this move (isKIFBranch).  Emitted after this
                // node's token, matching the CSL "(…)" placement convention.
                for (let k = node.children.length - 1; k >= 0; k--) {
                    const child = node.children[k];
                    if (!child.isKIFBranch) continue;
                    for (const body of this._serializeVariation(child)) {
                        out += " (" + body + ")";
                    }
                }

                // Raw KIF variations stored on this node (first move failed).
                if (node.rawVariations) {
                    for (const rv of node.rawVariations) {
                        const rawMoves = rv && rv.isKIF ? rv.moves : null;
                        if (!rawMoves) continue;
                        for (const body of this._serializeRawMoves(rawMoves)) {
                            out += " (" + body + ")";
                        }
                    }
                }
            }

            return out;
        }

        // Serialize a raw parsed-move array (from _parseCSLLevel) back to a
        // single-element array containing the body string.  Sub-variations of
        // every move are nested inline immediately after that move, matching the
        // CSL convention that ( … ) blocks follow the move they branch from.
        _serializeRawMoves(moves) {
            if (!moves || moves.length === 0) return [];
            const tokens = [];

            for (const m of moves) {
                let token = m.usi;
                if (m.comment && m.comment.trim()) {
                    token += " {" + this.escapeComment(m.comment) + "}";
                }
                tokens.push(token);

                // Sub-variations appear immediately after the move they follow.
                for (const subVar of (m.variations || [])) {
                    for (const body of this._serializeRawMoves(subVar)) {
                        tokens.push("(" + body + ")");
                    }
                }
            }

            const mainBody = tokens.join(" ");
            return mainBody.length > 0 ? [mainBody] : [];
        }

        // Recursively serialize one variation branch starting at `startNode`.
        //
        // Returns a single-element array [ body ] where body is the complete
        // space-separated move sequence with nested ( … ) blocks.
        //
        // Mirrors the display logic in buildChain / renderChain:
        //   • Emit node N's token.
        //   • After emitting the main continuation (node N+1), immediately emit
        //     the alternatives to N+1 — i.e. the branch children of node N —
        //     so they appear right after N+1 in the output.
        //   • After the last node in the chain, emit its own branch children.
        //
        // "Main continuation" = the last child that does NOT have isBranch:true.
        _serializeVariation(startNode) {
            const tokens = [];
            let cur = startNode;
            let prevNode = null;
            let prevContIdx = -1;

            while (cur) {
                const usi = this.moveToUSI(cur);
                if (!usi) break;

                let token = usi;
                if (cur.comment && cur.comment.trim()) {
                    token += " {" + this.escapeComment(cur.comment) + "}";
                }
                tokens.push(token);

                // 1. KIF children of cur: responses to cur; emit immediately
                //    after cur's token (before its main continuation).
                for (let k = cur.children.length - 1; k >= 0; k--) {
                    if (!cur.children[k].isKIFBranch) continue;
                    for (const body of this._serializeVariation(cur.children[k])) {
                        tokens.push("(" + body + ")");
                    }
                }
                // KIF raw variations stored on cur.
                if (cur.rawVariations) {
                    for (const rv of cur.rawVariations) {
                        if (!rv || !rv.isKIF) continue;
                        for (const body of this._serializeRawMoves(rv.moves)) {
                            tokens.push("(" + body + ")");
                        }
                    }
                }

                // 2. PGN siblings of cur: non-KIF, non-main children of
                //    prevNode.  Emit after cur (and its KIF children above).
                if (prevNode !== null) {
                    for (let k = prevNode.children.length - 1; k >= 0; k--) {
                        if (k === prevContIdx) continue;
                        if (prevNode.children[k].isKIFBranch) continue;
                        for (const body of this._serializeVariation(prevNode.children[k])) {
                            tokens.push("(" + body + ")");
                        }
                    }
                    if (prevNode.rawVariations) {
                        for (const rv of prevNode.rawVariations) {
                            const rawMoves = rv && rv.isKIF ? null : (rv.moves || rv);
                            if (!rawMoves) continue;
                            for (const body of this._serializeRawMoves(rawMoves)) {
                                tokens.push("(" + body + ")");
                            }
                        }
                    }
                }

                // Advance to the main continuation of cur.
                prevNode = cur;
                prevContIdx = -1;
                for (let j = cur.children.length - 1; j >= 0; j--) {
                    if (!cur.children[j].isBranch) { prevContIdx = j; break; }
                }
                cur = prevContIdx >= 0 ? cur.children[prevContIdx] : null;
            }

            // After the last node: emit its KIF children, then its PGN subs.
            if (prevNode !== null) {
                for (let k = prevNode.children.length - 1; k >= 0; k--) {
                    if (!prevNode.children[k].isKIFBranch) continue;
                    for (const body of this._serializeVariation(prevNode.children[k])) {
                        tokens.push("(" + body + ")");
                    }
                }
                if (prevNode.rawVariations) {
                    for (const rv of prevNode.rawVariations) {
                        if (!rv || !rv.isKIF) continue;
                        for (const body of this._serializeRawMoves(rv.moves)) {
                            tokens.push("(" + body + ")");
                        }
                    }
                }
                for (let k = prevNode.children.length - 1; k >= 0; k--) {
                    if (k === prevContIdx) continue;
                    if (prevNode.children[k].isKIFBranch) continue;
                    for (const body of this._serializeVariation(prevNode.children[k])) {
                        tokens.push("(" + body + ")");
                    }
                }
                if (prevNode.rawVariations) {
                    for (const rv of prevNode.rawVariations) {
                        const rawMoves = rv && rv.isKIF ? null : (rv.moves || rv);
                        if (!rawMoves) continue;
                        for (const body of this._serializeRawMoves(rawMoves)) {
                            tokens.push("(" + body + ")");
                        }
                    }
                }
            }

            const mainBody = tokens.join(" ");
            return mainBody.length > 0 ? [mainBody] : [];
        }

        // Export game in CSL format (starting SFEN + space-separated moves)
        exportGame() {
            const exportTextarea =
                this.container.querySelector("[data-game-export]");
            if (!exportTextarea) return;

            const gameExport = this.buildCSLString();
            exportTextarea.value = gameExport;

            // Copy to clipboard without selecting the text
            if (navigator.clipboard) {
                navigator.clipboard.writeText(gameExport).catch(() => {
                    // Fallback: select + execCommand
                    exportTextarea.select();
                    exportTextarea.setSelectionRange(0, 99999);
                    try {
                        document.execCommand("copy");
                    } catch (_) {}
                });
            } else {
                exportTextarea.select();
                exportTextarea.setSelectionRange(0, 99999);
                try {
                    document.execCommand("copy");
                } catch (_) {}
            }
        }

        // Update game export automatically
        updateGameExport() {
            const exportTextarea =
                this.container.querySelector("[data-game-export]");
            if (!exportTextarea) return;
            exportTextarea.value = this.buildCSLString();
        }

        // Render a SFEN board string as a PGN comment block (text drawing).
        // pgnPlayer: "w" or "b" \u2014 shown as "white to play" / "black to play".
        // Promoted pieces are shown as "+"; empty squares as ".".
        sfenToBoardComment(boardPart, pgnPlayer) {
            const ranks = boardPart.split("/");
            const rows = [];
            for (const rank of ranks) {
                const cells = [];
                let i = 0;
                while (i < rank.length) {
                    const ch = rank[i];
                    if (ch === "+") {
                        // Promoted piece \u2014 show as "+" and skip the following letter
                        cells.push("+");
                        i += 2;
                    } else if (ch >= "0" && ch <= "9") {
                        // Empty-square run (possibly multi-digit, e.g. "12")
                        let numStr = "";
                        while (
                            i < rank.length &&
                            rank[i] >= "0" &&
                            rank[i] <= "9"
                        ) {
                            numStr += rank[i++];
                        }
                        const count = parseInt(numStr, 10);
                        for (let j = 0; j < count; j++) cells.push(".");
                    } else {
                        cells.push(ch);
                        i++;
                    }
                }
                rows.push(cells.join(" "));
            }
            const playerLine =
                pgnPlayer === "w" ? "white to play" : "black to play";
            const border = "--------------";
            return `{${border}\n${rows.join("\n")}\n${playerLine}\n${border}}`;
        }

        // Convert a CSL square ID (e.g. "a1", "f12") to a PGN SAN coordinate.
        // CSL rank 1 = gote's back row (top) \u2194 PGN rank 12.
        // CSL rank 12 = sente's back row (bottom) \u2194 PGN rank 1.
        // Convert an internal square ID (<fileNumber><rankChar>, e.g. "6g") to
        // PGN algebraic notation (<fileLetter><rankNumber>, e.g. "g6").
        //
        // Internal format:  fileNumber = 12 - fileIndex (12=leftmost, 1=rightmost)
        //                   rankChar   = 'a' + rankIndex ('a'=top, 'l'=bottom)
        // PGN format:       fileLetter = 'a' + fileIndex  (a=leftmost from white's view)
        //                   rankNumber = 12 - rankIndex   (1=white's back rank, 12=black's)
        //
        // Since fileIndex = 12 - fileNumber:
        //   fileLetter charCode = 97 + (12 - fileNumber) = 109 - fileNumber
        cslSqToPgn(sq) {
            const match = sq.match(/^(\d+)([a-l])$/);
            if (!match) return "??";
            const fileNumber = parseInt(match[1], 10);
            const rankIndex = match[2].charCodeAt(0) - 97; // 'a'=0 \u2026 'l'=11
            const fileLetter = String.fromCharCode(109 - fileNumber); // 109 = 97+12
            const rankNumber = 12 - rankIndex;
            return fileLetter + rankNumber;
        }

        // Return true when the move was a promotion deferral \u2014 the piece was eligible
        // to promote (same conditions the engine uses) but the player chose not to yet.
        // Mirrors checkNormalPromotionEligibility in the promotion manager.
        moveWasDeferred(move) {
            if (move.promoted) return false; // piece DID promote
            if (move.piece.promoted) return false; // already promoted \u2014 no forward deferral
            if (!this.getPromotedType(move.piece.type)) return false; // not promotable
            const [fromRank] = this.parseSquareId(move.from);
            const [toRank] = this.parseSquareId(move.to);
            const { promotionZone, lastRank } =
                this.promotionManager.getPromotionZones(move.piece.color);
            const fromInZone = promotionZone.includes(fromRank);
            const toInZone = promotionZone.includes(toRank);
            const anyCapture = !!(move.captured || move.capturedAtMidpoint);
            // Rule a: piece enters the promotion zone (starts outside, ends within).
            if (!fromInZone && toInZone) return true;
            // Rule b: piece starts inside the zone and makes a capture.
            if (fromInZone && anyCapture) return true;
            // Rule c: pawn (P) reaches the very last rank.
            if (move.piece.type.toUpperCase() === "P" && toRank === lastRank)
                return true;
            return false;
        }

        // Return true if a piece at (fromRank, fromFile) can reach (destRank, destFile)
        // on the given board, using the same direction-walk logic as calculateValidMoves.
        // Sliding pieces are blocked by any intervening piece; step pieces need a clear
        // single step.  Friendly-piece destinations are never reachable.
        canReachSquare(fromRank, fromFile, piece, destRank, destFile, board) {
            const destPiece = board[destRank][destFile];
            if (destPiece && destPiece.color === piece.color) return false; // friendly blocker
            const directions = this.getPieceDirections(piece.type, piece.color);
            for (const dir of directions) {
                for (let d = 1; d < 12; d++) {
                    const r = fromRank + dir.rank * d;
                    const f = fromFile + dir.file * d;
                    if (r < 0 || r >= 12 || f < 0 || f >= 12) break;
                    if (r === destRank && f === destFile) return true;
                    if (board[r][f]) break; // blocked by any piece
                    if (!dir.sliding) break; // step piece \u2014 no further range
                }
            }
            return false;
        }

        // Return the SAN disambiguation info (file, rank, both, or none) needed
        // when multiple pieces of the same type and colour can reach toSq.
        // Per PGN spec:
        //   \u2022 No other piece can reach toSq \u2192 no prefix.
        //   \u2022 Rivals exist but none share the moving piece's file \u2192 file alone.
        //   \u2022 Rivals share the file but not the rank \u2192 rank alone.
        //   \u2022 Rivals share both file and rank \u2192 full square coordinate.
        // boardBefore is the 12\u00d712 array from parseSFENBoard() for the position BEFORE
        // the move. coordStyle selects the returned text's coordinate system:
        //   "pgn"   (default) \u2014 letter-then-number PGN square convention.
        //   "shogi" \u2014 native CSL square convention (number-then-letter, e.g. "8g").
        // Returns { text, type } where type is "none" | "file" | "rank" | "square".
        getSANDisambiguation(piece, fromSq, toSq, boardBefore, coordStyle = "pgn") {
            if (!boardBefore) return { text: "", type: "none" };
            const [fromRankIdx, fromFileIdx] = this.parseSquareId(fromSq);
            const [destRankIdx, destFileIdx] = this.parseSquareId(toSq);

            // Find every other piece of the same type/colour that can reach toSq.
            const rivals = [];
            for (let r = 0; r < 12; r++) {
                for (let c = 0; c < 12; c++) {
                    if (r === fromRankIdx && c === fromFileIdx) continue;
                    const p = boardBefore[r][c];
                    if (!p || p.type !== piece.type || p.color !== piece.color)
                        continue;
                    if (
                        this.canReachSquare(
                            r,
                            c,
                            p,
                            destRankIdx,
                            destFileIdx,
                            boardBefore,
                        )
                    ) {
                        rivals.push({ rank: r, file: c });
                    }
                }
            }

            if (rivals.length === 0) return { text: "", type: "none" }; // sole piece that can reach toSq

            let fileText, rankText, squareText;
            if (coordStyle === "shogi") {
                // fromSq is already native CSL notation: fileNumber + rankChar (e.g. "8g").
                const match = fromSq.match(/^(\d+)([a-l])$/);
                fileText = match ? match[1] : fromSq;
                rankText = match ? match[2] : "";
                squareText = fromSq;
            } else {
                const pgnFrom = this.cslSqToPgn(fromSq);
                fileText = pgnFrom[0];
                rankText = pgnFrom.slice(1);
                squareText = pgnFrom;
            }

            // File alone suffices when no rival sits on the same internal file column.
            if (!rivals.some((rv) => rv.file === fromFileIdx))
                return { text: fileText, type: "file" };
            // Rank alone suffices when no rival sits on the same internal rank row.
            if (!rivals.some((rv) => rv.rank === fromRankIdx))
                return { text: rankText, type: "rank" };
            // Both needed.
            return { text: squareText, type: "square" };
        }

        // For a pass move (from === to, no midpoint), find an empty square that is a
        // legal first-leg square for the moving piece's double move, so the PGN can
        // represent the pass as a double move without XBoard/Winboard confusion.
        //
        // Legal first-leg directions mirror the engine's own double-move generators:
        //   Lion (+O or N)    \u2014 any of the 8 king-step adjacent squares
        //   Horned Falcon +H  \u2014 forward orthogonal only (-1,0 for black; +1,0 for white)
        //   Soaring Eagle +D  \u2014 forward diagonals only  (-1,\u00b11 for black; +1,\u00b11 for white)
        //
        // Returns an internal square ID string, or null if nothing is available.
        findPassMidpoint(fromSq, boardBefore) {
            if (!boardBefore) return null;
            const [fromRank, fromFile] = this.parseSquareId(fromSq);
            const piece = boardBefore[fromRank][fromFile];
            if (!piece) return null;

            // Build the legal first-leg direction set for this piece type.
            const fwd = piece.color === "b" ? -1 : 1; // forward rank direction
            let directions;

            if (this.isLionPiece(piece)) {
                // Lions may use any of the 8 king-step adjacent squares as midpoint.
                directions = [
                    [-1, -1],
                    [-1, 0],
                    [-1, 1],
                    [0, -1],
                    [0, 1],
                    [1, -1],
                    [1, 0],
                    [1, 1],
                ];
            } else if (this.isHornedFalconPiece(piece)) {
                // Horned Falcon double moves only in the forward orthogonal direction.
                directions = [[fwd, 0]];
            } else if (this.isSoaringEaglePiece(piece)) {
                // Soaring Eagle double moves only in the two forward diagonal directions.
                directions = [
                    [fwd, -1],
                    [fwd, 1],
                ];
            } else {
                // Fallback: try all 8 king-step adjacents for any unknown double-mover.
                directions = [
                    [-1, -1],
                    [-1, 0],
                    [-1, 1],
                    [0, -1],
                    [0, 1],
                    [1, -1],
                    [1, 0],
                    [1, 1],
                ];
            }

            for (const [dr, df] of directions) {
                const r = fromRank + dr;
                const f = fromFile + df;
                if (r < 0 || r >= 12 || f < 0 || f >= 12) continue;
                if (!boardBefore[r][f]) return this.getSquareId(r, f); // empty square \u2713
            }
            return null; // all candidate squares are occupied \u2014 shouldn't happen in practice
        }

        // PGN-style move-number prefix for half-move index i (0-based), given
        // whether black moved first (blackStarted). Mirrors standard PGN
        // numbering: white's ply opens a numbered pair ("N. "), black's ply
        // has no prefix at all EXCEPT when black is the very first mover of
        // the whole game, which gets the special "1... " form. Shared by
        // buildPGNString and the move-history list display so both stay in
        // sync.
        getPGNMoveNumberPrefix(i, blackStarted) {
            const isWhiteTurn = blackStarted ? i % 2 === 1 : i % 2 === 0;
            if (blackStarted && i === 0) {
                return "1... ";
            }
            if (isWhiteTurn) {
                const moveNum = blackStarted
                    ? Math.floor((i + 1) / 2) + 1
                    : Math.floor(i / 2) + 1;
                return `${moveNum}. `;
            }
            return "";
        }

        // Build one SAN label (sequential move number + SAN body) per entry in
        // this.moveHistory, in order. Used to render the move-history list \u2014
        // a first step toward supporting branching variations, since
        // variations are naturally expressed as alternate SAN move sequences
        // anchored to a specific ply. Numbering here stays the app's existing
        // sequential "N." per half-move (distinct from the paired white/black
        // numbering used in buildPGNString's exported PGN move text).
        buildMoveHistorySANLabels() {
            const startSFEN = this.startingSFEN || "";

            return this.moveHistory.map((move, index) => {
                const prevSFENFull =
                    index === 0
                        ? startSFEN
                        : this.moveHistory[index - 1].resultingSFEN || "";
                const prevBoard = prevSFENFull.split(" ")[0] || "";
                let boardBefore = null;
                try {
                    boardBefore = prevBoard
                        ? this.parseSFENBoard(prevBoard)
                        : null;
                } catch (_) {
                    /* skip disambiguation on parse error */
                }
                const san = this.moveToSAN(
                    move,
                    boardBefore,
                    "captureAware",
                    "shogi",
                );
                return `${index + 1}. ${san}`;
            });
        }

        // ── Move-tree UI helpers ──────────────────────────────────────────────

        // Generate a SAN label for any node in the tree (main-line or variation).
        // Uses the parent node's resultingSFEN (or startingSFEN for root children)
        // so it works for nodes that are not in the current moveHistory.
        _getNodeSAN(node) {
            const parentSFEN =
                node.parent === this.moveTree
                    ? this.startingSFEN || ""
                    : node.parent.resultingSFEN || "";
            const boardStr = parentSFEN.split(" ")[0] || "";
            let boardBefore = null;
            try {
                boardBefore = boardStr ? this.parseSFENBoard(boardStr) : null;
            } catch (_) {
                /* skip disambiguation on parse error */
            }
            const san = this.moveToSAN(
                node,
                boardBefore,
                "captureAware",
                "shogi",
            );
            return `${node.ply}. ${san}`;
        }

        // Rebuild this._nodeMap (Map<nodeId → node>) by walking the full tree.
        // Called at the start of every move-list render so click handlers can
        // resolve a node from its id attribute.
        _buildNodeMap() {
            this._nodeMap = new Map();
            const walk = (n) => {
                if (n !== this.moveTree) this._nodeMap.set(n.id, n);
                for (const child of n.children) walk(child);
            };
            walk(this.moveTree);
        }

        // Build lishogi-style tree HTML for the default (non-inline) move list.
        // Main line (moveHistory) is rendered at depth 0.
        // At each main-line node, sibling alternatives are rendered at depth 1,
        // and their own sub-variations at depth 2, and so on.
        buildMoveTreeHTML() {
            this._buildNodeMap();
            const parts = [];

            // Find the main continuation of a node: last child without isBranch.
            // Returns the index, or -1 if all children are branches (leaf or
            // all-branch node).
            const mainContinuationIdx = (node) => {
                for (let j = node.children.length - 1; j >= 0; j--) {
                    if (!node.children[j].isBranch) return j;
                }
                return -1;
            };

            // Render a variation chain starting at startNode at the given depth.
            // Sub-variations of node N are rendered AFTER N's continuation so that
            // "(alt)" appears after the move it is alternative to, not before it.
            // prevNode carries N across iterations so its sub-vars are emitted
            // once cur (the continuation) has been rendered.
            const renderChain = (startNode, depth) => {
                parts.push(
                    `<div class="chushogi-variation-block" style="margin-left:12px">`,
                );
                let cur = startNode;
                let prevNode = null;
                let prevContIdx = -1;
                while (cur) {
                    const label = this._getNodeSAN(cur);
                    parts.push(
                        `<div class="chushogi-move-item clickable chushogi-variation-move" ` +
                            `data-node-id="${cur.id}" ` +
                            `title="Click to navigate here">${label}</div>`,
                    );
                    // 1. KIF children of cur: responses to cur; emit immediately
                    //    after cur (before its main continuation).
                    for (let k = cur.children.length - 1; k >= 0; k--) {
                        if (cur.children[k].isKIFBranch) {
                            renderChain(cur.children[k], depth + 1);
                        }
                    }
                    // 2. PGN siblings of cur: non-KIF, non-main children of
                    //    prevNode.  Emit after cur (and its KIF children above).
                    if (prevNode !== null) {
                        for (let k = prevNode.children.length - 1; k >= 0; k--) {
                            if (k === prevContIdx) continue;
                            if (prevNode.children[k].isKIFBranch) continue;
                            renderChain(prevNode.children[k], depth + 1);
                        }
                    }
                    prevNode = cur;
                    prevContIdx = mainContinuationIdx(cur);
                    cur = prevContIdx >= 0 ? cur.children[prevContIdx] : null;
                }
                // After the last node: emit its KIF children, then its PGN subs.
                if (prevNode !== null) {
                    for (let k = prevNode.children.length - 1; k >= 0; k--) {
                        if (prevNode.children[k].isKIFBranch) {
                            renderChain(prevNode.children[k], depth + 1);
                        }
                    }
                    for (let k = prevNode.children.length - 1; k >= 0; k--) {
                        if (k === prevContIdx) continue;
                        if (prevNode.children[k].isKIFBranch) continue;
                        renderChain(prevNode.children[k], depth + 1);
                    }
                }
                parts.push("</div>");
            };

            // Walk the main line at depth 0.  After each main-line node:
            //   1. Render PGN siblings (alternative first moves from the same
            //      parent position), skipping isKIFBranch nodes.
            //   2. Render KIF variations (branch children of this node — the
            //      opponent's responses to this move).
            // This ensures each variation block appears immediately after the
            // move it is a response or alternative to.
            for (let i = 0; i < this.moveHistory.length; i++) {
                const node = this.moveHistory[i];

                // Main-line node
                const label = this._getNodeSAN(node);
                parts.push(
                    `<div class="chushogi-move-item clickable" ` +
                        `data-node-id="${node.id}" ` +
                        `title="Click to navigate here">${label}</div>`,
                );

                // PGN siblings: other children of node.parent.  Oldest first
                // (high-index → low-index, since new nodes are prepended).
                // Skip isKIFBranch nodes — those are shown after the node they
                // respond to (the *previous* main-line node).
                const par = node.parent;
                for (let k = par.children.length - 1; k >= 0; k--) {
                    const sib = par.children[k];
                    if (sib === node) continue;
                    if (sib.isKIFBranch) continue;
                    renderChain(sib, 1);
                }

                // KIF variations: branch children of this node (isKIFBranch).
                for (let k = node.children.length - 1; k >= 0; k--) {
                    const child = node.children[k];
                    if (!child.isKIFBranch) continue;
                    renderChain(child, 1);
                }
            }

            // Frontier pass: render children of the last main-line node that have
            // no successor in moveHistory (i.e. after an undo).
            //   • The promoted child (isBranch=false): walk its full chain inline,
            //     exactly like the main loop does, so it appears at the same level
            //     as the main-line moves above it.  Its non-main siblings appear as
            //     indented variation blocks after the move they diverge from.
            //   • If all children are branches (no promotion), render each via
            //     renderChain as a variation block.
            {
                const _frontier =
                    this.moveHistory.length > 0
                        ? this.moveHistory[this.moveHistory.length - 1]
                        : this.moveTree;
                const _promotedIdx = mainContinuationIdx(_frontier);
                if (_promotedIdx >= 0) {
                    let _fcur = _frontier.children[_promotedIdx];
                    let _fprev = _frontier;
                    let _fprevContIdx = _promotedIdx;
                    while (_fcur) {
                        const label = this._getNodeSAN(_fcur);
                        parts.push(
                            `<div class="chushogi-move-item clickable" ` +
                                `data-node-id="${_fcur.id}" ` +
                                `title="Click to navigate here">${label}</div>`,
                        );
                        // Non-main, non-KIF siblings of _fcur (other children of _fprev):
                        for (let k = _fprev.children.length - 1; k >= 0; k--) {
                            if (k === _fprevContIdx) continue;
                            if (_fprev.children[k].isKIFBranch) continue;
                            renderChain(_fprev.children[k], 1);
                        }
                        // KIF children of _fcur:
                        for (let k = _fcur.children.length - 1; k >= 0; k--) {
                            if (_fcur.children[k].isKIFBranch) {
                                renderChain(_fcur.children[k], 1);
                            }
                        }
                        _fprev = _fcur;
                        _fprevContIdx = mainContinuationIdx(_fcur);
                        _fcur =
                            _fprevContIdx >= 0
                                ? _fcur.children[_fprevContIdx]
                                : null;
                    }
                    // Trailing non-main branches of the last promoted node:
                    if (_fprev !== _frontier) {
                        for (let k = _fprev.children.length - 1; k >= 0; k--) {
                            if (k === _fprevContIdx) continue;
                            if (_fprev.children[k].isKIFBranch) continue;
                            renderChain(_fprev.children[k], 1);
                        }
                    }
                } else {
                    // No promoted child — render all non-KIF frontier children as
                    // variation blocks.
                    for (let k = _frontier.children.length - 1; k >= 0; k--) {
                        if (_frontier.children[k].isKIFBranch) continue;
                        renderChain(_frontier.children[k], 1);
                    }
                }
            }

            return `<div class="chushogi-move-tree-block">${parts.join("")}</div>`;
        }

        // Build inline-notation HTML for the move list when displayInlineNotation
        // is true.  Variations are rendered as parenthetical spans just like CSL.
        buildMoveTreeInlineHTML() {
            this._buildNodeMap();
            const parts = [];

            const mainContinuationIdx = (node) => {
                for (let j = node.children.length - 1; j >= 0; j--) {
                    if (!node.children[j].isBranch) return j;
                }
                return -1;
            };

            const buildChain = (startNode) => {
                const chunks = [];
                let cur = startNode;
                let prevNode = null;
                let prevContIdx = -1;
                while (cur) {
                    const label = this._getNodeSAN(cur);
                    chunks.push(
                        `<span class="chushogi-move-item-inline clickable chushogi-variation-move" ` +
                            `data-node-id="${cur.id}" ` +
                            `title="Click to navigate here">${label}</span>`,
                    );
                    // 1. KIF children of cur: responses to cur; emit immediately
                    //    after cur (before its main continuation).
                    for (let k = cur.children.length - 1; k >= 0; k--) {
                        if (cur.children[k].isKIFBranch) {
                            chunks.push("(" + buildChain(cur.children[k]) + ")");
                        }
                    }
                    // 2. PGN siblings of cur: non-KIF, non-main children of
                    //    prevNode.  Emit after cur (and its KIF children above).
                    if (prevNode !== null) {
                        for (let k = prevNode.children.length - 1; k >= 0; k--) {
                            if (k === prevContIdx) continue;
                            if (prevNode.children[k].isKIFBranch) continue;
                            chunks.push("(" + buildChain(prevNode.children[k]) + ")");
                        }
                    }
                    prevNode = cur;
                    prevContIdx = mainContinuationIdx(cur);
                    cur = prevContIdx >= 0 ? cur.children[prevContIdx] : null;
                }
                // After the last node: emit its KIF children, then its PGN subs.
                if (prevNode !== null) {
                    for (let k = prevNode.children.length - 1; k >= 0; k--) {
                        if (prevNode.children[k].isKIFBranch) {
                            chunks.push("(" + buildChain(prevNode.children[k]) + ")");
                        }
                    }
                    for (let k = prevNode.children.length - 1; k >= 0; k--) {
                        if (k === prevContIdx) continue;
                        if (prevNode.children[k].isKIFBranch) continue;
                        chunks.push("(" + buildChain(prevNode.children[k]) + ")");
                    }
                }
                return chunks.join(" ");
            };

            for (let i = 0; i < this.moveHistory.length; i++) {
                const node = this.moveHistory[i];

                const label = this._getNodeSAN(node);
                parts.push(
                    `<span class="chushogi-move-item-inline clickable" ` +
                        `data-node-id="${node.id}" ` +
                        `title="Click to navigate here">${label}</span>`,
                );

                // PGN siblings: other children of node.parent that are NOT
                // isKIFBranch (KIF branches are shown after the node they
                // respond to).  Oldest first (high-index → low-index).
                const par = node.parent;
                for (let k = par.children.length - 1; k >= 0; k--) {
                    const sib = par.children[k];
                    if (sib === node) continue;
                    if (sib.isKIFBranch) continue;
                    parts.push("(" + buildChain(sib) + ")");
                }

                // KIF variations: branch children of this node.
                for (let k = node.children.length - 1; k >= 0; k--) {
                    const child = node.children[k];
                    if (!child.isKIFBranch) continue;
                    parts.push("(" + buildChain(child) + ")");
                }
            }

            // Frontier pass: mirrors buildMoveTreeHTML's frontier pass.
            //   • Promoted child (isBranch=false): walk its chain inline as main-line
            //     spans; siblings appear as parenthetical variations.
            //   • All branches (no promotion): render each as a parenthetical.
            {
                const _frontier =
                    this.moveHistory.length > 0
                        ? this.moveHistory[this.moveHistory.length - 1]
                        : this.moveTree;
                const _promotedIdx = mainContinuationIdx(_frontier);
                if (_promotedIdx >= 0) {
                    let _fcur = _frontier.children[_promotedIdx];
                    let _fprev = _frontier;
                    let _fprevContIdx = _promotedIdx;
                    while (_fcur) {
                        const label = this._getNodeSAN(_fcur);
                        parts.push(
                            `<span class="chushogi-move-item-inline clickable" ` +
                                `data-node-id="${_fcur.id}" ` +
                                `title="Click to navigate here">${label}</span>`,
                        );
                        // Non-main, non-KIF siblings (other children of _fprev):
                        for (let k = _fprev.children.length - 1; k >= 0; k--) {
                            if (k === _fprevContIdx) continue;
                            if (_fprev.children[k].isKIFBranch) continue;
                            parts.push("(" + buildChain(_fprev.children[k]) + ")");
                        }
                        // KIF children of _fcur:
                        for (let k = _fcur.children.length - 1; k >= 0; k--) {
                            if (_fcur.children[k].isKIFBranch) {
                                parts.push("(" + buildChain(_fcur.children[k]) + ")");
                            }
                        }
                        _fprev = _fcur;
                        _fprevContIdx = mainContinuationIdx(_fcur);
                        _fcur =
                            _fprevContIdx >= 0
                                ? _fcur.children[_fprevContIdx]
                                : null;
                    }
                    // Trailing non-main branches of the last promoted node:
                    if (_fprev !== _frontier) {
                        for (let k = _fprev.children.length - 1; k >= 0; k--) {
                            if (k === _fprevContIdx) continue;
                            if (_fprev.children[k].isKIFBranch) continue;
                            parts.push("(" + buildChain(_fprev.children[k]) + ")");
                        }
                    }
                } else {
                    for (let k = _frontier.children.length - 1; k >= 0; k--) {
                        if (_frontier.children[k].isKIFBranch) continue;
                        parts.push("(" + buildChain(_frontier.children[k]) + ")");
                    }
                }
            }

            return parts.join(" ");
        }

        // ── End move-tree UI helpers ──────────────────────────────────────────

        // Generate Standard Algebraic Notation for one move.
        // boardBefore is the 12\u00d712 array from parseSFENBoard() for the position BEFORE
        // the move; pass null to skip disambiguation.
        // midDestSeparator selects how the midpoint/destination pair of a double
        // move is joined: "comma" (default, used by PGN export) always uses ",";
        // "captureAware" (used by the move-history list) uses "x" when the final
        // destination square was captured, or "-" when it was empty or was the
        // piece's own origin square (return/pass moves).
        // coordStyle selects the square notation: "pgn" (default, used by PGN
        // export) or "shogi" (used by the move-history list) \u2014 native CSL
        // squares (fileNumber + rankChar, e.g. "8g"), used as-is with no
        // conversion since move.from/to/midpoint are already stored this way.
        moveToSAN(move, boardBefore, midDestSeparator = "comma", coordStyle = "pgn") {
            const piece = move.piece;
            const pieceLtr = piece.type; // e.g. "K", "N", "+H"

            // Pass move: piece returns to its own square with no recorded midpoint.
            // XBoard/Winboard cannot parse "from === to" double moves, so we substitute
            // any empty adjacent square as a legal fake midpoint.
            const isPassMove = move.from === move.to && !move.midpoint;

            const disambig = this.getSANDisambiguation(
                piece,
                move.from,
                move.to,
                boardBefore,
                coordStyle,
            );

            // In Shogi-style coordinates the piece letter/disambiguator is
            // always separated from the coordinate of the very first square
            // the piece moves to (the midpoint for a double move, or the
            // destination for a regular move) by a dedicated "-"/"x": "x" if
            // a capture was made on that square, "-" if it was empty. This
            // also resolves what would otherwise be ambiguous concatenation
            // for a bare file disambiguation (a number) running into a
            // number-then-letter square (e.g. "8" + "7g" reading as "87g").
            // PGN coordinates never need this separator.
            const useShogiSeparator = coordStyle === "shogi";

            const toSq = (sq) =>
                coordStyle === "shogi" ? sq : this.cslSqToPgn(sq);

            let body;
            if (move.midpoint || isPassMove) {
                // Double move (Lion / Horned Falcon / Soaring Eagle) or pass move.
                //   Piece[disambig][x]<midpoint>,<destination>
                const anyCapture = !!move.captured || !!move.capturedAtMidpoint;

                let midSq, destSq;
                if (isPassMove) {
                    const fakeMid = this.findPassMidpoint(
                        move.from,
                        boardBefore,
                    );
                    // Fallback (shouldn't occur): reuse the piece's own square so the
                    // output is at least syntactically valid.
                    midSq = fakeMid ? toSq(fakeMid) : toSq(move.from);
                    destSq = toSq(move.to);
                } else {
                    midSq = toSq(move.midpoint);
                    destSq = toSq(move.to);
                }

                const midDestSep =
                    midDestSeparator === "captureAware"
                        ? move.captured
                            ? "x"
                            : "-"
                        : ",";

                // Prefix before the midpoint square (the first square the
                // piece moves to): "x" if the midpoint itself was captured,
                // "-" if it was empty \u2014 always present in Shogi-style output.
                const midPrefix = useShogiSeparator
                    ? move.capturedAtMidpoint
                        ? "x"
                        : "-"
                    : anyCapture
                      ? "x"
                      : "";

                body =
                    pieceLtr +
                    disambig.text +
                    midPrefix +
                    midSq +
                    midDestSep +
                    destSq;
            } else {
                // Regular move: Piece[disambig][x]<destination>
                const destSq = toSq(move.to);
                const prefix = useShogiSeparator
                    ? move.captured
                        ? "x"
                        : "-"
                    : move.captured
                      ? "x"
                      : "";
                body = pieceLtr + disambig.text + prefix + destSq;
            }

            // Suffix: + for promotion, = for deferral, nothing otherwise.
            if (move.promoted) body += "+";
            else if (this.moveWasDeferred(move)) body += "=";

            return body;
        }

        buildPGNString() {
            const now = new Date();
            const pad = (n) => String(n).padStart(2, "0");
            const date = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;

            const tags = [
                `[Event "ChuShogiLite PGN Record"]`,
                `[Site "ChuShogiLite Applet"]`,
                `[Date "${date}"]`,
                `[Round "-"]`,
                `[White "?"]`,
                `[Black "?"]`,
                `[Result "*"]`,
                `[Variant "chu"]`,
            ];

            // Standard Chu Shogi opening: board + player + anti-trade fields
            const DEFAULT_START_PREFIX =
                "lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b -";

            const startSFEN = this.startingSFEN || "";
            const sfenParts = startSFEN.split(" ");
            const startPrefix = sfenParts.slice(0, 3).join(" ");

            // CSL player "b" = sente = PGN white; "w" = gote = PGN black.
            const cslStartPlayer = sfenParts[1] || "b";
            const pgnStartPlayer = cslStartPlayer === "b" ? "w" : "b";

            let boardComment = null;
            if (sfenParts.length >= 3 && startPrefix !== DEFAULT_START_PREFIX) {
                // Non-standard position: add SetUp + FEN tags (SetUp must precede FEN).
                // PGN FEN differs from CSL SFEN:
                //   - player to move is inverted (b\u2194w)
                //   - anti-trade field is kept as-is, then always followed by "0 1"
                const board = sfenParts[0] || "";
                const antiTrade = sfenParts[2] || "-";
                const pgnPlayer = pgnStartPlayer;
                tags.push(`[SetUp "1"]`);
                tags.push(`[FEN "${board} ${pgnPlayer} ${antiTrade} 0 1"]`);
                boardComment = this.sfenToBoardComment(board, pgnPlayer);
            }

            // \u2500\u2500 Move text \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
            // Standard PGN move numbering: the number prefix appears on white's
            // half-move ("N. san") and black's response follows with no prefix.
            // The only time black gets a prefix is the very first half-move of a
            // game where black plays first ("1... san"), to signal whose turn it is.
            //
            // White starts (cslStartPlayer "b"):
            //   i even \u2192 white ("1. san"), i odd \u2192 black ("san")
            //   moveNum(i) = \u230ai/2\u230b + 1
            //
            // Black starts (cslStartPlayer "w"):
            //   i=0 black \u2192 "1... san"  (only occurrence of N... in the output)
            //   i odd  \u2192 white ("N. san"),  moveNum(i) = \u230a(i+1)/2\u230b + 1
            //   i even \u2192 black ("san")  (for i > 0)
            //
            // NOTE: turn order is determined solely by the starting player and the
            // half-move index i \u2014 NOT by which piece's color actually moved.  This
            // keeps numbering correct even when allowIllegalMoves lets one side move
            // multiple times in a row.
            const moveTokens = [];
            // cslStartPlayer "w" means gote (PGN black) moves first.
            const blackStarted = cslStartPlayer === "w";

            // After any variation block the next black main-line move needs its
            // number re-shown (e.g. "1... ") so the reader knows whose turn it is.
            let needsMoveNumber = false;

            for (let i = 0; i < this.moveHistory.length; i++) {
                const move = this.moveHistory[i];
                const parent =
                    i === 0 ? this.moveTree : this.moveHistory[i - 1];

                // Board state BEFORE this move: previous move's resultingSFEN, or
                // the starting board for the first move.
                const prevSFENFull =
                    i === 0
                        ? startSFEN
                        : this.moveHistory[i - 1].resultingSFEN || "";
                const prevBoard = prevSFENFull.split(" ")[0] || "";
                let boardBefore = null;
                try {
                    boardBefore = prevBoard
                        ? this.parseSFENBoard(prevBoard)
                        : null;
                } catch (_) {
                    /* skip disambiguation on parse error */
                }

                const san = this.moveToSAN(move, boardBefore);

                // Build the token: number prefix (if any) + SAN + optional comment.
                const commentText =
                    move.comment && move.comment.trim()
                        ? " {" + this.sanitizeCommentForPGN(move.comment) + "}"
                        : "";

                // After a variation block, black's move also needs its number.
                let prefix = this.getPGNMoveNumberPrefix(i, blackStarted);
                if (needsMoveNumber && prefix === "") {
                    const moveNum = blackStarted
                        ? Math.floor((i + 1) / 2) + 1
                        : Math.floor(i / 2) + 1;
                    prefix = `${moveNum}... `;
                }
                moveTokens.push(`${prefix}${san}${commentText}`);

                // ── Variations ──────────────────────────────────────────────────
                // Mirror buildCSLString's pattern:
                //   1. PGN siblings of this move (alternatives to this move,
                //      i.e. other non-KIF children of parent). Board = prevSFENFull,
                //      ply = i.
                //   2. KIF branches of this move (responses to this move, i.e.
                //      isKIFBranch children of move). Board = move.resultingSFEN,
                //      ply = i + 1.
                let emittedAnyVar = false;

                // 1. PGN siblings
                for (
                    let k = parent.children.length - 1;
                    k >= 0;
                    k--
                ) {
                    const sibling = parent.children[k];
                    if (sibling === move) continue;
                    if (sibling.isKIFBranch) continue;
                    const vt = this._serializePGNVariationChain(
                        sibling,
                        prevSFENFull,
                        i,
                        blackStarted,
                    );
                    if (vt.length > 0) {
                        moveTokens.push("(" + vt.join(" ") + ")");
                        emittedAnyVar = true;
                    }
                }

                // 2. KIF branches
                const afterSFEN = move.resultingSFEN || "";
                for (let k = move.children.length - 1; k >= 0; k--) {
                    if (!move.children[k].isKIFBranch) continue;
                    const vt = this._serializePGNVariationChain(
                        move.children[k],
                        afterSFEN,
                        i + 1,
                        blackStarted,
                    );
                    if (vt.length > 0) {
                        moveTokens.push("(" + vt.join(" ") + ")");
                        emittedAnyVar = true;
                    }
                }

                needsMoveNumber = emittedAnyVar;
            }

            // Starting-position comment, if any, appears before the first move token.
            const startComment =
                this.startingComment && this.startingComment.trim()
                    ? "{" +
                      this.sanitizeCommentForPGN(this.startingComment) +
                      "} "
                    : "";

            const moveText =
                (moveTokens.length > 0
                    ? startComment + moveTokens.join(" ") + " "
                    : startComment) + "*";

            // \u2500\u2500 Assemble output \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
            let output = tags.join("\n") + "\n\n";
            if (boardComment) output += boardComment + "\n\n";
            output += moveText;
            return output;
        }

        // Recursively serialize one variation branch starting at `startNode` into
        // an array of PGN token strings (move-number prefix + SAN + comment +
        // nested variation blocks).  Join with " " to get the variation body.
        //
        //   startNode   — first branch node in this variation
        //   sfenBefore  — full SFEN of the position BEFORE startNode's move
        //   startPly    — 0-based half-move index of startNode in the game
        //   blackStarted — whether gote (CSL "w") plays the game's first move
        //
        // Ordering mirrors buildCSLString / _serializeVariation:
        //   • After emitting node N's token, emit PGN siblings of N (alternatives
        //     to N, i.e. non-KIF, non-main children of prevNode) then KIF branches
        //     of N (responses to N, isKIFBranch children of N).  This produces the
        //     standard PGN "move (alternatives) continuation" ordering.
        _serializePGNVariationChain(startNode, sfenBefore, startPly, blackStarted) {
            const tokens = [];
            let cur = startNode;
            let prevNode = null;
            let prevContIdx = -1;
            let plyIndex = startPly;
            // sfenCur = full SFEN before cur's move
            let sfenCur = sfenBefore;
            // sfenPrevAfter = resultingSFEN of prevNode (= sfenCur of prev iteration)
            // — needed for PGN siblings whose board = sfenCur at the time they're
            //   the peers of cur (which equals sfenPrevAfter).
            let sfenPrevAfter = null;
            let isFirst = true;       // first move in this variation?
            let needsNumber = false;  // re-number after a sub-variation?

            while (cur) {
                // ── Board before cur ─────────────────────────────────────────
                const prevBoardStr = sfenCur ? sfenCur.split(" ")[0] : "";
                let boardBefore = null;
                try {
                    boardBefore = prevBoardStr
                        ? this.parseSFENBoard(prevBoardStr)
                        : null;
                } catch (_) { /* skip on error */ }

                const san = boardBefore
                    ? this.moveToSAN(cur, boardBefore)
                    : "?";

                // ── Move-number prefix ───────────────────────────────────────
                const isWhiteTurn = blackStarted
                    ? plyIndex % 2 === 1
                    : plyIndex % 2 === 0;
                const moveNum = blackStarted
                    ? Math.floor((plyIndex + 1) / 2) + 1
                    : Math.floor(plyIndex / 2) + 1;

                let prefix;
                if (isFirst || needsNumber) {
                    // First move in variation (or after a sub-variation): always
                    // show the number so the reader knows whose turn it is.
                    prefix = isWhiteTurn
                        ? `${moveNum}. `
                        : `${moveNum}... `;
                } else {
                    // Inside the variation: only white's moves get a number.
                    prefix = isWhiteTurn ? `${moveNum}. ` : "";
                }
                isFirst = false;

                const commentText =
                    cur.comment && cur.comment.trim()
                        ? " {" +
                          this.sanitizeCommentForPGN(cur.comment) +
                          "}"
                        : "";

                tokens.push(`${prefix}${san}${commentText}`);

                // ── Board after cur (for sub-variations) ─────────────────────
                const sfenAfterCur = cur.resultingSFEN || "";
                let emittedSubVars = false;

                // 1. PGN siblings of cur (alternatives to cur):
                //    non-KIF, non-main children of prevNode.
                //    Board = sfenCur (= board before cur = board after prevNode).
                //    Ply  = plyIndex (same as cur).
                if (prevNode !== null) {
                    for (
                        let k = prevNode.children.length - 1;
                        k >= 0;
                        k--
                    ) {
                        if (k === prevContIdx) continue; // skip cur
                        if (prevNode.children[k].isKIFBranch) continue;
                        const vt = this._serializePGNVariationChain(
                            prevNode.children[k],
                            sfenCur,
                            plyIndex,
                            blackStarted,
                        );
                        if (vt.length > 0) {
                            tokens.push("(" + vt.join(" ") + ")");
                            emittedSubVars = true;
                        }
                    }
                }

                // 2. KIF branches of cur (responses to cur):
                //    isKIFBranch children of cur.
                //    Board = sfenAfterCur.  Ply = plyIndex + 1.
                for (let k = cur.children.length - 1; k >= 0; k--) {
                    if (!cur.children[k].isKIFBranch) continue;
                    const vt = this._serializePGNVariationChain(
                        cur.children[k],
                        sfenAfterCur,
                        plyIndex + 1,
                        blackStarted,
                    );
                    if (vt.length > 0) {
                        tokens.push("(" + vt.join(" ") + ")");
                        emittedSubVars = true;
                    }
                }

                needsNumber = emittedSubVars;

                // ── Advance to main continuation ─────────────────────────────
                sfenPrevAfter = sfenCur;
                sfenCur = sfenAfterCur;
                prevNode = cur;
                prevContIdx = -1;
                for (let j = cur.children.length - 1; j >= 0; j--) {
                    if (!cur.children[j].isBranch) {
                        prevContIdx = j;
                        break;
                    }
                }
                cur =
                    prevContIdx >= 0
                        ? cur.children[prevContIdx]
                        : null;
                plyIndex++;
            }

            // ── Post-loop: last node's remaining non-KIF children ────────────
            // (The main continuation was null, so prevContIdx stayed at -1 when
            //  the loop advanced past the final node.  Any non-KIF children of
            //  the last node are sub-branches at the terminal position.)
            if (prevNode !== null) {
                // KIF children of prevNode were already emitted inside the loop
                // on prevNode's own iteration.  Emit the non-KIF, non-main ones.
                for (
                    let k = prevNode.children.length - 1;
                    k >= 0;
                    k--
                ) {
                    if (k === prevContIdx) continue; // prevContIdx=-1 → no skip
                    if (prevNode.children[k].isKIFBranch) continue;
                    const vt = this._serializePGNVariationChain(
                        prevNode.children[k],
                        sfenCur, // = prevNode.resultingSFEN (set at end of last iter)
                        plyIndex,
                        blackStarted,
                    );
                    if (vt.length > 0) {
                        tokens.push("(" + vt.join(" ") + ")");
                    }
                }
            }

            return tokens;
        }

        updatePGNExport() {
            const ta = this.container.querySelector("[data-pgn-export]");
            if (!ta) return;
            ta.value = this.buildPGNString();
        }

        // \u2500\u2500 KIF export \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        // Renders the plain-text KIF board diagram for a non-standard
        // starting position: a file-number header, a bordered 12x12 grid of
        // piece kanji (each cell left-padded to a fixed 3-character width,
        // gote pieces prefixed with "v"), and a matching bottom border.
        buildKIFBoardDrawing(boardPart) {
            const board = this.parseSFENBoard(boardPart);
            const lines = [KIF_FILE_HEADER, KIF_BOARD_BORDER];
            for (let rank = 0; rank < 12; rank++) {
                let row = "|";
                for (let file = 0; file < 12; file++) {
                    const piece = board ? board[rank][file] : null;
                    let cell;
                    if (!piece) {
                        cell = "\u30fb";
                    } else {
                        const kanji =
                            KIF_DIAGRAM_KANJI[piece.type] || piece.type;
                        cell = (piece.color === "w" ? "v" : "") + kanji;
                    }
                    row += cell.padStart(3, " ");
                }
                row += "|" + KIF_RANK_KANJI[rank];
                lines.push(row);
            }
            lines.push(KIF_BOARD_BORDER);
            return lines;
        }

        // Every KIF export shares three fixed lines: sente/gote player name
        // fields (left blank - this applet has no player-name concept)
        // followed by the fixed move-table column header. Before those,
        // standard-start games get a single "\u624b\u5408\u5272\uff1a" line, while
        // non-standard-start games get a full board drawing instead.
        buildKIFString() {
            const lines = [];

            const startSFEN = this.startingSFEN || this.exportSFEN();
            const sfenFields = (startSFEN || "").split(" ");
            const boardPart = sfenFields[0] || "";
            const startPlayer = sfenFields[1] || "b";
            const counterStrikeSquare = sfenFields[2] || "-";

            // \u624b\u5408\u5272\uff1a is only valid for the standard starting position with
            // sente to move (the only case a real "\u624b\u5408\u5272" \u2014 even-game
            // handicap type \u2014 actually describes). Any other position,
            // including this exact same board with gote to move, must use
            // a full board drawing instead.
            if (boardPart === KIF_STANDARD_START_BOARD && startPlayer === "b") {
                lines.push("\u624b\u5408\u5272\uff1a");
            } else {
                lines.push(...this.buildKIFBoardDrawing(boardPart));
            }

            // KIF has no per-move player field \u2014 whoever moves first is
            // implied by the header instead. Sente-first is the silent
            // default; when gote moves first, a "\u5f8c\u624b\u756a" marker line
            // immediately follows the header (board drawing or \u624b\u5408\u5272\uff1a).
            if (startPlayer === "w") {
                lines.push("\u5f8c\u624b\u756a");
            }

            lines.push(
                "\u5148\u624b\uff1a",
                "\u5f8c\u624b\uff1a",
                "\u624b\u6570----\u6307\u624b---------\u6d88\u8cbb\u6642\u9593--",
            );

            // The starting-position comment (same field CSL/PGN place before
            // the first move) is rendered the same way as per-move comments:
            // one "* ..." line per source line break, padded to line up
            // under the move-number column.
            //
            // KIF has no native field for CSL's Counter-strike square (the
            // 3rd SFEN field), so it's smuggled in as a synthetic first
            // starting-comment line: the KIF square token immediately
            // followed by "\u7345\u5b50\u76fe" (e.g. "7\u516b\u7345\u5b50\u76fe" for square "7h"), with
            // no space between them. Emitted whenever the rule is active,
            // even if there's no real starting comment otherwise.
            const hasCounterStrike = counterStrikeSquare !== "-";
            const hasStartingComment =
                this.startingComment && this.startingComment.trim();
            if (hasCounterStrike || hasStartingComment) {
                const commentPad = " ".repeat(this.getKIFNumWidth() - 1);
                if (hasCounterStrike) {
                    lines.push(
                        `${commentPad}* ${this.kifSquareToken(counterStrikeSquare)}\u7345\u5b50\u76fe`,
                    );
                }
                if (hasStartingComment) {
                    this.startingComment.split("\n").forEach((commentLine) => {
                        lines.push(`${commentPad}* ${commentLine}`);
                    });
                }
            }

            const moveLines = this.buildKIFMoveList();
            if (moveLines) {
                lines.push(moveLines);
            }

            const numWidth = this.getKIFNumWidth();
            let result = lines.join("\n");
            const varSection = this.buildKIFVariationSection(numWidth);
            if (varSection) result += varSection;
            return result;
        }

        // Shared move-number column width used by both the move list and the
        // starting-position comment padding: the widest move number gets
        // exactly one leading space, and every shorter number (including the
        // starting comment, which has no move number of its own) pads out to
        // that same total width.
        getKIFNumWidth() {
            const maxDigits = String(this.moveHistory.length).length;
            return maxDigits + 1;
        }

        // Convert an internal square ID ("<fileNumber><rankChar>", e.g. "8i")
        // to its KIF display token: the Arabic file digit(s) followed by the
        // kanji rank numeral (e.g. "8\u4e5d").
        kifSquareToken(sq) {
            const match = (sq || "").match(/^(\d+)([a-l])$/);
            if (!match) return sq || "";
            const fileNum = match[1];
            const rankIdx = match[2].charCodeAt(0) - 97;
            return fileNum + (KIF_RANK_KANJI[rankIdx] || "");
        }

        // Formal KIF piece name for a move leg. KIF move text always names
        // the piece by its identity BEFORE the move \u2014 even when the move
        // promotes it \u2014 and relies on a separate trailing "\u6210" suffix to
        // signal the promotion. This holds even for pieces whose promotion
        // target has its own distinct traditional name (e.g. a native
        // Dragon Horse promoting to Horned Falcon is still written
        // "\u9f8d\u99ac\u6210", not "\u89d2\u9df9\u6210"), confirmed against the reference example.
        getKIFPieceName(pieceType) {
            return KIF_MOVE_PIECE_NAMES[pieceType] || pieceType;
        }

        // Render the full KIF move list from this.moveHistory. Each entry
        // is numbered by its 1-based ply index ("N \u624b\u76ee"). Double moves
        // (Lion/Horned Falcon/Soaring Eagle) share that same number across
        // two lines ("N \u624b\u76ee\u4e00\u6b69\u76ee" / "N \u624b\u76ee\u4e8c\u6b69\u76ee"); a promotion suffix
        // ("\u6210") is only ever attached to the final leg.
        //
        // Two special double-move cases, both landing back on the origin
        // square (move.to === move.from):
        //   - "\u5c45\u98df\u3044" (stationary capture): a REAL double move (midpoint
        //     recorded) where the piece hops out and back, capturing along
        //     the way. Marked with full-width parens on the final leg.
        //   - "\u3058\u3063\u3068" (pass): no midpoint recorded at all (nothing was
        //     captured, nothing legally forces a midpoint) \u2014 same fake-
        //     midpoint substitution used for PGN turn-passing moves via
        //     findPassMidpoint(). Marked with half-width parens.
        buildKIFMoveList() {
            const startSFEN = this.startingSFEN || this.exportSFEN();
            const lines = [];

            // Number padding is relative, not fixed: the widest move number
            // gets exactly one leading space, and every shorter number is
            // padded out to that same total width (so single-digit numbers
            // get 2 leading spaces in a game with up to 99 moves, 3 in a
            // game with up to 999, etc.).
            const numWidth = this.getKIFNumWidth();

            this.moveHistory.forEach((move, i) => {
                const num = String(i + 1).padStart(numWidth, " ");
                const promoSuffix = move.promoted ? "\u6210" : "";
                const pieceName = this.getKIFPieceName(move.piece.type);
                const isReturnToOrigin = move.to === move.from;

                if (move.midpoint && isReturnToOrigin) {
                    // \u5c45\u98df\u3044: stationary capture double move.
                    lines.push(
                        `${num} \u624b\u76ee\u4e00\u6b69\u76ee ${this.kifSquareToken(move.midpoint)}${pieceName} \uff08\u2190${this.kifSquareToken(move.from)}\uff09`,
                    );
                    lines.push(
                        `${num} \u624b\u76ee\u4e8c\u6b69\u76ee ${this.kifSquareToken(move.to)}${pieceName}${promoSuffix}\uff08\u5c45\u98df\u3044\uff09 \uff08\u2190${this.kifSquareToken(move.midpoint)}\uff09`,
                    );
                } else if (move.midpoint) {
                    // Normal double move.
                    lines.push(
                        `${num} \u624b\u76ee\u4e00\u6b69\u76ee ${this.kifSquareToken(move.midpoint)}${pieceName} \uff08\u2190${this.kifSquareToken(move.from)}\uff09`,
                    );
                    lines.push(
                        `${num} \u624b\u76ee\u4e8c\u6b69\u76ee ${this.kifSquareToken(move.to)}${pieceName}${promoSuffix} \uff08\u2190${this.kifSquareToken(move.midpoint)}\uff09`,
                    );
                } else if (isReturnToOrigin) {
                    // \u3058\u3063\u3068: turn-passing move, rendered as a fake double move.
                    const prevSFENFull =
                        i === 0
                            ? startSFEN
                            : this.moveHistory[i - 1].resultingSFEN || "";
                    const prevBoard = prevSFENFull.split(" ")[0] || "";
                    let boardBefore = null;
                    try {
                        boardBefore = prevBoard
                            ? this.parseSFENBoard(prevBoard)
                            : null;
                    } catch (_) {
                        /* fall through to no-fake-midpoint case below */
                    }
                    const fakeMid = this.findPassMidpoint(
                        move.from,
                        boardBefore,
                    );
                    const midSq = fakeMid || move.from;

                    lines.push(
                        `${num} \u624b\u76ee\u4e00\u6b69\u76ee ${this.kifSquareToken(midSq)}${pieceName} \uff08\u2190${this.kifSquareToken(move.from)}\uff09`,
                    );
                    lines.push(
                        `${num} \u624b\u76ee\u4e8c\u6b69\u76ee ${this.kifSquareToken(move.to)}${pieceName}${promoSuffix}(\u3058\u3063\u3068) \uff08\u2190${this.kifSquareToken(midSq)}\uff09`,
                    );
                } else {
                    // Normal single-leg move.
                    lines.push(
                        `${num} \u624b\u76ee ${this.kifSquareToken(move.to)}${pieceName}${promoSuffix} \uff08\u2190${this.kifSquareToken(move.from)}\uff09`,
                    );
                }

                // Comments follow the move's line(s), one KIF comment line per
                // source line break. Each comment line starts with "*", padded
                // by the same number of leading spaces as the move-number
                // column minus the "*" itself (so it visually lines up under
                // the number), followed by a space and the comment text.
                if (move.comment && move.comment.trim()) {
                    const commentPad = " ".repeat(numWidth - 1);
                    move.comment.split("\n").forEach((commentLine) => {
                        lines.push(`${commentPad}* ${commentLine}`);
                    });
                }
            });
            return lines.join("\n");
        }

        // ── KIF variation export helpers ─────────────────────────────────────

        // Append the KIF move line(s) for a single tree node to `lines`.
        // `sfenBefore` is the full SFEN of the position before this node's
        // move (needed only for the じっと / pass case).
        // `plyNum` is the 1-based absolute ply index used as the move number.
        // `numWidth` is the column width (same as getKIFNumWidth for the game).
        _appendKIFNodeLines(node, sfenBefore, plyNum, numWidth, lines) {
            const num = String(plyNum).padStart(numWidth, " ");
            const promoSuffix = node.promoted ? "\u6210" : "";
            const pieceName = this.getKIFPieceName(node.piece.type);
            const isReturnToOrigin = node.to === node.from;

            if (node.midpoint && isReturnToOrigin) {
                // 居食い: stationary capture double move
                lines.push(
                    `${num} \u624b\u76ee\u4e00\u6b69\u76ee ${this.kifSquareToken(node.midpoint)}${pieceName} \uff08\u2190${this.kifSquareToken(node.from)}\uff09`,
                );
                lines.push(
                    `${num} \u624b\u76ee\u4e8c\u6b69\u76ee ${this.kifSquareToken(node.to)}${pieceName}${promoSuffix}\uff08\u5c45\u98df\u3044\uff09 \uff08\u2190${this.kifSquareToken(node.midpoint)}\uff09`,
                );
            } else if (node.midpoint) {
                // Normal double move
                lines.push(
                    `${num} \u624b\u76ee\u4e00\u6b69\u76ee ${this.kifSquareToken(node.midpoint)}${pieceName} \uff08\u2190${this.kifSquareToken(node.from)}\uff09`,
                );
                lines.push(
                    `${num} \u624b\u76ee\u4e8c\u6b69\u76ee ${this.kifSquareToken(node.to)}${pieceName}${promoSuffix} \uff08\u2190${this.kifSquareToken(node.midpoint)}\uff09`,
                );
            } else if (isReturnToOrigin) {
                // じっと: pass move, rendered as a fake double move
                const prevBoardStr = sfenBefore
                    ? sfenBefore.split(" ")[0]
                    : "";
                let boardBefore = null;
                try {
                    boardBefore = prevBoardStr
                        ? this.parseSFENBoard(prevBoardStr)
                        : null;
                } catch (_) { /* fall through */ }
                const fakeMid = this.findPassMidpoint(node.from, boardBefore);
                const midSq = fakeMid || node.from;
                lines.push(
                    `${num} \u624b\u76ee\u4e00\u6b69\u76ee ${this.kifSquareToken(midSq)}${pieceName} \uff08\u2190${this.kifSquareToken(node.from)}\uff09`,
                );
                lines.push(
                    `${num} \u624b\u76ee\u4e8c\u6b69\u76ee ${this.kifSquareToken(node.to)}${pieceName}${promoSuffix}(\u3058\u3063\u3068) \uff08\u2190${this.kifSquareToken(midSq)}\uff09`,
                );
            } else {
                // Normal single-leg move
                lines.push(
                    `${num} \u624b\u76ee ${this.kifSquareToken(node.to)}${pieceName}${promoSuffix} \uff08\u2190${this.kifSquareToken(node.from)}\uff09`,
                );
            }

            // Comment lines
            if (node.comment && node.comment.trim()) {
                const commentPad = " ".repeat(numWidth - 1);
                node.comment.split("\n").forEach((cl) => {
                    lines.push(`${commentPad}* ${cl}`);
                });
            }
        }

        // Collect all KIF variation blocks rooted at `startNode` (the first
        // node of one branch) into `blocks` (an array of string-arrays, each
        // being the lines of one 変化：N手 block, header first).
        //
        // Sub-variations are pushed AFTER the parent block so that the stack-
        // based KIF parser reconstructs the correct nesting (higher ply →
        // child of preceding lower-ply block; equal or lower ply → sibling).
        // Within the same ply, blocks are emitted in "game order" (oldest
        // branch first), satisfying rule 5c.
        _collectKIFVarBlocks(startNode, sfenBefore, startPly, numWidth, blocks) {
            // ── Step 1: walk this variation's chain and render its move lines.
            //    Simultaneously, collect deferred calls for sub-variations.
            const moveLines = [];
            const subVarQueue = []; // { node, sfenBefore, ply }

            let cur = startNode;
            let prevNode = null;
            let prevContIdx = -1;
            let ply = startPly;
            let sfenCur = sfenBefore;

            while (cur) {
                this._appendKIFNodeLines(cur, sfenCur, ply, numWidth, moveLines);

                const sfenAfterCur = cur.resultingSFEN || "";

                // PGN siblings of cur (alternatives to cur at ply `ply`):
                // children of prevNode that are not the main continuation and
                // not KIF branches.  Oldest first (k from length-1 down to 0).
                if (prevNode !== null) {
                    for (
                        let k = prevNode.children.length - 1;
                        k >= 0;
                        k--
                    ) {
                        if (k === prevContIdx) continue;
                        if (prevNode.children[k].isKIFBranch) continue;
                        subVarQueue.push({
                            node: prevNode.children[k],
                            sfenBefore: sfenCur,
                            ply,
                        });
                    }
                }

                // KIF branches of cur (responses to cur, start at ply+1).
                for (let k = cur.children.length - 1; k >= 0; k--) {
                    if (!cur.children[k].isKIFBranch) continue;
                    subVarQueue.push({
                        node: cur.children[k],
                        sfenBefore: sfenAfterCur,
                        ply: ply + 1,
                    });
                }

                sfenCur = sfenAfterCur;
                prevNode = cur;
                prevContIdx = -1;
                for (let j = cur.children.length - 1; j >= 0; j--) {
                    if (!cur.children[j].isBranch) {
                        prevContIdx = j;
                        break;
                    }
                }
                cur =
                    prevContIdx >= 0
                        ? cur.children[prevContIdx]
                        : null;
                ply++;
            }

            // Post-loop: KIF branches of last node (at ply = current ply),
            // then PGN non-main siblings of last node.
            if (prevNode !== null) {
                for (
                    let k = prevNode.children.length - 1;
                    k >= 0;
                    k--
                ) {
                    if (!prevNode.children[k].isKIFBranch) continue;
                    subVarQueue.push({
                        node: prevNode.children[k],
                        sfenBefore: sfenCur,
                        ply,
                    });
                }
                for (
                    let k = prevNode.children.length - 1;
                    k >= 0;
                    k--
                ) {
                    if (k === prevContIdx) continue;
                    if (prevNode.children[k].isKIFBranch) continue;
                    subVarQueue.push({
                        node: prevNode.children[k],
                        sfenBefore: sfenCur,
                        ply,
                    });
                }
            }

            // ── Step 2: push THIS variation's block (header + move lines).
            blocks.push([`\u5909\u5316\uff1a${startPly}\u624b`, ...moveLines]);

            // ── Step 3: recursively emit sub-variations.
            // Sort descending by ply so higher-ply blocks are emitted first
            // (the KIF stack parser then correctly treats them as children of
            // this block).  Stable sort preserves game-order within same ply.
            subVarQueue.sort((a, b) => b.ply - a.ply);
            for (const sv of subVarQueue) {
                this._collectKIFVarBlocks(
                    sv.node,
                    sv.sfenBefore,
                    sv.ply,
                    numWidth,
                    blocks,
                );
            }
        }

        // Build the 変化：N手 section that follows the main KIF move list.
        // Returns an empty string when there are no variations.
        buildKIFVariationSection(numWidth) {
            const blocks = [];

            // Walk the main line right-to-left (highest ply first), so that
            // top-level variations appear in descending order of their
            // branching move number (rule 5a).
            for (
                let i = this.moveHistory.length - 1;
                i >= 0;
                i--
            ) {
                const node = this.moveHistory[i];
                const parent =
                    i === 0 ? this.moveTree : this.moveHistory[i - 1];
                const plyNum = i + 1; // 1-based
                const sfenBefore =
                    i === 0
                        ? this.startingSFEN || this.exportSFEN()
                        : this.moveHistory[i - 1].resultingSFEN || "";
                const sfenAfter = node.resultingSFEN || "";

                // PGN siblings: alternatives to `node` at ply `plyNum`.
                // Iterate oldest-first (k from length-1 to 0).
                for (
                    let k = parent.children.length - 1;
                    k >= 0;
                    k--
                ) {
                    if (parent.children[k] === node) continue;
                    if (parent.children[k].isKIFBranch) continue;
                    this._collectKIFVarBlocks(
                        parent.children[k],
                        sfenBefore,
                        plyNum,
                        numWidth,
                        blocks,
                    );
                }

                // KIF branches: responses to `node`, starting at plyNum+1.
                for (let k = node.children.length - 1; k >= 0; k--) {
                    if (!node.children[k].isKIFBranch) continue;
                    this._collectKIFVarBlocks(
                        node.children[k],
                        sfenAfter,
                        plyNum + 1,
                        numWidth,
                        blocks,
                    );
                }
            }

            if (blocks.length === 0) return "";

            // Each block is separated from the preceding content by a blank
            // line.  The leading "\n" ensures there is a blank line after the
            // last main-line move even when the main move list ends without one.
            return blocks
                .map((b) => "\n\n" + b.join("\n"))
                .join("");
        }

        // ── KIF variation import helpers ─────────────────────────────────────

        // Parse a segment of KIF lines (starting at `startIdx`) as move lines
        // until a 変化： header or end of input is reached.
        // Returns { entries: [{usi, comments}], nextIdx }.
        // Non-fatal: unrecognised lines are silently skipped.
        _parseKIFMoveSegment(lines, startIdx) {
            const NUM_RE =
                /^\s*(\d+)\s*\u624b\u76ee(\u4e00\u6b69\u76ee|\u4e8c\u6b69\u76ee)?\s*/;
            const FROM_RE =
                /\uff08\u2190(\d{1,2}(?:\u5341\u4e00|\u5341\u4e8c|[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341]))\uff09\s*$/;
            const DEST_RE =
                /^(\d{1,2}(?:\u5341\u4e00|\u5341\u4e8c|[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341]))/;
            const COMMENT_RE = /^\s*\*\s?(.*)$/;

            const entries = [];
            let currentEntry = null;
            let pending = null;
            let idx = startIdx;

            for (; idx < lines.length; idx++) {
                const rawLine = lines[idx];
                const trimmed = rawLine.trim();

                if (trimmed === "") continue;
                // Stop at the next variation header
                if (trimmed.startsWith("\u5909\u5316\uff1a")) break;

                const commentMatch = rawLine.match(COMMENT_RE);
                if (commentMatch) {
                    if (currentEntry)
                        currentEntry.comments.push(commentMatch[1]);
                    continue;
                }

                const numMatch = rawLine.match(NUM_RE);
                if (!numMatch) continue; // skip unrecognised lines (non-fatal)

                const leg = numMatch[2] || null;
                let rest = rawLine.slice(numMatch[0].length);

                const fromMatch = rest.match(FROM_RE);
                if (!fromMatch) continue;

                const fromToken = fromMatch[1];
                rest = rest.slice(0, fromMatch.index).trim();

                let marker = null;
                if (rest.includes("\uff08\u5c45\u98df\u3044\uff09")) {
                    marker = "istick";
                    rest = rest
                        .replace("\uff08\u5c45\u98df\u3044\uff09", "")
                        .trim();
                } else if (/\(\u3058\u3063\u3068\)/.test(rest)) {
                    marker = "pass";
                    rest = rest.replace(/\(\u3058\u3063\u3068\)/, "").trim();
                }

                let promoted = false;
                if (rest.endsWith("\u6210")) {
                    promoted = true;
                    rest = rest.slice(0, -1).trim();
                }

                const destMatch = rest.match(DEST_RE);
                if (!destMatch) continue;

                const fromSq = this.kifTokenToSquare(fromToken);
                const destSq = this.kifTokenToSquare(destMatch[1]);
                if (!fromSq || !destSq) continue;

                if (leg === "\u4e00\u6b69\u76ee") {
                    pending = { fromSq, midSq: destSq };
                    continue;
                }

                let usi;
                if (leg === "\u4e8c\u6b69\u76ee") {
                    if (!pending) continue;
                    const { fromSq: origFrom, midSq } = pending;
                    pending = null;
                    usi =
                        marker === "pass"
                            ? origFrom + origFrom
                            : origFrom +
                              midSq +
                              destSq +
                              (promoted ? "+" : "");
                } else {
                    usi = fromSq + destSq + (promoted ? "+" : "");
                }

                const entry = { usi, comments: [] };
                entries.push(entry);
                currentEntry = entry;
            }

            return { entries, nextIdx: idx };
        }

        // Recursively convert a parsed KIF variation node (with its nested
        // children) into an array of CSL parts (USI strings, "{comment}"
        // strings, and "(sub-variation)" strings).
        //
        //   varData    — { startPly, entries: [{usi,comments}], children: [...] }
        //   boardBefore — deep copy of the board state before this var's first move
        //
        // Children are attached at the position whose absoluteAbsPly == child.startPly.
        _kifVariationToCSLParts(varData, boardBefore) {
            const parts = [];
            // Mutate a local board copy
            const board = boardBefore.map((row) =>
                row.map((c) => (c ? { ...c } : null)),
            );

            for (let i = 0; i < varData.entries.length; i++) {
                const entry = varData.entries[i];
                const currentAbsPly = varData.startPly + i;

                // Snapshot BEFORE applying this entry — this is the correct
                // boardBefore for any child variation that is an alternative
                // to this entry (child.startPly === currentAbsPly).
                const boardBeforeEntry = board.map((row) =>
                    row.map((c) => (c ? { ...c } : null)),
                );

                parts.push(entry.usi);
                if (entry.comments.length) {
                    parts.push("{" + entry.comments.join("\n") + "}");
                }
                this.applyUSIToBoard(entry.usi, board);

                // Children whose startPly === currentAbsPly are PGN-style
                // alternatives to this entry.  In CSL they appear immediately
                // AFTER this move's USI token.  Their boardBefore is the board
                // state just before this entry (after the preceding one).
                for (const child of varData.children || []) {
                    if (child.startPly !== currentAbsPly) continue;
                    const childParts = this._kifVariationToCSLParts(
                        child,
                        boardBeforeEntry,
                    );
                    if (childParts.length > 0) {
                        parts.push("(" + childParts.join(" ") + ")");
                    }
                }
            }

            return parts;
        }

        updateKIFExport() {
            const ta = this.container.querySelector("[data-kif-export]");
            if (!ta) return;
            ta.value = this.buildKIFString();
        }

        // Convert an arbitrary 12x12 board array (as produced by
        // parseSFENBoard(), or hand-built while parsing a KIF board
        // drawing) into an SFEN board-part string. Mirrors boardToSFEN()'s
        // logic exactly, but works on any board array rather than
        // this.board, so it can be used for pure/offline conversions.
        sfenBoardPartFromArray(board) {
            let sfen = "";
            for (let rank = 0; rank < 12; rank++) {
                let emptyCount = 0;
                let rankString = "";
                for (let file = 0; file < 12; file++) {
                    const piece = board[rank][file];
                    if (piece) {
                        if (emptyCount > 0) {
                            rankString += emptyCount.toString();
                            emptyCount = 0;
                        }
                        if (piece.promoted || piece.type.startsWith("+")) {
                            const originalType =
                                piece.originalType ||
                                (piece.type.startsWith("+")
                                    ? piece.type.substring(1)
                                    : piece.type);
                            let pieceChar = originalType;
                            if (piece.color === "w")
                                pieceChar = pieceChar.toLowerCase();
                            rankString += "+" + pieceChar;
                        } else {
                            let pieceChar = piece.type;
                            if (piece.color === "w")
                                pieceChar = pieceChar.toLowerCase();
                            rankString += pieceChar;
                        }
                    } else {
                        emptyCount++;
                    }
                }
                if (emptyCount > 0) rankString += emptyCount.toString();
                sfen += rankString;
                if (rank < 11) sfen += "/";
            }
            return sfen;
        }

        // Convert a KIF file-number + rank-kanji square token (e.g. "5\u516b")
        // back to an internal square ID ("<fileNumber><rankChar>", e.g.
        // "5h"). Exact inverse of kifSquareToken().
        kifTokenToSquare(token) {
            const match = (token || "").match(
                /^(\d{1,2})(\u5341\u4e00|\u5341\u4e8c|[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341])$/,
            );
            if (!match) return null;
            const fileNum = match[1];
            const rankIdx = KIF_RANK_KANJI.indexOf(match[2]);
            if (rankIdx === -1) return null;
            return fileNum + String.fromCharCode(97 + rankIdx);
        }

        // Convert a KIF string to CSL notation. Returns { csl } on success or
        // { error } on failure. Pure logic, no DOM access. Handles both the
        // "\u624b\u5408\u5272\uff1a" (standard start) and full board-drawing headers, the
        // full move-list grammar (normal moves, promotions, double moves,
        // \u5c45\u98df\u3044, and \u3058\u3063\u3068), and comments (including a leading "starting"
        // comment block before the first move).
        convertKIFStringToCSL(kif) {
            kif = (kif || "").trim();
            if (!kif) {
                return { error: "No KIF data provided." };
            }

            const lines = kif.split(/\r\n|\r|\n/);
            let idx = 0;
            const isBlank = (s) => s.trim() === "";

            while (idx < lines.length && isBlank(lines[idx])) idx++;

            let boardPart;
            if (
                idx < lines.length &&
                lines[idx].trim().startsWith("\u624b\u5408\u5272")
            ) {
                boardPart = KIF_STANDARD_START_BOARD;
                idx++;
            } else {
                // Expect a full board drawing: a border line, 12 piece rows,
                // then a closing border line. Skip any preceding label/
                // header rows (e.g. the file-number header) to find it.
                while (
                    idx < lines.length &&
                    !/^\+-+\+$/.test(lines[idx].trim())
                )
                    idx++;
                if (idx >= lines.length) {
                    return {
                        error: "Error: could not find a \u624b\u5408\u5272\uff1a line or a KIF board drawing.",
                    };
                }
                idx++; // consume opening border

                const invDiagram = {};
                for (const [type, kanji] of Object.entries(
                    KIF_DIAGRAM_KANJI,
                )) {
                    invDiagram[kanji] = type;
                }

                const board = this.createEmptyBoard();
                for (let r = 0; r < 12; r++) {
                    if (idx >= lines.length) {
                        return {
                            error: "Error: incomplete KIF board drawing.",
                        };
                    }
                    const line = lines[idx];
                    idx++;
                    const body = line
                        .replace(/^\|/, "")
                        .replace(/\|[^|]*$/, "");
                    for (let f = 0; f < 12; f++) {
                        const chunk = body.slice(f * 3, f * 3 + 3);
                        const cell = chunk.trim();
                        if (!cell || cell === "\u30fb") continue;
                        let color = "b";
                        let token = cell;
                        if (token.startsWith("v")) {
                            color = "w";
                            token = token.slice(1);
                        }
                        const type = invDiagram[token];
                        if (!type) {
                            return {
                                error: `Error: unrecognized piece symbol "${cell}" in KIF board drawing.`,
                            };
                        }
                        board[r][f] = type.startsWith("+")
                            ? {
                                  type,
                                  color,
                                  promoted: true,
                                  originalType: type.slice(1),
                              }
                            : { type, color, promoted: false };
                    }
                }
                // consume closing border, if present
                if (
                    idx < lines.length &&
                    /^\+-+\+$/.test(lines[idx].trim())
                )
                    idx++;

                boardPart = this.sfenBoardPartFromArray(board);
            }

            // Skip the \u5148\u624b\uff1a/ \u5f8c\u624b\uff1a/ move-table header lines (and any blank
            // lines interspersed). A "\u5f8c\u624b\u756a" line is not a blank player-name
            // field like "\u5f8c\u624b\uff1a" \u2014 it's a marker meaning gote moves first
            // (KIF has no per-move player field, so this is the only place
            // that's recorded); sente-first is the silent default otherwise.
            let startingPlayer = "b";
            while (idx < lines.length) {
                const t = lines[idx].trim();
                if (t === "" || t.startsWith("\u5148\u624b") || t.startsWith("\u624b\u6570")) {
                    idx++;
                    continue;
                }
                if (t.startsWith("\u5f8c\u624b\u756a")) {
                    startingPlayer = "w";
                    idx++;
                    continue;
                }
                if (t.startsWith("\u5f8c\u624b")) {
                    idx++;
                    continue;
                }
                break;
            }

            // A run of "* ..." comment lines before the first move is the
            // starting comment (mirrors PGN's post-FEN-tag comment). If the
            // very first such line is a KIF square token immediately
            // followed by "\u7345\u5b50\u76fe" (e.g. "7\u516b\u7345\u5b50\u76fe"), it's not a real
            // comment \u2014 it's the smuggled-in Counter-strike square (CSL's
            // 3rd SFEN field), which KIF has no native field for.
            const COMMENT_RE = /^\s*\*\s?(.*)$/;
            const COUNTERSTRIKE_RE =
                /^(\d{1,2}(?:\u5341\u4e00|\u5341\u4e8c|[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341]))\u7345\u5b50\u76fe$/;
            let counterStrikeSquare = "-";
            const startingCommentLines = [];
            let firstCommentLine = true;
            while (idx < lines.length) {
                const m = lines[idx].match(COMMENT_RE);
                if (!m) break;
                if (firstCommentLine) {
                    const csMatch = m[1].match(COUNTERSTRIKE_RE);
                    if (csMatch) {
                        counterStrikeSquare = this.kifTokenToSquare(
                            csMatch[1],
                        );
                        idx++;
                        firstCommentLine = false;
                        continue;
                    }
                }
                firstCommentLine = false;
                startingCommentLines.push(m[1]);
                idx++;
            }
            const startingComment = startingCommentLines.join("\n");

            // ── Parse the main move list (stop at first 変化：header) ─────────
            // We reuse _parseKIFMoveSegment for the main line too, but we need
            // strict error-on-unknown-line semantics for the main line that the
            // shared helper doesn't provide.  Run the original strict loop,
            // extended to break (rather than error) on 変化：lines.
            const NUM_RE = /^\s*(\d+)\s*\u624b\u76ee(\u4e00\u6b69\u76ee|\u4e8c\u6b69\u76ee)?\s*/;
            const FROM_RE =
                /\uff08\u2190(\d{1,2}(?:\u5341\u4e00|\u5341\u4e8c|[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341]))\uff09\s*$/;
            const DEST_RE =
                /^(\d{1,2}(?:\u5341\u4e00|\u5341\u4e8c|[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341]))/;

            const entries = [];
            let currentEntry = null;
            let pending = null; // { fromSq, midSq } awaiting a \u4e8c\u6b69\u76ee leg

            for (; idx < lines.length; idx++) {
                const rawLine = lines[idx];
                if (isBlank(rawLine)) continue;

                // Variation header — end of main line.
                if (rawLine.trim().startsWith("\u5909\u5316\uff1a")) break;

                const commentMatch = rawLine.match(COMMENT_RE);
                if (commentMatch) {
                    if (currentEntry) {
                        currentEntry.comments.push(commentMatch[1]);
                    }
                    continue;
                }

                const numMatch = rawLine.match(NUM_RE);
                if (!numMatch) {
                    return {
                        error: `Error: could not parse KIF line: "${rawLine}"`,
                    };
                }
                const leg = numMatch[2] || null;
                let rest = rawLine.slice(numMatch[0].length);

                const fromMatch = rest.match(FROM_RE);
                if (!fromMatch) {
                    return {
                        error: `Error: could not find origin square in KIF line: "${rawLine}"`,
                    };
                }
                const fromToken = fromMatch[1];
                rest = rest.slice(0, fromMatch.index).trim();

                let marker = null;
                if (rest.includes("\uff08\u5c45\u98df\u3044\uff09")) {
                    marker = "istick";
                    rest = rest.replace("\uff08\u5c45\u98df\u3044\uff09", "").trim();
                } else if (/\(\u3058\u3063\u3068\)/.test(rest)) {
                    marker = "pass";
                    rest = rest.replace(/\(\u3058\u3063\u3068\)/, "").trim();
                }

                let promoted = false;
                if (rest.endsWith("\u6210")) {
                    promoted = true;
                    rest = rest.slice(0, -1).trim();
                }

                const destMatch = rest.match(DEST_RE);
                if (!destMatch) {
                    return {
                        error: `Error: could not find destination square in KIF line: "${rawLine}"`,
                    };
                }
                const destToken = destMatch[1];

                const fromSq = this.kifTokenToSquare(fromToken);
                const destSq = this.kifTokenToSquare(destToken);
                if (!fromSq || !destSq) {
                    return {
                        error: `Error: could not parse squares in KIF line: "${rawLine}"`,
                    };
                }

                if (leg === "\u4e00\u6b69\u76ee") {
                    pending = { fromSq, midSq: destSq };
                    continue;
                }

                let usi;
                if (leg === "\u4e8c\u6b69\u76ee") {
                    if (!pending) {
                        return {
                            error: `Error: \u4e8c\u6b69\u76ee line with no matching \u4e00\u6b69\u76ee: "${rawLine}"`,
                        };
                    }
                    const { fromSq: origFrom, midSq } = pending;
                    pending = null;
                    if (marker === "pass") {
                        usi = origFrom + origFrom;
                    } else {
                        usi = origFrom + midSq + destSq + (promoted ? "+" : "");
                    }
                } else {
                    usi = fromSq + destSq + (promoted ? "+" : "");
                }

                const entry = { usi, comments: [] };
                entries.push(entry);
                currentEntry = entry;
            }

            if (pending) {
                return {
                    error: "Error: KIF ends with an incomplete double move (missing \u4e8c\u6b69\u76ee line).",
                };
            }

            // ── Parse variation sections (変化：N手 blocks) ─────────────────
            // Each block: header line then move lines, separated from the next
            // by blank lines.  Non-fatal: bad blocks are warned and skipped.
            const varSections = []; // { startPly, entries }
            const VAR_HDR_RE = /^\u5909\u5316\uff1a(\d+)\u624b\s*$/;

            while (idx < lines.length) {
                if (isBlank(lines[idx])) { idx++; continue; }
                const hdrMatch = lines[idx].trim().match(VAR_HDR_RE);
                if (!hdrMatch) { idx++; continue; }

                const startPly = parseInt(hdrMatch[1], 10);
                idx++; // consume header line

                const seg = this._parseKIFMoveSegment(lines, idx);
                idx = seg.nextIdx;
                varSections.push({ startPly, entries: seg.entries, children: [] });
            }

            // ── Build variation tree via stack (rule 5b) ─────────────────────
            // If variation V2's startPly > preceding V1's startPly, V2 is a
            // child of V1; otherwise pop the stack until the right level.
            const rootVars = []; // top-level variations attached to the main line
            const stack = []; // { ply, varData }

            for (const vs of varSections) {
                while (
                    stack.length > 0 &&
                    stack[stack.length - 1].ply >= vs.startPly
                ) {
                    stack.pop();
                }
                const parentVarData =
                    stack.length > 0 ? stack[stack.length - 1].varData : null;
                const varData = vs; // already has { startPly, entries, children }
                if (parentVarData) {
                    parentVarData.children.push(varData);
                } else {
                    rootVars.push(varData);
                }
                stack.push({ ply: vs.startPly, varData });
            }

            // ── Build board states for main line ─────────────────────────────
            // boardStates[0] = initial board; boardStates[i] = after i-th move.
            // Used to supply the correct pre-move board for top-level variations.
            const boardStates = [];
            try {
                const tempBoard = this.parseSFENBoard(boardPart);
                boardStates.push(
                    tempBoard.map((row) => row.map((c) => (c ? { ...c } : null))),
                );
                for (const e of entries) {
                    this.applyUSIToBoard(e.usi, tempBoard);
                    boardStates.push(
                        tempBoard.map((row) =>
                            row.map((c) => (c ? { ...c } : null)),
                        ),
                    );
                }
            } catch (_) {
                // If board-state computation fails, skip all variations.
                boardStates.length = 0;
            }

            // ── Convert root variations to CSL (…) tokens ────────────────────
            // Map: ply (1-based) → array of CSL variation strings to insert
            //   AFTER the main-line move at that ply.
            const varAtPly = {}; // plyNum -> string[]
            for (const rv of rootVars) {
                const N = rv.startPly;
                if (N < 1 || N > boardStates.length - 1) {
                    // Out of range — would reference a board beyond the main line
                    console.warn(
                        `KIF import: skipped variation at ply ${N} (main line has ${entries.length} moves)`,
                    );
                    continue;
                }
                const boardBefore = boardStates[N - 1].map((row) =>
                    row.map((c) => (c ? { ...c } : null)),
                );
                try {
                    const parts = this._kifVariationToCSLParts(rv, boardBefore);
                    if (parts.length > 0) {
                        if (!varAtPly[N]) varAtPly[N] = [];
                        varAtPly[N].push("(" + parts.join(" ") + ")");
                    }
                } catch (err) {
                    console.warn(`KIF import: skipped variation at ply ${N} — ${err}`);
                }
            }

            // ── Assemble final CSL string ─────────────────────────────────────
            let csl =
                boardPart +
                " " +
                startingPlayer +
                " " +
                (counterStrikeSquare || "-") +
                " 1";
            if (startingComment) csl += " {" + startingComment + "}";
            for (let i = 0; i < entries.length; i++) {
                const plyNum = i + 1;
                csl += " " + entries[i].usi;
                if (entries[i].comments.length) {
                    csl += " {" + entries[i].comments.join("\n") + "}";
                }
                if (varAtPly[plyNum]) {
                    for (const varCSL of varAtPly[plyNum]) {
                        csl += " " + varCSL;
                    }
                }
            }

            return { csl };
        }

        // Read KIF from [data-kif-import], convert it to CSL notation, and
        // import it into the game (with the same overwrite confirmation as
        // the CSL/PGN import buttons).
        importKIFFromInput() {
            // Block import in viewOnly mode
            if (this.config.appletMode === "viewOnly") {
                console.log("Game import blocked in viewOnly mode");
                return;
            }

            const input = this.container.querySelector("[data-kif-import]");
            if (!input || !input.value.trim()) {
                return;
            }

            // Show confirmation prompt before importing
            if (
                !confirm("This will overwrite the current game. Are you sure?")
            ) {
                return;
            }

            const result = this.convertKIFStringToCSL(input.value.trim());
            if (result.error) {
                alert(result.error);
                return;
            }

            this.importGame(result.csl);
            input.value = "";
            this.updateButtonStates();
        }

        // Convert a PGN square (fileLetter + rankNumber, e.g. "g6") to a CSL/USI
        // square (fileNumber + rankChar, e.g. "6g").  Exact inverse of cslSqToPgn.
        pgnSqToCsl(pgnSq) {
            const match = pgnSq.match(/^([a-l])(\d+)$/);
            if (!match) return null;
            const fileNumber = 109 - match[1].charCodeAt(0); // cslSqToPgn: charCode = 109 - fileNumber
            const rankIndex = 12 - parseInt(match[2], 10); // cslSqToPgn: rankNumber = 12 - rankIndex
            if (
                rankIndex < 0 ||
                rankIndex > 11 ||
                fileNumber < 1 ||
                fileNumber > 12
            )
                return null;
            return String(fileNumber) + String.fromCharCode(97 + rankIndex);
        }

        // Tokenize PGN move text into { type: "comment"|"move", text } objects.
        // Skips move-number prefixes (N. / N...), result codes, NAGs ($N), and
        // parenthesised variations.
        tokenizePGNMoveText(text) {
            const tokens = [];
            let i = 0;
            const n = text.length;
            while (i < n) {
                const ch = text[i];
                if (ch === "{") {
                    // Brace comment \u2014 collect content verbatim
                    i++;
                    let comment = "";
                    while (i < n && text[i] !== "}") comment += text[i++];
                    if (i < n) i++; // skip closing '}'
                    tokens.push({ type: "comment", text: comment });
                } else if (ch === "(") {
                    // Variation — capture inner content (respecting nesting)
                    let depth = 1;
                    i++;
                    let varContent = "";
                    while (i < n && depth > 0) {
                        if (text[i] === "(") depth++;
                        else if (text[i] === ")") depth--;
                        if (depth > 0) varContent += text[i];
                        i++;
                    }
                    tokens.push({ type: "variation", text: varContent });
                } else if (ch === ";") {
                    // Semicolon line comment \u2014 skip to end of line
                    while (i < n && text[i] !== "\n") i++;
                } else if (ch === "%" && (i === 0 || text[i - 1] === "\n")) {
                    // PGN escape line \u2014 skip to end of line
                    while (i < n && text[i] !== "\n") i++;
                } else if (/\s/.test(ch)) {
                    i++;
                } else {
                    // Whitespace-delimited word
                    let word = "";
                    while (
                        i < n &&
                        !/\s/.test(text[i]) &&
                        text[i] !== "{" &&
                        text[i] !== "("
                    ) {
                        word += text[i++];
                    }
                    if (!word) continue;
                    if (/^\d+\.+$/.test(word) || word === "...") {
                        // Move-number prefix \u2014 ignore
                    } else if (["*", "1-0", "0-1", "1/2-1/2"].includes(word)) {
                        // Result token \u2014 ignore
                    } else if (word[0] === "$") {
                        // NAG annotation \u2014 ignore
                    } else {
                        tokens.push({ type: "move", text: word });
                    }
                }
            }
            return tokens;
        }

        // Parse a Chu Shogi PGN SAN token into its logical components:
        //   { pieceType, destSq, midSq, promotes, disambigFile, disambigRank }
        // Returns null if the token cannot be recognised.
        parseSANToken(san) {
            let s = san.trim();
            if (!s) return null;

            // Strip promotion / deferral suffix
            let promotes = false;
            if (s.endsWith("+")) {
                promotes = true;
                s = s.slice(0, -1);
            } else if (s.endsWith("=")) {
                s = s.slice(0, -1);
            }

            // Piece type: optional leading '+' + one uppercase letter
            let pieceType = "";
            if (s[0] === "+" && s.length > 1 && /[A-Z]/.test(s[1])) {
                pieceType = s.slice(0, 2);
                s = s.slice(2);
            } else if (/[A-Z]/.test(s[0])) {
                pieceType = s[0];
                s = s.slice(1);
            } else {
                return null;
            }

            // Helper: index of the last [a-l]\d+ match in a string
            const lastSqMatch = (str) => {
                const m = [...str.matchAll(/[a-l]\d+/g)];
                return m.length ? m[m.length - 1] : null;
            };

            // Split on ',' for double moves
            const parts = s.split(",");
            const isDouble = parts.length >= 2;

            let midSq = null,
                destSq = null,
                beforeDest = "";
            if (isDouble) {
                const m0 = lastSqMatch(parts[0]);
                const m1 = lastSqMatch(parts[1]);
                if (!m0 || !m1) return null;
                midSq = m0[0];
                destSq = m1[0];
                beforeDest = parts[0].slice(0, m0.index);
            } else {
                const m = lastSqMatch(s);
                if (!m) return null;
                destSq = m[0];
                beforeDest = s.slice(0, m.index);
            }

            // Remove capture marker from disambiguation zone
            beforeDest = beforeDest.replace(/x/g, "");

            // Parse disambiguation: full square, file letter, or rank number
            let disambigFile = null,
                disambigRank = null;
            const dSq = beforeDest.match(/^([a-l])(\d+)$/);
            const dFile = beforeDest.match(/^([a-l])$/);
            const dRank = beforeDest.match(/^(\d+)$/);
            if (dSq) {
                disambigFile = dSq[1];
                disambigRank = parseInt(dSq[2]);
            } else if (dFile) {
                disambigFile = dFile[1];
            } else if (dRank) {
                disambigRank = parseInt(dRank[1]);
            }

            return {
                pieceType,
                destSq,
                midSq,
                promotes,
                disambigFile,
                disambigRank,
            };
        }

        // Convert a single SAN token to a USI move string using the supplied board.
        // pgnColor: "w" (PGN white = sente) or "b" (PGN black = gote).
        // Returns a USI string on success, null on failure.
        sanToUSI(san, pgnColor, board) {
            const parsed = this.parseSANToken(san);
            if (!parsed) return null;
            const {
                pieceType,
                destSq,
                midSq,
                promotes,
                disambigFile,
                disambigRank,
            } = parsed;

            // PGN white = CSL "b" (sente);  PGN black = CSL "w" (gote)
            const cslColor = pgnColor === "w" ? "b" : "w";

            const destCsl = this.pgnSqToCsl(destSq);
            if (!destCsl) return null;
            const [destRank, destFile] = this.parseSquareId(destCsl);

            // Helper: apply file/rank disambiguation filter to a candidate list.
            // From cslSqToPgn: fileLetter charCode = 97 + fileIndex -> fileIndex = charCode - 97
            //                  rankNumber = 12 - rankIndex           -> rankIndex = 12 - rankNumber
            const applyDisambig = (list) => {
                let out = list;
                if (disambigFile !== null) {
                    const tfi = disambigFile.charCodeAt(0) - 97;
                    out = out.filter(([, f]) => f === tfi);
                }
                if (disambigRank !== null) {
                    const tri = 12 - disambigRank;
                    out = out.filter(([r]) => r === tri);
                }
                return out;
            };

            if (midSq) {
                // \u2500\u2500 Double move (Lion / Horned Falcon / Soaring Eagle) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
                // The piece makes two legs: source -> mid -> dest.
                // For disambiguation we identify the source by checking the FIRST LEG
                // (can the piece reach the mid square?).  Checking the final destination
                // does not work for Lion-return moves (dest === source) because
                // canReachSquare rejects a friendly-occupied destination.
                const midCsl = this.pgnSqToCsl(midSq);
                if (!midCsl) return null;
                const [midRank, midFile] = this.parseSquareId(midCsl);

                const midCandidates = [];
                for (let r = 0; r < 12; r++) {
                    for (let f = 0; f < 12; f++) {
                        const p = board[r][f];
                        if (!p || p.type !== pieceType || p.color !== cslColor)
                            continue;
                        if (
                            this.canReachSquare(
                                r,
                                f,
                                p,
                                midRank,
                                midFile,
                                board,
                            )
                        )
                            midCandidates.push([r, f]);
                    }
                }
                const midFiltered = applyDisambig(midCandidates);
                if (midFiltered.length === 1) {
                    const fromCsl = this.getSquareId(
                        midFiltered[0][0],
                        midFiltered[0][1],
                    );
                    // fromCsl === destCsl is a valid Lion-return (captures at mid, returns home)
                    return fromCsl + midCsl + destCsl + (promotes ? "+" : "");
                }

                // True pass move: no first-leg candidate found because the piece already
                // sits on the destination and canReachSquare also rejects it as friendly.
                // Emit the 2-square USI pass token (from === to, no mid).
                const pieceAtDest = board[destRank][destFile];
                if (
                    pieceAtDest &&
                    pieceAtDest.type === pieceType &&
                    pieceAtDest.color === cslColor
                ) {
                    const passDisambigOk =
                        applyDisambig([[destRank, destFile]]).length === 1;
                    if (passDisambigOk) return destCsl + destCsl;
                }
                return null;
            }

            // \u2500\u2500 Regular (single-leg) move \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
            const candidates = [];
            for (let r = 0; r < 12; r++) {
                for (let f = 0; f < 12; f++) {
                    const p = board[r][f];
                    if (!p || p.type !== pieceType || p.color !== cslColor)
                        continue;
                    if (this.canReachSquare(r, f, p, destRank, destFile, board))
                        candidates.push([r, f]);
                }
            }
            const filtered = applyDisambig(candidates);
            if (filtered.length !== 1) return null;

            const fromCsl = this.getSquareId(filtered[0][0], filtered[0][1]);
            return fromCsl + destCsl + (promotes ? "+" : "");
        }

        // Apply a USI move to a mutable 12x12 board array in-place.
        // Used to advance board state between moves during PGN to CSL conversion.
        applyUSIToBoard(usi, board) {
            const promotes = usi.endsWith("+");
            const u = promotes ? usi.slice(0, -1) : usi;

            // Extract all squares -- each is \d+[a-l] (file number + rank char)
            const sqMatches = [...u.matchAll(/\d+[a-l]/g)].map((m) => m[0]);
            if (sqMatches.length < 2) return;

            const fromSq = sqMatches[0];
            const toSq = sqMatches[sqMatches.length - 1];
            const midSq = sqMatches.length === 3 ? sqMatches[1] : null;

            // True pass move: from === to with NO midpoint. Lion-return (from===to
            // with a midpoint) still needs to clear the captured piece at mid.
            if (fromSq === toSq && !midSq) return;

            const [fromRank, fromFile] = this.parseSquareId(fromSq);
            const [toRank, toFile] = this.parseSquareId(toSq);
            const piece = board[fromRank][fromFile];
            if (!piece) return;

            // For double moves: clear any enemy piece captured at the midpoint
            if (midSq) {
                const [midRank, midFile] = this.parseSquareId(midSq);
                const midPiece = board[midRank][midFile];
                if (midPiece && midPiece.color !== piece.color)
                    board[midRank][midFile] = null;
            }

            const movedPiece = promotes
                ? {
                      ...piece,
                      type: this.getPromotedType(piece.type) || piece.type,
                      promoted: true,
                  }
                : { ...piece };

            board[fromRank][fromFile] = null;
            board[toRank][toFile] = movedPiece;
        }

        // Convert a PGN string to CSL notation. Returns { csl } on success or
        // { error } on failure. Pure logic, no DOM access.
        convertPGNStringToCSL(pgn) {
            pgn = (pgn || "").trim();
            if (!pgn) {
                return { error: "No PGN data provided." };
            }

            // 1. Extract FEN tag -> starting SFEN
            const DEFAULT_SFEN =
                "lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/" +
                "3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b - 1";

            let startingSFEN = DEFAULT_SFEN;
            const fenMatch = pgn.match(/\[FEN\s+"([^"]+)"\]/i);
            if (fenMatch) {
                const fp = fenMatch[1].trim().split(/\s+/);
                const cslPlayer = (fp[1] || "w") === "w" ? "b" : "w"; // invert PGN <-> CSL
                startingSFEN = `${fp[0] || ""} ${cslPlayer} ${fp[2] || "-"} 1`;
            }

            // 2. Initialise board state
            const sfenParts = startingSFEN.split(" ");
            let board;
            try {
                board = this.parseSFENBoard(sfenParts[0]);
            } catch (_) {
                board = null;
            }
            if (!board) {
                return { error: "Error: could not parse starting position." };
            }

            // 3. Determine first mover
            // CSL "b" = sente = PGN white;  CSL "w" = gote = PGN black
            let currentPgnColor = (sfenParts[1] || "b") === "b" ? "w" : "b";

            // 4. Tokenize PGN move text (strip all [Tag "..."] pairs first)
            const moveText = pgn.replace(/\[[^\]]*\]/g, "").trim();
            const tokens = this.tokenizePGNMoveText(moveText);

            // 5. Convert each token
            let startingComment = "";
            const cslParts = [];
            let firstMoveEmitted = false;

            // Track board state before the last move so that any variation
            // token immediately following can branch from the correct position.
            let boardBeforeLastMove = null;
            let colorBeforeLastMove = currentPgnColor;

            for (const tok of tokens) {
                if (tok.type === "comment") {
                    // Comments are passed through verbatim, wrapped in CSL { }
                    if (!firstMoveEmitted) {
                        startingComment = tok.text;
                    } else {
                        cslParts.push("{" + tok.text + "}");
                    }
                } else if (tok.type === "move") {
                    // Snapshot before applying this move (needed by any
                    // variation token that follows it).
                    colorBeforeLastMove = currentPgnColor;
                    boardBeforeLastMove = board.map((row) =>
                        row.map((c) => (c ? { ...c } : null)),
                    );

                    const usi = this.sanToUSI(tok.text, currentPgnColor, board);
                    if (!usi) {
                        return {
                            error: `Error: could not convert move "${tok.text}".`,
                        };
                    }
                    cslParts.push(usi);
                    this.applyUSIToBoard(usi, board);
                    currentPgnColor = currentPgnColor === "w" ? "b" : "w";
                    firstMoveEmitted = true;
                } else if (tok.type === "variation") {
                    // Variation block: alternative starting from the position
                    // BEFORE the last main-line move.  Non-fatal — skip on error.
                    if (boardBeforeLastMove !== null) {
                        const innerToks = this.tokenizePGNMoveText(tok.text);
                        // Fresh board copy so sibling variations are independent.
                        const varBoard = boardBeforeLastMove.map((row) =>
                            row.map((c) => (c ? { ...c } : null)),
                        );
                        const subResult =
                            this._convertPGNVariationToCSLParts(
                                innerToks,
                                varBoard,
                                colorBeforeLastMove,
                            );
                        if (subResult.error) {
                            console.warn(
                                "PGN import: skipped variation —",
                                subResult.error,
                            );
                        } else if (subResult.parts.length > 0) {
                            cslParts.push(
                                "(" + subResult.parts.join(" ") + ")",
                            );
                        }
                    }
                }
            }

            // 6. Assemble CSL string
            let csl = startingSFEN;
            if (startingComment) csl += " {" + startingComment + "}";
            if (cslParts.length) csl += " " + cslParts.join(" ");

            return { csl };
        }

        // Recursively convert a tokenized PGN variation into an array of CSL
        // parts (USI strings, "{comment}" strings, "(sub-variation)" strings).
        //
        //   tokens        — output of tokenizePGNMoveText for the variation text
        //   board         — MUTABLE board snapshot at the start of the variation
        //                   (caller must pass a deep copy; this function mutates it)
        //   firstPgnColor — PGN color ("w"/"b") to move first in this variation
        //
        // Returns { parts } on success or { error } on failure.
        _convertPGNVariationToCSLParts(tokens, board, firstPgnColor) {
            const parts = [];
            let currentPgnColor = firstPgnColor;

            // Snapshot of the board before the last move (for sub-variations).
            let boardBeforeLastMove = null;
            let colorBeforeLastMove = firstPgnColor;

            for (const tok of tokens) {
                if (tok.type === "comment") {
                    parts.push("{" + tok.text + "}");
                } else if (tok.type === "move") {
                    colorBeforeLastMove = currentPgnColor;
                    boardBeforeLastMove = board.map((row) =>
                        row.map((c) => (c ? { ...c } : null)),
                    );

                    const usi = this.sanToUSI(tok.text, currentPgnColor, board);
                    if (!usi) {
                        return {
                            error: `Could not convert move "${tok.text}" in variation.`,
                        };
                    }
                    parts.push(usi);
                    this.applyUSIToBoard(usi, board);
                    currentPgnColor = currentPgnColor === "w" ? "b" : "w";
                } else if (tok.type === "variation") {
                    // Sub-variation: branch from position before last move.
                    if (boardBeforeLastMove !== null) {
                        const innerToks = this.tokenizePGNMoveText(tok.text);
                        const varBoard = boardBeforeLastMove.map((row) =>
                            row.map((c) => (c ? { ...c } : null)),
                        );
                        const subResult =
                            this._convertPGNVariationToCSLParts(
                                innerToks,
                                varBoard,
                                colorBeforeLastMove,
                            );
                        if (subResult.error) {
                            console.warn(
                                "PGN import: skipped sub-variation —",
                                subResult.error,
                            );
                        } else if (subResult.parts.length > 0) {
                            parts.push(
                                "(" + subResult.parts.join(" ") + ")",
                            );
                        }
                    }
                }
            }

            return { parts };
        }

        // Read PGN from [data-pgn-import], convert it to CSL notation, and
        // import it into the game (with the same overwrite confirmation as
        // the CSL import button).
        importPGNFromInput() {
            // Block import in viewOnly mode
            if (this.config.appletMode === "viewOnly") {
                console.log("Game import blocked in viewOnly mode");
                return;
            }

            const input = this.container.querySelector("[data-pgn-import]");
            if (!input || !input.value.trim()) {
                return;
            }

            // Show confirmation prompt before importing
            if (
                !confirm("This will overwrite the current game. Are you sure?")
            ) {
                return;
            }

            const result = this.convertPGNStringToCSL(input.value.trim());
            if (result.error) {
                alert(result.error);
                return;
            }

            this.importGame(result.csl);
            input.value = "";
            this.updateButtonStates();
        }

        exportPGN() {
            const ta = this.container.querySelector("[data-pgn-export]");
            if (!ta) return;
            const pgn = this.buildPGNString();
            ta.value = pgn;
            // Copy to clipboard without selecting the text
            if (navigator.clipboard) {
                navigator.clipboard.writeText(pgn).catch(() => {
                    // Fallback: select + execCommand
                    ta.select();
                    ta.setSelectionRange(0, 99999);
                    try {
                        document.execCommand("copy");
                    } catch (_) {}
                });
            } else {
                ta.select();
                ta.setSelectionRange(0, 99999);
                try {
                    document.execCommand("copy");
                } catch (_) {}
            }
        }

        exportKIF() {
            const ta = this.container.querySelector("[data-kif-export]");
            if (!ta) return;
            const kif = this.buildKIFString();
            ta.value = kif;
            // Copy to clipboard without selecting the text
            if (navigator.clipboard) {
                navigator.clipboard.writeText(kif).catch(() => {
                    // Fallback: select + execCommand
                    ta.select();
                    ta.setSelectionRange(0, 99999);
                    try {
                        document.execCommand("copy");
                    } catch (_) {}
                });
            } else {
                ta.select();
                ta.setSelectionRange(0, 99999);
                try {
                    document.execCommand("copy");
                } catch (_) {}
            }
        }

        // Utility methods
        calculatePromotionDeferralSquare(destination) {
            const [rank, file] = this.parseSquareId(destination);

            // Point away from the row the destination is closest to
            // If destination is in rows a-f (ranks 0-5), point towards row l (rank 11)
            // If destination is in rows g-l (ranks 6-11), point towards row a (rank 0)
            let offsetRank = 0;

            if (rank <= 5) {
                // Destination is in upper half (a-f), point towards bottom (l)
                offsetRank = 1;
            } else {
                // Destination is in lower half (g-l), point towards top (a)
                offsetRank = -1;
            }

            const altRank = rank + offsetRank;

            // Ensure within bounds
            if (altRank >= 0 && altRank < 12) {
                return this.getSquareId(altRank, file);
            }

            return null;
        }

        calculatePromotionAlternateSquare(destination) {
            const [rank, file] = this.parseSquareId(destination);

            // Get the deferral square direction first
            const deferralSquare =
                this.calculatePromotionDeferralSquare(destination);
            if (!deferralSquare) return null;

            const [deferralRank, deferralFile] =
                this.parseSquareId(deferralSquare);

            // Calculate direction from destination to deferral
            const rankDirection = deferralRank - rank;
            const fileDirection = deferralFile - file;

            // Move two king steps in the same direction as the deferral square
            const altRank = rank + rankDirection * 2;
            const altFile = file + fileDirection * 2;

            // Ensure within bounds
            if (altRank >= 0 && altRank < 12 && altFile >= 0 && altFile < 12) {
                return this.getSquareId(altRank, altFile);
            }

            return null;
        }

        getSquareId(rank, file) {
            const rankChar = String.fromCharCode(97 + rank); // a-l
            const fileNumber = 12 - file; // 12-1
            return fileNumber + rankChar; // Shogi notation: file first, then rank
        }

        parseSquareId(squareId) {
            // CENTRALIZED: Use utils.coords for all coordinate operations
            // Handle both single and double digit file numbers
            if (!squareId || typeof squareId !== "string") return [0, 0]; // guard against null/undefined
            const match = squareId.match(/^(\d+)([a-l])$/);
            if (!match) return [0, 0]; // fallback for invalid input

            const fileNumber = parseInt(match[1]);
            const rankChar = match[2];
            const rank = rankChar.charCodeAt(0) - 97; // a=0, b=1, etc.
            const file = 12 - fileNumber; // 12=0, 11=1, etc.
            return [rank, file];
        }

        // Navigation methods
        clearNavigationHold() {
            if (this.navigationHold) {
                if (this.navigationHold.holdTimer) {
                    clearTimeout(this.navigationHold.holdTimer);
                }
                if (this.navigationHold.navigationInterval) {
                    clearInterval(this.navigationHold.navigationInterval);
                }
                // Remove holding class from button to restore normal appearance
                if (this.navigationHold.button) {
                    this.navigationHold.button.classList.remove("holding");
                }
                this.navigationHold = null;
            }
        }

        canNavigateBack() {
            // Can't navigate back if at start position
            if (this.currentNavigationIndex === -1) return false;
            // Can navigate back if there are moves and we're not at start
            return this.moveHistory.length > 0;
        }

        canNavigateForward() {
            // Can't navigate forward if at current position
            if (
                this.currentNavigationIndex === null ||
                this.currentNavigationIndex === this.moveHistory.length - 1
            ) {
                return false;
            }
            // Can navigate forward otherwise
            return true;
        }

        goToStart() {
            this.navigateToPosition("start");
        }

        // Returns the preferred continuation child of a node: the last child
        // without isBranch=true (children are prepended, so last = oldest =
        // the main line).  Returns null at a leaf or if all children are branches.
        _mainContinuationOf(node) {
            for (let j = node.children.length - 1; j >= 0; j--) {
                if (!node.children[j].isBranch) return node.children[j];
            }
            return null;
        }

        // Follows _mainContinuationOf to the deepest leaf of the current branch.
        _lastInBranch(node) {
            let cur = node;
            while (true) {
                const next = this._mainContinuationOf(cur);
                if (!next) return cur;
                cur = next;
            }
        }

        // Returns { current, total } for the viewed node's global depth.
        // current: number of moves from the start position to node (all
        //          ancestors on any line, plus node itself).
        // total:   same depth but to the leaf of the current branch
        //          continuation — includes all ancestors plus all remaining
        //          branch moves.
        _branchPosition(node) {
            // Walk up to moveTree, counting every ancestor.
            let current = 0;
            let cur = node;
            while (cur && cur !== this.moveTree) {
                current++;
                cur = cur.parent;
            }
            // Extend forward along the main continuation to the leaf.
            let total = current;
            cur = node;
            while (true) {
                const next = this._mainContinuationOf(cur);
                if (!next) break;
                cur = next;
                total++;
            }
            return { current, total };
        }

        goBackOneMove() {
            // Off-branch: navigate within the variation tree.
            if (this._viewedNode !== null) {
                const parent = this._viewedNode.parent;
                if (!parent || parent === this.moveTree) {
                    // Reached the root — go to start position.
                    this.navigateToPosition("start");
                } else {
                    const mainLineIdx = this.moveHistory.indexOf(parent);
                    if (mainLineIdx >= 0) {
                        // Parent is on the main line — re-enter main-line navigation.
                        this.navigateToPosition(mainLineIdx);
                    } else {
                        // Parent is also off-branch — stay in the variation tree.
                        this.navigateToNode(parent);
                    }
                }
                return;
            }

            // Main-line navigation.
            if (this.moveHistory.length === 0) return;
            if (
                this.currentNavigationIndex === null ||
                this.currentNavigationIndex === this.moveHistory.length - 1
            ) {
                if (this.moveHistory.length > 1) {
                    this.navigateToPosition(this.moveHistory.length - 2);
                } else {
                    this.navigateToPosition("start");
                }
            } else if (this.currentNavigationIndex > 0) {
                this.navigateToPosition(this.currentNavigationIndex - 1);
            } else if (this.currentNavigationIndex === 0) {
                this.navigateToPosition("start");
            }
        }

        goForwardOneMove() {
            // Check if we're paused in puzzle mode waiting for advancement
            // Only trigger opponent response if we're at the current position (not browsing history)
            if (
                this.config.appletMode === "puzzle" &&
                this.puzzleWaitingForAdvance &&
                this.currentNavigationIndex === null
            ) {
                console.log(
                    "Puzzle: Resuming from pause, executing opponent response",
                );
                this.puzzleWaitingForAdvance = false;
                this.puzzleOpponentThinking = true;
                this.updateButtonStates(); // Disable navigation during opponent thinking
                this.executeOpponentResponseInPuzzle();
                // Re-enable interactions after opponent move
                this.puzzleOpponentThinking = false;
                this.updateButtonStates(); // Re-enable navigation buttons
                return;
            }

            // Off-branch: follow the main continuation within this branch.
            if (this._viewedNode !== null) {
                const next = this._mainContinuationOf(this._viewedNode);
                if (next) this.navigateToNode(next);
                // At a variation leaf — nothing to do.
                return;
            }

            // Main-line navigation.
            if (
                this.currentNavigationIndex === null ||
                this.currentNavigationIndex === this.moveHistory.length - 1
            ) {
                // Already at the live position.
                return;
            }
            if (
                this.currentNavigationIndex === -1 &&
                this.moveHistory.length > 0
            ) {
                this.navigateToPosition(0);
            } else if (
                this.currentNavigationIndex >= 0 &&
                this.currentNavigationIndex < this.moveHistory.length - 1
            ) {
                this.navigateToPosition(this.currentNavigationIndex + 1);
            }
        }

        goToCurrent() {
            // Off-branch: go to the last move in this variation branch.
            if (this._viewedNode !== null) {
                const leaf = this._lastInBranch(this._viewedNode);
                if (leaf !== this._viewedNode) this.navigateToNode(leaf);
                // Already at the leaf — nothing to do.
                return;
            }
            // Main line: go to the live position.
            this.navigateToPosition("current");
        }

        // Keyboard navigation helper methods
        triggerNavigationKey(buttonType) {
            // Simulate pressing the navigation button
            // Clear any existing hold state first
            this.clearNavigationHold();

            // Initialize hold state
            if (!this.navigationHold) {
                this.navigationHold = {};
            }
            this.navigationHold.isHolding = false;
            this.navigationHold.direction = buttonType;
            this.navigationHold.button = null; // No actual button for keyboard
            this.navigationHold.fromKeyboard = true; // Mark as keyboard-triggered

            // Find and add holding class to the corresponding button for visual feedback
            let buttonSelector;
            switch (buttonType) {
                case "start":
                    buttonSelector = "[data-nav-start]";
                    break;
                case "prev":
                    buttonSelector = "[data-nav-prev]";
                    break;
                case "next":
                    buttonSelector = "[data-nav-next]";
                    break;
                case "end":
                    buttonSelector = "[data-nav-end]";
                    break;
            }

            const button = this.container.querySelector(buttonSelector);
            if (button) {
                button.classList.add("holding");
                this.navigationHold.button = button;
            }

            // Perform the navigation action immediately
            switch (buttonType) {
                case "start":
                    this.goToStart();
                    break;
                case "prev":
                    this.goBackOneMove();
                    break;
                case "next":
                    this.goForwardOneMove();
                    break;
                case "end":
                    this.goToCurrent();
                    break;
            }

            // Start timer for hold detection after 1 second
            this.navigationHold.holdTimer = setTimeout(() => {
                this.navigationHold.isHolding = true;

                // Start continuous navigation at 4 moves per second
                this.navigationHold.navigationInterval = setInterval(() => {
                    // Check if we can still navigate
                    let canContinue = false;
                    switch (buttonType) {
                        case "start":
                            canContinue = this.canNavigateBack();
                            break;
                        case "prev":
                            canContinue = this.canNavigateBack();
                            break;
                        case "next":
                            canContinue = this.canNavigateForward();
                            break;
                        case "end":
                            canContinue = this.canNavigateForward();
                            break;
                    }

                    if (!canContinue) {
                        this.clearNavigationHold();
                        return;
                    }

                    // Perform navigation
                    switch (buttonType) {
                        case "start":
                            this.goToStart();
                            break;
                        case "prev":
                            this.goBackOneMove();
                            break;
                        case "next":
                            this.goForwardOneMove();
                            break;
                        case "end":
                            this.goToCurrent();
                            break;
                    }
                }, 125);
            }, 750);
        }

        releaseNavigationKey(key) {
            // Simulate releasing the navigation button
            if (this.navigationHold && this.navigationHold.fromKeyboard) {
                this.clearNavigationHold();
            }
        }

        loadNavigationPosition() {
            if (this.navigationPosition === null) {
                // Current position - restore without navigation
                if (this.moveHistory.length > 0) {
                    const lastMove =
                        this.moveHistory[this.moveHistory.length - 1];
                    console.log(
                        "Navigation: Loading current position with last move:",
                        lastMove.notation,
                        "SFEN:",
                        lastMove.resultingSFEN,
                    );
                    const loadResult = this.loadSFENForNavigation(
                        lastMove.resultingSFEN,
                    );
                    if (!loadResult) {
                        console.error(
                            "Failed to load current position:",
                            lastMove.resultingSFEN,
                        );
                        return;
                    }
                    this.lastMove = {
                        from: lastMove.from,
                        to: lastMove.to,
                        midpoint: lastMove.midpoint || null, // Include midpoint for Lion double moves
                    };
                } else {
                    const targetSFEN =
                        this.startingSFEN || this.getDefaultStartingSFEN();
                    console.log(
                        "Navigation: Loading current position (no moves), SFEN:",
                        targetSFEN,
                    );
                    const loadResult = this.loadSFENForNavigation(targetSFEN);
                    if (!loadResult) {
                        console.error(
                            "Failed to load current position (no moves):",
                            targetSFEN,
                        );
                        return;
                    }
                    this.lastMove = null;
                }
                // Force update square highlights to show last move immediately
                this.updateSquareHighlights();
                this.updateDisplay();
                return;
            }

            let targetSFEN;

            if (this.navigationPosition === -1) {
                // Start position
                targetSFEN = this.startingSFEN || this.getDefaultStartingSFEN();
                console.log("Navigation: Loading start position", targetSFEN);
            } else if (
                this.navigationPosition >= 0 &&
                this.navigationPosition < this.moveHistory.length
            ) {
                // Historical position after the specified move
                const move = this.moveHistory[this.navigationPosition];
                targetSFEN = move.resultingSFEN;
                console.log(
                    `Navigation: Loading position after move ${this.navigationPosition + 1}:`,
                    move.notation,
                    "SFEN:",
                    targetSFEN,
                );
            } else {
                // Invalid position, go to current
                console.log(
                    "Navigation: Invalid position",
                    this.navigationPosition,
                    "going to current",
                );
                this.navigationPosition = null;
                this.isNavigating = false;
                this.loadNavigationPosition();
                return;
            }

            // Load the position without affecting move history using exact same logic as Game Log
            const loadResult = this.loadSFENForNavigation(targetSFEN);
            if (!loadResult) {
                console.error(
                    "Failed to load navigation position:",
                    targetSFEN,
                );
                return;
            }

            // Set appropriate last move highlight after loading position
            if (this.navigationPosition === -1) {
                // At start position, no last move
                this.lastMove = null;
                // Restore starting counter-strike state
                this.lastLionCapture = this.startingLionCapture || null;
            } else if (
                this.navigationPosition >= 0 &&
                this.navigationPosition < this.moveHistory.length
            ) {
                // Show the move that led to this position
                const move = this.moveHistory[this.navigationPosition];
                this.lastMove = {
                    from: move.from,
                    to: move.to,
                    midpoint: move.midpoint || null, // Include midpoint for Lion double moves
                };
                // Restore counter-strike state at this navigation position
                this.lastLionCapture = move.lionCapture || null;
            }

            // Force update square highlights to show last move immediately
            this.updateSquareHighlights();
            this.updateDisplay();
        }

        loadSFENForNavigation(sfen) {
            // Store current state that should be preserved during navigation
            const originalMoveHistory = [...this.moveHistory];
            const originalStartingSFEN = this.startingSFEN;
            const originalStartingLionCapture = this.startingLionCapture;

            // Use the exact same SFEN interpretation as the Game Log (importGame function)
            // This ensures complete consistency between navigation and import functionality
            const result = this.loadSFEN(sfen);

            if (!result) {
                console.warn("Failed to load SFEN during navigation:", sfen);
                return false;
            }

            // Restore preserved state that shouldn't change during navigation
            this.moveHistory = originalMoveHistory;
            this.startingSFEN = this.sanitizeSFEN(originalStartingSFEN);
            this.startingLionCapture = originalStartingLionCapture;

            // Clear any selection and highlights since we're in navigation mode
            this.clearSelection();

            return true;
        }

        updateNavigationButtons() {
            // This method can be called to update button states based on navigation position
            // For now, we'll just ensure the display is updated
            this.updateDisplay();
        }

        // Check if we can make moves.
        // Navigation no longer blocks moves — playing from any position creates a
        // variation (or extends a leaf branch) in the move tree.
        canMakeMove() {
            return true;
        }

        // Public methods for external control
        confirmNewGame() {
            // Block new game in viewOnly mode
            if (this.config.appletMode === "viewOnly") {
                console.log("New game blocked in viewOnly mode");
                return;
            }

            if (this.moveHistory.length > 0) {
                if (confirm("This will start a new game. Are you sure?")) {
                    this.newGame();
                }
            } else {
                this.newGame();
            }
        }

        newGame() {
            // Use centralized state management for complete new game reset
            this.gameStateManager.resetGameState();

            // Clear puzzle pause state when starting new game
            if (
                this.config.appletMode === "puzzle" &&
                this.puzzleWaitingForAdvance
            ) {
                console.log("Puzzle: Clearing pause state due to new game");
                this.puzzleWaitingForAdvance = false;
            }

            // Clear edit mode state
            this.gameStateManager.updateGameState({
                editMode: {
                    selectedPiece: null,
                    counterStrikeSelection: false,
                    preEditPosition: null,
                    preEditCounterStrike: null,
                },
            });

            // Reset to the starting position (either imported SFEN or default)
            this.loadSFEN(this.startingSFEN);
            this.updateButtonStates();
        }

        confirmReset() {
            // Special behavior when in edit mode - clear edits instead of full reset
            if (this.currentTab === "edit") {
                // Check if there are edits to clear
                if (this.editMode.preEditPosition) {
                    const message =
                        "This will clear all edits made to the board position. Are you sure?";
                    if (confirm(message)) {
                        this.revertToPreEditPosition();
                    }
                }
                // If no edits have been made, do nothing (no need to reset in edit mode)
                return;
            }

            // Normal reset behavior when not in edit mode
            // Check if current game state differs from initially loaded configuration
            const hasChangedFromInitial = this.hasGameChangedFromInitial();

            if (hasChangedFromInitial) {
                const message =
                    "This will reset the board to its original state. Are you sure?";

                if (confirm(message)) {
                    this.reset();
                }
            } else {
                this.reset();
            }
        }

        hasGameChangedFromInitial() {
            // If there's a custom startGame configuration, check if current state matches it
            if (this.config.startGame) {
                // Get current game export format
                const currentGameState = this.getCurrentGameState();
                return currentGameState !== this.config.startGame;
            } else {
                // No custom start, check if we're at standard position with no moves
                const standardSFEN =
                    "lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b - 1";
                return (
                    this.moveHistory.length > 0 ||
                    this.startingSFEN !== standardSFEN
                );
            }
        }

        getCurrentGameState() {
            // Generate the same format as exportGame() but return as string instead of setting textarea
            return this.buildCSLString();
        }

        reset() {
            // Reset to the configured starting position (custom if provided, otherwise standard)
            const standardSFEN =
                "lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b - 1";

            if (this.config.startGame) {
                // Reload the configured game state (SFEN + USI moves)
                if (this.importGame(this.config.startGame)) {
                    console.log("Reset to configured startGame position");
                } else {
                    console.error(
                        "Failed to reset to startGame configuration, using standard position",
                    );
                    this.startingSFEN = this.sanitizeSFEN(standardSFEN);
                    this.loadSFEN(standardSFEN);
                }
            } else {
                // Reset to standard starting position
                this.startingSFEN = this.sanitizeSFEN(standardSFEN);
                this.loadSFEN(standardSFEN);
                this.moveHistory = [];
                this.moveTree = { id: "root", children: [], parent: null, ply: 0 };
                this.lastMove = null;
                this.lastLionCapture = null;
                this.startingLionCapture = null;
                this.clearSelection();

                // Reset navigation state
                this.currentNavigationIndex = -1;
                this.isNavigating = false;
                this.currentNode = this.moveTree;
            }
            this.updateDisplay();
            this.updateMoveHistoryHighlight();
            this.updateButtonStates();
        }

        clearBoard() {
            // First, clear all edits (revert to pre-edit position if it exists)
            if (this.editMode.preEditPosition) {
                this.revertToPreEditPosition();
            }

            // Clear any current selection
            this.clearEditSelection();

            // Store the pre-edit position for the clearing operation
            if (!this.editMode.preEditPosition) {
                this.editMode.preEditPosition = this.exportSFEN();
                this.editMode.preEditCounterStrike = this.lastLionCapture;
            }

            // Invalidate moveable pieces cache when board is cleared
            this.moveablePiecesCache = null;

            // Now remove each piece individually by editing them off the board
            for (let rank = 0; rank < 12; rank++) {
                for (let file = 0; file < 12; file++) {
                    if (this.board[rank] && this.board[rank][file]) {
                        // Remove the piece by setting it to null - board squares are piece objects directly
                        this.board[rank][file] = null;
                    }
                }
            }

            // Update the board visual, display and highlights
            this.updateBoard();
            this.updateDisplay();
            this.updateSquareHighlights();

            console.log("clearBoard: Board cleared successfully");
            console.log(
                "clearBoard: Current board state after clearing:",
                this.board.map((row) =>
                    row.map((piece) => (piece ? piece.type : "empty")),
                ),
            );
        }

        setStartPosition() {
            this.clearEditSelection(); // Clear edit mode selection

            // Get the selected player to move from the dropdown
            const playerSelect = this.container.querySelector(
                "[data-player-to-move]",
            );
            const selectedPlayer = playerSelect
                ? playerSelect.value
                : this.currentPlayer;

            // Set current position as the new starting position with selected player to move
            const currentSFEN = this.exportSFEN();
            // Replace the current player in SFEN with selected player and reset move number to 1
            const sfenParts = currentSFEN.split(" ");
            sfenParts[1] = selectedPlayer;
            sfenParts[3] = "1"; // Reset move number to 1 for new starting position

            // Preserve Counter-strike rule state if it was set during editing
            // The current Counter-strike state is already included in the exported SFEN
            const newStartingSFEN = sfenParts.join(" ");

            // Set the new starting position and reload it (similar to clearBoard approach)
            this.startingSFEN = this.sanitizeSFEN(newStartingSFEN);

            // Store the current Counter-strike state before loading
            const currentCounterStrike = this.lastLionCapture;

            this.loadSFEN(newStartingSFEN);
            this.moveHistory = [];
            this.moveTree = { id: "root", children: [], parent: null, ply: 0 };
            this.currentNode = null;
            this.lastMove = null;

            // Set the starting Counter-strike state to match what was set during editing
            this.startingLionCapture = currentCounterStrike;

            // Clear the pre-edit position so that clicking the board doesn't revert to old position
            this.editMode.preEditPosition = null;
            this.editMode.counterStrikeSelection = false;
            this.editMode.preEditCounterStrike = null;

            this.clearSelection();
            this.updateDisplay();
            this.updateSquareHighlights();
            this.updateButtonStates();

            console.log("Set new starting position:", newStartingSFEN);
        }

        confirmSetStartPosition() {
            if (
                confirm(
                    "This will start a new game with the current starting position. Are you sure?",
                )
            ) {
                // Invalidate moveable pieces cache before setting new start position
                this.moveablePiecesCache = null;
                this.setStartPosition();
            }
        }

        // Edit mode methods
        selectPieceFromTable(pieceCode) {
            // Clear any board piece selection when selecting from piece table
            this.clearSelection();

            // Store pre-edit position if this is the first selection
            if (
                !this.editMode.selectedPiece &&
                !this.editMode.preEditPosition
            ) {
                this.editMode.preEditPosition = this.exportSFEN();
                this.editMode.preEditCounterStrike = this.lastLionCapture;
            }

            // Handle Counter-strike selection
            if (pieceCode === "counterstrike") {
                this.editMode.counterStrikeSelection =
                    !this.editMode.counterStrikeSelection;
                // Clear other piece selections when selecting Counter-strike
                if (this.editMode.counterStrikeSelection) {
                    this.editMode.selectedPiece = null;
                }
            } else {
                // Disable Counter-strike selection when selecting other pieces
                this.editMode.counterStrikeSelection = false;
            }

            // Clear previous selection
            const previousSelected = this.container.querySelector(
                ".chushogi-selector-square.selected",
            );
            if (previousSelected) {
                previousSelected.classList.remove("selected");
            }

            // Toggle selection based on piece type
            if (pieceCode === "counterstrike") {
                // For Counter-strike, the state was already toggled above
                // Find and highlight the Counter-strike square
                const selectedSquare = this.container.querySelector(
                    `.chushogi-selector-square[data-piece="counterstrike"]`,
                );
                if (selectedSquare) {
                    if (this.editMode.counterStrikeSelection) {
                        selectedSquare.classList.add("selected");
                    } else {
                        selectedSquare.classList.remove("selected");
                    }
                }
            } else {
                // Standard piece selection toggle
                if (this.editMode.selectedPiece === pieceCode) {
                    this.editMode.selectedPiece = null;
                } else {
                    this.editMode.selectedPiece = pieceCode;
                    // Find and highlight the selected piece in the selector table only
                    const selectedSquare = this.container.querySelector(
                        `.chushogi-selector-square[data-piece="${pieceCode}"]`,
                    );
                    if (selectedSquare) {
                        selectedSquare.classList.add("selected");
                        // Force a reflow to ensure the style is applied immediately
                        selectedSquare.offsetHeight;
                    }
                }
            }

            // Update Counter-strike highlighting
            this.updateSquareHighlights();
        }

        setCounterStrikeSquare(squareId) {
            // Store pre-edit position if this is the first edit
            if (!this.editMode.preEditPosition) {
                this.editMode.preEditPosition = this.exportSFEN();
                this.editMode.preEditCounterStrike = this.lastLionCapture;
            }

            // Invalidate moveable pieces cache when setting counter-strike square
            this.moveablePiecesCache = null;

            const [rank, file] = this.parseSquareId(squareId);
            const piece = this.board[rank][file];

            if (piece) {
                // Clicking on an occupied square sets the Counter-strike square to that square
                this.lastLionCapture = squareId;
                console.log(`Counter-strike rule set to square: ${squareId}`);
            } else {
                // Clicking on an empty square sets the Counter-strike square to null (relaxed rule)
                this.lastLionCapture = null;
                console.log("Counter-strike rule relaxed (no restriction)");
            }

            // Update board and display first, then apply highlighting
            this.updateBoard();
            this.updateDisplay();

            // Ensure highlighting is applied after DOM updates
            requestAnimationFrame(() => {
                this.updateSquareHighlights();
            });
        }

        relaxCounterStrikeRule() {
            // Only act when the shield is selected (counter-strike selection mode is active)
            if (!this.editMode.counterStrikeSelection) return;

            // Store pre-edit position if this is the first edit
            if (!this.editMode.preEditPosition) {
                this.editMode.preEditPosition = this.exportSFEN();
                this.editMode.preEditCounterStrike = this.lastLionCapture;
            }

            // Invalidate moveable pieces cache
            this.moveablePiecesCache = null;

            // Clear the counter-strike restriction
            this.lastLionCapture = null;
            console.log("Counter-strike rule relaxed via right-click");

            this.updateBoard();
            this.updateDisplay();
            requestAnimationFrame(() => {
                this.updateSquareHighlights();
            });
        }

        checkCounterStrikeStateAfterEdit() {
            // Check if counter-strike square became empty and clear state if so
            if (this.lastLionCapture) {
                const [rank, file] = this.parseSquareId(this.lastLionCapture);
                const pieceAtSquare = this.board[rank][file];

                if (!pieceAtSquare) {
                    console.log(
                        "Counter-strike square became empty after edit - clearing state",
                    );
                    this.lastLionCapture = null;
                }
            }
        }

        handleEditModeBoardClick(squareId) {
            // Store pre-edit position if this is the first edit
            if (!this.editMode.preEditPosition) {
                this.editMode.preEditPosition = this.exportSFEN();
                this.editMode.preEditCounterStrike = this.lastLionCapture;
            }

            // Handle arbitrary board editing like allowIllegalMoves mode
            // These are edits, not actual moves, so no validation or legal move display
            const [rank, file] = this.parseSquareId(squareId);
            const pieceAtSquare = this.board[rank][file];

            if (this.selectedSquare) {
                // A piece is already selected - perform an edit move
                const [selectedRank, selectedFile] = this.parseSquareId(
                    this.selectedSquare,
                );
                const selectedPiece = this.board[selectedRank][selectedFile];

                if (this.selectedSquare === squareId) {
                    // Clicking the same square - deselect
                    this.clearSelection();
                    return;
                }

                if (selectedPiece) {
                    // Move the piece without validation (edit mode)
                    this.board[rank][file] = { ...selectedPiece };
                    this.board[selectedRank][selectedFile] = null;
                    this.clearSelection();

                    // Check if we need to update counter-strike state due to board changes
                    this.checkCounterStrikeStateAfterEdit();
                } else {
                    // No piece selected somehow, just deselect
                    this.clearSelection();
                }
            } else {
                // No piece selected - select piece if there is one
                if (pieceAtSquare) {
                    // Select this piece for editing (no legal moves shown)
                    this.selectedSquare = squareId;
                    this.validMoves = []; // No legal moves in edit mode
                    this.updateSquareHighlights();
                }
                // If no piece, do nothing (clicking empty square with no selection)
            }

            // Update display after edit
            this.updateBoard();
            this.updateDisplay();
        }

        updateEditModeDisplay() {
            // Regenerate edit panel to reflect current selection states
            const editPanel = this.container.querySelector(
                '[data-panel="edit"]',
            );
            if (editPanel && this.currentTab === "edit") {
                editPanel.innerHTML = this.generateEditPanel();

                // Restore selection states after regenerating the panel with a small delay
                setTimeout(() => {
                    this.restorePieceSelection();

                    // IMPORTANT: Always restore counter-strike highlighting after panel regeneration
                    this.updateSquareHighlights();
                }, 5);

                // Restore Counter-strike selection highlighting for shield icon
                if (this.editMode.counterStrikeSelection) {
                    const counterStrikeSquare = this.container.querySelector(
                        '[data-piece="counterstrike"]',
                    );
                    if (counterStrikeSquare) {
                        counterStrikeSquare.classList.add("selected");
                    }
                }
            }
        }

        placePieceOnBoard(squareId) {
            if (!this.editMode.selectedPiece) return;

            const [rank, file] = this.parseSquareId(squareId);
            const pieceCode = this.editMode.selectedPiece;

            // Parse piece code to create piece object
            let piece = null;
            if (pieceCode !== "" && pieceCode !== "remove") {
                // Remove piece if pieceCode is 'remove' or empty
                const isBlack = pieceCode === pieceCode.toUpperCase();
                const isPromoted = pieceCode.startsWith("+");
                const baseType = isPromoted
                    ? pieceCode.slice(1).toUpperCase()
                    : pieceCode.toUpperCase();

                if (isPromoted) {
                    // For promoted pieces, store the full promoted type (e.g., "+P") and original type
                    piece = {
                        type: pieceCode.toUpperCase(), // Store "+P", "+L", etc.
                        color: isBlack ? "b" : "w",
                        promoted: true,
                        originalType: baseType,
                    };
                } else {
                    // For regular pieces
                    piece = {
                        type: baseType,
                        color: isBlack ? "b" : "w",
                        promoted: false,
                    };
                }
            }

            // Place or remove the piece
            this.board[rank][file] = piece;

            // Invalidate moveable pieces cache when placing/removing pieces
            this.moveablePiecesCache = null;

            // Check if we need to update counter-strike state due to board changes
            this.checkCounterStrikeStateAfterEdit();

            this.updateBoard();
            this.updateDisplay();
        }

        clearEditSelection() {
            // Clear selected piece from table
            const selectedSquare = this.container.querySelector(
                ".chushogi-selector-square.selected",
            );
            if (selectedSquare) {
                selectedSquare.classList.remove("selected");
            }
            this.editMode.selectedPiece = null;
            this.editMode.counterStrikeSelection = false;
        }

        restorePieceSelection() {
            if (this.editMode.selectedPiece) {
                const selectedSquare = this.container.querySelector(
                    `.chushogi-selector-square[data-piece="${this.editMode.selectedPiece}"]`,
                );
                if (selectedSquare) {
                    selectedSquare.classList.add("selected");
                    // Force a reflow to ensure the style is applied immediately
                    selectedSquare.offsetHeight;
                }
            }
        }

        revertToPreEditPosition() {
            if (this.editMode.preEditPosition) {
                // Use applySFENPosition to preserve move history instead of loadSFEN
                this.applySFENPosition(this.editMode.preEditPosition);
                this.editMode.preEditPosition = null;
                this.updateDisplay();
            }

            // Revert Counter-strike state
            if (
                this.editMode.preEditCounterStrike !== null ||
                (this.editMode.preEditCounterStrike === null &&
                    this.lastLionCapture !== null)
            ) {
                this.lastLionCapture = this.editMode.preEditCounterStrike;
            }
            this.editMode.preEditCounterStrike = null;

            this.clearEditSelection();
            this.updateSquareHighlights();
        }

        flipBoard() {
            // Toggle the flip view configuration
            this.config.flipView = !this.config.flipView;

            // Update the checkbox state to reflect the change (if it exists)
            const flipCheckbox = this.container.querySelector("#flip-view");
            if (flipCheckbox) {
                flipCheckbox.checked = this.config.flipView;
            }

            // Update the container data attribute for CSS styling
            this.container.setAttribute(
                "data-flip-view",
                this.config.flipView.toString(),
            );

            // Store current drawings to preserve them during flip (position doesn't change)
            const currentCircles = new Map(this.drawings.circles);
            const currentArrows = new Map(this.drawings.arrows);

            // Store current game state to preserve highlights (same as updateBoardSize)
            const currentSelected = this.selectedSquare;
            const currentValidMoves = [...this.validMoves];

            const currentPromotionState = {
                active: this.promotionPromptActive,
                move: this.promotionMove,
                destination: this.promotionDestinationSquare,
                deferral: this.promotionDeferralSquare,
                alternate: this.promotionAlternateSquare,
            };
            const currentLionReturnState = {
                active: this.lionReturnPromptActive,
                alternate: this.lionReturnAlternateSquare,
            };
            const currentEditModeState = {
                counterStrikeSelection: this.editMode.counterStrikeSelection,
                selectedPiece: this.editMode.selectedPiece,
            };

            // Refresh the board to apply the flip
            this.updateBoard();

            // Restore drawings after flip since board positions remain the same
            this.drawings.circles = currentCircles;
            this.drawings.arrows = currentArrows;

            // Restore game state (same as updateBoardSize)
            this.selectedSquare = currentSelected;
            this.validMoves = currentValidMoves;

            this.promotionPromptActive = currentPromotionState.active;
            this.promotionMove = currentPromotionState.move;
            this.promotionDestinationSquare = currentPromotionState.destination;
            this.promotionDeferralSquare = currentPromotionState.deferral;
            this.promotionAlternateSquare = currentPromotionState.alternate;
            this.lionReturnPromptActive = currentLionReturnState.active;
            this.lionReturnAlternateSquare = currentLionReturnState.alternate;
            this.editMode.counterStrikeSelection =
                currentEditModeState.counterStrikeSelection;
            this.editMode.selectedPiece = currentEditModeState.selectedPiece;

            // Redraw the preserved drawings on the flipped board
            this.redrawAllDrawings();

            // Re-apply highlights after state restoration
            this.updateSquareHighlights();

            // Restore edit mode display if needed
            if (this.currentTab === "edit") {
                this.updateEditModeDisplay();
            }

            // Restore piece previews if promotion prompt was active
            if (currentPromotionState.active && currentPromotionState.move) {
                this.recreatePromotionPreviews(currentPromotionState.move);
            }

            // Restore piece previews if Lion return prompt was active
            if (currentLionReturnState.active) {
                this.recreateLionReturnPreviews();
            }
        }

        setStartingPosition(sfen) {
            // Set a new starting position and load it
            this.startingSFEN = this.sanitizeSFEN(sfen);
            this.loadSFEN(sfen);
            this.moveHistory = [];
            this.moveTree = { id: "root", children: [], parent: null, ply: 0 };
            this.currentNode = null;
            this.lastMove = null;
            this.lastLionCapture = null;
            this.startingLionCapture = null;
            this.clearSelection();
            this.updateDisplay();
        }

        // ── Move-tree helpers ─────────────────────────────────────────────────

        /**
         * Wrap a plain move-data object in a MoveNode, linking it to its parent.
         * The caller is responsible for pushing the node into parent.children and
         * into this.moveHistory.
         */
        makeMoveNode(moveData, parent) {
            return Object.assign({}, moveData, {
                id: ++this._moveNodeCounter,
                parent,
                children: [],
                ply: parent.ply + 1,
            });
        }

        /**
         * Recursively sever node and all its descendants from the tree.
         * Removes node from parent.children and nulls the parent pointer.
         * Safe to call on an already-detached node (parent === null → no-op).
         */
        detachSubtree(node) {
            // Detach children depth-first so references are cleaned before the parent
            for (const child of [...node.children]) {
                this.detachSubtree(child);
            }
            node.children = [];
            if (node.parent) {
                const idx = node.parent.children.indexOf(node);
                if (idx >= 0) node.parent.children.splice(idx, 1);
                node.parent = null;
            }
        }

        /**
         * Count how many nodes exist in the subtree rooted at `node`
         * (the node itself plus every descendant across all branches).
         * Used to give accurate move counts in undo confirmation prompts.
         */
        countSubtreeNodes(node) {
            let count = 1;
            for (const child of node.children) {
                count += this.countSubtreeNodes(child);
            }
            return count;
        }

        /**
         * Return the live leaf: the last node in moveHistory, or moveTree if no
         * moves have been played yet.
         */
        getLiveNode() {
            return this.moveHistory.length > 0
                ? this.moveHistory[this.moveHistory.length - 1]
                : this.moveTree;
        }

        // ── End move-tree helpers ─────────────────────────────────────────────

        undo() {
            // Block undo in viewOnly mode
            if (this.config.appletMode === "viewOnly") {
                console.log("Undo blocked in viewOnly mode");
                return;
            }

            // Block undo during puzzle pause (waiting for manual advance)
            if (
                this.config.appletMode === "puzzle" &&
                this.puzzleWaitingForAdvance
            ) {
                console.log(
                    "Undo blocked during puzzle pause - press > or \u2192 to continue",
                );
                return;
            }

            // Block undo during puzzle opponent thinking
            if (
                this.config.appletMode === "puzzle" &&
                this.puzzleOpponentThinking
            ) {
                console.log("Undo blocked during puzzle opponent response");
                return;
            }

            // Special undo behavior for puzzle mode
            if (this.config.appletMode === "puzzle") {
                return this.undoPuzzleMove();
            }

            // Clear selections first using centralized state management
            this.gameStateManager.updateGameState({
                selectedSquare: null,
                validMoves: [],
                editMode: {
                    ...this.editMode,
                    selectedPiece: null,
                    counterStrikeSelection: false,
                },
            });

            // Check if we have moves to undo
            if (this.moveHistory.length === 0) {
                // No moves to undo, but if we had edit changes, clear them
                if (this.editMode.preEditPosition) {
                    this.applySFENPosition(this.editMode.preEditPosition);
                    this.gameStateManager.updateGameState({
                        editMode: {
                            ...this.editMode,
                            preEditPosition: null,
                        },
                    });
                    this.updateDisplay();
                }
                return;
            }

            // If in edit mode with changes, revert to pre-edit position first
            if (this.editMode.preEditPosition) {
                this.applySFENPosition(this.editMode.preEditPosition);
                this.gameStateManager.updateGameState({
                    editMode: {
                        ...this.editMode,
                        preEditPosition: null,
                    },
                });
            }

            // ── Off-branch variation undo / clip ─────────────────────────────
            // When the user is viewing an off-branch node (_viewedNode is set):
            //   Leaf node    → ↶  remove just that node, navigate to parent.
            //   Non-leaf node → ✂  clip all children of this node (making it a
            //                      leaf), stay at the node.  Sibling branches
            //                      that diverge from an ancestor are untouched.
            if (this._viewedNode) {
                const node = this._viewedNode;

                if (node.children.length === 0) {
                    // ── Leaf undo ──────────────────────────────────────────
                    // No confirmation needed for a single move.
                    // goBackOneMove already handles both the "parent is on the
                    // main line" and "parent is also off-branch" cases, and
                    // calls updateDisplay / updateButtonStates internally.
                    const _leafParent = node.parent;
                    this.goBackOneMove();
                    this.detachSubtree(node);
                    // After deletion, any surviving sibling still carries
                    // isBranch=true.  Promote the highest-priority one so the
                    // tree always has a clear main continuation at this position.
                    if (
                        _leafParent &&
                        _leafParent.children.length > 0 &&
                        _leafParent.children[0].isBranch
                    ) {
                        _leafParent.children[0].isBranch = false;
                    }
                    // Refresh so the deleted node disappears from the move list.
                    this.clearAllDrawings();
                    this.updateDisplay();
                    this.updateButtonStates();
                    this.highlightManager.updateAllIntelligent();
                } else {
                    // ── Non-leaf clip ──────────────────────────────────────
                    // Clip only the current-branch continuation — the main
                    // continuation child (_mainContinuationOf, i.e. the last
                    // non-branch child, oldest in prepend order) — so that
                    // any sibling sub-branches attached to this node survive.
                    // After the clip the first remaining child automatically
                    // becomes the new continuation (it already has isBranch=false
                    // within a variation).
                    const _cont =
                        this._mainContinuationOf(node) ?? node.children[0];
                    const totalToDelete = this.countSubtreeNodes(_cont);
                    if (totalToDelete > 9) {
                        const confirmed = confirm(
                            `Delete ${totalToDelete} moves?`,
                        );
                        if (!confirmed) return;
                    }
                    this.detachSubtree(_cont);
                    // Sibling branches carry isBranch=true. After removing the
                    // main continuation the highest-priority surviving child
                    // (children[0], most recently prepended) must be promoted to
                    // isBranch=false so it becomes the new continuation.
                    if (node.children.length > 0 && node.children[0].isBranch) {
                        node.children[0].isBranch = false;
                    }
                    // Stay at this node; refresh UI.
                    this.clearAllDrawings();
                    this.updateDisplay();
                    this.updateButtonStates();
                    this.highlightManager.updateAllIntelligent();
                }
                return;
            }

            // Check if we're in navigation mode (not at current position)
            if (this.isNavigating && this.currentNavigationIndex !== null) {
                // Calculate how many moves will be deleted
                const currentPosition = this.currentNavigationIndex;
                const totalMoves = this.moveHistory.length;
                let movesToDelete = 0;

                if (currentPosition === -1) {
                    // At start position, all moves will be deleted
                    movesToDelete = totalMoves;
                } else {
                    // At a historical position, delete all moves after this position
                    movesToDelete = totalMoves - (currentPosition + 1);
                }

                if (movesToDelete > 0) {
                    // Count the full subtree being removed (main-line nodes + all
                    // variation branches hanging off them) for the confirm prompt.
                    const targetLength =
                        currentPosition === -1 ? 0 : currentPosition + 1;
                    const firstRemoved = this.moveHistory[targetLength];
                    const totalToDelete = firstRemoved
                        ? this.countSubtreeNodes(firstRemoved)
                        : movesToDelete;

                    // Show confirmation prompt if more than 9 nodes will be deleted
                    if (totalToDelete > 9) {
                        const confirmed = confirm(
                            `Delete ${totalToDelete} moves?`,
                        );
                        if (!confirmed) {
                            console.log(
                                "Undo: User cancelled bulk move deletion",
                            );
                            return;
                        }
                    }

                    // Delete moves from the current navigation position to the end
                    const newMoveHistory = [...this.moveHistory];
                    const removedNodes = newMoveHistory.splice(targetLength);

                    // Detach only the main-line continuation (removedNodes[0]).
                    // Sibling variation branches hanging off the clip-point node
                    // are children of newMoveHistory's last element, not of
                    // removedNodes[0], so detachSubtree leaves them untouched.
                    if (removedNodes.length > 0) this.detachSubtree(removedNodes[0]);

                    // Promote the nearest surviving child of the clip-point node
                    // (if any) to become the new main line.  New moves are
                    // prepended (unshift), so children[0] is the most-recently
                    // added — that is also the "nearest" branch.
                    const _pivot =
                        newMoveHistory.length > 0
                            ? newMoveHistory[newMoveHistory.length - 1]
                            : this.moveTree;
                    let _promoteCur =
                        _pivot.children.length > 0
                            ? _pivot.children[0]
                            : null;
                    while (_promoteCur) {
                        _promoteCur.isBranch = false;
                        newMoveHistory.push(_promoteCur);
                        _promoteCur = this._mainContinuationOf(_promoteCur);
                    }

                    this.gameStateManager.updateGameState({
                        moveHistory: newMoveHistory,
                    });

                    console.log("Undo: Bulk deleted moves from navigation", {
                        deletedMoves: movesToDelete,
                        newHistoryLength: this.moveHistory.length,
                        fromPosition: currentPosition,
                    });

                    // If the promotion loop extended newMoveHistory past the
                    // clip point (a branch was promoted as the new main line),
                    // stay at the clip point so the user's view doesn't jump
                    // to the newly-promoted live end.
                    // Otherwise, the clip point IS the new live end — go there.
                    const _wasExtended = this.moveHistory.length > targetLength;
                    if (_wasExtended) {
                        const _clipIdx = targetLength - 1;
                        if (_clipIdx < 0) {
                            // Clipped from start position.
                            this.currentNavigationIndex = -1;
                            this.isNavigating = true;
                            this.currentNode = this.moveTree;
                            this._viewedNode = null;
                            if (this.startingSFEN) {
                                this.applySFENPosition(this.startingSFEN);
                                const _sp = this.startingSFEN.split(" ");
                                if (_sp.length >= 2) this.setCurrentPlayer(_sp[1]);
                            }
                        } else {
                            const _clipNode = this.moveHistory[_clipIdx];
                            this.currentNavigationIndex = _clipIdx;
                            this.isNavigating = true;
                            this.currentNode = _clipNode ?? null;
                            this._viewedNode = null;
                            if (_clipNode?.resultingSFEN) {
                                this.applySFENPosition(_clipNode.resultingSFEN);
                                const _sp = _clipNode.resultingSFEN.split(" ");
                                if (_sp.length >= 2) this.setCurrentPlayer(_sp[1]);
                            }
                        }
                    } else {
                        // No promotion — clip point is new live end.
                        this.currentNavigationIndex = null;
                        this.isNavigating = false;
                        this.currentNode = null;
                        this._viewedNode = null;
                    }

                    // Clear all drawings when undoing
                    this.clearAllDrawings();

                    // Update display to reflect the new state
                    this.updateDisplay();

                    // Update button states so undo symbol reflects post-trim state
                    this.updateButtonStates();

                    // Update highlights (including moveable pieces) after bulk undo
                    this.highlightManager.updateAllIntelligent();
                    return;
                }
            }

            // Standard single move undo behavior (when at current position or no moves to delete)

            // Get the last move before removing it
            const lastMove = this.moveHistory[this.moveHistory.length - 1];

            // Navigate to the position BEFORE removing the move from history
            // This ensures the navigation can access the correct SFEN
            if (this.moveHistory.length > 1) {
                // Navigate to the previous move's resulting position
                this.navigateToPosition(this.moveHistory.length - 2);
            } else {
                // Navigate to starting position
                this.navigateToPosition("start");
            }

            // Pop the move from history.
            //   • lastMove.isBranch === false  →  it was the main continuation;
            //     delete it from the tree entirely, then promote the highest-priority
            //     remaining child (if any, if still tagged isBranch=true) to be the
            //     new main continuation.
            //   • lastMove.isBranch === true   →  it was a variation the user played
            //     into a position that already had a continuation.  Leave it in the
            //     tree; the original main continuation (isBranch=false) is still
            //     there and needs no further action.
            const newMoveHistory = [...this.moveHistory];
            newMoveHistory.pop();
            if (lastMove) {
                const _pivot =
                    newMoveHistory.length > 0
                        ? newMoveHistory[newMoveHistory.length - 1]
                        : this.moveTree;
                if (!lastMove.isBranch) {
                    this.detachSubtree(lastMove);
                    if (_pivot.children.length > 0 && _pivot.children[0].isBranch) {
                        _pivot.children[0].isBranch = false;
                    }
                }
                // else: was a variation — leave it; isBranch=false sibling stays put.
            }

            this.gameStateManager.updateGameState({
                moveHistory: newMoveHistory,
            });

            console.log("Undo: Removed move from history", {
                undoneMove: lastMove.notation,
                newHistoryLength: this.moveHistory.length,
            });

            // Reset navigation state so moves can be made immediately after undo
            // The user should be at the current position after undo, not in navigation mode
            this.currentNavigationIndex = null;
            this.isNavigating = false;
            this.currentNode = null;

            console.log("Undo: Reset navigation state - moves now allowed");

            // Clear all drawings when undoing
            this.clearAllDrawings();

            // Update display to reflect the new state
            this.updateDisplay();

            // Update button states so undo symbol reflects post-undo position
            this.updateButtonStates();

            // Update highlights (including moveable pieces) after undo
            this.highlightManager.updateAllIntelligent();
        }

        undoPuzzleMove() {
            console.log("Puzzle: Executing puzzle undo");

            // Clear selections first using centralized state management
            this.gameStateManager.updateGameState({
                selectedSquare: null,
                validMoves: [],
                editMode: {
                    ...this.editMode,
                    selectedPiece: null,
                    counterStrikeSelection: false,
                },
            });

            // Handle game-trimming functionality for non-current positions (same as regular undo)
            if (this.isNavigating && this.currentNavigationIndex !== null) {
                const positionPlayer = this.getPlayerAtPosition(
                    this.currentNavigationIndex,
                );

                // Block undo when opponent is to move and not at current position
                if (positionPlayer === this.puzzleOpponent) {
                    console.log(
                        "Puzzle: Undo blocked - opponent to move in non-current position",
                    );
                    return;
                }

                // Calculate how many moves will be deleted (game-trimming functionality)
                const currentPosition = this.currentNavigationIndex;
                const totalMoves = this.moveHistory.length;
                let movesToDelete = 0;

                if (currentPosition === -1) {
                    // At start position, all moves will be deleted
                    movesToDelete = totalMoves;
                } else {
                    // At a historical position, delete all moves after this position
                    movesToDelete = totalMoves - (currentPosition + 1);
                }

                if (movesToDelete > 0) {
                    // Show confirmation prompt if more than 9 moves will be deleted
                    if (movesToDelete > 9) {
                        const confirmed = confirm(
                            `Delete ${movesToDelete} moves?`,
                        );
                        if (!confirmed) {
                            console.log(
                                "Puzzle: User cancelled bulk move deletion",
                            );
                            return;
                        }
                    }

                    // Delete moves from the current navigation position to the end
                    const newMoveHistory = [...this.moveHistory];
                    const targetLength =
                        currentPosition === -1 ? 0 : currentPosition + 1;
                    const removedNodes = newMoveHistory.splice(targetLength);

                    // Detach all removed nodes (and their branches) from the tree.
                    if (removedNodes.length > 0) this.detachSubtree(removedNodes[0]);

                    this.gameStateManager.updateGameState({
                        moveHistory: newMoveHistory,
                    });

                    console.log("Puzzle: Bulk deleted moves from navigation", {
                        deletedMoves: movesToDelete,
                        newHistoryLength: this.moveHistory.length,
                        fromPosition: currentPosition,
                    });

                    // Reset navigation state - stay at the current displayed position
                    this.currentNavigationIndex = null;
                    this.isNavigating = false;
                    this.currentNode = null;

                    // Clear all drawings when undoing
                    this.clearAllDrawings();

                    // Update display to reflect the new state
                    this.updateDisplay();

                    // Update button states so undo symbol reflects post-trim state
                    this.updateButtonStates();

                    // Update highlights (including moveable pieces) after puzzle bulk undo
                    this.highlightManager.updateAllIntelligent();
                    return;
                }
            }

            // Check if we have moves to undo
            if (this.moveHistory.length === 0) {
                // No moves to undo, but if we had edit changes, clear them
                if (this.editMode.preEditPosition) {
                    this.applySFENPosition(this.editMode.preEditPosition);
                    this.gameStateManager.updateGameState({
                        editMode: {
                            ...this.editMode,
                            preEditPosition: null,
                        },
                    });
                    this.updateDisplay();
                }
                return;
            }

            // Check if final move of solution is even-numbered (opponent's move)
            // Puzzle solution moves are 1-indexed: move 1 (solver), move 2 (opponent), etc.
            const solutionHasEvenFinalMove =
                this.puzzleSolution.length % 2 === 0;
            const isFullySolved =
                this.moveHistory.length === this.puzzleSolution.length;
            const isAtCurrentPosition =
                !this.isNavigating || this.currentNavigationIndex === null;

            if (
                isFullySolved &&
                isAtCurrentPosition &&
                solutionHasEvenFinalMove
            ) {
                // At end of fully solved puzzle with even final move - undo two moves at once
                console.log(
                    "Puzzle: Undoing two moves at end of solved puzzle (even final move)",
                );
                this.standardUndo(); // Undo opponent's final move
                if (this.moveHistory.length > 0) {
                    this.standardUndo(); // Undo solver's previous move
                }
            } else if (isFullySolved && isAtCurrentPosition) {
                // At end of fully solved puzzle with odd final move - undo one move only
                console.log(
                    "Puzzle: Undoing one move at end of solved puzzle (odd final move)",
                );
                return this.standardUndo();
            } else {
                // Normal puzzle undo - undo two moves at a time (solver + opponent)
                console.log("Puzzle: Undoing two moves (solver + opponent)");
                this.standardUndo(); // Undo first move
                if (this.moveHistory.length > 0) {
                    this.standardUndo(); // Undo second move
                }
            }
        }

        standardUndo() {
            // Standard single move undo logic (extracted from main undo method)
            this.gameStateManager.updateGameState({
                selectedSquare: null,
                validMoves: [],
                editMode: {
                    ...this.editMode,
                    selectedPiece: null,
                    counterStrikeSelection: false,
                },
            });

            if (this.moveHistory.length === 0) {
                if (this.editMode.preEditPosition) {
                    this.applySFENPosition(this.editMode.preEditPosition);
                    this.gameStateManager.updateGameState({
                        editMode: {
                            ...this.editMode,
                            preEditPosition: null,
                        },
                    });
                    this.updateDisplay();
                }
                return;
            }

            if (this.editMode.preEditPosition) {
                this.applySFENPosition(this.editMode.preEditPosition);
                this.gameStateManager.updateGameState({
                    editMode: {
                        ...this.editMode,
                        preEditPosition: null,
                    },
                });
            }

            const lastMove = this.moveHistory[this.moveHistory.length - 1];

            if (this.moveHistory.length > 1) {
                this.navigateToPosition(this.moveHistory.length - 2);
            } else {
                this.navigateToPosition("start");
            }

            const newMoveHistory = [...this.moveHistory];
            newMoveHistory.pop();

            // lastMove.isBranch === false → was main continuation; delete it and
            // promote the highest-priority remaining sibling if needed.
            // lastMove.isBranch === true  → was a user-played variation; leave it.
            if (lastMove) {
                const _pivot =
                    newMoveHistory.length > 0
                        ? newMoveHistory[newMoveHistory.length - 1]
                        : this.moveTree;
                if (!lastMove.isBranch) {
                    this.detachSubtree(lastMove);
                    if (_pivot.children.length > 0 && _pivot.children[0].isBranch) {
                        _pivot.children[0].isBranch = false;
                    }
                }
            }

            this.gameStateManager.updateGameState({
                moveHistory: newMoveHistory,
            });

            console.log("Undo: Removed move from history", {
                undoneMove: lastMove.notation,
                newHistoryLength: this.moveHistory.length,
            });

            this.currentNavigationIndex = null;
            this.isNavigating = false;
            this.currentNode = null;
            this.clearAllDrawings();
            this.updateDisplay();

            // Update button states so undo symbol reflects post-undo position
            this.updateButtonStates();

            // Update highlights (including moveable pieces) after standard undo
            this.highlightManager.updateAllIntelligent();
        }

        getPlayerAtPosition(moveIndex) {
            // Calculate which player's turn it is at a given move index
            // moveIndex -1 = start position (puzzleSolver's turn)
            // moveIndex 0 = after solver's first move (opponent's turn)
            // moveIndex 1 = after opponent's first move (solver's turn)
            // etc.

            if (moveIndex === -1) {
                return this.puzzleSolver;
            }

            // Even indices (0, 2, 4...) = opponent's turn
            // Odd indices (1, 3, 5...) = solver's turn
            return moveIndex % 2 === 0
                ? this.puzzleOpponent
                : this.puzzleSolver;
        }

        parseUSIMove(moveNotation) {
            // Parse USI move notation like "7g7f", "P*3c", "7i6h+"
            console.log("Parsing USI move:", moveNotation);

            if (moveNotation.includes("*")) {
                // Drop move (e.g., "P*3c")
                const parts = moveNotation.split("*");
                if (parts.length !== 2) return null;

                const pieceType = parts[0];
                const toSquare = parts[1];

                return {
                    type: "drop",
                    pieceType: pieceType,
                    to: toSquare,
                    promoted: false,
                };
            } else {
                // Regular move (e.g., "7g7f" or "7i6h+")
                const promoted = moveNotation.endsWith("+");
                const cleanMove = promoted
                    ? moveNotation.slice(0, -1)
                    : moveNotation;

                if (cleanMove.length !== 4) return null;

                const fromSquare = cleanMove.substring(0, 2);
                const toSquare = cleanMove.substring(2, 4);

                return {
                    type: "move",
                    from: fromSquare,
                    to: toSquare,
                    promoted: promoted,
                };
            }
        }

        executeParsedMove(parsedMove) {
            // Execute a parsed move
            console.log("Executing parsed move:", parsedMove);

            if (parsedMove.type === "drop") {
                // Handle piece drops
                console.log(
                    "Executing drop move:",
                    parsedMove.pieceType,
                    "to",
                    parsedMove.to,
                );
                // For now, basic implementation - this would need full drop logic
                return false; // Drops not fully implemented yet
            } else if (parsedMove.type === "move") {
                // Handle regular moves
                const fromSquareId = parsedMove.from;
                const toSquareId = parsedMove.to;

                // Parse square coordinates
                const [fromRank, fromFile] = this.parseSquareId(fromSquareId);
                const [toRank, toFile] = this.parseSquareId(toSquareId);

                if (fromRank === -1 || toRank === -1) {
                    console.error(
                        "Invalid square coordinates:",
                        fromSquareId,
                        toSquareId,
                    );
                    return false;
                }

                // Get the piece at the from square
                const piece = this.board[fromRank][fromFile];
                if (!piece) {
                    console.error("No piece found at", fromSquareId);
                    return false;
                }

                // Execute the move using existing move execution system
                const moveData = {
                    from: fromSquareId,
                    to: toSquareId,
                    piece: piece,
                    captured: this.board[toRank][toFile] || null,
                    promoted: parsedMove.promoted,
                };

                return this.moveExecutor.executeMove(moveData);
            }

            return false;
        }

        // Centralized navigation function - handles all position loading scenarios
        navigateToPosition(target) {
            // Returning to main-line navigation clears any off-branch view.
            this._viewedNode = null;

            // Clear any selections and highlights
            this.clearSelection();
            this.clearHighlights();

            // Clear any passively inspected piece - the piece info tab should
            // reset when the displayed position changes, not keep showing
            // whatever piece used to be at that square.
            this.inspectedSquare = null;
            this.updatePieceInfoPanel();

            // Clear any prompt states that might interfere
            this.promotionPromptActive = false;
            this.lionReturnPromptActive = false;

            // Clear all drawings when navigating
            this.clearAllDrawings();

            let targetSFEN = null;
            let targetIndex = null;
            let logMessage = "";

            // Determine target position
            if (target === "start" || target === -1) {
                // Navigate to starting position
                targetSFEN = this.startingSFEN;
                targetIndex = -1;
                logMessage = "Navigation: Loading start position";
            } else if (target === "current" || target === null) {
                // Navigate to current position (after all moves)
                if (this.moveHistory.length > 0) {
                    const lastMove =
                        this.moveHistory[this.moveHistory.length - 1];
                    targetSFEN = lastMove.resultingSFEN;
                    targetIndex = this.moveHistory.length - 1;
                    logMessage = `Navigation: Loading current position with last move: ${lastMove.notation}`;
                } else {
                    // No moves played, go to start position
                    targetSFEN = this.startingSFEN;
                    targetIndex = -1;
                    logMessage =
                        "Navigation: Loading current position (no moves)";
                }
            } else if (typeof target === "number") {
                // Navigate to position after specific move
                if (target < 0 || target >= this.moveHistory.length) {
                    console.warn(`Invalid move index: ${target}`);
                    return;
                }

                const targetMove = this.moveHistory[target];
                if (targetMove && targetMove.resultingSFEN) {
                    targetSFEN = targetMove.resultingSFEN;
                    targetIndex = target;
                    logMessage = `Navigation: Loading position after move ${target + 1}: ${targetMove.notation}`;
                } else {
                    console.warn(`Move ${target} missing resultingSFEN`);
                    return;
                }
            } else {
                console.warn(`Invalid navigation target: ${target}`);
                return;
            }

            // Determine if this resolves to the live position
            const livePositionIndex =
                this.moveHistory.length > 0 ? this.moveHistory.length - 1 : -1;
            const resolvesToLivePosition =
                target === "current" ||
                target === null ||
                (typeof target === "number" && target === livePositionIndex) ||
                // Special case: navigating to start when no moves have been played
                ((target === "start" || target === -1) &&
                    this.moveHistory.length === 0);

            // Clear puzzle pause state only when navigating away from live position
            if (
                this.config.appletMode === "puzzle" &&
                this.puzzleWaitingForAdvance &&
                !resolvesToLivePosition
            ) {
                console.log(
                    "Puzzle: Clearing pause state due to navigation away from current position",
                );
                this.puzzleWaitingForAdvance = false;
            }

            if (targetSFEN) {
                console.log(logMessage, "SFEN:", targetSFEN);

                // Set navigation state - use null index when at live position
                const navIndex = resolvesToLivePosition ? null : targetIndex;
                const isNav = !resolvesToLivePosition;

                // Set navigation state BEFORE applying position using centralized management
                this.gameStateManager.updateGameState({
                    currentNavigationIndex: navIndex,
                    isNavigating: isNav,
                });

                // Keep currentNode in sync so makeMove branches from the right node.
                // At the live position currentNode stays null (getLiveNode() handles it).
                // At the start sentinel use moveTree; otherwise use the move-history node.
                if (resolvesToLivePosition) {
                    this.currentNode = null;
                } else if (target === "start" || target === -1) {
                    this.currentNode = this.moveTree;
                } else {
                    this.currentNode = this.moveHistory[targetIndex] ?? null;
                }

                // Load the SFEN position
                this.applySFENPosition(targetSFEN);

                // Ensure current player display matches the position being viewed
                // Extract the correct player from the SFEN we just loaded
                const sfenParts = targetSFEN.split(" ");
                if (sfenParts.length >= 2) {
                    console.log(
                        `Navigation Debug: Setting player from SFEN to: ${sfenParts[1]}`,
                    );
                    this.setCurrentPlayer(sfenParts[1]);
                }

                // Update display and highlighting after navigation state is set
                this.updateDisplay();
                this.updateMoveHistoryHighlight();

                // Force update square highlights to reflect the new navigation state
                this.updateSquareHighlights();

                // Update button states to reflect the new navigation state
                this.updateButtonStates();
            }
        }

        // Navigate to any node in the move tree, including off-branch variation
        // nodes.  moveHistory is intentionally left unchanged so the rendered
        // tree order stays stable.  The clicked node is stored in _viewedNode
        // so updateMoveHistoryHighlight can locate and highlight it.
        navigateToNode(node) {
            this.clearSelection();
            this.clearHighlights();
            this.inspectedSquare = null;
            this.updatePieceInfoPanel();
            this.promotionPromptActive = false;
            this.lionReturnPromptActive = false;
            this.clearAllDrawings();

            // Track which off-branch node is being viewed (for highlighting).
            // Do NOT touch moveHistory — the tree render order must stay the same.
            this._viewedNode = node;

            // Mark as navigating without using the integer index (which is
            // meaningless for off-branch nodes).  Set currentNode so that any
            // move played from here branches off this node.
            this.isNavigating = true;
            this.currentNode = node;
            // Leave currentNavigationIndex unchanged so goBack/goForward still
            // walk the main line correctly.

            // Apply board state
            const targetSFEN = node.resultingSFEN;
            if (targetSFEN) {
                this.applySFENPosition(targetSFEN);
                const sfenParts = targetSFEN.split(" ");
                if (sfenParts.length >= 2) {
                    this.setCurrentPlayer(sfenParts[1]);
                }
            }

            this.updateDisplay();
            this.updateMoveHistoryHighlight();
            this.updateSquareHighlights();
            this.updateButtonStates();
        }

        getNavigationDisplayMove() {
            // When viewing an off-branch variation node, highlight that node's move.
            if (this._viewedNode && this.isNavigating) {
                return this._viewedNode;
            }
            // Return the move that should be highlighted based on current navigation state
            if (this.currentNavigationIndex === -1) {
                // At starting position, no move to highlight
                return null;
            } else if (
                this.currentNavigationIndex === null &&
                this.moveHistory.length > 0
            ) {
                // At current position (normal gameplay), show the last move from history
                return this.moveHistory[this.moveHistory.length - 1];
            } else if (
                this.currentNavigationIndex >= 0 &&
                this.currentNavigationIndex < this.moveHistory.length
            ) {
                // Show the move that led to this position
                return this.moveHistory[this.currentNavigationIndex];
            }
            return null;
        }

        getNavigationDisplaySFEN() {
            // When viewing an off-branch variation node, use that node's SFEN.
            if (this._viewedNode && this.isNavigating) {
                return this._viewedNode.resultingSFEN || this.exportSFEN();
            }
            // Return the SFEN that represents the currently displayed position
            if (this.currentNavigationIndex === -1) {
                // At starting position
                return this.startingSFEN;
            } else if (
                this.currentNavigationIndex >= 0 &&
                this.currentNavigationIndex < this.moveHistory.length
            ) {
                // At a specific move position - use the stored SFEN from that move
                const move = this.moveHistory[this.currentNavigationIndex];
                return move && move.resultingSFEN
                    ? move.resultingSFEN
                    : this.exportSFEN();
            } else {
                // At current position or not navigating
                return this.exportSFEN();
            }
        }

        getNavigationDisplayComment() {
            // Return the comment for the currently displayed position
            let comment = "";

            // When viewing an off-branch variation node, use that node's comment.
            if (this._viewedNode && this.isNavigating) {
                comment = this._viewedNode.comment || "";
            } else if (this.currentNavigationIndex === -1) {
                // At starting position
                comment = this.startingComment;
            } else if (
                this.currentNavigationIndex !== null &&
                this.currentNavigationIndex >= 0 &&
                this.currentNavigationIndex < this.moveHistory.length
            ) {
                // At a specific move position - use the stored comment from that move
                const move = this.moveHistory[this.currentNavigationIndex];
                comment = move && move.comment ? move.comment : "";
            } else if (this.moveHistory.length > 0) {
                // At current position (null navigation index) - show last move's comment
                const lastMove = this.moveHistory[this.moveHistory.length - 1];
                comment = lastMove && lastMove.comment ? lastMove.comment : "";
            } else {
                // No moves yet, show starting comment
                comment = this.startingComment;
            }

            // Add instruction prefix when in puzzle pause state
            if (
                this.config.appletMode === "puzzle" &&
                this.puzzleWaitingForAdvance &&
                comment
            ) {
                return "(Press > or \u2192 key to proceed)\n" + comment;
            }

            return comment;
        }

        updateMoveHistoryHighlight() {
            // Clear all move highlighting
            const moveItems = this.container.querySelectorAll(
                ".chushogi-move-item, .chushogi-move-item-inline",
            );
            moveItems.forEach((item) => {
                item.classList.remove("selected", "current");
            });

            // Off-branch variation node being viewed via navigateToNode.
            // Leaf nodes (end of branch, moves allowed) show as "current";
            // non-leaf nodes (mid-branch, read-only) show as "selected".
            if (this._viewedNode && this.isNavigating) {
                const isLeaf = this._viewedNode.children.length === 0;
                const el = this.container.querySelector(
                    `[data-node-id="${this._viewedNode.id}"]`,
                );
                if (el) {
                    el.classList.add(isLeaf ? "current" : "selected");
                    this._scrollMoveIntoView(el);
                }
                return;
            }

            // Determine whether the viewed position is the live (most-recent) one
            const isAtCurrentPosition =
                !this.isNavigating &&
                (this.currentNavigationIndex === null ||
                    this.currentNavigationIndex ===
                        this.moveHistory.length - 1);

            if (this.currentNavigationIndex === -1) {
                // At starting position
                const startItem = this.container.querySelector(
                    '[data-move="start"]',
                );
                if (startItem) {
                    startItem.classList.add(
                        isAtCurrentPosition ? "current" : "selected",
                    );
                }
                return;
            }

            // Resolve the node that should be highlighted
            let targetNode = null;
            if (
                this.currentNavigationIndex !== null &&
                this.currentNavigationIndex >= 0 &&
                this.currentNavigationIndex < this.moveHistory.length
            ) {
                targetNode = this.moveHistory[this.currentNavigationIndex];
            } else if (
                this.currentNavigationIndex === null &&
                this.moveHistory.length > 0
            ) {
                // At live position — highlight the last move
                targetNode =
                    this.moveHistory[this.moveHistory.length - 1];
            }

            if (targetNode) {
                const el = this.container.querySelector(
                    `[data-node-id="${targetNode.id}"]`,
                );
                if (el) {
                    el.classList.add(
                        isAtCurrentPosition ? "current" : "selected",
                    );
                    this._scrollMoveIntoView(el);
                }
            } else if (this.moveHistory.length === 0) {
                // No moves yet — highlight starting position
                const startItem = this.container.querySelector(
                    '[data-move="start"]',
                );
                if (startItem) startItem.classList.add("current");
            }
        }

        // Scroll a move-list item into view within its own scrollable container
        // only — never scrolls the page.
        _scrollMoveIntoView(el) {
            const scroller = el.closest(".chushogi-move-list");
            if (!scroller) return;
            const sr = scroller.getBoundingClientRect();
            const er = el.getBoundingClientRect();
            if (er.top < sr.top) {
                scroller.scrollTop -= sr.top - er.top + 4;
            } else if (er.bottom > sr.bottom) {
                scroller.scrollTop += er.bottom - sr.bottom + 4;
            }
        }

        // Legacy functions - redirect to centralized navigation
        loadMovePosition(moveIndex) {
            this.navigateToPosition(moveIndex);
        }

        goToMove(moveIndex) {
            this.navigateToPosition(moveIndex);
        }

        saveGame() {
            const gameData = {
                sfen: this.exportSFEN(),
                moves: this.moveHistory,
                config: this.config,
            };

            const blob = new Blob([JSON.stringify(gameData, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "chushogi-game.json";
            a.click();
            URL.revokeObjectURL(url);
        }

        importGameFromInput() {
            // Block import in viewOnly mode
            if (this.config.appletMode === "viewOnly") {
                console.log("Game import blocked in viewOnly mode");
                return;
            }

            const input = this.container.querySelector("[data-game-import]");
            if (!input || !input.value.trim()) {
                return;
            }

            // Show confirmation prompt before importing
            if (
                !confirm("This will overwrite the current game. Are you sure?")
            ) {
                return;
            }

            this.importGame(input.value.trim());
            input.value = "";
            this.updateButtonStates();
        }

        // Parse game string with comments (PGN-style {comment} format)
        // Handles escaped characters: \\ \}
        parseGameStringWithComments(gameString) {
            const result = {
                tokens: [], // Array of {type: 'text'|'comment', value: string}
                error: null,
            };

            let currentPos = 0;
            const len = gameString.length;

            while (currentPos < len) {
                // Look for opening curly bracket (no escaping needed for {)
                const openBracket = gameString.indexOf("{", currentPos);

                if (openBracket === -1) {
                    // No more comments, add remaining text
                    const remaining = gameString.substring(currentPos).trim();
                    if (remaining) {
                        result.tokens.push({ type: "text", value: remaining });
                    }
                    break;
                }

                // Add text before comment
                const textBefore = gameString
                    .substring(currentPos, openBracket)
                    .trim();
                if (textBefore) {
                    result.tokens.push({ type: "text", value: textBefore });
                }

                // Find unescaped closing bracket
                let closeBracket = -1;
                for (let i = openBracket + 1; i < len; i++) {
                    if (gameString[i] === "}") {
                        // Check if it's escaped (preceded by odd number of backslashes)
                        let backslashCount = 0;
                        let j = i - 1;
                        while (j >= 0 && gameString[j] === "\\") {
                            backslashCount++;
                            j--;
                        }
                        if (backslashCount % 2 === 0) {
                            // Even number of backslashes (or none), so } is not escaped
                            closeBracket = i;
                            break;
                        }
                    }
                }

                if (closeBracket === -1) {
                    result.error =
                        "Unclosed comment: missing closing bracket }";
                    return result;
                }

                // Extract comment (without brackets) and unescape it
                const rawComment = gameString.substring(
                    openBracket + 1,
                    closeBracket,
                );
                const unescapedComment = this.unescapeComment(rawComment);
                result.tokens.push({
                    type: "comment",
                    value: unescapedComment,
                });

                // Check for invalid text immediately after closing bracket
                currentPos = closeBracket + 1;

                // Skip whitespace after }
                while (currentPos < len && gameString[currentPos] === " ") {
                    currentPos++;
                }

                // If not at end and next char is not { or space, check if there's invalid text
                if (currentPos < len && gameString[currentPos] !== "{") {
                    // Find the next space, { or end to get the next token
                    let tokenEnd = currentPos;
                    while (
                        tokenEnd < len &&
                        gameString[tokenEnd] !== " " &&
                        gameString[tokenEnd] !== "{"
                    ) {
                        tokenEnd++;
                    }

                    const nextToken = gameString.substring(
                        currentPos,
                        tokenEnd,
                    );

                    // Validate that this token looks like valid input (SFEN part or move)
                    // Valid patterns:
                    // - SFEN position (contains / and letters): e.g., "lfcsgekgscfl/..."
                    // - Player: "b" or "w"
                    // - Lion capture: "-" or a square like "5f"
                    // - Turn number: digits
                    // - Move: pattern like "5a6b" or "5a6b+" or "5a6b7c" (double move)
                    const validTokenPattern =
                        /^(\d+[a-l]\d+[a-l](\d+[a-l])?\+?|[a-z\/]+|[bw]|-|\d+)$/;

                    if (!validTokenPattern.test(nextToken)) {
                        result.error = `Invalid text after comment: "${nextToken}"`;
                        return result;
                    }
                }
            }

            return result;
        }

        // Extract text parts and comment map from parsed tokens
        // Helper for unified game loading
        extractTextAndComments(tokens) {
            const textParts = [];
            let partIndex = 0;
            const commentMap = new Map();

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];

                if (token.type === "text") {
                    // Split this text into individual parts (space-separated)
                    const parts = token.value.trim().split(/\s+/);

                    for (const part of parts) {
                        if (part) {
                            textParts.push(part);
                            partIndex++;
                        }
                    }
                } else if (token.type === "comment") {
                    // This comment belongs to the most recent text part
                    // If there are no text parts yet, it's a starting comment
                    const targetIndex = partIndex > 0 ? partIndex - 1 : -1;
                    commentMap.set(targetIndex, token.value);
                }
            }

            const commentOnly = textParts.length === 0 && commentMap.size > 0;
            return { textParts, commentMap, commentOnly };
        }

        // ── CSL TOKENIZER (variation-aware) ──────────────────────────────────────

        // Tokenize a CSL game string into a flat list recognising:
        //   { type:'word',    value }  – a non-whitespace, non-bracket token
        //   { type:'comment', value }  – content of a { … } block (unescaped)
        //   { type:'open'  }           – a bare '('
        //   { type:'close' }           – a bare ')'
        //
        // Returns { items } on success or { error } on malformed input.
        tokenizeCSLFull(gameString) {
            const items = [];
            let i = 0;
            const len = gameString.length;

            while (i < len) {
                const ch = gameString[i];

                // Skip whitespace
                if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
                    i++;
                    continue;
                }

                if (ch === "{") {
                    // Find the unescaped closing }
                    let j = i + 1;
                    let closed = false;
                    while (j < len) {
                        if (gameString[j] === "}") {
                            let backslashes = 0;
                            let k = j - 1;
                            while (k > i && gameString[k] === "\\") {
                                backslashes++;
                                k--;
                            }
                            if (backslashes % 2 === 0) {
                                closed = true;
                                break;
                            }
                        }
                        j++;
                    }
                    if (!closed) {
                        return {
                            error: "Unclosed comment: missing closing bracket }",
                        };
                    }
                    items.push({
                        type: "comment",
                        value: this.unescapeComment(
                            gameString.substring(i + 1, j),
                        ),
                    });
                    i = j + 1;
                } else if (ch === "(") {
                    items.push({ type: "open" });
                    i++;
                } else if (ch === ")") {
                    items.push({ type: "close" });
                    i++;
                } else {
                    // Word: read until whitespace or structural character
                    let j = i;
                    while (
                        j < len &&
                        gameString[j] !== " " &&
                        gameString[j] !== "\t" &&
                        gameString[j] !== "\n" &&
                        gameString[j] !== "\r" &&
                        gameString[j] !== "{" &&
                        gameString[j] !== "(" &&
                        gameString[j] !== ")"
                    ) {
                        j++;
                    }
                    if (j > i) {
                        items.push({
                            type: "word",
                            value: gameString.substring(i, j),
                        });
                    }
                    i = j;
                }
            }

            return { items };
        }

        // Recursively parse one nesting level of CSL tokens.
        // If inVariation=true, parsing stops on the first 'close' token
        // (which is consumed).  Returns { moves, preComment, endIdx, error }.
        // Each move: { usi, comment, variations: [[move, …], …] }.
        _parseCSLLevel(items, startIdx, inVariation) {
            const moves = [];
            let preComment = ""; // comment that appears before any word token
            let i = startIdx;

            while (i < items.length) {
                const item = items[i];

                if (item.type === "close") {
                    if (inVariation) {
                        i++; // consume ')'
                        break;
                    }
                    // Stray ')' at top level – ignore
                    console.warn("CSL parser: unexpected ) at top level");
                    i++;
                    continue;
                }

                if (item.type === "open") {
                    i++; // consume '('
                    const sub = this._parseCSLLevel(items, i, true);
                    if (sub.error) return sub;
                    i = sub.endIdx;
                    // Attach sub-variation to the last move seen at this level
                    if (moves.length > 0) {
                        moves[moves.length - 1].variations.push(sub.moves);
                    }
                    continue;
                }

                if (item.type === "comment") {
                    i++;
                    if (moves.length > 0) {
                        // Last comment for a word wins (matches PGN style)
                        moves[moves.length - 1].comment = item.value;
                    } else {
                        preComment = item.value; // starting comment
                    }
                    continue;
                }

                // item.type === 'word'
                moves.push({ usi: item.value, comment: "", variations: [] });
                i++;
            }

            return { moves, preComment, endIdx: i };
        }

        // Parse a CSL game string with full variation support.
        // Returns { sfen, startingComment, moves, commentOnly, hasNoData } or { error }.
        // Each move: { usi, comment, variations: [[move,…],…] }
        parseCSLWithVariations(gameString) {
            const tokenResult = this.tokenizeCSLFull(gameString.trim());
            if (tokenResult.error) return tokenResult; // { error }

            const parseResult = this._parseCSLLevel(
                tokenResult.items,
                0,
                false,
            );
            if (parseResult.error) return parseResult;

            const allItems = parseResult.moves; // all word-level items (SFEN parts + moves)
            const preComment = parseResult.preComment;

            // Reconstruct word list and commentMap for parseSfenFromParts
            const words = allItems.map((item) => item.usi);
            const commentMap = new Map();
            if (preComment) commentMap.set(-1, preComment);
            allItems.forEach((item, idx) => {
                if (item.comment) commentMap.set(idx, item.comment);
            });

            const parsed = this.parseSfenFromParts(words, commentMap);
            const sfenParts = parsed.sfenParts; // 0 / 3 / 4

            // Slice off the SFEN word-items; the rest are the moves
            const movesData = allItems.slice(sfenParts).map((item, relIdx) => ({
                usi: item.usi,
                comment: item.comment || parsed.moveComments[relIdx] || "",
                variations: item.variations,
            }));

            const commentOnly =
                words.length === 0 && (!!preComment || commentMap.size > 0);
            const hasNoData = words.length === 0 && !commentOnly;

            return {
                sfen: parsed.sfen,
                startingComment: parsed.startingComment,
                moves: movesData,
                commentOnly,
                hasNoData,
            };
        }

        // Parse SFEN and moves from text parts with simplified logic:
        // If first field is a position (not a move), always use first 4 fields as SFEN
        parseSfenFromParts(parts, commentMap = new Map()) {
            const defaultSFEN =
                "lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b - 1";

            // Handle empty input
            if (parts.length === 0) {
                const startingComment = commentMap.get(-1) || "";
                return {
                    sfen: this.startingSFEN || defaultSFEN,
                    moves: [],
                    startingComment,
                    moveComments: [],
                    sfenParts: 0,
                };
            }

            // Check if first field looks like a position (contains "/" and letters)
            const firstPart = parts[0];
            const looksLikeSFEN =
                firstPart.includes("/") && /[a-zA-Z]/.test(firstPart);

            if (looksLikeSFEN && parts.length >= 4) {
                // Check if 4th field is a valid turn number (just digits, possibly with +/- sign)
                const fourthField = parts[3];
                const isTurnNumber = /^[+-]?\d+$/.test(fourthField);

                if (isTurnNumber) {
                    // 4-field SFEN: position, player, lionCapture, turnNumber
                    const position = parts[0];
                    const player = parts[1];
                    const lionCapture = parts[2];
                    const turnNumberField = parts[3];

                    // Parse turn number (normalize to positive integer)
                    const parsedNumber = parseInt(turnNumberField, 10);
                    const turnNumber = Math.abs(Math.trunc(parsedNumber));

                    // Construct SFEN with normalized turn number
                    const sfen = `${position} ${player} ${lionCapture} ${turnNumber}`;

                    // All fields after the 4th are moves
                    const moves = parts.slice(4);
                    const sfenParts = 4;

                    // Extract starting comment (after last SFEN part or before any parts)
                    const startingComment =
                        commentMap.get(sfenParts - 1) ||
                        commentMap.get(-1) ||
                        "";

                    // Extract move comments
                    const moveComments = moves.map((move, index) => {
                        const partIndex = sfenParts + index;
                        return commentMap.get(partIndex) || "";
                    });

                    console.log(
                        `parseSfenFromParts: Parsed 4-field SFEN="${sfen}", move count=${moves.length}, starting comment="${startingComment}"`,
                    );

                    return {
                        sfen,
                        moves,
                        startingComment,
                        moveComments,
                        sfenParts,
                    };
                } else {
                    // 4th field is not a turn number - treat as 3-field SFEN followed by move/comment
                    // Fall through to 3-field case
                }
            }

            if (looksLikeSFEN && parts.length >= 3) {
                // SFEN with only 3 fields - add default turn number
                const position = parts[0];
                const player = parts[1];
                const lionCapture = parts[2];
                const sfen = `${position} ${player} ${lionCapture} 1`;
                const moves = parts.slice(3);
                const sfenParts = 3;

                const startingComment =
                    commentMap.get(sfenParts - 1) || commentMap.get(-1) || "";
                const moveComments = moves.map((move, index) => {
                    return commentMap.get(sfenParts + index) || "";
                });

                console.log(
                    `parseSfenFromParts: Parsed 3-field SFEN="${sfen}", move count=${moves.length}`,
                );

                return {
                    sfen,
                    moves,
                    startingComment,
                    moveComments,
                    sfenParts,
                };
            } else {
                // Moves-only format: use current game's starting position
                console.log(
                    "parseSfenFromParts: Detected moves-only format, using current game's starting position",
                );
                const sfen = this.startingSFEN || defaultSFEN;
                const moves = parts; // All parts are moves

                const startingComment = commentMap.get(-1) || "";
                const moveComments = moves.map((move, index) => {
                    return commentMap.get(index) || "";
                });

                return {
                    sfen,
                    moves,
                    startingComment,
                    moveComments,
                    sfenParts: 0,
                };
            }
        }

        // Unified game loading - parses game string and returns normalized data
        // Does NOT mutate state - callers handle loadSFEN, move execution, etc.
        loadGame(gameString) {
            // Parse game string to extract comments
            const parsed = this.parseGameStringWithComments(gameString.trim());

            if (parsed.error) {
                return { success: false, error: parsed.error };
            }

            // Extract text parts and comment map
            const { textParts, commentMap, commentOnly } =
                this.extractTextAndComments(parsed.tokens);

            // Parse SFEN and moves from text parts
            const { sfen, moves, startingComment, moveComments } =
                this.parseSfenFromParts(textParts, commentMap);

            // Return normalized payload
            return {
                success: true,
                sfen,
                moves,
                startingComment,
                moveComments,
                commentOnly,
                hasNoData: textParts.length === 0 && !startingComment,
            };
        }

        // Import game in CSL format (SFEN + space-separated moves, or just moves).
        // Supports PGN-style ( … ) variation groups – alternate branches are added
        // to the move tree as sibling children of the move they deviate from.
        importGame(gameString) {
            // Parse with full variation support
            const parsed = this.parseCSLWithVariations(gameString.trim());

            if (parsed.error) {
                alert("Import error: " + parsed.error);
                return false;
            }

            const { sfen, startingComment, moves, commentOnly, hasNoData } =
                parsed;

            // Special case: only a {comment} was provided – clear moves and set comment
            if (commentOnly) {
                if (startingComment) {
                    const resetSFEN =
                        this.startingSFEN ||
                        "lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b - 1";
                    if (!this.loadSFEN(resetSFEN)) {
                        alert("Failed to reset position.");
                        return false;
                    }
                    this.startingComment = startingComment;
                    console.log(
                        `Import: Cleared moves and set starting comment: "${startingComment}"`,
                    );
                    this.updateDisplay();
                    return true;
                }
                alert("No game data provided.");
                return false;
            }

            if (hasNoData) {
                alert("No game data provided.");
                return false;
            }

            // fixedStart mode restriction
            if (
                this.config.appletMode === "fixedStart" ||
                this.config.appletMode === "fixedStartAndRules" ||
                this.config.appletMode === "fixedStartAndSettings"
            ) {
                const expectedStartingSFEN =
                    this.startingSFEN ||
                    "lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b - 1";
                if (sfen !== expectedStartingSFEN) {
                    alert(
                        "Import rejected: Only imports with the same starting position or moves-only format are allowed.",
                    );
                    return false;
                }
            }

            // Store starting comment before loadSFEN (which resets the tree)
            this.startingComment = startingComment || "";

            // Load the starting position (resets move history and tree)
            if (!this.loadSFEN(sfen)) {
                alert("Invalid starting position in game import.");
                return false;
            }

            // Clear any remaining state that might interfere
            this.clearSelection();
            this.clearHighlights();
            this.promotionPromptActive = false;
            this.lionReturnPromptActive = false;

            // Set import mode flags to skip promotion prompts and batch updates
            this.isImporting = true;
            this.isBatchImporting = true;

            // Execute main line and embedded variations recursively.
            // Board is at startingSFEN; currentNode is null (live leaf at root).
            const startSFEN = this.startingSFEN;
            this._importCSLSequence(moves, this.moveTree, startSFEN);

            // Clear import mode flags
            this.isImporting = false;
            this.isBatchImporting = false;


            // Set last move highlighting from the most recent main-line move
            if (this.moveHistory.length > 0) {
                const lastMoveInHistory =
                    this.moveHistory[this.moveHistory.length - 1];
                this.lastMove = {
                    from: lastMoveInHistory.from,
                    to: lastMoveInHistory.to,
                    midpoint: lastMoveInHistory.midpoint || null,
                };
                console.log(
                    "Import: Set last move highlighting:",
                    this.lastMove,
                );
                console.log(
                    "Import: Move history length:",
                    this.moveHistory.length,
                );
            } else {
                this.lastMove = null;
                console.log("Import: No moves to highlight");
            }

            // Refresh board visual state after batch import
            this.updateBoard();
            this.updateMoveHistoryHighlight();
            this.updateSquareHighlights();

            // Reset navigation state to current position
            this.gameStateManager.updateGameState({
                currentNavigationIndex: null,
                isNavigating: false,
            });

            // Force display refresh (comment panel, etc.)
            this.updateDisplay();

            console.log(
                `Successfully imported ${this.moveHistory.length} main-line moves from game.`,
            );
            return true;
        }

        // Cleanup method to remove event listeners
        destroy() {
            if (this.resizeListener) {
                window.removeEventListener("resize", this.resizeListener);
            }
        }

        // ── CSL VARIATION IMPORT HELPERS ─────────────────────────────────────────

        // Recursively execute a parsed CSL move sequence (main line or variation).
        //
        // Invariant on entry:
        //   • The board position is at parentSFEN.
        //   • this.currentNode is set so that executeUSIMove will attach the next
        //     move as a child of parentNode:
        //       – null  → parentNode is the live leaf (standard append)
        //       – parentNode → branching case (creates sibling child)
        //
        // For each move data item the function:
        //   1. Executes the USI move (creates a MoveNode as child of parentNode).
        //   2. Assigns the comment.
        //   3. For every variation belonging to that move:
        //        a. Saves the current moveHistory.
        //        b. Restores board + moveHistory to the parentNode position.
        //        c. Sets currentNode = parentNode so the variation branches off it.
        //        d. Recurses.
        //        e. Restores moveHistory + board back to just after the main move.
        //   4. Advances parentNode / parentSFEN for the next iteration.
        // isVariation=false  → top-level main-line call: sub-variations are
        //                       alternatives to the current move, so they branch off
        //                       parentNode (position before the move).
        // isVariation=true   → inside a variation: sub-variations are alternatives
        //                       to the NEXT continuation, so they branch off newNode
        //                       (position after the move just played).
        _importCSLSequence(moves, parentNode, parentSFEN, isVariation = false) {
            for (let i = 0; i < moves.length; i++) {
                const moveData = moves[i];

                // Execute the move.  currentNode is already correct on entry.
                // On failure, stop processing this sequence here but keep any
                // nodes that were already built (valid prefix is preserved).
                if (!this.executeUSIMove(moveData.usi)) {
                    const _failPiece = (() => {
                        try {
                            const c = this.parseUSICoordinates(moveData.usi.replace(/\+$/,''));
                            if (!c) return 'no-coords';
                            const [r,f] = this.parseSquareId(c.fromSquare);
                            const p = this.board[r]?.[f];
                            return p ? `${p.color}${p.type}@${c.fromSquare}→${c.toSquare}` : `empty@${c.fromSquare}`;
                        } catch { return 'err'; }
                    })();
                    console.warn(
                        `CSL import: stopping at invalid move "${moveData.usi}" player=${this.currentPlayer} piece=${_failPiece} isImporting=${this.isImporting} histLen=${this.moveHistory.length}`,
                    );
                    break;
                }
                // The moveExecutor skips `currentNode = null` when isImporting=true.
                // Reset it explicitly so the NEXT move uses getLiveNode() as parent.
                this.currentNode = null;

                const newNode = this.moveHistory[this.moveHistory.length - 1];
                if (newNode && moveData.comment) {
                    newNode.comment = moveData.comment;
                }
                const newSFEN = newNode?.resultingSFEN || "";

                if (moveData.variations && moveData.variations.length > 0) {
                    const savedHistory = [...this.moveHistory];

                    for (const varMoves of moveData.variations) {
                        if (!varMoves || varMoves.length === 0) continue;

                        // Detect KIF vs PGN style.
                        //
                        // The board is currently at newSFEN (restored at the end
                        // of the previous variation iteration, or from the main
                        // move execution on the first pass).
                        //
                        //   KIF: the variation's first move is by the player whose
                        //        turn it is in newSFEN (the opponent's response to
                        //        the main move).  Branch from newNode / newSFEN so
                        //        the variation becomes a child of the main-line node.
                        //
                        //   PGN: the variation's first move is by the same player
                        //        as the main move (an alternative to it).  Branch
                        //        from parentNode / parentSFEN so the variation
                        //        becomes a sibling of the main-line node.
                        let _isKIF = false;
                        if (newSFEN && varMoves.length > 0) {
                            try {
                                const _fvc = this.parseUSICoordinates(
                                    varMoves[0].usi.replace(/\+$/, ""),
                                );
                                if (_fvc) {
                                    const [_vr, _vf] = this.parseSquareId(
                                        _fvc.fromSquare,
                                    );
                                    const _vp = this.board[_vr]?.[_vf];
                                    if (_vp) {
                                        const _newPlayer = newSFEN.split(" ")[1];
                                        _isKIF = _vp.color === _newPlayer;
                                    }
                                }
                            } catch { /* default PGN */ }
                        }
                        const _varBranch = _isKIF ? newNode : parentNode;
                        const _varBranchSFEN = _isKIF ? newSFEN : parentSFEN;

                        this._restoreBoardForImport(_varBranchSFEN);

                        if (_varBranch === this.moveTree) {
                            this.moveHistory = [];
                        } else {
                            const _bi = savedHistory.findIndex(
                                (n) => n === _varBranch,
                            );
                            this.moveHistory =
                                _bi >= 0
                                    ? savedHistory.slice(0, _bi + 1)
                                    : [...savedHistory];
                        }

                        this.currentNode = _varBranch;

                        const _childsBefore = _varBranch.children.length;

                        this._importCSLSequence(
                            varMoves,
                            _varBranch,
                            _varBranchSFEN,
                            true,
                        );

                        // Tag every child added by this variation as a branch.
                        // KIF branches additionally get isKIFBranch so renderers
                        // and serializers can show them after the parent node
                        // (the move they respond to) rather than before it.
                        // New nodes are unshifted (prepended) so they appear at
                        // indices 0 … (newLen - _childsBefore - 1).
                        const _addedCount =
                            _varBranch.children.length - _childsBefore;
                        for (let k = 0; k < _addedCount; k++) {
                            _varBranch.children[k].isBranch = true;
                            if (_isKIF) {
                                _varBranch.children[k].isKIFBranch = true;
                            }
                        }

                        // If nothing was added (first move illegal), store raw
                        // moves so the serializer can re-emit them verbatim.
                        if (_addedCount === 0) {
                            if (!_varBranch.rawVariations)
                                _varBranch.rawVariations = [];
                            _varBranch.rawVariations.push(
                                _isKIF ? { moves: varMoves, isKIF: true } : varMoves,
                            );
                        }

                        this.moveHistory = [...savedHistory];
                        this.currentNode = null;
                        this._restoreBoardForImport(newSFEN);
                    }
                }

                parentNode = newNode;
                parentSFEN = newSFEN;
            }
            return true;
        }

        // Restore the board position from a SFEN string without touching the move
        // tree or move history.  Used during variation import to set up board state
        // for branching without disrupting the already-built tree.
        _restoreBoardForImport(sfen) {
            if (!sfen) return;
            this.applySFENPosition(sfen);
            this.moveablePiecesCache = null;
            // Ensure navigation flags are clear so executeUSIMove behaves normally
            this.isNavigating = false;
            this.currentNavigationIndex = null;
        }

        // Execute a single USI move (like "7i7h" or "7g7f+" for promotion)
        executeUSIMove(usiMove) {
            if (!usiMove) {
                console.log(`Invalid USI move: empty or null`);
                return false;
            }

            // Parse promotion indicator
            const hasPromotion = usiMove.endsWith("+");
            const moveString = hasPromotion ? usiMove.slice(0, -1) : usiMove;

            // Parse coordinates from the move string
            const coordinates = this.parseUSICoordinates(moveString);
            if (!coordinates) {
                console.log(`Could not parse coordinates from: ${moveString}`);
                return false;
            }

            let { fromSquare, toSquare, midpointSquare } = coordinates;

            // UNIVERSAL MOVE DISAMBIGUATION - Apply centralized disambiguation logic
            // Check if move disambiguation should be applied (same conditions as board click logic)
            // Always disambiguate when midpoint is empty, even for Lion return moves (fromSquare === toSquare)
            if (disambiguateMoves && midpointSquare) {
                // Check if midpoint is empty using centralized board access
                const pieceAtMidpoint = utils.board.getPieceAt(
                    this.board,
                    midpointSquare,
                );

                if (!pieceAtMidpoint) {
                    // Empty midpoint - convert double move to normal move (skip midpoint)
                    console.log(
                        `Move disambiguation: Converting ${fromSquare}-${midpointSquare}-${toSquare} to ${fromSquare}-${toSquare} (empty midpoint)`,
                    );
                    midpointSquare = null; // Remove midpoint to make it a normal move
                }
            }

            // Reduce logging during batch import
            if (!this.isBatchImporting) {
                console.log(
                    `Parsed move: ${fromSquare} -> ${midpointSquare || "none"} -> ${toSquare}, promotion: ${hasPromotion}`,
                );
            }

            // Get piece at source square
            const [fromRank, fromFile] = this.parseSquareId(fromSquare);
            const piece = this.board[fromRank][fromFile];
            if (!piece) {
                if (!this.isBatchImporting) {
                    console.log(`No piece found at ${fromSquare}`);
                }
                return false;
            }

            // Double move debug logging removed

            // Check if it's the correct player's turn (skip if allowIllegalMoves is true)
            if (
                !this.config.allowIllegalMoves &&
                piece.color !== this.currentPlayer
            ) {
                if (!this.isBatchImporting) {
                    console.log(
                        `Wrong turn: piece is ${piece.color}, current player is ${this.currentPlayer}`,
                    );
                }
                return false;
            }

            // Use existing move validation logic (without prompts)
            if (midpointSquare) {
                // Always check piece type restrictions for double moves, regardless of allowIllegalMoves
                if (!this.isValidDoubleMovePieceType(piece)) {
                    if (!this.isBatchImporting) {
                        console.log(
                            `Invalid double move: ${fromSquare}-${midpointSquare}-${toSquare}`,
                        );
                        console.log(
                            `Piece type: ${piece.type}, Piece color: ${piece.color}, Can double move: ${piece.type === "N" || piece.type === "+O" || piece.type === "+H" || piece.type === "+D"}`,
                        );
                    }
                    return false;
                }

                // Additional validation only when allowIllegalMoves is false
                if (
                    !this.config.allowIllegalMoves &&
                    !this.isValidDoubleMove(
                        fromSquare,
                        midpointSquare,
                        toSquare,
                        piece,
                    )
                ) {
                    if (!this.isBatchImporting) {
                        console.log(
                            `Invalid double move: ${fromSquare}-${midpointSquare}-${toSquare}`,
                        );
                    }
                    return false;
                }

                // Apply Counter-strike and Bridge-capture rules for double moves using centralized validation
                if (!this.config.allowIllegalMoves) {
                    // Use the centralized double move validation that includes proper Counter-strike and Bridge-capture logic
                    let validSecondMoves = [];

                    if (piece.type === "N" || piece.type === "+O") {
                        // Lion double move validation
                        validSecondMoves = this.calculateLionSecondMoves(
                            midpointSquare,
                            fromSquare,
                            piece,
                        );
                    } else if (piece.type === "+H") {
                        // Horned Falcon double move validation
                        validSecondMoves =
                            this.calculateHornedFalconSecondMoves(
                                midpointSquare,
                                fromSquare,
                                piece,
                            );
                    } else if (piece.type === "+D") {
                        // Soaring Eagle double move validation
                        validSecondMoves =
                            this.calculateSoaringEagleSecondMoves(
                                midpointSquare,
                                fromSquare,
                                piece,
                            );
                    }

                    // Check if the target square is in the list of valid moves
                    if (!validSecondMoves.includes(toSquare)) {
                        if (!this.isBatchImporting) {
                            console.log(
                                `Double move invalid: ${toSquare} not in valid second moves [${validSecondMoves.join(", ")}]`,
                            );
                        }
                        return false;
                    }
                }
                // Always check promotion validity for double moves, regardless of allowIllegalMoves
                if (hasPromotion) {
                    const [midRank, midFile] =
                        this.parseSquareId(midpointSquare);
                    const [toRank, toFile] = this.parseSquareId(toSquare);
                    const midpointCapture = this.board[midRank][midFile];
                    const endCapture = this.board[toRank][toFile];
                    if (
                        !this.isValidPromotion(
                            fromSquare,
                            toSquare,
                            piece,
                            endCapture,
                            midpointCapture,
                        )
                    ) {
                        if (!this.isBatchImporting) {
                            console.log(
                                `Invalid promotion in double move: ${fromSquare}-${midpointSquare}-${toSquare}`,
                            );
                            console.log(
                                `Piece type: ${piece.type}, Promoted: ${piece.promoted}, Can promote: ${!piece.promoted && !!this.getPromotedType(piece.type)}`,
                            );
                            console.log(
                                `From zone: ${this.isInPromotionZone(fromSquare, piece.color)}, To zone: ${this.isInPromotionZone(toSquare, piece.color)}, End capture: ${!!endCapture}, Mid capture: ${!!midpointCapture}`,
                            );
                        }
                        return false;
                    }
                }

                // Use centralized MoveExecutor for double moves
                const [midRank, midFile] = this.parseSquareId(midpointSquare);
                const [toRank, toFile] = this.parseSquareId(toSquare);

                const isLionReturn = fromSquare === toSquare;
                const moveData = {
                    from: fromSquare,
                    to: toSquare,
                    midpoint: midpointSquare,
                    piece: piece,
                    captured: this.board[toRank][toFile],
                    capturedAtMidpoint: this.board[midRank][midFile],
                    promoted: hasPromotion,
                    isLionReturn: isLionReturn,
                };

                showDebugMessage(false, "DEBUG Import moveData:", {
                    ...moveData,
                    pieceType: moveData.piece?.type,
                    capturedType: moveData.captured?.type,
                    capturedAtMidpointType: moveData.capturedAtMidpoint?.type,
                });

                const moveResult = this.moveExecutor.executeMove(moveData, {
                    skipPromotionPrompt: this.isImporting,
                });
                return moveResult !== false;
            } else {
                // Check if this is a disambiguated turn skip (origin-to-origin move after disambiguation)
                // These are valid when:
                // 1. fromSquare === toSquare (origin-to-origin)
                // 2. The piece is capable of double moves (Lion, +O, +H, +D)
                // 3. At least one of the piece's double move squares is EMPTY
                if (fromSquare === toSquare) {
                    // Check if piece can make double moves
                    if (!this.isValidDoubleMovePieceType(piece)) {
                        if (!this.isBatchImporting) {
                            console.log(
                                `Invalid turn skip: piece ${piece.type} cannot make double moves`,
                            );
                        }
                        return false;
                    }

                    // Get the raw double move square coordinates for this piece type
                    // Store as [rank, file] pairs to avoid coordinate format issues
                    const [fromRank, fromFile] = this.parseSquareId(fromSquare);
                    let doubleMoveCoords = []; // Array of [rank, file] pairs

                    if (piece.type === "N" || piece.type === "+O") {
                        // Lion: All squares a King's move away (8 surrounding squares)
                        const kingOffsets = [
                            [-1, -1],
                            [-1, 0],
                            [-1, 1],
                            [0, -1],
                            [0, 1],
                            [1, -1],
                            [1, 0],
                            [1, 1],
                        ];
                        for (const [dr, df] of kingOffsets) {
                            const newRank = fromRank + dr;
                            const newFile = fromFile + df;
                            if (
                                newRank >= 0 &&
                                newRank < 12 &&
                                newFile >= 0 &&
                                newFile < 12
                            ) {
                                doubleMoveCoords.push([newRank, newFile]);
                            }
                        }
                    } else if (piece.type === "+H") {
                        // Horned Falcon: One orthogonal step forward
                        const forwardOffset = piece.color === "b" ? -1 : 1;
                        const newRank = fromRank + forwardOffset;
                        if (newRank >= 0 && newRank < 12) {
                            doubleMoveCoords.push([newRank, fromFile]);
                        }
                    } else if (piece.type === "+D") {
                        // Soaring Eagle: Two diagonal steps forward
                        const forwardOffset = piece.color === "b" ? -1 : 1;
                        const newRank = fromRank + forwardOffset;
                        if (newRank >= 0 && newRank < 12) {
                            // Left diagonal
                            if (fromFile - 1 >= 0) {
                                doubleMoveCoords.push([newRank, fromFile - 1]);
                            }
                            // Right diagonal
                            if (fromFile + 1 < 12) {
                                doubleMoveCoords.push([newRank, fromFile + 1]);
                            }
                        }
                    }

                    // Check if at least one double move square is EMPTY
                    // Access board directly using raw coordinates
                    const hasEmptyDoubleMoveSquare = doubleMoveCoords.some(
                        ([r, f]) => {
                            const pieceAtSquare = this.board[r]?.[f];
                            return !pieceAtSquare;
                        },
                    );

                    if (!hasEmptyDoubleMoveSquare) {
                        if (!this.isBatchImporting) {
                            console.log(
                                `Invalid turn skip: piece at ${fromSquare} has no empty double move squares (all ${doubleMoveCoords.length} squares occupied)`,
                            );
                        }
                        return false;
                    }

                    if (!this.isBatchImporting) {
                        console.log(
                            `Valid disambiguated turn skip: ${fromSquare}-${toSquare} (at least one of ${doubleMoveCoords.length} double move squares is empty)`,
                        );
                    }

                    // Execute the turn skip as a simple origin-to-origin move
                    const moveResult = this.moveExecutor.executeMove(
                        {
                            from: fromSquare,
                            to: toSquare,
                            piece: piece,
                            captured: null,
                            promoted: hasPromotion,
                        },
                        { skipPromotionPrompt: this.isImporting },
                    );
                    return moveResult !== false;
                }

                // Check if this is a valid regular move using centralized validation
                if (!this.config.allowIllegalMoves) {
                    const moveResult = this.moveValidator.validateMove(
                        fromSquare,
                        toSquare,
                        piece,
                        { allowIllegalMoves: false },
                    );
                    if (!moveResult.valid) {
                        console.log(
                            `Invalid regular move: ${fromSquare}-${toSquare}. Reason: ${moveResult.reason}`,
                        );
                        return false;
                    }
                }
                // Always check promotion validity, regardless of allowIllegalMoves
                if (hasPromotion) {
                    const [toRank, toFile] = this.parseSquareId(toSquare);
                    const capturedPiece = this.board[toRank][toFile];
                    if (
                        !this.isValidPromotion(
                            fromSquare,
                            toSquare,
                            piece,
                            capturedPiece,
                        )
                    ) {
                        console.log(
                            `Invalid promotion: ${fromSquare}-${toSquare}`,
                        );
                        console.log(
                            `Piece type: ${piece.type}, Promoted: ${piece.promoted}, Can promote: ${!piece.promoted && !!this.getPromotedType(piece.type)}`,
                        );
                        console.log(
                            `From zone: ${this.isInPromotionZone(fromSquare, piece.color)}, To zone: ${this.isInPromotionZone(toSquare, piece.color)}, Captured: ${!!capturedPiece}`,
                        );
                        return false;
                    }
                }

                // Use centralized MoveExecutor for regular moves
                const [toRank, toFile] = this.parseSquareId(toSquare);

                const moveResult = this.moveExecutor.executeMove(
                    {
                        from: fromSquare,
                        to: toSquare,
                        piece: piece,
                        captured: this.board[toRank][toFile],
                        promoted: hasPromotion,
                    },
                    { skipPromotionPrompt: this.isImporting },
                );
                return moveResult !== false;
            }
        }

        // Parse USI coordinates from move string
        parseUSICoordinates(moveString) {
            if (!moveString || moveString.length < 4) return null;

            // Try to parse as regular move first (2 coordinates)
            let fromSquare = moveString.slice(0, 2);
            let toSquare = moveString.slice(2, 4);

            if (
                this.isValidSquareId(fromSquare) &&
                this.isValidSquareId(toSquare)
            ) {
                if (moveString.length === 4) {
                    // Regular move
                    return { fromSquare, toSquare, midpointSquare: null };
                } else if (moveString.length > 4) {
                    // Try to parse third coordinate for double move
                    let midpointSquare = toSquare;
                    toSquare = moveString.slice(4);

                    if (this.isValidSquareId(toSquare)) {
                        // Double move: from-mid-to
                        return { fromSquare, toSquare, midpointSquare };
                    }
                }
            }

            // Try alternative parsing for different coordinate lengths
            const len = moveString.length;
            for (let i = 2; i <= 3; i++) {
                for (let j = 2; j <= 3; j++) {
                    if (i + j < len) {
                        const from = moveString.slice(0, i);
                        const mid = moveString.slice(i, i + j);
                        const to = moveString.slice(i + j);

                        if (
                            this.isValidSquareId(from) &&
                            this.isValidSquareId(mid) &&
                            this.isValidSquareId(to)
                        ) {
                            return {
                                fromSquare: from,
                                toSquare: to,
                                midpointSquare: mid,
                            };
                        }
                    }

                    if (i + j === len) {
                        const from = moveString.slice(0, i);
                        const to = moveString.slice(i);

                        if (
                            this.isValidSquareId(from) &&
                            this.isValidSquareId(to)
                        ) {
                            return {
                                fromSquare: from,
                                toSquare: to,
                                midpointSquare: null,
                            };
                        }
                    }
                }
            }

            return null;
        }

        // Legacy wrapper for backward compatibility
        isValidRegularMove(fromSquare, toSquare, piece) {
            const result = this.moveValidator.validateRegularMove(
                fromSquare,
                toSquare,
                piece,
            );
            return result.valid;
        }

        // Check if piece type can perform double moves
        isValidDoubleMovePieceType(piece) {
            return (
                this.isLionPiece(piece) ||
                this.isHornedFalconPiece(piece) ||
                this.isSoaringEaglePiece(piece)
            );
        }

        // Check if a square is in the promotion zone for a given color
        isInPromotionZone(squareId, color) {
            const [rank] = this.parseSquareId(squareId);
            const isBlack = color === "b";
            const promotionZone = isBlack ? [0, 1, 2, 3] : [8, 9, 10, 11];
            return promotionZone.includes(rank);
        }

        // Check if promotion is valid using same logic as interactive clicks
        // USI promotion validation - uses centralized logic
        isValidPromotion(
            fromSquare,
            toSquare,
            piece,
            capturedPiece = null,
            midpointCapture = null,
        ) {
            const [fromRank] = this.parseSquareId(fromSquare);
            const [toRank] = this.parseSquareId(toSquare);

            // Use any capture as captured piece for promotion rules
            const anyCapture = capturedPiece || midpointCapture;

            const context = { isUSI: true };
            return this.promotionManager.checkEligibility(
                piece,
                fromRank,
                toRank,
                anyCapture,
                context,
            );
        }

        // Validate double move for USI import
        isValidDoubleMove(fromSquare, midpointSquare, toSquare, piece) {
            // Basic validation: check piece can make double moves
            if (!this.isValidDoubleMovePieceType(piece)) {
                console.log(
                    "Double move validation failed: piece cannot make double moves",
                );
                return false;
            }

            // Additional basic checks
            if (
                !this.isValidSquareId(fromSquare) ||
                !this.isValidSquareId(midpointSquare) ||
                !this.isValidSquareId(toSquare)
            ) {
                console.log(
                    "Double move validation failed: invalid square coordinates",
                );
                return false;
            }

            // Parse coordinates
            const [fromRank, fromFile] = this.parseSquareId(fromSquare);
            const [midRank, midFile] = this.parseSquareId(midpointSquare);
            const [toRank, toFile] = this.parseSquareId(toSquare);

            // Calculate direction vectors
            const firstDirection = [midRank - fromRank, midFile - fromFile];
            const secondDirection = [toRank - midRank, toFile - midFile];

            // Lions can change direction between moves, others cannot
            if (piece.type === "N" || piece.type === "+O") {
                // Lion has full double move flexibility (both regular Lion and promoted Kirin)
                console.log(
                    `Double move validation passed: Lion can change direction`,
                );
                return true;
            } else if (piece.type === "+H" || piece.type === "+D") {
                // Horned Falcon and Soaring Eagle must continue in same direction OR return to origin
                const isReturnToOrigin =
                    toRank === fromRank && toFile === fromFile;
                const isSameDirection =
                    firstDirection[0] === secondDirection[0] &&
                    firstDirection[1] === secondDirection[1];

                if (isReturnToOrigin || isSameDirection) {
                    // Additional check: Horned Falcon can only double move forward orthogonally
                    if (piece.type === "+H") {
                        const isForwardOrthogonal =
                            firstDirection[1] === 0 &&
                            ((piece.color === "b" &&
                                firstDirection[0] === -1) ||
                                (piece.color === "w" &&
                                    firstDirection[0] === 1));
                        if (!isForwardOrthogonal) {
                            console.log(
                                "Double move validation failed: Horned Falcon can only double move forward orthogonally",
                            );
                            return false;
                        }
                    }
                    // Additional check: Soaring Eagle can only double move forward diagonally
                    else if (piece.type === "+D") {
                        const isForwardDiagonal =
                            Math.abs(firstDirection[0]) === 1 &&
                            Math.abs(firstDirection[1]) === 1 &&
                            ((piece.color === "b" &&
                                firstDirection[0] === -1) ||
                                (piece.color === "w" &&
                                    firstDirection[0] === 1));
                        if (!isForwardDiagonal) {
                            console.log(
                                "Double move validation failed: Soaring Eagle can only double move forward diagonally",
                            );
                            return false;
                        }
                    }

                    if (isReturnToOrigin) {
                        console.log(
                            `Double move validation passed: ${piece.type} returning to origin`,
                        );
                    } else {
                        console.log(
                            `Double move validation passed: ${piece.type} linear movement validated`,
                        );
                    }
                    return true;
                } else {
                    console.log(
                        `Double move validation failed: ${piece.type} must continue in same direction or return to origin. First: [${firstDirection}], Second: [${secondDirection}]`,
                    );
                    return false;
                }
            }

            console.log("Double move validation failed: unknown piece type");
            return false;
        }

        // Helper to get piece type for double move validation
        getPieceTypeForDoubleMove(piece) {
            if (piece.type === "N" || piece.type === "+O") {
                return "lion";
            } else if (piece.type === "+H") {
                return "hornedFalcon";
            } else if (piece.type === "+D") {
                return "soaringEagle";
            }
            return null;
        }

        // Helper to validate square IDs
        isValidSquareId(squareId) {
            if (!squareId || squareId.length < 2) return false;

            const file = parseInt(squareId.slice(0, -1));
            const rank = squareId.slice(-1);

            return file >= 1 && file <= 12 && rank >= "a" && rank <= "l";
        }

        // Execute USI regular move without prompts
        executeUSIRegularMove(fromSquare, toSquare, shouldPromote) {
            const [fromRank, fromFile] = this.parseSquareId(fromSquare);
            const [toRank, toFile] = this.parseSquareId(toSquare);

            const movingPiece = this.board[fromRank][fromFile];
            const capturedPiece = this.board[toRank][toFile];

            if (!movingPiece) return false;

            // Create the final piece state using centralized promotion logic
            const finalPiece = this.promotionManager.applyPromotion(
                movingPiece,
                shouldPromote,
            );
            const wasPromoted =
                shouldPromote && finalPiece.type !== movingPiece.type;

            // Execute the move
            this.board[fromRank][fromFile] = null;
            this.board[toRank][toFile] = finalPiece;

            // Update Lion capture tracking
            if (
                capturedPiece &&
                (capturedPiece.type === "N" || capturedPiece.type === "+O")
            ) {
                if (movingPiece.type !== "N" && movingPiece.type !== "+O") {
                    this.lastLionCapture = toSquare;
                } else {
                    this.lastLionCapture = null;
                }
            } else if (capturedPiece) {
                this.lastLionCapture = null;
            }

            // Record move in history
            const moveRecord = {
                from: fromSquare,
                to: toSquare,
                piece: { ...movingPiece },
                captured: capturedPiece,
                promoted: wasPromoted,
                notation: this.generateMoveNotation(
                    fromSquare,
                    toSquare,
                    movingPiece,
                    capturedPiece,
                    wasPromoted,
                ),
                lionCapture: this.lastLionCapture,
                previousLionCapture:
                    this.moveHistory.length > 0
                        ? this.moveHistory[this.moveHistory.length - 1]
                              .lionCapture
                        : this.startingLionCapture,
                resultingSFEN: "", // Will be set after player update
                comment: "", // Comment for this move
            };

            // Add move to history first
            this.moveHistory.push(moveRecord);
            this.lastMove = moveRecord;

            // Update current player (always update when importing moves to track game state)
            this.updateCurrentPlayer();

            // Store SFEN with correct player turn and move count
            // For allowIllegalMoves mode, resultingSFEN should show the non-moving player
            if (this.config.allowIllegalMoves) {
                moveRecord.resultingSFEN = this.exportSFENWithPlayer(
                    movingPiece.color === "b" ? "w" : "b",
                );
            } else {
                moveRecord.resultingSFEN = this.exportSFEN();
            }

            // Update display
            this.updateBoard();
            this.updateDisplay();

            return true;
        }

        // Execute USI double move without prompts
        executeUSIDoubleMove(
            fromSquare,
            midpointSquare,
            toSquare,
            shouldPromote,
        ) {
            const [fromRank, fromFile] = this.parseSquareId(fromSquare);
            const [midRank, midFile] = this.parseSquareId(midpointSquare);
            const [toRank, toFile] = this.parseSquareId(toSquare);

            const movingPiece = this.board[fromRank][fromFile];
            const midpointPiece = this.board[midRank][midFile];
            const endPiece = this.board[toRank][toFile];

            if (!movingPiece) return false;

            // Create the final piece state using centralized promotion logic
            const finalPiece = this.promotionManager.applyPromotion(
                movingPiece,
                shouldPromote,
            );
            const wasPromoted =
                shouldPromote && finalPiece.type !== movingPiece.type;

            // Execute double move
            this.board[fromRank][fromFile] = null;
            this.board[midRank][midFile] = null;
            this.board[toRank][toFile] = finalPiece;

            // Update Lion capture tracking
            const capturedAtEnd =
                endPiece && (endPiece.type === "N" || endPiece.type === "+O");
            const capturedAtMidpoint =
                midpointPiece &&
                (midpointPiece.type === "N" || midpointPiece.type === "+O");

            if (capturedAtEnd) {
                if (movingPiece.type !== "N" && movingPiece.type !== "+O") {
                    this.lastLionCapture = toSquare;
                } else {
                    this.lastLionCapture = null;
                }
            } else if (capturedAtMidpoint) {
                if (movingPiece.type !== "N" && movingPiece.type !== "+O") {
                    this.lastLionCapture = midpointSquare;
                } else {
                    this.lastLionCapture = null;
                }
            } else if (endPiece || midpointPiece) {
                this.lastLionCapture = null;
            }

            // Record move in history
            const moveRecord = {
                from: fromSquare,
                to: toSquare,
                midpoint: midpointSquare,
                piece: { ...movingPiece },
                captured: endPiece,
                capturedAtMidpoint: midpointPiece,
                promoted: wasPromoted,
                notation: this.generateMoveNotation(
                    fromSquare,
                    toSquare,
                    movingPiece,
                    endPiece,
                    wasPromoted,
                    midpointSquare,
                    midpointPiece,
                ),
                lionCapture: this.lastLionCapture,
                previousLionCapture:
                    this.moveHistory.length > 0
                        ? this.moveHistory[this.moveHistory.length - 1]
                              .lionCapture
                        : this.startingLionCapture,
                resultingSFEN: "", // Will be set after player update
                comment: "", // Comment for this move
            };

            // Add move to history first
            this.moveHistory.push(moveRecord);
            this.lastMove = moveRecord;

            // Update current player (always update when importing moves to track game state)
            this.updateCurrentPlayer();

            // Store SFEN with correct player turn and move count
            // For allowIllegalMoves mode, resultingSFEN should show the non-moving player
            if (this.config.allowIllegalMoves) {
                moveRecord.resultingSFEN = this.exportSFENWithPlayer(
                    movingPiece.color === "b" ? "w" : "b",
                );
            } else {
                moveRecord.resultingSFEN = this.exportSFEN();
            }

            // Update display
            this.updateBoard();
            this.updateDisplay();

            return true;
        }

        copySFEN() {
            const sfen = this.exportSFEN();
            navigator.clipboard.writeText(sfen).then(() => {
                // Could show a toast notification here
                console.log("SFEN copied to clipboard");
            });
        }

        downloadKIF() {
            // Simplified KIF export
            let kif = "Chu Shogi Game\n\n";
            this.moveHistory.forEach((move, index) => {
                kif += `${index + 1}. ${move.notation}\n`;
            });

            const blob = new Blob([kif], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "chushogi-game.kif";
            a.click();
            URL.revokeObjectURL(url);
        }

        downloadUSI() {
            // Simplified USI export
            let usi =
                "position sfen lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b - 1\n";
            if (this.moveHistory.length > 0) {
                usi +=
                    "moves " +
                    this.moveHistory
                        .map(
                            (move) =>
                                move.from +
                                move.to +
                                (move.promoted ? "+" : ""),
                        )
                        .join(" ");
            }

            const blob = new Blob([usi], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "chushogi-game.usi";
            a.click();
            URL.revokeObjectURL(url);
        }

        showLionReturnPrompt() {
            console.log(
                "Lion return prompts disabled - treating as invalid move",
            );
            // Lion return logic disabled - clear selection instead
            this.clearSelection();
            return;
        }

        // Execute Lion return move after disambiguation prompt
        executeLionReturnMove(shouldPromote, lionReturnData) {
            console.log("Executing Lion return move:", {
                shouldPromote,
                lionReturnData,
            });

            if (!shouldPromote) {
                // User clicked deferral square - cancel the double move and deselect
                console.log("Lion return cancelled - deselecting piece");
                this.clearSelection();
                this.lionReturnPromptActive = false;
                this.promotionPromptActive = false;
                return;
            }

            // User clicked origin square - execute Lion return double move
            console.log("Executing Lion return double move");

            // Use the centralized MoveExecutor for Lion return
            const moveResult = this.moveExecutor.executeMove({
                from: lionReturnData.startSquare,
                to: lionReturnData.endSquare,
                midpoint: lionReturnData.midpointSquare,
                piece: lionReturnData.piece,
                captured: null, // No capture at destination (returning to origin)
                capturedAtMidpoint:
                    this.board[
                        this.parseSquareId(lionReturnData.midpointSquare)[0]
                    ][this.parseSquareId(lionReturnData.midpointSquare)[1]], // Capture at midpoint
                isLionReturn: true,
                promoted: false,
            });

            // Clear double move state and promotion flags regardless of move result
            // This ensures the prompt clears even if the move was rejected in puzzle mode
            this.lionReturnPromptActive = false;
            this.promotionPromptActive = false;

            // If move was rejected (e.g., in puzzle mode), clear selection and highlights
            if (moveResult === false) {
                console.log(
                    "Lion return move was rejected, clearing selection and highlights",
                );
                this.clearSelection();
                this.highlightManager.updateAllIntelligent();
            }
        }

        // Legacy Lion return functions removed - now handled by promotion system

        showPromotionPrompt(from, to, piece, additionalData = {}) {
            // Store the move details - preserve existing promotionMove data if it exists
            if (!this.promotionMove) {
                this.promotionMove = { from, to, piece, ...additionalData };
            } else {
                // Preserve existing data and only update basic move info
                this.promotionMove.from = from;
                this.promotionMove.to = to;
                this.promotionMove.piece = piece;
                // Merge in any additional data (like midpoint for Lion double moves)
                Object.assign(this.promotionMove, additionalData);
            }
            this.promotionDestinationSquare = to;

            // Special handling for Lion double moves that return to starting square
            const isLionReturnMove = additionalData.isDoubleMove && from === to;

            if (isLionReturnMove) {
                // Check if this Lion return move allows promotion
                const [fromRank] = this.parseSquareId(from);
                const [toRank] = this.parseSquareId(to);
                const canPromote = this.promotionManager.checkEligibility(
                    piece,
                    fromRank,
                    toRank,
                    null,
                    {},
                );

                if (!canPromote) {
                    // Use simplified Lion return prompt (no promotion option)
                    this.showLionReturnPrompt(from, to, piece, additionalData);
                    return;
                }
                // If can promote, continue with regular promotion prompt
            }

            // Calculate deferral square (one king step away from destination)
            this.promotionDeferralSquare =
                this.calculatePromotionDeferralSquare(to);

            // Calculate alternate square if origin is covered
            // For Lion return moves (to === from), the deferral square is always one step away from destination
            // and the alternate should be two steps away, so origin is effectively "covered"
            const originCovered =
                to === from || this.promotionDeferralSquare === from;
            this.promotionAlternateSquare = originCovered
                ? this.calculatePromotionAlternateSquare(to)
                : null;

            // Set promotionPromptActive BEFORE updateBoard so the inner
            // updateSquareHighlights() call inside updateBoard already sees the
            // promotion state. Without this, it runs with promotionPromptActive=false
            // and allowIllegalMoves=true, which adds moveable-piece (amber) to every
            // piece square — including the still-unremoved captured pawn at the midpoint.
            // The outer updateSquareHighlights() then removes moveable-piece, but the
            // CSS background-color transition fires (amber → transparent, 0.2s) on every
            // piece square, making the midpoint and other occupied squares look like
            // stale double-move highlights until the fade completes.
            // promotionDestinationSquare / promotionDeferralSquare are already set above,
            // so the inner updateSquareHighlights() can apply the correct promotion CSS
            // directly with no amber intermediate state.
            this.promotionPromptActive = true;

            // Clear all highlights first, then preserve last move highlighting
            this.clearSquareHighlights();

            // Clear double move modal state to ensure double move highlights are removed
            this.doubleMoveMidpoint = null;
            this.doubleMoveOrigin = null;
            this.doubleMoveDestinations = [];

            // Force board update to ensure current piece positions are reflected before showing promotion previews
            this.updateBoard();

            // Determine if this is reverse promotion
            const isReversePromotion =
                piece.promoted && this.config.allowIllegalMoves;

            // Give the DOM a moment to update before modifying piece elements
            setTimeout(() => {
                this.showPromotionPreviews(from, to, piece, isReversePromotion);
            }, 0);

            // Outer updateSquareHighlights is now redundant (the inner call inside
            // updateBoard already applied the correct promotion highlights) but kept
            // as a safety net in case any intermediate state needs reapplying.
            this.updateSquareHighlights();

        }

        showPromotionPreviews(from, to, piece, isReversePromotion) {
            // Highlight destination square with promotion preview
            const destElement = this.container.querySelector(
                `[data-square="${to}"]`,
            );
            if (destElement) {
                destElement.classList.add("promotion-destination");
                // For reverse promotion: destination shows unpromoted piece (what you get by clicking)
                // For normal promotion: destination shows promoted piece (what you get by clicking)
                const targetType = isReversePromotion
                    ? this.getOriginalType(piece.type)
                    : this.getPromotedType(piece.type);
                let pieceElement = destElement.querySelector(".chushogi-piece");
                if (targetType) {
                    const targetSymbol = PIECE_DEFINITIONS[targetType]?.kanji;
                    if (targetSymbol) {
                        if (pieceElement) {
                            pieceElement.dataset.originalText =
                                pieceElement.textContent;
                            pieceElement.dataset.originalClass =
                                pieceElement.className;
                            pieceElement.textContent = targetSymbol;
                            // Set color and orientation to match moving piece
                            const colorClass =
                                piece.color === "w" ? "white" : "black";
                            const promotedClass = isReversePromotion
                                ? ""
                                : "promoted";
                            pieceElement.className =
                                `chushogi-piece ${colorClass} ${promotedClass}`.trim();
                        } else {
                            // Create piece element if it doesn't exist
                            pieceElement = document.createElement("div");
                            const colorClass =
                                piece.color === "w" ? "white" : "black";
                            const promotedClass = isReversePromotion
                                ? ""
                                : "promoted";
                            pieceElement.className =
                                `chushogi-piece ${colorClass} ${promotedClass}`.trim();
                            pieceElement.textContent = targetSymbol;
                            pieceElement.dataset.originalText = "";
                            pieceElement.dataset.temporaryPiece = "true";
                            destElement.appendChild(pieceElement);
                        }
                    }
                }
            }

            // Highlight deferral square with current piece (showing what stays the same)
            if (this.promotionDeferralSquare) {
                const deferralElement = this.container.querySelector(
                    `[data-square="${this.promotionDeferralSquare}"]`,
                );
                if (deferralElement) {
                    deferralElement.classList.add("promotion-deferral");
                    // Deferral shows the current piece state (what you get by deferring/not promoting)
                    let pieceElement =
                        deferralElement.querySelector(".chushogi-piece");
                    const currentSymbol = PIECE_DEFINITIONS[piece.type]?.kanji;
                    if (currentSymbol) {
                        if (pieceElement) {
                            pieceElement.dataset.originalText =
                                pieceElement.textContent;
                            pieceElement.dataset.originalClass =
                                pieceElement.className;
                            pieceElement.textContent = currentSymbol;
                            // Set color and orientation to match moving piece
                            const colorClass =
                                piece.color === "w" ? "white" : "black";
                            const promotedClass = piece.promoted
                                ? "promoted"
                                : "";
                            pieceElement.className =
                                `chushogi-piece ${colorClass} ${promotedClass}`.trim();
                        } else {
                            // Create piece element if it doesn't exist
                            pieceElement = document.createElement("div");
                            const colorClass =
                                piece.color === "w" ? "white" : "black";
                            const promotedClass = piece.promoted
                                ? "promoted"
                                : "";
                            pieceElement.className =
                                `chushogi-piece ${colorClass} ${promotedClass}`.trim();
                            pieceElement.textContent = currentSymbol;
                            pieceElement.dataset.originalText = "";
                            pieceElement.dataset.temporaryPiece = "true";
                            deferralElement.appendChild(pieceElement);
                        }
                    }
                }
            }

            // Highlight origin or alternate square for deselection
            if (this.promotionAlternateSquare) {
                const altElement = this.container.querySelector(
                    `[data-square="${this.promotionAlternateSquare}"]`,
                );
                if (altElement) {
                    altElement.classList.add("promotion-alternate");
                    // Hide any existing piece on alternate square
                    const pieceElement =
                        altElement.querySelector(".chushogi-piece");
                    if (pieceElement) {
                        pieceElement.dataset.originalText =
                            pieceElement.textContent;
                        pieceElement.dataset.originalClass =
                            pieceElement.className;
                        pieceElement.textContent = "";
                        pieceElement.className = "chushogi-piece";
                    }
                }
            } else {
                const originElement = this.container.querySelector(
                    `[data-square="${from}"]`,
                );
                if (originElement) {
                    originElement.classList.add("promotion-origin");
                }
            }

            // Note: Origin highlight (promotion-origin-highlight) is applied by updateSquareHighlights()
            // after promotionDestinationSquare and promotionDeferralSquare are set, not here.
        }

        showLionReturnPrompt(from, to, piece, additionalData = {}) {
            console.log(
                "Showing simplified Lion return prompt for non-promotable move:",
                from,
                "->",
                to,
            );

            // Store the move details
            this.promotionMove = {
                from,
                to,
                piece,
                ...additionalData,
                isLionReturnNoPromotion: true,
            };

            // For Lion return moves without promotion:
            // - Destination square acts as "deferral" (execute the move)
            // - Calculate alternate square for deselection (where normal deferral would be)
            this.promotionDestinationSquare = to;
            this.promotionDeferralSquare = to; // Clicking destination executes the move
            this.promotionAlternateSquare =
                this.calculatePromotionDeferralSquare(to); // For deselection

            // Set promotionPromptActive before updateBoard for the same reason as in
            // showPromotionPrompt: prevents the inner updateSquareHighlights() from
            // applying moveable-piece (amber) to piece squares and triggering a
            // spurious amber → transparent CSS transition that looks like stale highlights.
            this.promotionPromptActive = true;

            // Clear all highlights first
            this.clearSquareHighlights();

            // Clear double move modal state
            this.doubleMoveMidpoint = null;
            this.doubleMoveOrigin = null;
            this.doubleMoveDestinations = [];

            // Force board update
            this.updateBoard();

            // Show simplified previews
            setTimeout(() => {
                this.showLionReturnPreviews(from, to, piece);
            }, 0);

            this.updateSquareHighlights();
        }

        showLionReturnPreviews(from, to, piece) {
            // Highlight destination square (acts as deferral - executes move)
            const destElement = this.container.querySelector(
                `[data-square="${to}"]`,
            );
            if (destElement) {
                destElement.classList.add("promotion-deferral");
                // Show the current piece (no promotion change)
                let pieceElement = destElement.querySelector(".chushogi-piece");
                const currentSymbol = PIECE_DEFINITIONS[piece.type]?.kanji;
                if (currentSymbol) {
                    if (pieceElement) {
                        pieceElement.dataset.originalText =
                            pieceElement.textContent;
                        pieceElement.dataset.originalClass =
                            pieceElement.className;
                        pieceElement.textContent = currentSymbol;
                        const colorClass =
                            piece.color === "w" ? "white" : "black";
                        const promotedClass = piece.promoted ? "promoted" : "";
                        pieceElement.className =
                            `chushogi-piece ${colorClass} ${promotedClass}`.trim();
                    } else {
                        pieceElement = document.createElement("div");
                        const colorClass =
                            piece.color === "w" ? "white" : "black";
                        const promotedClass = piece.promoted ? "promoted" : "";
                        pieceElement.className =
                            `chushogi-piece ${colorClass} ${promotedClass}`.trim();
                        pieceElement.textContent = currentSymbol;
                        pieceElement.dataset.originalText = "";
                        pieceElement.dataset.temporaryPiece = "true";
                        destElement.appendChild(pieceElement);
                    }
                }
            }

            // Highlight alternate square for deselection
            if (this.promotionAlternateSquare) {
                const altElement = this.container.querySelector(
                    `[data-square="${this.promotionAlternateSquare}"]`,
                );
                if (altElement) {
                    altElement.classList.add("promotion-alternate");
                    // Hide any existing piece on alternate square
                    const pieceElement =
                        altElement.querySelector(".chushogi-piece");
                    if (pieceElement) {
                        pieceElement.dataset.originalText =
                            pieceElement.textContent;
                        pieceElement.dataset.originalClass =
                            pieceElement.className;
                        pieceElement.textContent = "";
                        pieceElement.className = "chushogi-piece";
                    }
                }
            }
        }

        closePromotionPrompt() {
            // Restore original piece display
            const destElement = this.container.querySelector(
                `[data-square="${this.promotionDestinationSquare}"]`,
            );
            if (destElement) {
                const pieceElement =
                    destElement.querySelector(".chushogi-piece");
                if (pieceElement) {
                    if (pieceElement.dataset.temporaryPiece === "true") {
                        // Remove temporary piece element
                        pieceElement.remove();
                    } else if (
                        pieceElement.dataset.originalText !== undefined
                    ) {
                        // Restore original text and classes
                        pieceElement.textContent =
                            pieceElement.dataset.originalText;
                        delete pieceElement.dataset.originalText;
                        // Restore original classes if they were changed
                        if (pieceElement.dataset.originalClass) {
                            pieceElement.className =
                                pieceElement.dataset.originalClass;
                            delete pieceElement.dataset.originalClass;
                        }
                    }
                }
            }

            if (this.promotionDeferralSquare) {
                const deferralElement = this.container.querySelector(
                    `[data-square="${this.promotionDeferralSquare}"]`,
                );
                if (deferralElement) {
                    const pieceElement =
                        deferralElement.querySelector(".chushogi-piece");
                    if (pieceElement) {
                        if (pieceElement.dataset.temporaryPiece === "true") {
                            // Remove temporary piece element
                            pieceElement.remove();
                        } else if (
                            pieceElement.dataset.originalText !== undefined
                        ) {
                            // Restore original text and classes
                            pieceElement.textContent =
                                pieceElement.dataset.originalText;
                            delete pieceElement.dataset.originalText;
                            // Restore original classes if they were changed
                            if (pieceElement.dataset.originalClass) {
                                pieceElement.className =
                                    pieceElement.dataset.originalClass;
                                delete pieceElement.dataset.originalClass;
                            }
                        }
                    } else {
                        // If no piece element exists but we expected one, create it from board state
                        // This handles cases where the deferral square piece was completely hidden
                        if (
                            this.promotionMove &&
                            this.promotionMove.isLionReturn
                        ) {
                            const midpointSquare =
                                this.promotionMove.midpointSquare;
                            if (
                                midpointSquare === this.promotionDeferralSquare
                            ) {
                                // Force regeneration from board state
                                const [rank, file] =
                                    this.parseSquareId(midpointSquare);
                                const boardPiece = this.board[rank][file];
                                if (boardPiece) {
                                    this.generatePieceHTML(
                                        deferralElement,
                                        boardPiece,
                                    );
                                }
                            }
                        }
                    }
                }
            }

            // Restore alternate square content if it was hidden
            if (this.promotionAlternateSquare) {
                const altElement = this.container.querySelector(
                    `[data-square="${this.promotionAlternateSquare}"]`,
                );
                if (altElement) {
                    const pieceElement =
                        altElement.querySelector(".chushogi-piece");
                    if (
                        pieceElement &&
                        pieceElement.dataset.originalText !== undefined
                    ) {
                        pieceElement.textContent =
                            pieceElement.dataset.originalText;
                        delete pieceElement.dataset.originalText;
                        if (pieceElement.dataset.originalClass) {
                            pieceElement.className =
                                pieceElement.dataset.originalClass;
                            delete pieceElement.dataset.originalClass;
                        }
                    }
                }
            }

            // For Lion return moves, ensure the deferral square (midpoint) is visually restored
            if (
                this.promotionMove &&
                this.promotionMove.isLionReturn &&
                this.promotionDeferralSquare
            ) {
                // Force a complete board update to restore visual state
                setTimeout(() => {
                    this.updateBoard();
                }, 0);
            }

            // Clear promotion prompt state BEFORE updating highlights so the
            // highlight update sees the correct (non-promotion) state.
            // Ordering fix: previously state was cleared AFTER updateSquareHighlights(),
            // which caused promotion-choice/promotion-source/promotion-origin-highlight
            // classes to be re-added then linger until the next board update.
            this.promotionPromptActive = false;
            this.promotionDestinationSquare = null;
            this.promotionDeferralSquare = null;
            this.promotionAlternateSquare = null;
            this.promotionMove = null;

            // Remove classes added by showPromotionPreviews (async via setTimeout).
            // These are not in allHighlightClasses so clearAll() and
            // updateSquareHighlights() never touch them; they must be removed explicitly.
            [
                "promotion-deferral",
                "promotion-destination",
                "promotion-alternate",
                "promotion-origin",
            ].forEach((cls) => {
                this.container
                    .querySelectorAll("." + cls)
                    .forEach((el) => el.classList.remove(cls));
            });

            // Restore proper highlighting with correct (non-promotion) state
            this.updateSquareHighlights();
        }

        executePromotionMove(shouldPromote) {
            console.log(
                "executePromotionMove called with shouldPromote:",
                shouldPromote,
                "promotionMove:",
                this.promotionMove,
            );
            if (!this.promotionMove) return;

            // Handle simplified Lion return moves (no promotion option)
            if (this.promotionMove.isLionReturnNoPromotion) {
                console.log(
                    "Executing simplified Lion return move (no promotion)",
                );

                const { from, to, piece, midpoint, capturedAtMidpoint } =
                    this.promotionMove;

                // Turn skip disambiguation: use the STORED capturedAtMidpoint (captured when prompt was shown)
                // because the board state changes before the prompt appears
                if (disambiguateMoves && !capturedAtMidpoint && from === to) {
                    console.log(
                        "Turn skip disambiguation: Converting Lion return to simple move (empty midpoint)",
                    );

                    const moveResult = this.moveExecutor.executeMove(
                        {
                            from,
                            to,
                            piece: piece,
                            captured: null,
                            promoted: false,
                        },
                        {
                            skipPromotionCheck: true,
                            skipPromotionPrompt: true,
                            skipLionReturnPrompt: true,
                        },
                    );

                    if (moveResult === false) {
                        console.log(
                            "Turn skip move was rejected, prompt state preserved for retry",
                        );
                        // Do NOT clear selection or close prompt - let user retry
                        // The prompt UI should still be visible
                    } else {
                        // Only close prompt after move succeeds
                        this.closePromotionPrompt();
                    }
                    return;
                }

                // Execute Lion double move without promotion
                const [toRank, toFile] = this.parseSquareId(to);
                const capturedPiece = this.board[toRank][toFile];

                console.log("About to execute Lion return move with data:", {
                    from,
                    to,
                    piece: piece.type,
                    midpoint,
                    capturedAtMidpoint,
                    promoted: false,
                });

                const moveResult = this.moveExecutor.executeMove(
                    {
                        from,
                        to,
                        piece: piece,
                        captured: capturedPiece,
                        promoted: false, // No promotion for this move
                        midpoint,
                        capturedAtMidpoint,
                        isLionReturn: true, // Critical: Mark this as a Lion return move for counter-strike detection
                    },
                    {
                        skipPromotionCheck: true,
                        skipPromotionPrompt: true,
                        skipLionReturnPrompt: true,
                        forcePromotion: false,
                    },
                );

                console.log("Lion return move execution result:", moveResult);

                // Only close prompt after move succeeds; on failure, preserve prompt state for retry
                if (moveResult === false) {
                    console.log(
                        "Lion return move was rejected, prompt state preserved for retry",
                    );
                    // Do NOT clear selection or close prompt - let user retry
                } else {
                    this.closePromotionPrompt();
                }

                return;
            }

            // Handle Lion double move promotion
            if (this.promotionMove.isDoubleMove) {
                console.log(
                    "Executing Lion double move promotion with shouldPromote:",
                    shouldPromote,
                );
                console.log("Full promotion move data:", this.promotionMove);

                const { from, to, piece, midpoint, capturedAtMidpoint } =
                    this.promotionMove;

                // Turn skip disambiguation: use the STORED capturedAtMidpoint (captured when prompt was shown)
                // Only disambiguate when ALL conditions are met:
                // 1. disambiguateMoves is enabled
                // 2. Midpoint was empty when prompt was shown (stored value)
                // 3. This is a Lion return (from === to)
                // 4. User chose deferral path (shouldPromote === false)
                // When user selects promotion, execute as normal two-step move to preserve promotion
                if (
                    disambiguateMoves &&
                    !capturedAtMidpoint &&
                    from === to &&
                    !shouldPromote
                ) {
                    console.log(
                        "Turn skip disambiguation: Converting Lion double move to simple move (empty midpoint, deferral path)",
                    );

                    const moveResult = this.moveExecutor.executeMove(
                        {
                            from,
                            to,
                            piece: piece,
                            captured: null,
                            promoted: false,
                        },
                        {
                            skipPromotionCheck: true,
                            skipPromotionPrompt: true,
                            skipLionReturnPrompt: true,
                        },
                    );

                    if (moveResult === false) {
                        console.log(
                            "Turn skip move was rejected, prompt state preserved for retry",
                        );
                        // Do NOT clear selection or close prompt - let user retry
                    } else {
                        // Only close prompt after move succeeds
                        this.closePromotionPrompt();
                    }
                    return;
                }

                // Execute Lion double move with promotion choice
                const [toRank, toFile] = this.parseSquareId(to);
                const capturedPiece = this.board[toRank][toFile];

                console.log("About to execute Lion double move with data:", {
                    from,
                    to,
                    piece: piece.type,
                    midpoint,
                    capturedAtMidpoint,
                    promoted: shouldPromote,
                });

                const moveResult = this.moveExecutor.executeMove(
                    {
                        from,
                        to,
                        piece: piece,
                        captured: capturedPiece,
                        promoted: shouldPromote,
                        midpoint,
                        capturedAtMidpoint,
                    },
                    {
                        skipPromotionCheck: true,
                        skipPromotionPrompt: true,
                        skipLionReturnPrompt: true,
                        forcePromotion: shouldPromote,
                    },
                );

                console.log("Lion double move execution result:", moveResult);

                // Only close prompt after move succeeds; on failure, preserve prompt state for retry
                if (moveResult === false) {
                    console.log(
                        "Lion double move promotion was rejected, prompt state preserved for retry",
                    );
                    // Do NOT clear selection or close prompt - let user retry
                } else {
                    this.closePromotionPrompt();
                }

                return;
            }

            // Lion return logic disabled - no longer handled via promotion system

            const { from, to, piece, isEdit } = this.promotionMove;

            // Validate that we have all required data
            if (!from || !to || !piece) {
                console.error(
                    "Invalid promotion move data:",
                    this.promotionMove,
                );
                this.closePromotionPrompt();
                return;
            }

            // Close the promotion prompt
            this.closePromotionPrompt();

            if (isEdit) {
                // Handle edit mode promotion directly without move execution
                const [toRank, toFile] = this.parseSquareId(to);

                // Apply promotion to the piece if shouldPromote is true
                const finalPiece = shouldPromote
                    ? this.promotionManager.applyPromotion(piece, true)
                    : piece;

                // Update the board directly for edit mode
                this.board[toRank][toFile] = finalPiece;
                this.clearSelection();
                this.updateBoard();
                this.updateDisplay();
            } else {
                // Execute the move using centralized move executor for normal moves
                console.log(
                    "Executing promotion move with shouldPromote:",
                    shouldPromote,
                );
                const [fromRank, fromFile] = this.parseSquareId(from);
                const [toRank, toFile] = this.parseSquareId(to);
                const capturedPiece = this.board[toRank][toFile];

                console.log("Before promotion application:", {
                    piece,
                    shouldPromote,
                });

                // For normal moves, pass the promotion choice directly to the move executor
                // Don't modify the piece beforehand - let the move executor handle promotion
                const moveData = {
                    from,
                    to,
                    piece: piece, // Use original piece, let moveExecutor handle promotion
                    captured: capturedPiece,
                    promoted: shouldPromote, // This is the user's choice
                };

                // Add Lion double move data if present
                if (this.promotionMove && this.promotionMove.midpoint) {
                    moveData.midpoint = this.promotionMove.midpoint;
                    moveData.capturedAtMidpoint =
                        this.promotionMove.capturedAtMidpoint;
                }

                const moveResult = this.moveExecutor.executeMove(moveData, {
                    skipPromotionCheck: true,
                    forcePromotion: shouldPromote, // Add explicit promotion flag
                });

                // If move was rejected (e.g., in puzzle mode), clear selection and highlights
                if (moveResult === false) {
                    console.log(
                        "Promotion move was rejected, clearing selection and highlights",
                    );
                    this.clearSelection();
                    this.highlightManager.updateAllIntelligent();
                }
            }
        }

        executeLionReturnPromotionMove(shouldPromote, lionReturnData = null) {
            const promotionData = lionReturnData || this.promotionMove;
            if (!promotionData || !promotionData.isLionReturn) {
                console.error(
                    "Invalid promotion move for Lion return",
                    promotionData,
                );
                return;
            }

            const {
                from: startSquare,
                midpointSquare,
                piece,
                capturedAtMidpoint,
            } = promotionData;

            // Execute Lion return using centralized move executor
            const moveResult = this.moveExecutor.executeMove(
                {
                    from: startSquare,
                    to: startSquare, // Lion returns to start
                    piece,
                    captured: null, // No capture at destination for Lion return
                    promoted: shouldPromote,
                    midpoint: midpointSquare,
                    capturedAtMidpoint,
                    isLionReturn: true,
                },
                { skipPromotionCheck: true },
            );

            // Clear double move state

            // Reset promotion state regardless of move result (clear prompt even if move rejected)
            if (this.promotionMove) {
                this.promotionMove = null;
            }
            this.lionReturnPromptActive = false;
            this.lionReturnAlternateSquare = null;

            // If move was rejected (e.g., in puzzle mode), clear selection and highlights
            if (moveResult === false) {
                console.log(
                    "Lion return promotion move was rejected, clearing selection and highlights",
                );
                this.clearSelection();
                this.highlightManager.updateAllIntelligent();
            }
        }

        executeDoublePromotionMove(shouldPromote, moveData = null) {
            console.log(
                "executeDoublePromotionMove called with shouldPromote:",
                shouldPromote,
            );
            const promotionMove = moveData || this.promotionMove;
            const {
                startSquare,
                midpointSquare,
                endSquare,
                piece,
                capturedAtMidpoint,
                capturedAtEnd,
            } = promotionMove;

            // Validate that we have all required data
            if (!startSquare || !endSquare || !piece) {
                console.error(
                    "Invalid double promotion move data:",
                    this.promotionMove,
                );
                return;
            }

            const [startRank, startFile] = this.parseSquareId(startSquare);
            const [midRank, midFile] = this.parseSquareId(midpointSquare);
            const [endRank, endFile] = this.parseSquareId(endSquare);

            // Execute double move using centralized move executor
            this.moveExecutor.executeMove(
                {
                    from: startSquare,
                    to: endSquare,
                    piece,
                    captured: capturedAtEnd,
                    promoted: shouldPromote,
                    midpoint: midpointSquare,
                    capturedAtMidpoint,
                },
                { skipPromotionCheck: true },
            );

            // Clear double move state

            // Clear promotion state
            this.promotionMove = null;
        }

        updateCurrentPlayer() {
            const previousPlayer = this.currentPlayer;
            let nextPlayer;

            // When a move was just made, the next player is simply the opposite of
            // whoever moved.  Using lastMove.piece.color is always correct and avoids
            // exportSFEN(), which reads isNavigating + currentNavigationIndex — both of
            // which are stale during a variation play (they still point at the
            // pre-variation position in the main line).
            if (this.lastMove && this.lastMove.piece) {
                nextPlayer = this.lastMove.piece.color === "b" ? "w" : "b";
            } else {
                // No last move yet (e.g. game just started) — fall back to SFEN.
                const currentSFEN = this.exportSFEN();
                const sfenParts = currentSFEN.split(" ");
                nextPlayer = sfenParts.length >= 2 ? sfenParts[1] : "b";
            }

            this.gameStateManager.updateGameState({ currentPlayer: nextPlayer });

            console.log("Turn updated:", {
                from: previousPlayer,
                to: this.currentPlayer,
                moveCount: this.moveHistory.length,
            });
        }

        setCurrentPlayer(player) {
            // Set the current player directly (used for navigation and SFEN application)
            this.currentPlayer = player;
        }

        // Helper function to get current player based on game state
        determineCurrentPlayer() {
            // Determine current player based on who made the last move
            if (this.lastMove && this.lastMove.piece) {
                return this.lastMove.piece.color === "b" ? "w" : "b";
            } else if (this.moveHistory.length > 0) {
                // Fall back to last move in history
                const lastHistoryMove =
                    this.moveHistory[this.moveHistory.length - 1];
                if (lastHistoryMove && lastHistoryMove.piece) {
                    return lastHistoryMove.piece.color === "b" ? "w" : "b";
                }
            }
            // No moves exist - return starting player
            return this.startingPlayer || "b";
        }

        // Helper function to get position display text
        getPositionDisplayText() {
            // Off-branch: show position within the current variation branch.
            if (this._viewedNode) {
                const { current, total } = this._branchPosition(this._viewedNode);
                return `<span translate="yes">Position</span> ${current} / ${total}`;
            }

            // Main-line: calculate current position based on navigation state.
            let currentPosition;
            if (this.currentNavigationIndex === null) {
                // At current position (not navigating) - show total moves
                currentPosition = this.moveHistory.length;
            } else if (this.currentNavigationIndex === -1) {
                // At starting position
                currentPosition = 0;
            } else if (this.currentNavigationIndex >= 0) {
                // At specific move in history
                currentPosition = this.currentNavigationIndex + 1;
            } else {
                // Fallback to starting position
                currentPosition = 0;
            }

            // In puzzle mode, show puzzle solution length as denominator
            let totalMoves;
            if (
                this.config.appletMode === "puzzle" &&
                this.puzzleSolution &&
                Array.isArray(this.puzzleSolution)
            ) {
                totalMoves = this.puzzleSolution.length;
            } else {
                totalMoves = this.moveHistory.length;
            }

            return `<span translate="yes">Position</span> ${currentPosition} / ${totalMoves}`;
        }

        viewPuzzleSolution() {
            // Block if not in puzzle mode
            if (this.config.appletMode !== "puzzle") {
                console.log("View Solution: Not in puzzle mode");
                return;
            }

            // Block if opponent is thinking or waiting for manual advance
            if (this.puzzleOpponentThinking) {
                console.log("View Solution: Blocked during opponent thinking");
                return;
            }

            if (this.puzzleWaitingForAdvance) {
                console.log(
                    "View Solution: Blocked during pause - press > to continue",
                );
                return;
            }

            // Check if we have a solution
            if (
                !this.puzzleSolution ||
                !Array.isArray(this.puzzleSolution) ||
                this.puzzleSolution.length === 0
            ) {
                alert("No puzzle solution available.");
                return;
            }

            // Confirm with user before showing solution
            const confirmed = confirm(
                `This will show the complete ${this.puzzleSolution.length}-move puzzle solution. Are you sure?`,
            );
            if (!confirmed) {
                console.log("View Solution: User cancelled");
                return;
            }

            console.log(
                "View Solution: Showing puzzle solution:",
                this.puzzleSolution,
            );

            // Import the complete puzzle solution to show all moves
            try {
                // Reset to starting position first
                this.goToStart();

                // Clear the current move history to start fresh
                this.gameStateManager.updateGameState({
                    moveHistory: [],
                });

                // Build solution string with comments included
                // Format: {startingComment} move1 {comment1} move2 {comment2}...
                // Use escapeComment to properly handle special characters
                let solutionParts = [];

                // Add starting comment if present
                if (this.startingComment) {
                    solutionParts.push(
                        `{${this.escapeComment(this.startingComment)}}`,
                    );
                }

                // Add each move with its comment
                for (let i = 0; i < this.puzzleSolution.length; i++) {
                    solutionParts.push(this.puzzleSolution[i]);
                    // Add comment if present for this move
                    if (
                        this.puzzleSolutionComments &&
                        this.puzzleSolutionComments[i]
                    ) {
                        solutionParts.push(
                            `{${this.escapeComment(this.puzzleSolutionComments[i])}}`,
                        );
                    }
                }

                const solutionString = solutionParts.join(" ");
                console.log(
                    "View Solution: Importing moves with comments:",
                    solutionString,
                );

                // Use the importGame method with just moves
                const importResult = this.importGame(solutionString);

                if (importResult) {
                    console.log(
                        "View Solution: Successfully imported complete solution",
                    );
                } else {
                    throw new Error("Failed to import puzzle solution");
                }
            } catch (error) {
                console.error("View Solution: Error showing solution:", error);
                alert(
                    "Error displaying puzzle solution. Check console for details.",
                );
            }
        }

        // Helper function to get move notation text
        getMoveNotationText() {
            // Calculate current position based on navigation state
            let currentPosition;
            if (this.currentNavigationIndex === null) {
                // At current position (not navigating) - show total moves
                currentPosition = this.moveHistory.length;
            } else if (this.currentNavigationIndex === -1) {
                // At starting position
                currentPosition = 0;
            } else if (this.currentNavigationIndex >= 0) {
                // At specific move in history
                currentPosition = this.currentNavigationIndex + 1;
            } else {
                // Fallback to starting position
                currentPosition = 0;
            }

            if (currentPosition === 0) {
                return "Starting Position";
            }

            const displayMove = this.getNavigationDisplayMove();
            return displayMove ? displayMove.notation : "";
        }

        // Helper function to get full position display text (combines position and move notation)
        getFullPositionDisplayText() {
            const positionText = this.getPositionDisplayText();
            if (this.config.showLastMove) {
                const moveNotation = this.getMoveNotationText();
                return `${positionText}\n${moveNotation}`;
            }
            return positionText;
        }

        // Legacy wrapper for Lion return promotion check
        checkPromotionForLionReturn(
            piece,
            fromRank,
            toRank,
            capturedPiece = null,
        ) {
            if (!piece || !piece.promoted) return false;

            const context = { isLionReturn: true };
            return this.promotionManager.checkEligibility(
                piece,
                fromRank,
                toRank,
                capturedPiece,
                context,
            );
        }

        calculateAlternateSquare(originSquare) {
            // CENTRALIZED: Use utils.coords for consistent alternate square calculation
            return utils.coords.calculateAlternateSquare(originSquare);
        }

        // Legacy confirmLionReturn function removed - now handled by promotion system

        calculateAlternateSquareForLionReturn(originSquare) {
            return this.calculateAlternateSquare(originSquare);
        }

        testDoubleMoveFunctionality() {
            console.log("Starting double move tests...");
            // Test basic double moves
            console.log("Testing Lion double moves...");
            // Implementation for testing double move functionality
        }
    }

    // ChuShogiLite object definition
    const ChuShogiLite = {
        // Initialize all game instances on the page
        initializeAll() {
            try {
                const containers = document.querySelectorAll(".chuShogiLite");
                console.log(
                    "Found containers for initialization:",
                    containers.length,
                );
                containers.forEach((container, index) => {
                    if (!container.chuShogiInstance) {
                        this.initialize(container);
                    }
                });
            } catch (error) {
                console.error("Error in initializeAll:", error);
            }
        },

        // Initialize a single game instance
        initialize(container, config = {}) {
            if (!container) return null;

            try {
                console.log("Initializing ChuShogi game instance");

                // Parse configuration from data attribute if not provided
                if (
                    Object.keys(config).length === 0 &&
                    container.dataset.config
                ) {
                    try {
                        config = JSON.parse(container.dataset.config);
                    } catch (e) {
                        console.warn(
                            "Invalid config JSON in data-config attribute:",
                            e,
                        );
                        config = {};
                    }
                }

                // Create new game instance
                console.log("Creating ChuShogiBoard instance");
                const game = new ChuShogiBoard(container, config);
                container.chuShogiInstance = game;
                console.log("ChuShogi game initialized successfully");
                return game;
            } catch (error) {
                console.error("Error initializing ChuShogi game:", error);
                container.innerHTML =
                    '<div style="padding: 20px; color: red;">Error loading ChuShogi game: ' +
                    error.message +
                    "</div>";
                return null;
            }
        },

        // Factory method for programmatic creation
        create(container, config = {}) {
            return this.initialize(container, config);
        },
    };

    // Export to global scope
    window.ChuShogiLite = ChuShogiLite;

    // Auto-initialize on DOM ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () =>
            ChuShogiLite.initializeAll(),
        );
    } else {
        ChuShogiLite.initializeAll();
    }
})(window);
