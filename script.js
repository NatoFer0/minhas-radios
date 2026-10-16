/* ==========================================
   CONSTANTES E CONFIGURAÇÕES
========================================== */

const PLAYLIST_URL =
    "https://gist.githubusercontent.com/NatoFer0/c5174eb31972b0fddbb5e4bb460f0bc2/raw/radios.m3u";

const STORAGE_KEYS = {
    THEME: "minhasRadios_tema",
    RECENT: "minhasRadios_ouvidasRecentemente",
    POPULAR: "minhasRadios_maisEscutadas",
    VOLUME: "minhasRadios_volume",
    FAVORITES: "minhasRadios_favoritos"
};

const LISTEN_TIME_REQUIRED = 5 * 60 * 1000; // 5 minutos
const MAX_HISTORY_ITEMS = 5;

const THEMES = [
    { name: "original", icon: "◈", label: "Tema Original" },
    { name: "claro", icon: "☀️", label: "Tema Claro" },
    { name: "eclipse", icon: "🌘", label: "Tema Eclipse" },
    { name: "escuro", icon: "🌑", label: "Tema Escuro" }
];

const CATEGORY_ICONS = {
    "Brasil": '<img src="https://flagcdn.io/flags/4x3/br.svg" alt="Brasil">',
    "Argentina": '<img src="https://flagcdn.io/flags/4x3/ar.svg" alt="Argentina">',
    "Uruguai": '<img src="https://flagcdn.io/flags/4x3/uy.svg" alt="Uruguai">',
    "Uruguay": '<img src="https://flagcdn.io/flags/4x3/uy.svg" alt="Uruguay">',
    "Chile": '<img src="https://flagcdn.io/flags/4x3/cl.svg" alt="Chile">',
    "Paraguai": '<img src="https://flagcdn.io/flags/4x3/py.svg" alt="Paraguai">',
    "Paraguay": '<img src="https://flagcdn.io/flags/4x3/py.svg" alt="Paraguay">',
    "México": '<img src="https://flagcdn.io/flags/4x3/mx.svg" alt="México">',
    "Mexico": '<img src="https://flagcdn.io/flags/4x3/mx.svg" alt="Mexico">',
    "Colômbia": '<img src="https://flagcdn.io/flags/4x3/co.svg" alt="Colômbia">',
    "Colombia": '<img src="https://flagcdn.io/flags/4x3/co.svg" alt="Colombia">',
    "Peru": '<img src="https://flagcdn.io/flags/4x3/pe.svg" alt="Peru">',
    "Estados Unidos": '<img src="https://flagcdn.io/flags/4x3/us.svg" alt="Estados Unidos">',
    "USA": '<img src="https://flagcdn.io/flags/4x3/us.svg" alt="USA">',
    "Noruega": '<img src="https://flagcdn.io/flags/4x3/no.svg" alt="Noruega">',
    "República Dominicana": '<img src="https://flagcdn.io/flags/4x3/do.svg" alt="República Dominicana">',
    "Republica Dominicana": '<img src="https://flagcdn.io/flags/4x3/do.svg" alt="Republica Dominicana">',
    "Equador": '<img src="https://flagcdn.io/flags/4x3/ec.svg" alt="Equador">',
    "Porto Rico": '<img src="https://flagcdn.io/flags/4x3/pr.svg" alt="Porto Rico">',
    "Alemanha": '<img src="https://flagcdn.io/flags/4x3/de.svg" alt="Alemanha">',
    "Bolívia": '<img src="https://flagcdn.io/flags/4x3/bo.svg" alt="Bolivia">',
    "França": '<img src="https://flagcdn.io/flags/4x3/fr.svg" alt="Franca">',
    "Russia": '<img src="https://flagcdn.io/flags/4x3/ru.svg" alt="Russia">',
    "Paquistão": '<img src="https://flagcdn.io/flags/4x3/pk.svg" alt="Paquistao">',
    "Turquia": '<img src="https://flagcdn.io/flags/4x3/tr.svg" alt="Turquia">',
    "Espanha": '<img src="https://flagcdn.io/flags/4x3/es.svg" alt="Espanha">',
    "Itália": '<img src="https://flagcdn.io/flags/4x3/it.svg" alt="Italia">',
    "Suiça": '<img src="https://flagcdn.io/flags/4x3/ch.svg" alt="Suica">',
    "Disney": "🏰",
    "Outras": "🌎"
};

