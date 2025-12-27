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
        P: { name: "Pawn", kanji: "歩", movement: "P", promotes: "+P" },
        I: { name: "Go-Between", kanji: "仲", movement: "I", promotes: "+I" },
        C: {
            name: "Copper General",
            kanji: "銅",
            movement: "C",
            promotes: "+C",
        },
        S: {
            name: "Silver General",
            kanji: "銀",
            movement: "S",
            promotes: "+S",
        },
        G: { name: "Gold General", kanji: "金", movement: "G", promotes: "+G" },
        F: {
            name: "Ferocious Leopard",
            kanji: "豹",
            movement: "F",
            promotes: "+F",
        },
        T: { name: "Blind Tiger", kanji: "虎", movement: "T", promotes: "+T" },
        E: {
            name: "Drunk Elephant",
            kanji: "象",
            movement: "E",
            promotes: "+E",
        },
        X: { name: "Phoenix", kanji: "鳳", movement: "X", promotes: "+X" },
        O: { name: "Kirin", kanji: "麒", movement: "O", promotes: "+O" },
        L: { name: "Lance", kanji: "香", movement: "L", promotes: "+L" },
        A: {
            name: "Reverse Chariot",
            kanji: "反",
            movement: "A",
            promotes: "+A",
        },
        M: { name: "Side Mover", kanji: "横", movement: "M", promotes: "+M" },
        V: {
            name: "Vertical Mover",
            kanji: "竪",
            movement: "V",
            promotes: "+V",
        },
        B: { name: "Bishop", kanji: "角", movement: "B", promotes: "+B" },
        R: { name: "Rook", kanji: "飛", movement: "R", promotes: "+R" },
        H: { name: "Dragon Horse", kanji: "馬", movement: "H", promotes: "+H" },
        D: { name: "Dragon King", kanji: "龍", movement: "D", promotes: "+D" },

        // Basic pieces that don't promote
        Q: { name: "Queen", kanji: "奔", movement: "Q", promotes: null },
        N: { name: "Lion", kanji: "獅", movement: "N", promotes: null },
        k: { name: "King", kanji: "玉", movement: "K", promotes: null },
        K: { name: "King", kanji: "王", movement: "K", promotes: null },

        // Promoted pieces (only appear upon promotion)
        // These should be accessed by the original piece type prefixed with '+'
        "+T": {
            name: "Flying Stag",
            kanji: "鹿",
            movement: "+T",
            promotes: null,
        }, // Blind Tiger -> Flying Stag
        "+E": { name: "Prince", kanji: "太", movement: "K", promotes: null }, // Drunk Elephant -> Prince (same as King)
        "+L": {
            name: "White Horse",
            kanji: "駒",
            movement: "+L",
            promotes: null,
        }, // Lance -> White Horse
        "+A": { name: "Whale", kanji: "鯨", movement: "+A", promotes: null }, // Reverse Chariot -> Whale
        "+M": {
            name: "Free Boar",
            kanji: "猪",
            movement: "+M",
            promotes: null,
        }, // Side Mover -> Free Boar
        "+V": {
            name: "Flying Ox",
            kanji: "牛",
            movement: "+V",
            promotes: null,
        }, // Vertical Mover -> Flying Ox
        "+H": {
            name: "Horned Falcon",
            kanji: "鷹",
            movement: "+H",
            promotes: null,
        }, // Dragon Horse -> Horned Falcon
        "+D": {
            name: "Soaring Eagle",
            kanji: "鷲",
            movement: "+D",
            promotes: null,
        }, // Dragon King -> Soaring Eagle

        // Additional promoted pieces based on original piece types and their promotion targets
        "+P": {
            name: "Gold General",
            kanji: "金",
            movement: "G",
            promotes: null,
        }, // Pawn -> Gold General
        "+I": {
            name: "Drunk Elephant",
            kanji: "象",
            movement: "E",
            promotes: null,
        }, // Go-Between -> Drunk Elephant
        "+C": {
            name: "Side Mover",
            kanji: "横",
            movement: "M",
            promotes: null,
        }, // Copper General -> Side Mover
        "+S": {
            name: "Vertical Mover",
            kanji: "竪",
            movement: "V",
            promotes: null,
        }, // Silver General -> Vertical Mover
        "+G": { name: "Rook", kanji: "飛", movement: "R", promotes: null }, // Gold General -> Rook
        "+F": { name: "Bishop", kanji: "角", movement: "B", promotes: null }, // Ferocious Leopard -> Bishop
        "+X": { name: "Queen", kanji: "奔", movement: "Q", promotes: null }, // Phoenix -> Queen
        "+O": { name: "Lion", kanji: "獅", movement: "N", promotes: null }, // Kirin -> Lion
        "+B": {
            name: "Dragon Horse",
            kanji: "馬",
            movement: "H",
            promotes: null,
        }, // Bishop -> Dragon Horse
        "+R": {
            name: "Dragon King",
            kanji: "龍",
            movement: "D",
            promotes: null,
        }, // Rook -> Dragon King
    };

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
                    lookupType = isWhite ? "K" : "k"; // White King uses "K" (王), Black King uses "k" (玉)
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
            this.selectedSquare = null;
            this.validMoves = [];
            this.repeatPromotionMoves = []; // Moves that violate repetition but are promotion-eligible
            this.illegalMoves = []; // Illegal moves when allowIllegalMoves is true
            this.lastMove = null;
            this.gameStatus = "playing";
            this.currentTab = "moves"; // Track current active tab
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

        // PUZZLE MODE FUNCTIONALITY
        initializePuzzle(gameData) {
            try {
                console.log(
                    "Puzzle: Initializing puzzle mode with data:",
                    gameData,
                );

                // Use unified loader to parse game data (same logic as importGame)
                const loadResult = this.loadGame(gameData);

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
              <span class="chushogi-turn-text">${this.currentPlayer === "b" ? "Black (先手)" : "White (後手)"}</span>
            </div>
          </div>
          <div class="chushogi-credit">
            ChuShogiLite by A. M. DeWitt
          </div>
        </div>
        <div class="chushogi-controls">
          <div class="chushogi-action-buttons">
            <div class="chushogi-drawing-controls">
              <input type="checkbox" data-drawing-shift title="Left = Red shapes" style="outline: 3px solid #00af0e;">
              <input type="checkbox" data-drawing-alt title="Right = Blue shapes" style="outline: 3px solid #00af0e;">
            </div>
            <button class="chushogi-btn" onclick="this.closest('.chushogi-container').chuShogiInstance.flipBoard()">🔄
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
                    ? `<button class="chushogi-btn" onclick="this.closest('.chushogi-container').chuShogiInstance.undo()">↶
            </button>`
                    : ""
            }
            ${
                !isViewOnly
                    ? `<button class="chushogi-btn" onclick="this.closest('.chushogi-container').chuShogiInstance.confirmNewGame()">⌫
            </button>`
                    : ""
            }
            ${
                !isPuzzle
                    ? `<button class="chushogi-btn" onclick="this.closest('.chushogi-container').chuShogiInstance.confirmReset()">⟳
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
            <div class="chushogi-tab ${this.currentTab === "moves" ? "active" : ""}" data-tab="moves">📋</div>
            ${!isFixedSettings ? `<div class="chushogi-tab ${this.currentTab === "settings" ? "active" : ""}" data-tab="settings">⚙️</div>` : ""}
            <div class="chushogi-tab ${this.currentTab === "export" ? "active" : ""}" data-tab="export">⇅</div>
            ${!isViewOnly && !isFixedStart && !isPuzzle ? `<div class="chushogi-tab ${this.currentTab === "edit" ? "active" : ""}" data-tab="edit">✏️</div>` : ""}
            <div class="chushogi-tab ${this.currentTab === "rules" ? "active" : ""}" data-tab="rules">ℹ️</div>
            <div class="chushogi-tab ${this.currentTab === "help" ? "active" : ""}" data-tab="help">❓</div>
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
            ${this.moveHistory
                .map(
                    (move, index) =>
                        `<div class="chushogi-move-item" data-move="${index}">${index + 1}. ${move.notation}</div>`,
                )
                .join("")}
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
          <div class="chushogi-setting-group">
            <h4>Game Export</h4>
            <textarea class="chushogi-textarea" translate="no" data-game-export readonly>Loading...</textarea>
            <button class="chushogi-btn-primary" onclick="this.closest('.chushogi-container').chuShogiInstance.exportGame()">
              ↓ Export Game
            </button>
          </div>

          ${
              isPuzzle
                  ? `<div class="chushogi-setting-group">
            <h4>Puzzle Solution</h4>
            <button class="chushogi-btn-primary" onclick="this.closest('.chushogi-container').chuShogiInstance.viewPuzzleSolution()" data-view-solution-btn>
              👁 View Solution
            </button>
          </div>`
                  : ""
          }

          ${
              !isViewOnly && !isPuzzle
                  ? `<div class="chushogi-setting-group">
            <h4>Game Import${isFixedStart ? " (Restricted)" : ""}</h4>
            <textarea class="chushogi-textarea" placeholder="Paste game in Game Export format (i. e. SFEN {StartComment} USIMove1 USIMove2 {Comment2}... or USIMove1 USIMove2...) here..." data-game-import=""></textarea>
            <button class="chushogi-btn-primary" onclick="this.closest('.chushogi-container').chuShogiInstance.importGameFromInput()">
              ↑ Import Game
            </button>
            ${isFixedStart ? `<p class="chushogi-help-text">Only moves-only games or games with a matching starting SFEN are allowed.</p>` : ""}
          </div>`
                  : ""
          }
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
                         ×
                       </div>`;
                        } else if (rowIndex === 0 && colIndex === 1) {
                            // Second empty square for Counter-strike rule selection
                            html += `<div class="chushogi-selector-square ${this.editMode.counterStrikeSelection ? "selected" : ""}" 
                         data-piece="counterstrike" 
                         onclick="this.closest('.chushogi-container').chuShogiInstance.selectPieceFromTable('counterstrike')"
                         title="Counter-strike Rule Selection">
                         🛡️
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
                            lookupType = isBlack ? "k" : "K"; // Black King uses "k" (玉), White King uses "K" (王)
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
              <button class="chushogi-btn-primary" onclick="this.closest('.chushogi-container').chuShogiInstance.clearBoard()">
                🗑️ Clear Board
              </button>

              <button class="chushogi-btn-primary" onclick="this.closest('.chushogi-container').chuShogiInstance.confirmSetStartPosition()">
                📍 Set Start Position
              </button>

              <div class="chushogi-edit-row">
                <label for="player-to-move">Player to Move:</label>
                <select class="chushogi-select" id="player-to-move" data-player-to-move>
                  <option value="b">Black (先手)</option>
                  <option value="w">White (後手)</option>
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
            <p>Chu Shogi (<span translate="no">中将棋 <i>chū shōgi</i></span>) is a two-player abstract strategy game native to Japan which is essentially 
a bigger version of Chess, which has been played since at least the 14th century. It is famous for its Lion 
piece, which moves as a King up to twice per turn.</p>
            <h4>Setup</h4>
            <p>Chu Shogi is played on a board of 12 ranks (rows) and 12 files (columns). The setup is as follows. Pieces are oriented with the top side facing the enemy, showing who controls what.</p>
            <table class="chuRulesDiagramTable">
            <tr>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">香</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">豹</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">銅</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">銀</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">金</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">象</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">王</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">金</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">銀</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">銅</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">豹</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">香</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">反</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">角</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">虎</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">鳳</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">麒</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">虎</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">角</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">反</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">横</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">竪</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">飛</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">馬</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">龍</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">奔</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">獅</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">龍</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">馬</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">飛</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">竪</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">横</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">歩</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">仲</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell flippedRulesDiagramCell" translate="no">仲</td>
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
            <td class="chuRulesDiagramTableCell" translate="no">仲</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell" translate="no">仲</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            <td class="chuRulesDiagramTableCell">&#160;</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell" translate="no">歩</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">横</td>
            <td class="chuRulesDiagramTableCell" translate="no">竪</td>
            <td class="chuRulesDiagramTableCell" translate="no">飛</td>
            <td class="chuRulesDiagramTableCell" translate="no">馬</td>
            <td class="chuRulesDiagramTableCell" translate="no">龍</td>
            <td class="chuRulesDiagramTableCell" translate="no">獅</td>
            <td class="chuRulesDiagramTableCell" translate="no">奔</td>
            <td class="chuRulesDiagramTableCell" translate="no">龍</td>
            <td class="chuRulesDiagramTableCell" translate="no">馬</td>
            <td class="chuRulesDiagramTableCell" translate="no">飛</td>
            <td class="chuRulesDiagramTableCell" translate="no">竪</td>
            <td class="chuRulesDiagramTableCell" translate="no">横</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">反</td>
            <td class="chuRulesDiagramTableCell" translate="no">&#160;</td>
            <td class="chuRulesDiagramTableCell" translate="no">角</td>
            <td class="chuRulesDiagramTableCell" translate="no">&#160;</td>
            <td class="chuRulesDiagramTableCell" translate="no">虎</td>
            <td class="chuRulesDiagramTableCell" translate="no">麒</td>
            <td class="chuRulesDiagramTableCell" translate="no">鳳</td>
            <td class="chuRulesDiagramTableCell" translate="no">虎</td>
            <td class="chuRulesDiagramTableCell" translate="no">&#160;</td>
            <td class="chuRulesDiagramTableCell" translate="no">角</td>
            <td class="chuRulesDiagramTableCell" translate="no">&#160;</td>
            <td class="chuRulesDiagramTableCell" translate="no">反</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">香</td>
            <td class="chuRulesDiagramTableCell" translate="no">豹</td>
            <td class="chuRulesDiagramTableCell" translate="no">銅</td>
            <td class="chuRulesDiagramTableCell" translate="no">銀</td>
            <td class="chuRulesDiagramTableCell" translate="no">金</td>
            <td class="chuRulesDiagramTableCell" translate="no">玉</td>
            <td class="chuRulesDiagramTableCell" translate="no">象</td>
            <td class="chuRulesDiagramTableCell" translate="no">金</td>
            <td class="chuRulesDiagramTableCell" translate="no">銀</td>
            <td class="chuRulesDiagramTableCell" translate="no">銅</td>
            <td class="chuRulesDiagramTableCell" translate="no">豹</td>
            <td class="chuRulesDiagramTableCell" translate="no">香</td>
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
            <td class="chuRulesDiagramTableCell" translate="no">歩</td>
            <td class="chuRulesDiagramTableCell">Pawn</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>金</i></td>
            <td class="chuRulesDiagramTableCell">Gold General</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">仲</td>
            <td class="chuRulesDiagramTableCell">Go-Between</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>象</i></td>
            <td class="chuRulesDiagramTableCell">Drunk Elephant</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">銅</td>
            <td class="chuRulesDiagramTableCell">Copper General</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>横</i></td>
            <td class="chuRulesDiagramTableCell">Side Mover</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">銀</td>
            <td class="chuRulesDiagramTableCell">Silver General</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>竪</i></td>
            <td class="chuRulesDiagramTableCell">Vertical Mover</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">金</td>
            <td class="chuRulesDiagramTableCell">Gold General</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>飛</i></td>
            <td class="chuRulesDiagramTableCell">Rook</td>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">豹</td>
            <td class="chuRulesDiagramTableCell">Ferocious Leopard</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>角</i></td>
            <td class="chuRulesDiagramTableCell">Bishop</td>
            </tr>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">虎</td>
            <td class="chuRulesDiagramTableCell">Blind Tiger</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>鹿</i></td>
            <td class="chuRulesDiagramTableCell">Flying Stag</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">象</td>
            <td class="chuRulesDiagramTableCell">Drunk Elephant</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>太</i></td>
            <td class="chuRulesDiagramTableCell">Prince</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">鳳</td>
            <td class="chuRulesDiagramTableCell">Phoenix</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>奔</i></td>
            <td class="chuRulesDiagramTableCell">Queen</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">麒</td>
            <td class="chuRulesDiagramTableCell">Kirin</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>獅</i></td>
            <td class="chuRulesDiagramTableCell">Lion</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">香</td>
            <td class="chuRulesDiagramTableCell">Lance</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>駒</i></td>
            <td class="chuRulesDiagramTableCell">White Horse</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">反</td>
            <td class="chuRulesDiagramTableCell">Reverse Chariot</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>鯨</i></td>
            <td class="chuRulesDiagramTableCell">Whale</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">横</td>
            <td class="chuRulesDiagramTableCell">Side Mover</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>猪</i></td>
            <td class="chuRulesDiagramTableCell">Free Boar</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">竪</td>
            <td class="chuRulesDiagramTableCell">Vertical Mover</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>牛</i></td>
            <td class="chuRulesDiagramTableCell">Flying Ox</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">角</td>
            <td class="chuRulesDiagramTableCell">Bishop</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>馬</i></td>
            <td class="chuRulesDiagramTableCell">Dragon Horse</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">飛</td>
            <td class="chuRulesDiagramTableCell">Rook</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>龍</i></td>
            <td class="chuRulesDiagramTableCell">Dragon King</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">馬</td>
            <td class="chuRulesDiagramTableCell">Dragon Horse</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>鷹</i></td>
            <td class="chuRulesDiagramTableCell">Horned Falcon</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">龍</td>
            <td class="chuRulesDiagramTableCell">Dragon King</td>
            <td class="chuRulesDiagramTableCell" translate="no"><i>鷲</i></td>
            <td class="chuRulesDiagramTableCell">Soaring Eagle</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">奔</td>
            <td class="chuRulesDiagramTableCell">Queen</td>
            <td class="chuRulesDiagramTableCell">-</td>
            <td class="chuRulesDiagramTableCell">-</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">獅</td>
            <td class="chuRulesDiagramTableCell">Lion</td>
            <td class="chuRulesDiagramTableCell">-</td>
            <td class="chuRulesDiagramTableCell">-</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell" translate="no">玉<br>王</td>
            <td class="chuRulesDiagramTableCell">King</td>
            <td class="chuRulesDiagramTableCell">-</td>
            <td class="chuRulesDiagramTableCell">-</td>
            </tr>
            </table>
            <h4>Deciding who goes first</h4>
            <p>Traditionally, the least skilled player goes first. However, the players may also decide who goes first through a game of chance or mutual agreement. The player who goes first is called Black (<span translate="no">先手 <i>sente</i></span>) and the other player is called White (<span translate="no">後手 <i>gote</i></span>). Black gets the King with the extra mark and vice versa.</p>
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
            <td class="chuRulesDiagramTableCell">●</td>
            <td class="chuRulesDiagramTableCell">Jumps to this square, ignoring any intervening piece</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">│</td>
            <td class="chuRulesDiagramTableCell" rowspan="4">Slide any number of squares in a straight line, stopping at the first capture or short of the first friendly piece.</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">―</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">╲</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">╱</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell"><b>※</b></td>
            <td class="chuRulesDiagramTableCell">Moves to this square, then optionally moves to any orthogonally or diagonally adjacent square in the same turn.</td>
            </tr>
            <tr>
            <td class="chuRulesDiagramTableCell">‡</td>
            <td class="chuRulesDiagramTableCell">Moves to this square, then optionally moves to the starting square or the next square in the same direction in the same turn.</td>
            </tr>
            </table>
            <h4>Movement Diagrams</h4>
            <p>Promoted pieces that appear in the setup move identically to their unpromoted counterparts.</p>
            <table style="width:250px;">
            <tr>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Pawn</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">歩</td>
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
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">仲</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
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
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">銅</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
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
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">銀</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Gold General</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">金</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
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
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">豹</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
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
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">虎</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Drunk Elephant</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">象</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
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
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">香</td>
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
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">反</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
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
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">横</td>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
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
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">竪</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
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
                <td class="chuRulesLargeDiagramTableCell">╲</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">角</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
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
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">飛</td>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
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
                <td class="chuRulesLargeDiagramTableCell">╲</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">馬</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
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
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">龍</td>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Queen</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">奔</td>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">King<br><span translate="no">玉</span> / <span translate="no">王</span></th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">王</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
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
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>太</i></td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">White Horse</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>駒</i></td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
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
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>鯨</i></td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
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
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>鹿</i></td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Free Boar</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>猪</i></td>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="3">Flying Ox</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>牛</i></td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
                </tr>
                </table>
            </td>
            </tr>
            </table>
            <table style="width:254px;">
            <tr>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="5">Phoenix</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">鳳</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
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
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">麒</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
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
                <td class="chuRulesLargeDiagramTableCell">╲</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
                <td class="chuRulesLargeDiagramTableCell">‡</td>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>鷹</i></td>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
                </tr>
                </table>
            </td>
            <td>
                <table class="chuRulesDiagramTable">
                <tr>
                <td class="chuRulesLargeDiagramTableCell" colspan="5">Soaring Eagle</th>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">‡</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">‡</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                <td class="chuRulesLargeDiagramTableCell" translate="no"><i>鷲</i></td>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                <td class="chuRulesLargeDiagramTableCell">―</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">╱</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">│</td>
                <td class="chuRulesLargeDiagramTableCell">&#160;</td>
                <td class="chuRulesLargeDiagramTableCell">╲</td>
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
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell"><b>※</b></td>
                <td class="chuRulesLargeDiagramTableCell"><b>※</b></td>
                <td class="chuRulesLargeDiagramTableCell"><b>※</b></td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell"><b>※</b></td>
                <td class="chuRulesLargeDiagramTableCell" translate="no">獅</td>
                <td class="chuRulesLargeDiagramTableCell"><b>※</b></td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell"><b>※</b></td>
                <td class="chuRulesLargeDiagramTableCell"><b>※</b></td>
                <td class="chuRulesLargeDiagramTableCell"><b>※</b></td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                </tr>
                <tr>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
                <td class="chuRulesLargeDiagramTableCell">●</td>
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
            <li>A non-Lion cannot capture a Lion when in the immediately preceding turn a Lion
was captured by a non-Lion on another square.
                <ul>
                <li>This includes double moves from Horned Falcons and Soaring Eagles.</li>
                <li>The stipulation “another square” means that if a Kirin captures a Lion, it can always be
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
            <p>A player is in check when all their royal pieces (Kings and Princes) could be captured on the opponent’s next move. Players are not required to keep their royal(s) out of check, and can even move into check, though this is almost always a blunder.</p>
            <p>A player with two royals (i.e. a King and a Prince) may sacrifice one of them without losing the game.</p>
            <p>If a player has no legal moves that will keep at least one of their Kings out of check, regardless of whether they are in check or not, that player is mated and has effectively lost the game.</p>
            <h4>End of the Game</h4>
            <p>A player wins when they capture all their opponent’s royal pieces (Kings and Princes).</p>
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
            <h4>🧩 Puzzle</h4>
            <div class="chushogi-help-content">
              <p><strong>About Puzzle Mode:</strong></p>
              <p>You are solving a Chu Shogi puzzle! This puzzle validates your moves against a predetermined solution sequence to help you learn tactics and strategy.</p>

              <p><strong>How the Puzzle Works:</strong></p>
              <ul>
                <li>Play moves as the solving player (highlighted in the turn indicator)</li>
                <li>The opponent's responses are usually played automatically according to the solution</li>
                <li>If your move has commentary, the opponent will wait until you press the > button or → key to play the next move.</li>
                <li>Your moves must match the expected solution sequence to progress</li>
                <li>Incorrect moves will be rejected and deselect the moving piece</li>
                <li>The Info tab shows your progress: current position / total solution length</li>
              </ul>

              <p><strong>Puzzle-Specific Features:</strong></p>
              <ul>
                <li><strong>View Solution:</strong> In the ⇅ Export/Import tab, use "View Solution" to see the complete answer</li>
                <li><strong>Move Validation:</strong> Only solution moves are accepted - this helps ensure you understand the correct tactical sequence</li>
                <li><strong>Progress Display:</strong> Shows progress as "X / Y" in the 📋 Info tab, where X is the number of moves made and Y is the total number of moves in the puzzle solution</li>
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
                <li>🔄 Flip View: Flips the board view</li>
                <li>|&lt; or ↑ key: navigates to starting position</li>
                <li>&lt; or ← key: navigates one move backward</li>
                <li>> or → key: navigates one move forward</li>
                <li>>| or ↓ key: navigates to current position</li>
                ${!isViewOnly ? "<li>↶: undoes the last move</li>" : ""}
                ${!isViewOnly ? "<li>⌫: starts a new game</li>" : ""}
                ${!isPuzzle ? "<li>⟳: resets the board to its original state</li>" : ""}
              </ul>
              <p><strong>Sidebar:</strong></p>
              <p>Use the tabs to switch between different panels</p>
              <ul>
                <li>📋 Info: Shows information about the current game</li>
                <li>⚙️ Settings: Shows available settings${isViewOnly ? " (some settings are restricted in view-only mode)" : ""}</li>
                <li>⇅ Export/Import: Allows for games to be exported to plaintext${!isViewOnly ? (isFixedStart ? " and imported from plaintext (imports restricted to same starting position)" : " and imported from plaintext") : " (Game imports not available in viewOnly mode)"}${isPuzzle ? " and has a 'View Solution' button to reveal the complete puzzle answer" : ""}</li>
                ${!isViewOnly && !isFixedStart && !isPuzzle ? "<li>✏️ Edit: Allows the board to be edited without importing a game</li>" : ""}
                <li>ℹ️ Rules: Explains the rules of Chu Shogi and displays the current Rules Settings</li>
                <li>❓ Help: This help window</li>
              </ul>
              <p><strong>Info:</strong></p>
              <p>The 📋 Info tab shows all information relative to the game.</p>
              <ul>
              <li><strong>Display SFEN:</strong> checkbox - shows the current SFEN instead of the current comment if checked</li>
              <li><strong>Display inline notation:</strong> checkbox - puts all moves in the Game Log on a single line if checked</li>
              </ul>
              ${this.config.allowCustomComments ? "<p>When comments are shown, the current coomment can be edited by typing in the comment display window.</p>" : ""}
              ${
                  !isViewOnly
                      ? `<p><strong>Settings:</strong></p>
              <p>The ⚙️ Setting tab allows for various settings to be changed for a variety of effects.</p>
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
              <p>The ⚙️ Setting tab shows visual display settings (game-changing settings are restricted in view-only mode).</p>
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
              <p>The ⇅ Export/Import tab allows for games to be exported to plaintext${!isViewOnly && !isPuzzle ? (isFixedStart ? " and imported from plaintext (imports restricted)." : " and imported from plaintext.") : "."}.${isPuzzle ? " For puzzles, a 'View Solution' button to reveal the complete puzzle answer, and imports are not available." : ""}</p><p>The format used for a game's plaintext is very simple: an SFEN followed by a sequence of moves in Universal Shogi Notation (USI) and optional comments enclosed in {} curly brackets, all separated by spaces. Alternatively, you can import just the moves (without SFEN) to continue from the current game's starting position.${isFixedStart ? " Imports are restricted to moves-only format or games that start from the same position." : ""} An example is provided in the Game Export section.</p>
              <p>SFEN {StartComment} USIMove1 USIMove2 {Comment2}...</p>
              <p>A comment for a move is placed immediately after that move, and the comment for the starting position is placed just before the first move.</p>
              <ul>
                <li>To copy the current game's plaintext, click Export Game</li>
                ${
                    !isViewOnly && !isPuzzle
                        ? `<li>To import a game, paste it's plaintext into the Game Import text area and press Import Game
                <ul>
                  <li>Importing a game will overwrite the current game</li>
                </ul>
                </li>`
                        : ""
                }
              </ul>
              <p>Comments have three special escape characters used to encode certain characters within the Game Export String:</p>
              <ul>
              <li><strong>\\}</strong>: } closing curly bracket within comment</li>
              <li><strong>\\\\</strong>: \\ backslash</li>
              <li><strong>\\n</strong>: newline character</li>
              </ul>
              ${
                  !isViewOnly && !isFixedStart && !isPuzzle
                      ? `<p><strong>Editing the Board:</strong></p>
              <p>The ✏️ Edit tab allows the board to be edited without importing a game.</p>
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
                  <li>Click an empty board square to relax the rule</li>
                  <li>A highlight will show the current state while the ✏️ Edit tab is open</li>
                </ul>
                </li>
                <li>⟳: clears all board edits while the ✏️ Edit tab is open</li>
                <li>🗑️ Clear Board: empties the board</li>
                <li>📍 Set Start Position: starts a new game and sets the starting position to the current position
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
                <li><strong>startGame:</strong> Game Export string (i. e. SFEN {StartComment} USIMove1 USIMove2 {Comment2}... or USIMove1 USIMove2...), <span style="text-decoration:underline">null</span></li>
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
                console.log("Board clicks blocked - press > or → to continue");
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

            // Prevent moves during navigation (only for normal play mode)
            if (this.isNavigating) {
                console.log(
                    "Cannot make moves while navigating history. Use the navigation buttons to return to current position first.",
                );
                return;
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
            // Create cache key based on current game state
            // Include allowIllegalMoves in cache key since it affects which pieces are moveable
            const cacheKey = `${this.currentPlayer}_${this.moveHistory.length}_${this.config.allowIllegalMoves}`;

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
            this.moveHistory.push({
                from: fromSquare,
                to: toSquare,
                piece: { ...movingPiece }, // Store original piece state for undo
                captured: capturedPiece,
                promoted: promote,
                notation: moveNotation,
                lionCapture: this.lastLionCapture, // Store Lion capture state with each move
                previousLionCapture:
                    this.moveHistory.length > 0
                        ? this.moveHistory[this.moveHistory.length - 1]
                              .lionCapture
                        : this.lastLionCapture, // Preserve previous state for proper tracking
                resultingSFEN: "", // Will be set after player update
                comment: "", // Comment for this move
            });
            this.lastMove = this.moveHistory[this.moveHistory.length - 1];

            // Update current player based on last move
            // allowIllegalMoves should only affect move validation, not turn order
            this.updateCurrentPlayer();

            // Update the stored SFEN with correct player turn
            // For allowIllegalMoves mode, resultingSFEN should show the non-moving player
            if (this.config.allowIllegalMoves && this.lastMove.piece) {
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

            // Reset navigation state to current position after making a move
            this.currentNavigationIndex = null;
            this.isNavigating = false;

            // Update display
            this.updateBoard();
            this.updateDisplay();
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

                // Pre-calculate moveable pieces if setting is enabled (not during edit or navigation)
                const moveablePieces =
                    this.config.showMoveablePieces &&
                    this.currentTab !== "edit" &&
                    this.currentNavigationIndex === null
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
                        // Origin square gets selection highlight (for deselection) but NOT the × symbol
                        // Only apply after destination and deferral squares are set to avoid premature highlighting
                        if (
                            this.promotionMove &&
                            squareId === this.promotionMove.from &&
                            this.promotionDestinationSquare !== null &&
                            this.promotionDestinationSquare !== undefined &&
                            this.promotionDeferralSquare !== null &&
                            this.promotionDeferralSquare !== undefined
                        ) {
                            const isCoveredByDestination =
                                squareId === this.promotionDestinationSquare;
                            const isCoveredByDeferral =
                                squareId === this.promotionDeferralSquare;
                            if (
                                !isCoveredByDestination &&
                                !isCoveredByDeferral
                            ) {
                                // Use dedicated class for highlight without × symbol
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

                // Always highlight the origin square during promotion prompts
                if (this.promotionMove && this.promotionMove.from) {
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

                // Validate move in puzzle mode (after promotion prompt handling)
                if (this.config.appletMode === "puzzle") {
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
                        this.moveHistory.length > 0
                            ? this.moveHistory[this.moveHistory.length - 1]
                                  .lionCapture
                            : this.startingLionCapture,
                    resultingSFEN: "", // Will be set after player update
                    comment: "", // Comment for this move
                    ...(midpoint && {
                        midpoint,
                        capturedAtMidpoint,
                    }),
                    ...(isLionReturn && { isLionDouble: true }),
                };

                // Add move to history first
                this.moveHistory.push(moveRecord);
                this.lastMove = moveRecord;

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
                                "Puzzle: Paused - waiting for player to press > or →",
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

                // Store SFEN with correct player turn and move count
                // For allowIllegalMoves mode, resultingSFEN should show the non-moving player
                if (this.config.allowIllegalMoves) {
                    moveRecord.resultingSFEN = this.exportSFENWithPlayer(
                        piece.color === "b" ? "w" : "b",
                    );
                } else {
                    moveRecord.resultingSFEN = this.exportSFEN();
                }

                // Reset navigation state to current position after making a move
                // Skip this during import - state will be set correctly after import completes
                if (!this.isImporting) {
                    this.currentNavigationIndex = null; // null = at current position
                    this.isNavigating = false;
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
                            "EventManager: Board clicks blocked - press > or → to continue",
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
                        // Update game export to reflect the change
                        this.updateGameExport();
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
                }

                // Ensure navigation state consistency
                if (this.isNavigating && this.currentNavigationIndex === null) {
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

            // Block piece movement clicks in viewOnly mode (but allow drawing clearing above)
            if (this.config.appletMode === "viewOnly") {
                console.log("Piece movement clicks blocked in viewOnly mode");
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

            // Prevent moves during navigation (only for normal play mode)
            if (this.isNavigating) {
                console.log(
                    "Cannot make moves while navigating history. Use the navigation buttons to return to current position first.",
                );
                return;
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
                }
            } else {
                // No square selected - select if it's current player's piece
                if (
                    piece &&
                    (this.config.allowIllegalMoves ||
                        piece.color === this.currentPlayer)
                ) {
                    this.selectSquare(squareId);
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

            // Clear double move state
            this.deselectSquare();
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
                    // - Pawn (P/歩)
                    // - Go-between (I/仲)
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
  "allowCustomComments": true,
  "midpointProtection": false,
  "trappedLancePromotion": false,
  "repetitionHandling": "strict"
}'>
</div>

`;
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
                    if (this.currentNavigationIndex === -1) {
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
            if (moveList) {
                if (this.config.displayInlineNotation) {
                    // Inline notation: display all moves in a single line using spans
                    const startingSpan =
                        '<span class="chushogi-move-item-inline clickable" data-move="start">Starting Position</span>';
                    const moveSpans = this.moveHistory
                        .map(
                            (move, index) =>
                                `<span class="chushogi-move-item-inline clickable" data-move="${index}">${index + 1}. ${move.notation}</span>`,
                        )
                        .join(" ");
                    moveList.innerHTML =
                        startingSpan +
                        (this.moveHistory.length > 0 ? " " + moveSpans : "");
                } else {
                    // Default: display moves in individual rows
                    moveList.innerHTML =
                        '<div class="chushogi-move-item clickable" data-move="start">Starting Position</div>' +
                        this.moveHistory
                            .map(
                                (move, index) =>
                                    `<div class="chushogi-move-item clickable" data-move="${index}">${index + 1}. ${move.notation}</div>`,
                            )
                            .join("");
                }

                // Add click handlers to move items
                const moveItems = moveList.querySelectorAll(
                    ".chushogi-move-item.clickable, .chushogi-move-item-inline.clickable",
                );
                moveItems.forEach((item) => {
                    item.addEventListener("click", (e) => {
                        const moveIndex = e.target.getAttribute("data-move");
                        if (moveIndex === "start") {
                            this.navigateToPosition("start");
                        } else {
                            this.navigateToPosition(parseInt(moveIndex));
                        }
                    });
                });
            }
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

        // SFEN (Shogi Forsyth–Edwards Notation) support
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

            // Check all move history
            for (const move of this.moveHistory) {
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
            // White (後手): forward is down the board (a→l) = increasing rank = +1
            // Black (先手): forward is up the board (l→a) = decreasing rank = -1
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
            // White (後手): forward is down the board (a→l) = increasing rank
            // Black (先手): forward is up the board (l→a) = decreasing rank
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
            // White (後手): forward is down the board (a→l) = increasing rank = +1
            // Black (先手): forward is up the board (l→a) = decreasing rank = -1
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

            // Try both royal capture orders: R1→R2 and R2→R1
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
                    // Regular backslash escaping: \\ → \
                    return (
                        "\\".repeat(Math.floor(backslashCount / 2)) +
                        (backslashCount % 2 === 1 ? "\\" + nextChar : nextChar)
                    );
                }
            });
        }

        // Export game in USI format (starting SFEN + space-separated moves)
        exportGame() {
            const exportTextarea =
                this.container.querySelector("[data-game-export]");
            if (!exportTextarea) return;

            // Start with the starting SFEN
            let gameExport = this.startingSFEN || this.exportSFEN();

            // Add starting position comment if it exists
            if (this.startingComment && this.startingComment.trim()) {
                gameExport +=
                    " {" + this.escapeComment(this.startingComment) + "}";
            }

            // Add moves in USI notation with comments
            if (this.moveHistory.length > 0) {
                for (const move of this.moveHistory) {
                    const usi = this.moveToUSI(move);
                    if (usi) {
                        gameExport += " " + usi;
                        // Add comment for this move if it exists
                        if (move.comment && move.comment.trim()) {
                            gameExport +=
                                " {" + this.escapeComment(move.comment) + "}";
                        }
                    }
                }
            }

            exportTextarea.value = gameExport;

            // Select the text for easy copying
            exportTextarea.select();
            exportTextarea.setSelectionRange(0, 99999); // For mobile devices

            // Try to copy to clipboard
            try {
                document.execCommand("copy");
                console.log("Game exported and copied to clipboard");
            } catch (err) {
                console.log("Game exported (copy to clipboard failed)");
            }
        }

        // Update game export automatically
        updateGameExport() {
            const exportTextarea =
                this.container.querySelector("[data-game-export]");
            if (!exportTextarea) return;

            // Start with the starting SFEN
            let gameExport = this.startingSFEN || this.exportSFEN();

            // Add starting position comment if it exists
            if (this.startingComment && this.startingComment.trim()) {
                gameExport +=
                    " {" + this.escapeComment(this.startingComment) + "}";
            }

            // Add moves in USI notation with comments
            if (this.moveHistory.length > 0) {
                for (const move of this.moveHistory) {
                    const usi = this.moveToUSI(move);
                    if (usi) {
                        gameExport += " " + usi;
                        // Add comment for this move if it exists
                        if (move.comment && move.comment.trim()) {
                            gameExport +=
                                " {" + this.escapeComment(move.comment) + "}";
                        }
                    }
                }
            }

            exportTextarea.value = gameExport;
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

        goBackOneMove() {
            if (this.moveHistory.length === 0) return; // No moves to navigate

            if (
                this.currentNavigationIndex === null ||
                this.currentNavigationIndex === this.moveHistory.length - 1
            ) {
                // Currently at current position, go to position before last move
                if (this.moveHistory.length > 1) {
                    this.navigateToPosition(this.moveHistory.length - 2);
                } else if (this.moveHistory.length === 1) {
                    // Only one move, go to start position
                    this.navigateToPosition("start");
                }
            } else if (this.currentNavigationIndex > 0) {
                // Go back one more move
                this.navigateToPosition(this.currentNavigationIndex - 1);
            } else if (this.currentNavigationIndex === 0) {
                // Go to start position
                this.navigateToPosition("start");
            } else if (this.currentNavigationIndex === -1) {
                // Already at start, can't go back further
                return;
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

            if (
                this.currentNavigationIndex === null ||
                this.currentNavigationIndex === this.moveHistory.length - 1
            ) {
                // Already at current position
                return;
            }

            if (
                this.currentNavigationIndex === -1 &&
                this.moveHistory.length > 0
            ) {
                // At start position, go to position after first move
                this.navigateToPosition(0);
            } else if (
                this.currentNavigationIndex >= 0 &&
                this.currentNavigationIndex < this.moveHistory.length - 1
            ) {
                // Go forward one move
                this.navigateToPosition(this.currentNavigationIndex + 1);
            }
        }

        goToCurrent() {
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

        // Check if we can make moves (not navigating)
        canMakeMove() {
            if (this.isNavigating) {
                console.log(
                    "Cannot make moves while navigating history. Use the navigation buttons to return to current position first.",
                );
                return false;
            }
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
            let gameExport = this.startingSFEN || this.exportSFEN();

            // Add starting position comment if it exists
            if (this.startingComment && this.startingComment.trim()) {
                gameExport +=
                    " {" + this.escapeComment(this.startingComment) + "}";
            }

            // Add moves in USI notation with comments
            if (this.moveHistory.length > 0) {
                for (const move of this.moveHistory) {
                    const usi = this.moveToUSI(move);
                    if (usi) {
                        gameExport += " " + usi;
                        // Add comment for this move if it exists
                        if (move.comment && move.comment.trim()) {
                            gameExport +=
                                " {" + this.escapeComment(move.comment) + "}";
                        }
                    }
                }
            }

            return gameExport;
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
                this.lastMove = null;
                this.lastLionCapture = null;
                this.startingLionCapture = null;
                this.clearSelection();

                // Reset navigation state
                this.currentNavigationIndex = -1;
                this.isNavigating = false;
            }
            this.updateDisplay();
            this.updateMoveHistoryHighlight();
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
            this.lastMove = null;
            this.lastLionCapture = null;
            this.startingLionCapture = null;
            this.clearSelection();
            this.updateDisplay();
        }

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
                    "Undo blocked during puzzle pause - press > or → to continue",
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
                    // Show confirmation prompt if more than 9 moves will be deleted
                    if (movesToDelete > 9) {
                        const confirmed = confirm(
                            `Delete ${movesToDelete} moves?`,
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
                    const targetLength =
                        currentPosition === -1 ? 0 : currentPosition + 1;
                    newMoveHistory.splice(targetLength);

                    this.gameStateManager.updateGameState({
                        moveHistory: newMoveHistory,
                    });

                    console.log("Undo: Bulk deleted moves from navigation", {
                        deletedMoves: movesToDelete,
                        newHistoryLength: this.moveHistory.length,
                        fromPosition: currentPosition,
                    });

                    // Reset navigation state - stay at the current displayed position
                    this.currentNavigationIndex = null;
                    this.isNavigating = false;

                    // Clear all drawings when undoing
                    this.clearAllDrawings();

                    // Update display to reflect the new state
                    this.updateDisplay();

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

            // Now remove the move from history using centralized state management
            const newMoveHistory = [...this.moveHistory];
            newMoveHistory.pop();

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

            console.log("Undo: Reset navigation state - moves now allowed");

            // Clear all drawings when undoing
            this.clearAllDrawings();

            // Update display to reflect the new state
            this.updateDisplay();

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
                    newMoveHistory.splice(targetLength);

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

                    // Clear all drawings when undoing
                    this.clearAllDrawings();

                    // Update display to reflect the new state
                    this.updateDisplay();

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

            this.gameStateManager.updateGameState({
                moveHistory: newMoveHistory,
            });

            console.log("Undo: Removed move from history", {
                undoneMove: lastMove.notation,
                newHistoryLength: this.moveHistory.length,
            });

            this.currentNavigationIndex = null;
            this.isNavigating = false;
            this.clearAllDrawings();
            this.updateDisplay();

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
            // Clear any selections and highlights
            this.clearSelection();
            this.clearHighlights();

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
                ((target === "start" || target === -1) && this.moveHistory.length === 0);

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

        getNavigationDisplayMove() {
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

            if (this.currentNavigationIndex === -1) {
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
                return "(Press > or → key to proceed)\n" + comment;
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

            // Determine current state
            const isAtCurrentPosition =
                !this.isNavigating &&
                (this.currentNavigationIndex === null ||
                    this.currentNavigationIndex ===
                        this.moveHistory.length - 1);

            if (this.currentNavigationIndex === -1) {
                // Highlight starting position
                const startItem = this.container.querySelector(
                    '[data-move="start"]',
                );
                if (startItem) {
                    startItem.classList.add(
                        isAtCurrentPosition ? "current" : "selected",
                    );
                }
            } else if (
                this.currentNavigationIndex !== null &&
                this.currentNavigationIndex >= 0
            ) {
                // Highlight specific move
                const moveItem = this.container.querySelector(
                    `[data-move="${this.currentNavigationIndex}"]`,
                );
                if (moveItem) {
                    moveItem.classList.add(
                        isAtCurrentPosition ? "current" : "selected",
                    );
                }
            } else if (this.moveHistory.length > 0) {
                // Default to last move if no navigation index set
                const lastMoveItem = this.container.querySelector(
                    `[data-move="${this.moveHistory.length - 1}"]`,
                );
                if (lastMoveItem) {
                    lastMoveItem.classList.add("current");
                }
            } else {
                // No moves, highlight starting position
                const startItem = this.container.querySelector(
                    '[data-move="start"]',
                );
                if (startItem) {
                    startItem.classList.add("current");
                }
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

        // Import game in USI format (SFEN + space-separated moves, or just moves)
        importGame(gameString) {
            // Use unified loader to parse game data
            const loadResult = this.loadGame(gameString);

            if (!loadResult.success) {
                alert("Import error: " + loadResult.error);
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

            // Special case: If only a comment was provided (no text parts)
            // This should clear all moves and reset to starting position
            if (commentOnly) {
                if (startingComment !== undefined && startingComment !== "") {
                    // Reset to starting position and clear all moves
                    const resetSFEN =
                        this.startingSFEN ||
                        "lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b - 1";

                    if (!this.loadSFEN(resetSFEN)) {
                        alert("Failed to reset position.");
                        return false;
                    }

                    // Set the starting comment
                    this.startingComment = startingComment;
                    console.log(
                        `Import: Cleared moves and set starting comment: "${startingComment}"`,
                    );

                    // Update display to show the new comment and cleared moves
                    this.updateDisplay();
                    return true;
                } else {
                    // No text parts and no comment - this is an error
                    alert("No game data provided.");
                    return false;
                }
            }

            // Store starting comment
            this.startingComment = startingComment;

            // fixedStart mode restriction: only allow imports with same starting position
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

            // Load the starting position (this clears move history)
            if (!this.loadSFEN(sfen)) {
                alert("Invalid starting position in game import.");
                return false;
            }

            // Clear any remaining state that might interfere
            this.clearSelection();
            this.clearHighlights();

            // Clear all prompt states
            this.promotionPromptActive = false;
            this.lionReturnPromptActive = false;

            // Set import mode flag to skip promotion prompts and batch updates
            this.isImporting = true;
            this.isBatchImporting = true; // New flag for performance optimization

            // Execute moves one by one with reduced logging
            let moveCount = 0;
            for (const usiMove of moves) {
                // Reduce console logging during batch import
                if (moveCount % 50 === 0) {
                    console.log(
                        `Importing moves... ${moveCount}/${moves.length}`,
                    );
                }

                if (!this.executeUSIMove(usiMove)) {
                    alert(
                        `Invalid move at position ${moveCount + 1}: ${usiMove}. Import stopped.`,
                    );
                    break;
                }

                // Assign comment to the move that was just added to history
                if (
                    moveCount < moveComments.length &&
                    this.moveHistory.length > 0
                ) {
                    const lastMoveIndex = this.moveHistory.length - 1;
                    this.moveHistory[lastMoveIndex].comment =
                        moveComments[moveCount];
                }

                moveCount++;
            }

            // Clear import mode flags
            this.isImporting = false;
            this.isBatchImporting = false;

            // Set last move highlighting from the most recent move in history
            if (this.moveHistory.length > 0) {
                const lastMoveInHistory =
                    this.moveHistory[this.moveHistory.length - 1];
                // Use the complete move object from history for proper highlighting
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

            // Update display and highlighting - force synchronous DOM updates
            // After batch import, need to refresh board visual state
            this.updateBoard(); // Regenerate board HTML and reattach listeners
            this.updateMoveHistoryHighlight();

            // Force update square highlights to show last move BEFORE state update
            this.updateSquareHighlights();

            // Reset navigation state to current position after import using centralized state management
            // When not navigating, currentNavigationIndex should be null to indicate we're at the current position
            // IMPORTANT: Must be called AFTER updateBoard() and updateSquareHighlights() so the DOM and highlights are ready
            this.gameStateManager.updateGameState({
                currentNavigationIndex: null,
                isNavigating: false,
            });

            // Force update display to refresh comment panel
            // The gameStateManager.updateGameState call above may be a no-op if state is already null,
            // so we need to explicitly call updateDisplay() to ensure the comment textarea is updated
            this.updateDisplay();

            console.log(`Successfully imported ${moveCount} moves from game.`);
            return true;
        }

        // Cleanup method to remove event listeners
        destroy() {
            if (this.resizeListener) {
                window.removeEventListener("resize", this.resizeListener);
            }
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

            this.promotionPromptActive = true;

            // Clear legal move highlights immediately when promotion prompt becomes active
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

            this.promotionPromptActive = true;
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

            // Clear highlights and restore proper highlighting
            this.updateSquareHighlights();

            // Clear promotion prompt state
            this.promotionPromptActive = false;
            this.promotionDestinationSquare = null;
            this.promotionDeferralSquare = null;
            this.promotionAlternateSquare = null;
            this.promotionMove = null;
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
            // Instead of simple alternating, determine player from current SFEN position
            const currentSFEN = this.exportSFEN();
            const sfenParts = currentSFEN.split(" ");
            const sfenPlayer = sfenParts.length >= 2 ? sfenParts[1] : "b";

            const previousPlayer = this.currentPlayer;

            // Set player based on SFEN rather than simple alternation
            this.gameStateManager.updateGameState({
                currentPlayer: sfenPlayer,
            });

            console.log("Turn updated from SFEN:", {
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
