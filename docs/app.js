(function () {
    'use strict';

    const { createApp, ref, reactive, computed, watch, onMounted, nextTick } = Vue;

    const API_URL = (window.TABOO_CONFIG && window.TABOO_CONFIG.apiUrl) || '';
    const STORAGE = {
        cards: 'taboo.cards',
        session: 'taboo.session',
        settings: 'taboo.settings',
        players: 'taboo.players',
        autoSignIn: 'taboo.autoSignIn'
    };

    const translations = {
        en: {
            gameTitle: "Taboo",
            tabPlay: "Play",
            tabCards: "Cards",
            tabSettings: "Settings",
            chooseDeck: "Choose a deck",
            cards: "cards",
            noDecks: "No cards found. Check your connection and refresh from Settings.",
            options: "Game Options",
            uiLanguage: "Language",
            turnDuration: "Turn duration",
            breakDuration: "Pause after each card",
            untilContinue: "Until tap",
            returnSkipped: "Return skipped cards to deck",
            returnTaboo: "Return taboo cards to deck",
            rulesSummaryTurn: "{s}s turns",
            rulesSummaryPause: "{s}s pause",
            rulesSummaryTap: "tap to continue",
            change: "Change",
            addPlayers: "Players or teams",
            inputPlaceholder: "Add a player or team",
            addBtn: "Add",
            moveUp: "Move up",
            noPlayers: "Add at least one player or team.",
            startBtn: "Start Game",
            needDeck: "Choose a deck",
            needPlayers: "Add players",
            account: "Account",
            signIn: "Sign in",
            signOut: "Sign out",
            signInPrompt: "Sign in with Google to add and edit cards.",
            notEditor: "{email} can browse cards but isn't allowed to edit them. Ask the sheet owner to add you under Taboo › Manage editors.",
            editorBadge: "Editor",
            viewerBadge: "Viewer",
            editingNotConfigured: "Card editing isn't set up yet. The sheet owner needs to set the OAuth Client ID from the Taboo menu in Google Sheets.",
            sessionExpired: "Your sign-in has expired. Please sign in again.",
            notAllowedTitle: "Not allowed",
            data: "Data",
            refreshCards: "Refresh cards",
            lastUpdated: "Last updated",
            offlineNotice: "Offline — using saved cards.",
            selectDeckLabel: "Select a deck",
            deckLabel: "Deck",
            newDeckOption: "New",
            newDeckNameLabel: "New deck",
            newDeckMessage: "The deck is saved when you add its first card.",
            newDeckPlaceholder: "e.g., Movies, Kids",
            deckExists: "A deck with this name already exists.",
            previewDeck: "Preview",
            searchPlaceholder: "Search cards",
            noCards: "No cards in this deck yet.",
            noMatches: "No matching cards.",
            addNewCardTitle: "New card",
            editCardTitle: "Edit card",
            targetWordLabel: "Target word",
            wordPlaceholder: "e.g., COMPUTER",
            difficultyLabel: "Difficulty",
            tabooWordsLabel: "Taboo words",
            tabooPlaceholder: "Taboo word",
            addTabooWord: "Add taboo word",
            saveCardBtn: "Save card",
            previewBtn: "Preview",
            deleteBtn: "Delete",
            deleteConfirm: "Delete the card \"{word}\"?",
            cardSaved: "Card saved",
            cardDeleted: "Card deleted",
            missingWord: "Please enter a target word.",
            duplicateWord: "This target word already exists in this deck.",
            duplicateTaboo: "Each taboo word must be unique.",
            errorTitle: "Something went wrong",
            saving: "Saving…",
            cardOf: "Card {n} of {total}",
            draftPreview: "Preview",
            cardsRemaining: "Cards remaining:",
            passPhone: "Hand the phone to",
            tapWhenReady: "Tap when ready!",
            startTurn: "Start turn",
            tabooBtn: "Taboo −1",
            skipBtn: "Skip",
            correctBtn: "Correct!",
            timesUp: "Time's up!",
            endTurnText: "End of",
            passTo: "Pass to {name}",
            endGame: "End game",
            endGameConfirm: "End the game now and see the final scores?",
            gameEndedEarly: "Game ended.",
            gameOver: "Game over!",
            playAgain: "Play again",
            backToMenu: "Back to menu",
            diffEasy: "Easy",
            diffMed: "Medium",
            diffHard: "Hard",
            deckEmpty: "The card deck is completely empty!",
            allPlayed: "All cards have been played!",
            verifyAction: "Your last call:",
            actionCorrect: "Correct (+{n})",
            actionTaboo: "Taboo! (−1)",
            actionSkip: "Skipped (0)",
            actionUnfinished: "Time ran out",
            turnCards: "Cards this turn",
            lastTurnCards: "Last turn",
            hiddenCard: "Hidden card",
            backInDeck: "Back in the deck",
            confirmActionBtn: "Next card",
            changeActionBtn: "Undo",
            breakMessage: "Continuing in",
            loadingMessage: "Loading…",
            ok: "OK",
            cancel: "Cancel",
            close: "Close",
            prev: "Prev",
            next: "Next"
        },
        es: {
            gameTitle: "Tabú",
            tabPlay: "Jugar",
            tabCards: "Cartas",
            tabSettings: "Ajustes",
            chooseDeck: "Elige un mazo",
            cards: "cartas",
            noDecks: "No se encontraron cartas. Revisa tu conexión y actualiza desde Ajustes.",
            options: "Opciones del juego",
            uiLanguage: "Idioma",
            turnDuration: "Duración del turno",
            breakDuration: "Pausa después de cada carta",
            untilContinue: "Hasta tocar",
            returnSkipped: "Devolver cartas omitidas al mazo",
            returnTaboo: "Devolver cartas tabú al mazo",
            rulesSummaryTurn: "Turnos de {s}s",
            rulesSummaryPause: "pausa de {s}s",
            rulesSummaryTap: "tocar para seguir",
            change: "Cambiar",
            addPlayers: "Jugadores o equipos",
            inputPlaceholder: "Agrega un jugador o equipo",
            addBtn: "Añadir",
            moveUp: "Subir",
            noPlayers: "Agrega al menos un jugador o equipo.",
            startBtn: "Comenzar juego",
            needDeck: "Elige un mazo",
            needPlayers: "Agrega jugadores",
            account: "Cuenta",
            signIn: "Iniciar sesión",
            signOut: "Cerrar sesión",
            signInPrompt: "Inicia sesión con Google para agregar y editar cartas.",
            notEditor: "{email} puede ver las cartas pero no editarlas. Pide al dueño de la hoja que te agregue en Taboo › Manage editors.",
            editorBadge: "Editor",
            viewerBadge: "Lector",
            editingNotConfigured: "La edición de cartas aún no está configurada. El dueño de la hoja debe establecer el OAuth Client ID desde el menú Taboo en Google Sheets.",
            sessionExpired: "Tu sesión expiró. Inicia sesión de nuevo.",
            notAllowedTitle: "No permitido",
            data: "Datos",
            refreshCards: "Actualizar cartas",
            lastUpdated: "Última actualización",
            offlineNotice: "Sin conexión — usando cartas guardadas.",
            selectDeckLabel: "Selecciona un mazo",
            deckLabel: "Mazo",
            newDeckOption: "Nuevo",
            newDeckNameLabel: "Nuevo mazo",
            newDeckMessage: "El mazo se guarda al agregar su primera carta.",
            newDeckPlaceholder: "ej., Películas, Niños",
            deckExists: "Ya existe un mazo con este nombre.",
            previewDeck: "Vista previa",
            searchPlaceholder: "Buscar cartas",
            noCards: "Este mazo aún no tiene cartas.",
            noMatches: "No hay cartas que coincidan.",
            addNewCardTitle: "Nueva carta",
            editCardTitle: "Editar carta",
            targetWordLabel: "Palabra objetivo",
            wordPlaceholder: "ej., COMPUTADORA",
            difficultyLabel: "Dificultad",
            tabooWordsLabel: "Palabras tabú",
            tabooPlaceholder: "Palabra tabú",
            addTabooWord: "Agregar palabra tabú",
            saveCardBtn: "Guardar carta",
            previewBtn: "Vista previa",
            deleteBtn: "Eliminar",
            deleteConfirm: "¿Eliminar la carta \"{word}\"?",
            cardSaved: "Carta guardada",
            cardDeleted: "Carta eliminada",
            missingWord: "Ingresa una palabra objetivo.",
            duplicateWord: "Esta palabra ya existe en este mazo.",
            duplicateTaboo: "Cada palabra tabú debe ser única.",
            errorTitle: "Algo salió mal",
            saving: "Guardando…",
            cardOf: "Carta {n} de {total}",
            draftPreview: "Vista previa",
            cardsRemaining: "Cartas restantes:",
            passPhone: "Pasa el teléfono a",
            tapWhenReady: "¡Toca cuando estés listo!",
            startTurn: "Comenzar turno",
            tabooBtn: "Tabú −1",
            skipBtn: "Omitir",
            correctBtn: "¡Correcto!",
            timesUp: "¡Se acabó el tiempo!",
            endTurnText: "Fin del turno de",
            passTo: "Pasar a {name}",
            endGame: "Terminar juego",
            endGameConfirm: "¿Terminar el juego ahora y ver los puntajes finales?",
            gameEndedEarly: "Juego terminado.",
            gameOver: "¡Juego terminado!",
            playAgain: "Jugar de nuevo",
            backToMenu: "Volver al menú",
            diffEasy: "Fácil",
            diffMed: "Medio",
            diffHard: "Difícil",
            deckEmpty: "¡El mazo de cartas está completamente vacío!",
            allPlayed: "¡Todas las cartas han sido jugadas!",
            verifyAction: "Tu última jugada:",
            actionCorrect: "Correcto (+{n})",
            actionTaboo: "¡Tabú! (−1)",
            actionSkip: "Omitida (0)",
            actionUnfinished: "Se acabó el tiempo",
            turnCards: "Cartas de este turno",
            lastTurnCards: "Último turno",
            hiddenCard: "Carta oculta",
            backInDeck: "Volvió al mazo",
            confirmActionBtn: "Siguiente carta",
            changeActionBtn: "Deshacer",
            breakMessage: "Continuando en",
            loadingMessage: "Cargando…",
            ok: "OK",
            cancel: "Cancelar",
            close: "Cerrar",
            prev: "Anterior",
            next: "Siguiente"
        },
        pt: {
            gameTitle: "Tabu",
            tabPlay: "Jogar",
            tabCards: "Cartas",
            tabSettings: "Ajustes",
            chooseDeck: "Escolha um baralho",
            cards: "cartas",
            noDecks: "Nenhuma carta encontrada. Verifique sua conexão e atualize em Ajustes.",
            options: "Opções do jogo",
            uiLanguage: "Idioma",
            turnDuration: "Duração do turno",
            breakDuration: "Pausa após cada carta",
            untilContinue: "Até tocar",
            returnSkipped: "Retornar cartas puladas ao monte",
            returnTaboo: "Retornar cartas tabu ao monte",
            rulesSummaryTurn: "Turnos de {s}s",
            rulesSummaryPause: "pausa de {s}s",
            rulesSummaryTap: "tocar para seguir",
            change: "Mudar",
            addPlayers: "Jogadores ou equipes",
            inputPlaceholder: "Adicione um jogador ou equipe",
            addBtn: "Adicionar",
            moveUp: "Subir",
            noPlayers: "Adicione pelo menos um jogador ou equipe.",
            startBtn: "Iniciar jogo",
            needDeck: "Escolha um baralho",
            needPlayers: "Adicione jogadores",
            account: "Conta",
            signIn: "Entrar",
            signOut: "Sair",
            signInPrompt: "Entre com o Google para adicionar e editar cartas.",
            notEditor: "{email} pode ver as cartas, mas não editá-las. Peça ao dono da planilha para adicionar você em Taboo › Manage editors.",
            editorBadge: "Editor",
            viewerBadge: "Leitor",
            editingNotConfigured: "A edição de cartas ainda não foi configurada. O dono da planilha precisa definir o OAuth Client ID pelo menu Taboo no Google Sheets.",
            sessionExpired: "Sua sessão expirou. Entre novamente.",
            notAllowedTitle: "Não permitido",
            data: "Dados",
            refreshCards: "Atualizar cartas",
            lastUpdated: "Última atualização",
            offlineNotice: "Offline — usando cartas salvas.",
            selectDeckLabel: "Selecione um baralho",
            deckLabel: "Baralho",
            newDeckOption: "Novo",
            newDeckNameLabel: "Novo baralho",
            newDeckMessage: "O baralho é salvo quando você adiciona a primeira carta.",
            newDeckPlaceholder: "ex., Filmes, Infantil",
            deckExists: "Já existe um baralho com este nome.",
            previewDeck: "Visualizar",
            searchPlaceholder: "Buscar cartas",
            noCards: "Este baralho ainda não tem cartas.",
            noMatches: "Nenhuma carta encontrada.",
            addNewCardTitle: "Nova carta",
            editCardTitle: "Editar carta",
            targetWordLabel: "Palavra alvo",
            wordPlaceholder: "ex., COMPUTADOR",
            difficultyLabel: "Dificuldade",
            tabooWordsLabel: "Palavras tabu",
            tabooPlaceholder: "Palavra tabu",
            addTabooWord: "Adicionar palavra tabu",
            saveCardBtn: "Salvar carta",
            previewBtn: "Visualizar",
            deleteBtn: "Excluir",
            deleteConfirm: "Excluir a carta \"{word}\"?",
            cardSaved: "Carta salva",
            cardDeleted: "Carta excluída",
            missingWord: "Digite uma palavra alvo.",
            duplicateWord: "Esta palavra já existe neste baralho.",
            duplicateTaboo: "Cada palavra tabu deve ser única.",
            errorTitle: "Algo deu errado",
            saving: "Salvando…",
            cardOf: "Carta {n} de {total}",
            draftPreview: "Visualizar",
            cardsRemaining: "Cartas restantes:",
            passPhone: "Passe o celular para",
            tapWhenReady: "Toque quando estiver pronto!",
            startTurn: "Iniciar turno",
            tabooBtn: "Tabu −1",
            skipBtn: "Pular",
            correctBtn: "Correto!",
            timesUp: "O tempo acabou!",
            endTurnText: "Fim do turno de",
            passTo: "Passar para {name}",
            endGame: "Encerrar jogo",
            endGameConfirm: "Encerrar o jogo agora e ver a pontuação final?",
            gameEndedEarly: "Jogo encerrado.",
            gameOver: "Fim de jogo!",
            playAgain: "Jogar novamente",
            backToMenu: "Voltar ao menu",
            diffEasy: "Fácil",
            diffMed: "Médio",
            diffHard: "Difícil",
            deckEmpty: "O monte de cartas está completamente vazio!",
            allPlayed: "Todas as cartas foram jogadas!",
            verifyAction: "Sua última jogada:",
            actionCorrect: "Correto (+{n})",
            actionTaboo: "Tabu! (−1)",
            actionSkip: "Pulada (0)",
            actionUnfinished: "Tempo esgotado",
            turnCards: "Cartas deste turno",
            lastTurnCards: "Último turno",
            hiddenCard: "Carta oculta",
            backInDeck: "Voltou ao monte",
            confirmActionBtn: "Próxima carta",
            changeActionBtn: "Desfazer",
            breakMessage: "Continuando em",
            loadingMessage: "Carregando…",
            ok: "OK",
            cancel: "Cancelar",
            close: "Fechar",
            prev: "Anterior",
            next: "Próxima"
        }
    };

    // ---------------------------------------------------------------- helpers

    function load(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function store(key, value) {
        try {
            if (value === null || value === undefined) localStorage.removeItem(key);
            else localStorage.setItem(key, JSON.stringify(value));
        } catch (e) { /* storage full or disabled */ }
    }

    function decodeJwt(token) {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
    }

    function shuffle(list) {
        const a = [...list];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function vibrate(pattern) {
        if (navigator.vibrate) navigator.vibrate(pattern);
    }

    class ApiError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
        }
    }

    // Apps Script web apps can't answer CORS preflights, so POST as text/plain (a "simple" request).
    async function api(method, payload) {
        if (!API_URL) throw new ApiError('The API URL is not set in config.js.', 'NOT_CONFIGURED');
        let res;
        try {
            res = method === 'GET'
                ? await fetch(`${API_URL}?action=${encodeURIComponent(payload.action)}`, { cache: 'no-store' })
                : await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload)
                });
        } catch (e) {
            throw new ApiError('Could not reach the server. Check your connection.', 'NETWORK');
        }
        let data;
        try {
            data = await res.json();
        } catch (e) {
            throw new ApiError(`Unexpected response from the server (HTTP ${res.status}). Is the web app deployed with access for "Anyone"?`, 'SERVER');
        }
        if (!data.ok) throw new ApiError(data.error || 'Request failed.', data.code);
        return data;
    }

    // ---------------------------------------------------------------- app

    createApp({
        setup() {
            const cached = load(STORAGE.cards, null);

            const tab = ref('play');
            const screen = ref(null); // null = tabs; otherwise a game screen
            const busy = ref(false);
            const busyMessage = ref('');
            const toast = ref('');
            const offline = ref(false);

            const allCards = ref(cached ? cached.cards : []);
            const cardsUpdatedAt = ref(cached ? cached.updatedAt : null);
            const cardsLoaded = ref(!!cached);
            const clientId = ref(cached ? cached.clientId || '' : '');

            const settings = reactive(Object.assign({
                lang: 'en',
                deck: '',
                turnDuration: 60,
                breakDuration: 0,
                returnSkipped: false,
                returnTaboo: false
            }, load(STORAGE.settings, {})));

            const players = ref(load(STORAGE.players, []));
            const newPlayerName = ref('');
            const playerInputRef = ref(null);

            const session = ref(load(STORAGE.session, null));

            // Card editor
            const editorDeck = ref('');
            const pendingDeck = ref(''); // a new deck that has no cards saved yet
            const searchQuery = ref('');
            const tabooInputRefs = ref([]);
            const cardSheet = reactive({ show: false, originalWord: null, word: '', difficulty: 1, taboo: [] });
            const preview = reactive({ show: false, title: '', cards: [], index: 0 });

            const dialog = reactive({ show: false, type: 'alert', title: '', message: '', inputValue: '', placeholder: '', okText: '', danger: false, resolve: null });
            const dialogInputRef = ref(null);

            // Game
            const gameDeck = ref([]);
            const currentPlayerIndex = ref(0);
            const currentCard = ref(null);
            const timeLeft = ref(0);
            const timeFraction = ref(1);
            const breakTimeLeft = ref(0);
            const turnScoreEarned = ref(0);
            // Every card seen this turn: { card, action, scoreChange, playerIndex, returned }.
            // `returned` cards went back into the deck, so their words stay hidden until the game ends.
            const turnHistory = ref([]);
            const gameOverReason = ref('');

            let turnDeadline = 0;
            let turnRemainingMs = 0;
            let turnTicker = null;
            let breakTicker = null;
            let wakeLock = null;
            let toastTimer = null;
            let gisInitializedFor = '';

            // ------------------------------------------------------------ i18n

            const t = (key, params) => {
                let text = translations[settings.lang]?.[key] ?? translations.en[key] ?? key;
                if (params) {
                    Object.keys(params).forEach(k => { text = text.replace(`{${k}}`, params[k]); });
                }
                return text;
            };

            const difficultyName = (d) => d === 3 ? t('diffHard') : d === 2 ? t('diffMed') : t('diffEasy');
            const formatDelta = (n) => (n > 0 ? '+' : '') + n;
            const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase();

            // ------------------------------------------------------------ dialogs

            const openDialog = (options) => new Promise(resolve => {
                Object.assign(dialog, { type: 'alert', title: '', message: '', inputValue: '', placeholder: '', okText: '', danger: false }, options, { show: true, resolve });
                if (dialog.type === 'prompt') nextTick(() => dialogInputRef.value?.focus());
            });
            const showAlert = (title, message) => openDialog({ type: 'alert', title, message });
            const showConfirm = (title, message, extra) => openDialog(Object.assign({ type: 'confirm', title, message }, extra));
            const showPrompt = (title, message, placeholder) => openDialog({ type: 'prompt', title, message, placeholder });

            const closeDialog = (result) => {
                const resolve = dialog.resolve;
                dialog.show = false;
                dialog.resolve = null;
                if (resolve) resolve(dialog.type === 'prompt' ? (result ? dialog.inputValue : null) : result);
            };

            const showToast = (message) => {
                toast.value = message;
                clearTimeout(toastTimer);
                toastTimer = setTimeout(() => { toast.value = ''; }, 2200);
            };

            // ------------------------------------------------------------ cards data

            const setCards = (cards, newClientId) => {
                allCards.value = cards;
                if (newClientId !== undefined) clientId.value = newClientId;
                cardsUpdatedAt.value = Date.now();
                cardsLoaded.value = true;
                store(STORAGE.cards, { cards, clientId: clientId.value, updatedAt: cardsUpdatedAt.value });
            };

            const loadCards = async (interactive) => {
                if (interactive) { busy.value = true; busyMessage.value = ''; }
                try {
                    const data = await api('GET', { action: 'cards' });
                    setCards(data.cards, data.clientId || '');
                    offline.value = false;
                    if (interactive) showToast(`${data.cards.length} ${t('cards')}`);
                } catch (err) {
                    offline.value = err.code === 'NETWORK' && allCards.value.length > 0;
                    if (interactive || !allCards.value.length) showAlert(t('errorTitle'), err.message);
                } finally {
                    cardsLoaded.value = true;
                    busy.value = false;
                }
            };

            const uniqueDecks = computed(() => {
                const counts = {};
                allCards.value.forEach(c => { counts[c.deck] = (counts[c.deck] || 0) + 1; });
                return Object.keys(counts).sort((a, b) => a.localeCompare(b)).map(name => ({ name, count: counts[name] }));
            });

            // ------------------------------------------------------------ auth

            const canEdit = computed(() => !!(session.value && session.value.isEditor));

            const renderGisButtons = () => {
                if (!gisInitializedFor || !window.google?.accounts?.id) return;
                nextTick(() => {
                    document.querySelectorAll('.gsi-button').forEach(el => {
                        el.innerHTML = '';
                        google.accounts.id.renderButton(el, {
                            theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with',
                            width: 260, locale: settings.lang
                        });
                    });
                });
            };

            const initGis = () => {
                if (!clientId.value || !window.google?.accounts?.id || gisInitializedFor === clientId.value) return;
                google.accounts.id.initialize({
                    client_id: clientId.value,
                    callback: onCredential,
                    auto_select: true,
                    cancel_on_tap_outside: true,
                    use_fedcm_for_prompt: true
                });
                gisInitializedFor = clientId.value;
                renderGisButtons();
                maybeAutoSignIn();
            };
            window.onGoogleLibraryLoad = initGis;

            async function onCredential(response) {
                const claims = decodeJwt(response.credential);
                busy.value = true;
                busyMessage.value = '';
                try {
                    const data = await api('POST', { action: 'whoami', idToken: response.credential });
                    store(STORAGE.autoSignIn, true);
                    session.value = {
                        credential: response.credential,
                        email: data.email,
                        name: claims.name || '',
                        picture: claims.picture || '',
                        exp: claims.exp,
                        isEditor: data.isEditor
                    };
                } catch (err) {
                    session.value = null;
                    showAlert(t('errorTitle'), err.message);
                } finally {
                    busy.value = false;
                }
            }

            const signOut = () => {
                if (window.google?.accounts?.id) google.accounts.id.disableAutoSelect();
                store(STORAGE.autoSignIn, null);
                session.value = null;
            };

            // ID tokens last about an hour; drop ours once it is (nearly) expired.
            const pruneSession = () => {
                if (session.value && session.value.exp * 1000 < Date.now() + 60 * 1000) {
                    session.value = null;
                }
                return !!session.value;
            };

            // For returning editors, One Tap can usually sign them back in with a single tap (or none).
            const maybeAutoSignIn = () => {
                if (!session.value && gisInitializedFor && tab.value === 'cards' && load(STORAGE.autoSignIn, false)) {
                    google.accounts.id.prompt();
                }
            };

            const authedPost = async (payload) => {
                if (!pruneSession()) {
                    await showAlert(t('signIn'), t('sessionExpired'));
                    maybeAutoSignIn();
                    throw null;
                }
                try {
                    return await api('POST', Object.assign({ idToken: session.value.credential }, payload));
                } catch (err) {
                    if (err.code === 'AUTH') {
                        session.value = null;
                        await showAlert(t('signIn'), t('sessionExpired'));
                        maybeAutoSignIn();
                        throw null;
                    }
                    if (err.code === 'FORBIDDEN') {
                        session.value = Object.assign({}, session.value, { isEditor: false });
                        await showAlert(t('notAllowedTitle'), err.message);
                        throw null;
                    }
                    throw err;
                }
            };

            // ------------------------------------------------------------ play tab

            const addPlayer = () => {
                const name = newPlayerName.value.trim();
                if (!name) return;
                players.value.push({ name, score: 0 });
                newPlayerName.value = '';
                nextTick(() => playerInputRef.value?.focus());
            };
            const removePlayer = (index) => players.value.splice(index, 1);
            const movePlayer = (index, delta) => {
                const target = index + delta;
                if (target < 0 || target >= players.value.length) return;
                const list = players.value;
                [list[index], list[target]] = [list[target], list[index]];
            };

            const canStart = computed(() => players.value.length > 0 && uniqueDecks.value.some(d => d.name === settings.deck));
            const startHint = computed(() => !uniqueDecks.value.some(d => d.name === settings.deck) ? t('needDeck') : t('needPlayers'));
            const rulesSummary = computed(() => {
                const parts = [t('rulesSummaryTurn', { s: settings.turnDuration })];
                parts.push(settings.breakDuration ? t('rulesSummaryPause', { s: settings.breakDuration }) : t('rulesSummaryTap'));
                return parts.join(' · ');
            });

            // ------------------------------------------------------------ cards tab

            const editorDecks = computed(() => {
                const names = uniqueDecks.value.map(d => d.name);
                if (pendingDeck.value && !names.includes(pendingDeck.value)) names.push(pendingDeck.value);
                return names;
            });

            const deckCards = computed(() => allCards.value.filter(c => c.deck === editorDeck.value));

            const editorCards = computed(() => {
                const q = searchQuery.value.trim().toLowerCase();
                const list = deckCards.value.filter(c => !q ||
                    String(c.word).toLowerCase().includes(q) ||
                    c.taboo.some(w => w.toLowerCase().includes(q)));
                return list.sort((a, b) => String(a.word).localeCompare(String(b.word)));
            });

            const createDeck = async () => {
                const name = ((await showPrompt(t('newDeckNameLabel'), t('newDeckMessage'), t('newDeckPlaceholder'))) || '').trim();
                if (!name) return;
                if (uniqueDecks.value.some(d => d.name.toLowerCase() === name.toLowerCase())) {
                    await showAlert(t('newDeckNameLabel'), t('deckExists'));
                    return;
                }
                pendingDeck.value = name;
                editorDeck.value = name;
                openCard(null);
            };

            const openCard = (card) => {
                tabooInputRefs.value = [];
                Object.assign(cardSheet, card
                    ? { originalWord: card.word, word: card.word, difficulty: card.difficulty, taboo: card.taboo.length ? [...card.taboo] : [''] }
                    : { originalWord: null, word: '', difficulty: 1, taboo: ['', '', ''] },
                    { show: true });
            };
            const closeCardSheet = () => { cardSheet.show = false; };

            const addTabooField = () => {
                if (cardSheet.taboo.length >= 5) return;
                cardSheet.taboo.push('');
                nextTick(() => tabooInputRefs.value[cardSheet.taboo.length - 1]?.focus());
            };

            const saveCard = async () => {
                const word = String(cardSheet.word).trim();
                const taboo = cardSheet.taboo.map(w => String(w).trim()).filter(Boolean);
                if (!word) return showAlert(t('editCardTitle'), t('missingWord'));

                const original = cardSheet.originalWord ? String(cardSheet.originalWord).toLowerCase() : null;
                const duplicate = deckCards.value.some(c => {
                    const w = String(c.word).toLowerCase();
                    return w === word.toLowerCase() && w !== original;
                });
                if (duplicate) return showAlert(t('editCardTitle'), t('duplicateWord'));
                if (new Set(taboo.map(w => w.toLowerCase())).size !== taboo.length) {
                    return showAlert(t('editCardTitle'), t('duplicateTaboo'));
                }

                busy.value = true;
                busyMessage.value = t('saving');
                try {
                    const data = await authedPost({
                        action: 'saveCard',
                        card: { originalWord: cardSheet.originalWord, word, deck: editorDeck.value, difficulty: cardSheet.difficulty, taboo }
                    });
                    setCards(data.cards);
                    cardSheet.show = false;
                    showToast(t('cardSaved'));
                } catch (err) {
                    if (err) showAlert(t('errorTitle'), err.message);
                } finally {
                    busy.value = false;
                }
            };

            const deleteCard = async () => {
                const word = cardSheet.originalWord;
                const ok = await showConfirm(t('deleteBtn'), t('deleteConfirm', { word: String(word).toUpperCase() }), { danger: true, okText: t('deleteBtn') });
                if (!ok) return;
                busy.value = true;
                busyMessage.value = '';
                try {
                    const data = await authedPost({ action: 'deleteCard', word, deck: editorDeck.value });
                    setCards(data.cards);
                    cardSheet.show = false;
                    showToast(t('cardDeleted'));
                } catch (err) {
                    if (err) showAlert(t('errorTitle'), err.message);
                } finally {
                    busy.value = false;
                }
            };

            // ------------------------------------------------------------ previews

            const previewCard = computed(() => preview.cards[preview.index] || { word: '', difficulty: 1, taboo: [] });

            const previewDraft = () => {
                Object.assign(preview, {
                    show: true,
                    title: t('draftPreview'),
                    index: 0,
                    cards: [{
                        word: cardSheet.word.trim() || t('targetWordLabel'),
                        difficulty: cardSheet.difficulty,
                        taboo: cardSheet.taboo.map((w, i) => w.trim() || `${t('tabooPlaceholder')} ${i + 1}`)
                    }]
                });
            };

            const previewDeck = () => {
                Object.assign(preview, { show: true, title: editorDeck.value, index: 0, cards: [...editorCards.value] });
            };

            const stepPreview = (delta) => {
                const n = preview.cards.length;
                preview.index = (preview.index + delta + n) % n;
            };

            let swipeStartX = null;
            const onSwipeStart = (e) => { swipeStartX = e.changedTouches[0].clientX; };
            const onSwipeEnd = (e) => {
                if (swipeStartX === null || preview.cards.length < 2) return;
                const dx = e.changedTouches[0].clientX - swipeStartX;
                swipeStartX = null;
                if (Math.abs(dx) > 50) stepPreview(dx < 0 ? 1 : -1);
            };

            // ------------------------------------------------------------ game

            const currentPlayer = computed(() => players.value[currentPlayerIndex.value] || { name: '' });
            const nextPlayerName = computed(() => {
                if (!players.value.length) return '';
                return players.value[(currentPlayerIndex.value + 1) % players.value.length].name;
            });
            const sortedPlayers = computed(() => [...players.value].sort((a, b) => b.score - a.score));
            const resultText = (entry) => {
                if (!entry) return '';
                if (entry.action === 'taboo') return t('actionTaboo');
                if (entry.action === 'skip') return t('actionSkip');
                if (entry.action === 'unfinished') return t('actionUnfinished');
                return t('actionCorrect', { n: entry.card.difficulty });
            };
            const lastAction = computed(() => turnHistory.value[turnHistory.value.length - 1] || null);
            const actionText = computed(() => resultText(lastAction.value));
            const isHidden = (entry) => entry.returned && screen.value !== 'game_over';

            const requestWakeLock = async () => {
                try {
                    if ('wakeLock' in navigator && !wakeLock) {
                        wakeLock = await navigator.wakeLock.request('screen');
                        wakeLock.addEventListener('release', () => { wakeLock = null; });
                    }
                } catch (e) { /* not supported or denied */ }
            };
            const releaseWakeLock = () => {
                if (wakeLock) wakeLock.release();
                wakeLock = null;
            };

            // The turn clock counts down from a deadline so it stays accurate if the phone lags.
            const tickTurn = () => {
                const ms = Math.max(0, turnDeadline - Date.now());
                timeLeft.value = Math.ceil(ms / 1000);
                timeFraction.value = ms / (settings.turnDuration * 1000);
                if (ms <= 0) endTurn();
            };
            const runTurnClock = (ms) => {
                clearInterval(turnTicker);
                turnDeadline = Date.now() + ms;
                tickTurn();
                turnTicker = setInterval(tickTurn, 200);
            };
            const pauseTurnClock = () => {
                clearInterval(turnTicker);
                turnTicker = null;
                turnRemainingMs = Math.max(0, turnDeadline - Date.now());
            };
            const stopClocks = () => {
                clearInterval(turnTicker);
                clearInterval(breakTicker);
                turnTicker = breakTicker = null;
            };

            const startGame = () => {
                if (!canStart.value) return;
                const filtered = allCards.value.filter(c => c.deck === settings.deck);
                if (!filtered.length) return showAlert(t('chooseDeck'), t('deckEmpty'));
                gameDeck.value = shuffle(filtered);
                players.value.forEach(p => { p.score = 0; });
                currentPlayerIndex.value = 0;
                turnScoreEarned.value = 0;
                turnHistory.value = [];
                screen.value = 'turn_intro';
                requestWakeLock();
            };

            const drawCard = () => {
                if (!gameDeck.value.length) {
                    triggerGameOver(t('allPlayed'));
                    return false;
                }
                currentCard.value = gameDeck.value.pop();
                return true;
            };

            const startTurn = () => {
                turnHistory.value = [];
                if (!drawCard()) return;
                screen.value = 'gameplay';
                runTurnClock(settings.turnDuration * 1000);
            };

            const handleCardAction = (action) => {
                pauseTurnClock();
                const card = currentCard.value;
                let scoreChange = 0;
                let returnedCard = false;

                if (action === 'correct') {
                    scoreChange = card.difficulty;
                    vibrate(40);
                } else if (action === 'taboo') {
                    scoreChange = -1;
                    returnedCard = settings.returnTaboo;
                    vibrate([60, 40, 60]);
                } else {
                    returnedCard = settings.returnSkipped;
                    vibrate(20);
                }
                players.value[currentPlayerIndex.value].score += scoreChange;
                turnScoreEarned.value += scoreChange;
                if (returnedCard) gameDeck.value.unshift(card);

                turnHistory.value.push({ card, action, scoreChange, playerIndex: currentPlayerIndex.value, returned: returnedCard });
                screen.value = 'break';

                if (settings.breakDuration > 0) {
                    const breakDeadline = Date.now() + settings.breakDuration * 1000;
                    breakTimeLeft.value = settings.breakDuration;
                    breakTicker = setInterval(() => {
                        const ms = breakDeadline - Date.now();
                        breakTimeLeft.value = Math.max(0, Math.ceil(ms / 1000));
                        if (ms <= 0) proceedFromBreak();
                    }, 200);
                }
            };

            const proceedFromBreak = () => {
                clearInterval(breakTicker);
                breakTicker = null;
                if (!gameDeck.value.length) {
                    triggerGameOver(t('deckEmpty'));
                    return;
                }
                // No point drawing a card nobody has time to try.
                if (turnRemainingMs < 500) {
                    endTurn(false);
                    return;
                }
                drawCard();
                screen.value = 'gameplay';
                runTurnClock(turnRemainingMs);
            };

            const undoLastAction = () => {
                const last = lastAction.value;
                if (screen.value !== 'break' || !last) return;
                clearInterval(breakTicker);
                breakTicker = null;
                players.value[last.playerIndex].score -= last.scoreChange;
                turnScoreEarned.value -= last.scoreChange;
                if (last.returned) gameDeck.value.shift();
                turnHistory.value.pop();
                currentCard.value = last.card;
                screen.value = 'gameplay';
                runTurnClock(turnRemainingMs);
            };

            const endTurn = (cardOnScreen = true) => {
                stopClocks();
                vibrate([200, 100, 200]);
                if (cardOnScreen) {
                    // The card on screen wasn't finished, so it goes back to the bottom of the deck.
                    gameDeck.value.unshift(currentCard.value);
                    turnHistory.value.push({ card: currentCard.value, action: 'unfinished', scoreChange: 0, playerIndex: currentPlayerIndex.value, returned: true });
                }
                screen.value = 'turn_end';
            };

            // The turn history is kept until the next turn starts, so "End game" on the
            // next player's intro screen still shows the last turn's cards.
            const advanceToNextPlayer = () => {
                currentPlayerIndex.value = (currentPlayerIndex.value + 1) % players.value.length;
                turnScoreEarned.value = 0;
                screen.value = 'turn_intro';
            };

            const triggerGameOver = (reason) => {
                stopClocks();
                releaseWakeLock();
                gameOverReason.value = reason;
                screen.value = 'game_over';
            };

            const confirmEndGame = async () => {
                const ok = await showConfirm(t('endGame'), t('endGameConfirm'), { danger: true, okText: t('endGame') });
                if (ok) triggerGameOver(t('gameEndedEarly'));
            };

            const exitGame = () => {
                stopClocks();
                releaseWakeLock();
                screen.value = null;
            };

            // ------------------------------------------------------------ lifecycle

            watch(settings, () => {
                store(STORAGE.settings, settings);
                document.documentElement.lang = settings.lang;
                document.title = t('gameTitle');
            }, { deep: true, immediate: true });
            watch(players, () => store(STORAGE.players, players.value.map(p => ({ name: p.name, score: 0 }))), { deep: true });
            watch(session, () => { store(STORAGE.session, session.value); renderGisButtons(); }, { deep: true });
            watch(clientId, initGis);
            watch(() => settings.lang, renderGisButtons);
            watch(tab, () => {
                cardSheet.show = false;
                preview.show = false;
                pruneSession();
                renderGisButtons();
                maybeAutoSignIn();
            });
            watch(screen, renderGisButtons);

            // Keep the editor pointed at a real deck (default to the deck chosen for play).
            watch(uniqueDecks, (decks) => {
                const names = decks.map(d => d.name);
                if (pendingDeck.value && names.includes(pendingDeck.value)) pendingDeck.value = '';
                if (!editorDeck.value || (!names.includes(editorDeck.value) && editorDeck.value !== pendingDeck.value)) {
                    editorDeck.value = names.includes(settings.deck) ? settings.deck : (names[0] || '');
                }
                if (settings.deck && !names.includes(settings.deck) && decks.length) settings.deck = '';
            }, { immediate: true });
            watch(editorDeck, () => { searchQuery.value = ''; });

            onMounted(() => {
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible' && screen.value && screen.value !== 'game_over') requestWakeLock();
                });
                pruneSession();
                initGis();
                loadCards(false);
            });

            return {
                tab, screen, busy, busyMessage, toast, offline,
                allCards, cardsUpdatedAt, cardsLoaded, clientId, uniqueDecks,
                settings, players, newPlayerName, playerInputRef,
                session, canEdit, signOut,
                editorDeck, editorDecks, deckCards, editorCards, searchQuery, tabooInputRefs, cardSheet, preview, previewCard,
                dialog, dialogInputRef, closeDialog,
                gameDeck, currentPlayerIndex, currentPlayer, currentCard, timeLeft, timeFraction, breakTimeLeft,
                turnScoreEarned, turnHistory, gameOverReason, lastAction, actionText, resultText, isHidden, nextPlayerName, sortedPlayers,
                canStart, startHint, rulesSummary,
                t, difficultyName, formatDelta, initials,
                loadCards, addPlayer, removePlayer, movePlayer,
                createDeck, openCard, closeCardSheet, addTabooField, saveCard, deleteCard,
                previewDraft, previewDeck, stepPreview, onSwipeStart, onSwipeEnd,
                startGame, startTurn, handleCardAction, proceedFromBreak, undoLastAction,
                advanceToNextPlayer, confirmEndGame, exitGame
            };
        }
    }).mount('#app');

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
    }
})();