const LIVE_BADGE_HTML = `
    <span class="player-live">
        <span class="radio-live-dot"></span>
        AO VIVO
    </span>
`;

/* ==========================================
   ELEMENTOS DO DOM
========================================== */

const audioPlayer = document.getElementById("audioPlayer");
const radioApp = document.getElementById("radioApp");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const currentStation = document.getElementById("currentStation");
const playerStatus = document.getElementById("playerStatus");
const playPauseButton = document.getElementById("playPauseButton");
const muteButton = document.getElementById("muteButton");
const volumeControl = document.getElementById("volumeControl");
const volumeValue = document.getElementById("volumeValue");
const recentButton = document.getElementById("recentButton");
const recentDropdown = document.getElementById("recentDropdown");
const popularButton = document.getElementById("popularButton");
const popularDropdown = document.getElementById("popularDropdown");
const themeButton = document.getElementById("themeButton");
const randomButton = document.getElementById("randomButton");

/* ==========================================
   UTILITÁRIOS DE ARMAZENAMENTO E SEGURANÇA
========================================== */

function loadFromStorage(key, fallback) {
    try {
        const stored = localStorage.getItem(key);
        return stored !== null ? JSON.parse(stored) : fallback;
    } catch (error) {
        console.warn(`Erro ao ler ${key} do localStorage:`, error);
        return fallback;
    }
}

function saveToStorage(key, value) {
    try {
        const serialized = typeof value === "string" ? value : JSON.stringify(value);
        localStorage.setItem(key, serialized);
    } catch (error) {
        console.warn(`Erro ao salvar ${key} no localStorage:`, error);
    }
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ==========================================
   ESTADO DA APLICAÇÃO
========================================== */

let currentThemeIndex = 0;
let radios = [];
let currentRadio = null;
let currentSort = "original";
let listeningRadio = null;
let listeningTimer = null;
let previousVolume = Number(volumeControl.value);
let lastRandomUrl = null;

let recentRadios = loadFromStorage(STORAGE_KEYS.RECENT, []);
let popularRadios = loadFromStorage(STORAGE_KEYS.POPULAR, []);
let favoriteRadios = loadFromStorage(STORAGE_KEYS.FAVORITES, []);

/* ==========================================
   GERENCIAMENTO DE TEMAS
========================================== */

function applyTheme(themeIndex) {
    const theme = THEMES[themeIndex];

    document.documentElement.setAttribute("data-theme", theme.name);
    themeButton.textContent = theme.icon;
    themeButton.setAttribute("aria-label", theme.label);
    themeButton.setAttribute("title", theme.label);

    currentThemeIndex = themeIndex;
    saveToStorage(STORAGE_KEYS.THEME, theme.name);
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const savedIndex = THEMES.findIndex(theme => theme.name === savedTheme);

    applyTheme(savedIndex !== -1 ? savedIndex : 0);
}

themeButton.addEventListener("click", () => {
    const nextIndex = (currentThemeIndex + 1) % THEMES.length;
    applyTheme(nextIndex);
});

/* ==========================================
   RÁDIO ALEATÓRIA (DADO 🎲)
========================================== */

function pickRandomRadio() {
    if (!radios.length) return null;

    // Se só existe uma rádio, retorna ela mesma
    if (radios.length === 1) return radios[0];

    let chosen;
    let attempts = 0;

    // Evita repetir a última sorteada (com limite de tentativas por segurança)
    do {
        const index = Math.floor(Math.random() * radios.length);
        chosen = radios[index];
        attempts++;
    } while (chosen.url === lastRandomUrl && attempts < 10);

    lastRandomUrl = chosen.url;
    return chosen;
}

randomButton.addEventListener("click", () => {
    if (!radios.length) {
        playerStatus.textContent = "Aguarde o carregamento das rádios...";
        return;
    }

    // Animação do dado girando
    randomButton.classList.add("rolling");
    setTimeout(() => randomButton.classList.remove("rolling"), 600);

    const randomRadio = pickRandomRadio();

    if (randomRadio) {
        playRadio(randomRadio);
    }
});

/* ==========================================
   INICIALIZAÇÃO
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    loadSavedTheme();

    const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME);
    const initialVolume = savedVolume !== null
        ? Number(savedVolume)
        : Number(volumeControl.value);

    previousVolume = initialVolume > 0 ? initialVolume : 0.8;
    applyVolume(initialVolume, false);

    renderRecentDropdown();
    renderPopularDropdown();
    loadPlaylist();
});

/* ==========================================
   CARREGAR E INTERPRETAR PLAYLIST (M3U)
========================================== */

async function loadPlaylist() {
    try {
        showLoading();

        const response = await fetch(PLAYLIST_URL, { cache: "no-cache" });

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }

        const playlistText = await response.text();
        parseM3U(playlistText);

        if (!radios.length) {
            throw new Error("Nenhuma rádio encontrada.");
        }

        renderRadios();
    } catch (error) {
        console.error("Erro ao carregar playlist:", error);
        showError();
    }
}

function parseM3U(text) {
    const lines = text.split(/\r?\n/);
    let currentRadioData = null;

    radios = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line) continue;

        if (line.startsWith("#EXTINF:")) {
            const commaPosition = line.indexOf(",");
            const name = commaPosition !== -1
                ? line.substring(commaPosition + 1).trim()
                : "Rádio sem nome";

            currentRadioData = {
                name,
                category: "Outras",
                displayCategory: "Outras",
                url: ""
            };
            continue;
        }

        if (line.startsWith("#EXTGRP:")) {
            if (currentRadioData) {
                const category = line.substring(8).trim() || "Outras";
                currentRadioData.category = category;
                currentRadioData.displayCategory = category;
            }
            continue;
        }

        if (!line.startsWith("#") && currentRadioData) {
            currentRadioData.url = line;

            if (currentRadioData.name.toLowerCase().includes("disney")) {
                currentRadioData.displayCategory = "Disney";
            }

            if (!currentRadioData.displayCategory || !currentRadioData.displayCategory.trim()) {
                currentRadioData.displayCategory = "Outras";
            }

            radios.push(currentRadioData);
            currentRadioData = null;
        }
    }
}

/* ==========================================
   FAVORITOS
========================================== */

function isFavorite(radio) {
    return favoriteRadios.includes(radio.url);
}

function toggleFavorite(radio) {
    const index = favoriteRadios.indexOf(radio.url);

    if (index === -1) {
        favoriteRadios.push(radio.url);
    } else {
        favoriteRadios.splice(index, 1);
    }

    saveToStorage(STORAGE_KEYS.FAVORITES, favoriteRadios);
    renderRadios(searchInput.value);
}

/* ==========================================
   HISTÓRICO E RANKING (RECENTES E POPULARES)
========================================== */

function addToRecent(radio) {
    recentRadios = recentRadios.filter(item => item.url !== radio.url);

    recentRadios.unshift({
        name: radio.name,
        url: radio.url
    });

    recentRadios = recentRadios.slice(0, MAX_HISTORY_ITEMS);
    saveToStorage(STORAGE_KEYS.RECENT, recentRadios);
    renderRecentDropdown();
}

function startListeningCounter(radio) {
    stopListeningCounter();
    listeningRadio = radio;

    listeningTimer = setTimeout(() => {
        if (
            currentRadio &&
            currentRadio.url === radio.url &&
            !audioPlayer.paused
        ) {
            registerRadioListen(radio);
        }
    }, LISTEN_TIME_REQUIRED);
}

function stopListeningCounter() {
    if (listeningTimer) {
        clearTimeout(listeningTimer);
    }
    listeningTimer = null;
    listeningRadio = null;
}

function registerRadioListen(radio) {
    if (!radio) return;

    const existing = popularRadios.find(item => item.url === radio.url);

    if (existing) {
        existing.count += 1;
    } else {
        popularRadios.push({
            name: radio.name,
            url: radio.url,
            count: 1
        });
    }

    popularRadios.sort((a, b) => b.count - a.count);
    popularRadios = popularRadios.slice(0, MAX_HISTORY_ITEMS);

    saveToStorage(STORAGE_KEYS.POPULAR, popularRadios);
    renderPopularDropdown();

    listeningTimer = null;
}

/* ==========================================
   RENDERIZAÇÃO DOS DROPDOWNS
========================================== */

function renderPopularDropdown() {
    popularDropdown.innerHTML = "";

    if (!popularRadios.length) {
        popularDropdown.innerHTML = `
            <div class="recent-empty">
                Nenhuma rádio ranqueada ainda.
            </div>
        `;
        return;
    }

    popularRadios.forEach((radio, index) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "recent-item";
        item.title = `Tocar ${radio.name}`;

        const listenLabel = radio.count === 1 ? "escuta" : "escutas";

        item.innerHTML = `
            <span class="popular-position">${index + 1}º</span>
            <span class="recent-item-info">
                <span class="recent-item-name">${escapeHTML(radio.name)}</span>
                <span class="recent-item-category">${radio.count} ${listenLabel}</span>
            </span>
            <span class="recent-item-play">▶</span>
        `;

        item.addEventListener("click", event => {
            event.stopPropagation();

            const foundRadio = radios.find(r => r.url === radio.url);
            if (foundRadio) {
                playRadio(foundRadio);
            }

            closeAllDropdowns();
        });

        popularDropdown.appendChild(item);
    });
}

function renderRecentDropdown() {
    recentDropdown.innerHTML = "";

    if (!recentRadios.length) {
        recentDropdown.innerHTML = `
            <div class="recent-empty">
                Nenhuma rádio ouvida recentemente.
            </div>
        `;
        return;
    }

    recentRadios.forEach(radio => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "recent-item";
        item.textContent = radio.name;
        item.title = `Tocar ${radio.name}`;

        item.addEventListener("click", event => {
            event.stopPropagation();

            const foundRadio = radios.find(r => r.url === radio.url);
            if (foundRadio) {
                playRadio(foundRadio);
            }

            closeAllDropdowns();
        });

        recentDropdown.appendChild(item);
    });
}

/* ==========================================
   RENDERIZAÇÃO PRINCIPAL (CATEGORIAS E CARDS)
========================================== */

function renderRadios(filter = "") {
    const query = filter.trim().toLowerCase();

    const filteredRadios = radios.filter(radio => {
        const name = radio.name.toLowerCase();
        const category = (radio.displayCategory || radio.category || "Outras").toLowerCase();
        return name.includes(query) || category.includes(query);
    });

    if (!filteredRadios.length) {
        radioApp.innerHTML = `
            <div class="empty">
                <div class="empty-icon">🔎</div>
                <div>Nenhuma rádio encontrada.</div>
            </div>
        `;
        return;
    }

    const favoriteList = filteredRadios.filter(radio => isFavorite(radio));
    const categories = {};

    filteredRadios.forEach(radio => {
        const category = radio.displayCategory || radio.category || "Outras";
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(radio);
    });

    radioApp.innerHTML = "";

    // Seção de Favoritos
    if (favoriteList.length > 0) {
        const favSection = createCategorySection("Favoritos", "⭐", favoriteList, "favorites-category");
        radioApp.appendChild(favSection);
    }

    // Ordenação das Categorias
    const categoryEntries = Object.entries(categories);

    if (currentSort === "az") {
        categoryEntries.sort((a, b) =>
            a[0].localeCompare(b[0], "pt-BR", { sensitivity: "base" })
        );
    } else if (currentSort === "za") {
        categoryEntries.sort((a, b) =>
            b[0].localeCompare(a[0], "pt-BR", { sensitivity: "base" })
        );
    }

    // Seções de Categorias
    categoryEntries.forEach(([category, categoryRadios]) => {
        const icon = CATEGORY_ICONS[category] || "🌎";
        const section = createCategorySection(escapeHTML(category), icon, categoryRadios);
        radioApp.appendChild(section);
    });
}

function createCategorySection(titleHTML, iconHTML, radioList, extraClass = "") {
    const section = document.createElement("section");
    section.className = `category ${extraClass}`.trim();

    section.innerHTML = `
        <div class="category-title">
            <span>${iconHTML}</span>
            <span>${titleHTML}</span>
            <span class="category-count">${radioList.length}</span>
        </div>
        <div class="radio-grid"></div>
    `;

    const grid = section.querySelector(".radio-grid");
    radioList.forEach(radio => {
        grid.appendChild(createRadioCard(radio));
    });

    return section;
}

function createRadioCard(radio) {
    const card = document.createElement("div");
    card.className = "radio-card";

    const isSelected = currentRadio && currentRadio.url === radio.url;
    const isPlaying = isSelected && !audioPlayer.paused;
    const favorited = isFavorite(radio);

    if (isSelected) {
        card.classList.add("active");
    }

    const favTitle = favorited ? "Desfavoritar rádio" : "Favoritar rádio";
    const categoryName = radio.displayCategory || radio.category || "Outras";

    card.innerHTML = `
        <div class="radio-icon">📻</div>
        <div class="radio-name">${escapeHTML(radio.name)}</div>
        ${isPlaying ? `
            <div class="radio-live">
                <span class="radio-live-dot"></span>
                AO VIVO
            </div>
        ` : ""}
        <div class="radio-country">${escapeHTML(categoryName)}</div>
        <button
            class="radio-favorite ${favorited ? "favorited" : ""}"
            type="button"
            title="${favTitle}"
            aria-label="${favTitle}"
        >
            ${favorited ? "★" : "☆"}
        </button>
        <button
            class="radio-play"
            type="button"
            title="Tocar rádio"
        >
            ${isPlaying ? "⏹" : "▶"}
        </button>
    `;

    const playBtn = card.querySelector(".radio-play");
    playBtn.addEventListener("click", event => {
        event.stopPropagation();

        if (currentRadio && currentRadio.url === radio.url && !audioPlayer.paused) {
            stopRadio();
            return;
        }

        playRadio(radio);
    });

    const favoriteBtn = card.querySelector(".radio-favorite");
    favoriteBtn.addEventListener("click", event => {
        event.stopPropagation();
        toggleFavorite(radio);
    });

    return card;
}

/* ==========================================
   CONTROLE DE REPRODUÇÃO (PLAY / STOP)
========================================== */

async function playRadio(radio) {
    try {
        stopListeningCounter();

        currentRadio = radio;
        currentStation.textContent = radio.name;
        playerStatus.textContent = "Conectando...";
        playPauseButton.textContent = "⏳";

        audioPlayer.src = radio.url;
        audioPlayer.load();

        await audioPlayer.play();

        addToRecent(radio);
        startListeningCounter(radio);

        playPauseButton.textContent = "⏹";
        playerStatus.innerHTML = LIVE_BADGE_HTML;

        renderRadios(searchInput.value);
    } catch (error) {
        console.error("Erro ao reproduzir:", error);

        playPauseButton.textContent = "▶";
        playerStatus.textContent = "Não foi possível reproduzir esta rádio no navegador.";

        renderRadios(searchInput.value);
    }
}

function stopRadio(statusMessage = "Escolha uma rádio para começar.") {
    audioPlayer.pause();
    stopListeningCounter();

    audioPlayer.removeAttribute("src");
    audioPlayer.load();

    currentRadio = null;
    currentStation.textContent = "Nenhuma rádio selecionada";
    playPauseButton.textContent = "▶";
    playerStatus.textContent = statusMessage;

    renderRadios(searchInput.value);
}

playPauseButton.addEventListener("click", async () => {
    if (!currentRadio) {
        playerStatus.textContent = "Escolha uma rádio primeiro.";
        return;
    }

    if (!audioPlayer.paused) {
        stopRadio();
        return;
    }

    try {
        playerStatus.textContent = "Conectando...";
        playPauseButton.textContent = "⏳";

        audioPlayer.src = currentRadio.url;
        audioPlayer.load();

        await audioPlayer.play();
        startListeningCounter(currentRadio);

        playPauseButton.textContent = "⏹";
        playerStatus.innerHTML = LIVE_BADGE_HTML;

        renderRadios(searchInput.value);
    } catch (error) {
        console.error("Erro ao iniciar rádio:", error);
        playPauseButton.textContent = "▶";
        playerStatus.textContent = "Não foi possível iniciar a rádio.";
    }
});

/* ==========================================
   CONTROLE DE VOLUME E MUDO
========================================== */

function applyVolume(volume, persist = true) {
    const clampedVolume = Math.max(0, Math.min(1, Number(volume)));

    audioPlayer.volume = clampedVolume;
    volumeControl.value = clampedVolume;
    volumeValue.textContent = Math.round(clampedVolume * 100);

    if (persist) {
        saveToStorage(STORAGE_KEYS.VOLUME, clampedVolume);
    }

    if (clampedVolume > 0) {
        previousVolume = clampedVolume;
        muteButton.textContent = "🔊";
        muteButton.setAttribute("aria-label", "Mutar");
        muteButton.setAttribute("title", "Mutar");
    } else {
        muteButton.textContent = "🔇";
        muteButton.setAttribute("aria-label", "Ativar som");
        muteButton.setAttribute("title", "Ativar som");
    }
}

volumeControl.addEventListener("input", () => {
    applyVolume(volumeControl.value);
});

muteButton.addEventListener("click", () => {
    if (audioPlayer.volume > 0) {
        previousVolume = audioPlayer.volume;
        applyVolume(0);
    } else {
        const restoredVolume = previousVolume > 0 ? previousVolume : 0.8;
        applyVolume(restoredVolume);
    }
});

/* ==========================================
   DROPDOWNS, PESQUISA E ORDENAÇÃO
========================================== */

function toggleDropdown(button, dropdown, otherButton, otherDropdown) {
    const isOpen = dropdown.classList.contains("open");

    otherDropdown.classList.remove("open");
    otherButton.setAttribute("aria-expanded", "false");

    if (isOpen) {
        dropdown.classList.remove("open");
        button.setAttribute("aria-expanded", "false");
    } else {
        dropdown.classList.add("open");
        button.setAttribute("aria-expanded", "true");
    }
}

function closeAllDropdowns() {
    recentDropdown.classList.remove("open");
    recentButton.setAttribute("aria-expanded", "false");

    popularDropdown.classList.remove("open");
    popularButton.setAttribute("aria-expanded", "false");
}

recentButton.addEventListener("click", event => {
    event.stopPropagation();
    toggleDropdown(recentButton, recentDropdown, popularButton, popularDropdown);
});

popularButton.addEventListener("click", event => {
    event.stopPropagation();
    toggleDropdown(popularButton, popularDropdown, recentButton, recentDropdown);
});

document.addEventListener("click", event => {
    if (!event.target.closest(".recent-box") && !event.target.closest(".popular-box")) {
        closeAllDropdowns();
    }
});

searchInput.addEventListener("input", () => {
    renderRadios(searchInput.value);
});

sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    renderRadios(searchInput.value);
});

/* ==========================================
   EVENTOS DO ELEMENTO DE ÁUDIO
========================================== */

audioPlayer.addEventListener("playing", () => {
    playPauseButton.textContent = "⏹";
    playerStatus.innerHTML = LIVE_BADGE_HTML;
    renderRadios(searchInput.value);
});

audioPlayer.addEventListener("waiting", () => {
    if (currentRadio) {
        playerStatus.textContent = "Bufferizando...";
    }
});

audioPlayer.addEventListener("error", () => {
    stopListeningCounter();
    playPauseButton.textContent = "▶";
    playerStatus.textContent = "Erro ao acessar o stream.";
    currentRadio = null;
    currentStation.textContent = "Nenhuma rádio selecionada";
    renderRadios(searchInput.value);
});

/* ==========================================
   TELAS DE ESTADO (LOADING / ERRO)
========================================== */

function showLoading() {
    radioApp.innerHTML = `
        <div class="loading">
            <div class="loading-icon">📻</div>
            <p>Carregando suas rádios...</p>
        </div>
    `;
}

function showError() {
    radioApp.innerHTML = `
        <div class="empty">
            <div class="empty-icon">⚠️</div>
            <div>Não foi possível carregar a playlist.</div>
            <p>Verifique sua conexão e tente novamente.</p>
        </div>
    `;
}
