const PLAYLIST_URL =
    "https://gist.githubusercontent.com/NatoFer0/c5174eb31972b0fddbb5e4bb460f0bc2/raw/radios.m3u";


const audioPlayer =
    document.getElementById("audioPlayer");

const radioApp =
    document.getElementById("radioApp");

const searchInput =
    document.getElementById("searchInput");

const sortSelect =
    document.getElementById("sortSelect");

const currentStation =
    document.getElementById("currentStation");

const playerStatus =
    document.getElementById("playerStatus");

const playPauseButton =
    document.getElementById("playPauseButton");

const muteButton =
    document.getElementById("muteButton");

const volumeControl =
    document.getElementById("volumeControl");

const volumeValue =
    document.getElementById("volumeValue");

const VOLUME_STORAGE_KEY =
    "minhasRadios_volume";

let previousVolume =
    Number(volumeControl.value);

let radios = [];

let currentRadio = null;

let currentSort = "original";

/* ==========================================
   FAVORITOS
========================================== */

const FAVORITES_STORAGE_KEY =
    "minhasRadios_favoritos";

let favoriteRadios =
    JSON.parse(
        localStorage.getItem(
            FAVORITES_STORAGE_KEY
        ) || "[]"
    );

/* ==========================================
   ÍCONES DAS CATEGORIAS
========================================== */

const categoryIcons = {

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

/* ==========================================
   INICIALIZAÇÃO
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const savedVolume =
            localStorage.getItem(
                VOLUME_STORAGE_KEY
            );

        const initialVolume =
            savedVolume !== null
                ? Number(savedVolume)
                : Number(volumeControl.value);


        volumeControl.value =
            initialVolume;


        audioPlayer.volume =
            initialVolume;


        previousVolume =
            initialVolume > 0
                ? initialVolume
                : 0.8;


        volumeValue.textContent =
            Math.round(
                initialVolume * 100
            );


        if (initialVolume === 0) {

            muteButton.textContent =
                "🔇";

            muteButton.setAttribute(
                "aria-label",
                "Ativar som"
            );

            muteButton.setAttribute(
                "title",
                "Ativar som"
            );

        }


        loadPlaylist();

    }
);



/* ==========================================
   CARREGAR PLAYLIST
========================================== */

async function loadPlaylist() {

    try {

        showLoading();

        const response =
            await fetch(PLAYLIST_URL, {
                cache: "no-cache"
            });


        if (!response.ok) {

            throw new Error(
                "Erro HTTP " +
                response.status
            );

        }


        const playlistText =
            await response.text();


        parseM3U(playlistText);


        if (!radios.length) {
        
            throw new Error(
                "Nenhuma rádio encontrada."
            );
        
        }
        
        
        renderRadios();



    } catch (error) {

        console.error(
            "Erro ao carregar playlist:",
            error
        );

        showError();

    }

}


/* ==========================================
   INTERPRETAR M3U
========================================== */

function parseM3U(text) {

    const lines =
        text.split(/\r?\n/);

    let currentRadioData =
        null;

    radios = [];


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i].trim();


        if (!line) {
            continue;
        }


        /*
         * EXTINF contém o nome da rádio.
         *
         * A categoria ainda não é definida
         * aqui porque no seu Gist o EXTGRP
         * aparece logo depois do EXTINF.
         */

        if (
            line.startsWith("#EXTINF:")
        ) {

            const commaPosition =
                line.indexOf(",");


            let name =
                "Rádio sem nome";


            if (
                commaPosition !== -1
            ) {

                name =
                    line
                        .substring(
                            commaPosition + 1
                        )
                        .trim();

            }


            currentRadioData = {

                name: name,

                category:
                    "Outras",

                displayCategory:
                    "Outras",

                url: ""

            };


            continue;
        }


        /*
         * EXTGRP define a categoria
         * da rádio atual.
         *
         * No seu Gist ele aparece DEPOIS
         * do EXTINF, por isso precisamos
         * associá-lo ao currentRadioData.
         */

        if (
            line.startsWith("#EXTGRP:")
        ) {

            if (
                currentRadioData
            ) {

                const category =
                    line
                        .substring(8)
                        .trim();


                currentRadioData.category =
                    category ||
                    "Outras";


                currentRadioData.displayCategory =
                    category ||
                    "Outras";

            }


            continue;
        }


        /*
         * Qualquer linha que não comece
         * com "#" será tratada como URL.
         */

        if (
            !line.startsWith("#") &&
            currentRadioData
        ) {

            currentRadioData.url =
                line;


            /*
             * Disney continua agrupada
             * automaticamente.
             */

            if (
                currentRadioData.name
                    .toLowerCase()
                    .includes("disney")
            ) {

                currentRadioData.displayCategory =
                    "Disney";

            }


            /*
             * Garante que nunca fique
             * uma categoria vazia.
             */

            if (
                !currentRadioData.displayCategory ||
                !currentRadioData.displayCategory.trim()
            ) {

                currentRadioData.displayCategory =
                    "Outras";

            }


            radios.push(
                currentRadioData
            );


            currentRadioData =
                null;

        }

    }

}

/* ==========================================
   FAVORITOS
========================================== */

function isFavorite(radio) {

    return favoriteRadios.includes(
        radio.url
    );

}


function saveFavorites() {

    localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favoriteRadios)
    );

}


function toggleFavorite(radio) {

    const index =
        favoriteRadios.indexOf(
            radio.url
        );


    if (index === -1) {

        /*
         * Rádio ainda não é favorita.
         * Adiciona aos favoritos.
         */

        favoriteRadios.push(
            radio.url
        );

    } else {

        /*
         * Rádio já é favorita.
         * Remove dos favoritos.
         */

        favoriteRadios.splice(
            index,
            1
        );

    }


    saveFavorites();


    /*
     * Atualiza a tela mantendo
     * a pesquisa atual.
     */

    renderRadios(
        searchInput.value
    );

}

/* ==========================================
   RENDERIZAR RÁDIOS
========================================== */

function renderRadios(
    filter = ""
) {

    const query =
        filter
            .trim()
            .toLowerCase();


    const filteredRadios =
        radios.filter(
            radio => {

                const name =
                    radio.name
                        .toLowerCase();

                const category =
                    (
                        radio.displayCategory ||
                        radio.category ||
                        "Outras"
                    ).toLowerCase();


                return (
                    name.includes(query) ||
                    category.includes(query)
                );

            }
        );


    if (!filteredRadios.length) {

        radioApp.innerHTML = `

            <div class="empty">

                <div class="empty-icon">
                    🔎
                </div>

                <div>
                    Nenhuma rádio encontrada.
                </div>

            </div>

        `;

        return;

    }


    const categories = {};


/*
 * Separa as rádios favoritas
 * das demais rádios.
 */

const favoriteList =
    filteredRadios.filter(
        radio =>
            isFavorite(radio)
    );


const normalRadios =
    filteredRadios;

/*
 * Agrupa somente as rádios
 * normais por categoria.
 */

normalRadios.forEach(
    radio => {

        const category =
            radio.displayCategory ||
            radio.category ||
            "Outras";


        if (
            !categories[category]
        ) {

            categories[category] =
                [];

        }


        categories[category].push(
            radio
        );

    }
);


radioApp.innerHTML = "";


/*
 * As categorias normais continuam
 * usando a ordenação existente.
 */

let categoryEntries =
    Object.entries(
        categories
    );

/*
 * ================================
 * SEÇÃO DE FAVORITOS
 * ================================
 */

if (
    favoriteList.length > 0
) {

    const section =
        document.createElement(
            "section"
        );


    section.className =
        "category favorites-category";


    section.innerHTML = `

        <div class="category-title">

            <span>
                ⭐
            </span>

            <span>
                Favoritos
            </span>

            <span
                class="category-count"
            >
                ${favoriteList.length}
            </span>

        </div>

        <div
            class="radio-grid"
        ></div>

    `;


    const grid =
        section.querySelector(
            ".radio-grid"
        );


    favoriteList.forEach(
        radio => {

            const card =
                createRadioCard(
                    radio
                );


            grid.appendChild(
                card
            );

        }
    );


    radioApp.appendChild(
        section
    );

}




/*
 * Ordenação das categorias.
 *
 * "original" mantém a ordem em que
 * as categorias apareceram no arquivo M3U.
 */

if (currentSort === "az") {

    categoryEntries.sort(
        (a, b) =>
            a[0].localeCompare(
                b[0],
                "pt-BR",
                {
                    sensitivity: "base"
                }
            )
    );

}


if (currentSort === "za") {

    categoryEntries.sort(
        (a, b) =>
            b[0].localeCompare(
                a[0],
                "pt-BR",
                {
                    sensitivity: "base"
                }
            )
    );

}


categoryEntries.forEach(
    (
        [
            category,
            categoryRadios
        ]
    ) => {

                const section =
                    document.createElement(
                        "section"
                    );


                section.className =
                    "category";


                const icon =
                    categoryIcons[
                        category
                    ] || "🌎";


                section.innerHTML = `

                    <div class="category-title">

                        <span>
                            ${icon}
                        </span>

                        <span>
                            ${escapeHTML(
                                category
                            )}
                        </span>

                        <span
                            class="category-count"
                        >
                            ${categoryRadios.length}
                        </span>

                    </div>

                    <div
                        class="radio-grid"
                    ></div>

                `;


                const grid =
                    section.querySelector(
                        ".radio-grid"
                    );


                categoryRadios.forEach(
                    radio => {

                        const card =
                            createRadioCard(
                                radio
                            );


                        grid.appendChild(
                            card
                        );

                    }
                );


                radioApp.appendChild(
                    section
                );

            }
        );

}


/* ==========================================
   CRIAR CARD DA RÁDIO
========================================== */

function createRadioCard(
    radio
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "radio-card";


    if (
        currentRadio &&
        currentRadio.url === radio.url
    ) {

        card.classList.add(
            "active"
        );

    }

    const isCurrent =
        currentRadio &&
        currentRadio.url === radio.url &&
        !audioPlayer.paused;

    card.innerHTML = `

    <div class="radio-icon">
        📻
    </div>

    <div class="radio-name">
        ${escapeHTML(
            radio.name
        )}
    </div>

    ${
    isCurrent
        ? `
            <div class="radio-live">
                <span class="radio-live-dot"></span>
                AO VIVO
            </div>
        `
        : ""
    }

    <div class="radio-country">
        ${escapeHTML(
            radio.displayCategory ||
            radio.category ||
            "Outras"
        )}
    </div>

    <button
        class="radio-favorite ${isFavorite(radio) ? "favorited" : ""}"
        type="button"
        title="${
            isFavorite(radio)
                ? "Desfavoritar rádio"
                : "Favoritar rádio"
        }"
        aria-label="${
            isFavorite(radio)
                ? "Desfavoritar rádio"
                : "Favoritar rádio"
        }"
    >
        ${
            isFavorite(radio)
                ? "★"
                : "☆"
        }
    </button>

    <button
        class="radio-play"
        type="button"
        title="Tocar rádio"
    >
        ${isCurrent ? "⏹" : "▶"}
    </button>

`;



    /*
     * Evita que o clique no botão
     * seja tratado duas vezes.
     */

    const button =
        card.querySelector(
            ".radio-play"
        );


    button.addEventListener(
    "click",
    event => {

        event.stopPropagation();


        /*
         * Se esta rádio é a que está tocando,
         * o botão do card funciona como PARAR.
         */

        if (
            currentRadio &&
            currentRadio.url === radio.url &&
            !audioPlayer.paused
        ) {

            audioPlayer.pause();

            /*
             * Remove completamente a conexão
             * com o stream atual.
             */

            audioPlayer.removeAttribute(
                "src"
            );

            audioPlayer.load();


            /*
             * Volta o player para o estado inicial.
             */

            currentRadio = null;

            currentStation.textContent =
                "Nenhuma rádio selecionada";

            playPauseButton.textContent =
                "▶";

            playerStatus.textContent =
                "Escolha uma rádio para começar.";


            renderRadios(
                searchInput.value
            );


            return;

        }


        /*
         * Caso contrário, toca a rádio normalmente.
         */

        playRadio(
            radio
        );

    }
);


    const favoriteButton =
    card.querySelector(
        ".radio-favorite"
    );


favoriteButton.addEventListener(
    "click",
    event => {

        /*
         * Impede que o clique na estrela
         * também toque a rádio.
         */

        event.stopPropagation();


        toggleFavorite(
            radio
        );

    }
);


    return card;

}


/* ==========================================
   TOCAR RÁDIO
========================================== */

async function playRadio(
    radio
) {

    try {

        currentRadio =
            radio;


        currentStation.textContent =
            radio.name;


        playerStatus.textContent =
            "Conectando...";


        playPauseButton.textContent =
            "⏳";


        /*
         * Define a URL do stream.
         */

        audioPlayer.src =
            radio.url;


        audioPlayer.load();


        /*
         * Tenta iniciar imediatamente.
         */

        await audioPlayer.play();


        playPauseButton.textContent =
            "⏹";


        playerStatus.innerHTML = `
            <span class="player-live">
                <span class="radio-live-dot"></span>
                AO VIVO
            </span>
        `;


        renderRadios(
            searchInput.value
        );


    } catch (error) {

        console.error(
            "Erro ao reproduzir:",
            error
        );


        playPauseButton.textContent =
            "▶";


        playerStatus.textContent =
            "Não foi possível reproduzir esta rádio no navegador.";


        renderRadios(
            searchInput.value
        );

    }

}

/* ==========================================
   PLAY / PARAR
========================================== */

playPauseButton.addEventListener(
    "click",
    async () => {

        /*
         * Nenhuma rádio escolhida.
         */

        if (!currentRadio) {

            playerStatus.textContent =
                "Escolha uma rádio primeiro.";

            return;

        }


        /*
         * Se estiver tocando,
         * o botão agora funciona como PARAR.
         */

        if (!audioPlayer.paused) {

            audioPlayer.pause();

            /*
            * Remove completamente a conexão
            * com o stream atual.
            */

            audioPlayer.removeAttribute(
                "src"
            );

            audioPlayer.load();

            /*
            * Limpa a rádio atualmente selecionada.
            */

            currentRadio = null;

            currentStation.textContent =
                "Nenhuma rádio selecionada";
            
            playPauseButton.textContent =
                "▶";
            
            playerStatus.textContent =
                "Escolha uma rádio para começar.";
            
            renderRadios(
                searchInput.value
            );
            
            return;


        }


        /*
         * Se estiver parado,
         * inicia uma NOVA conexão
         * com a rádio atual.
         *
         * Isso faz o usuário voltar
         * para o ponto atual da transmissão.
         */

        try {

            playerStatus.textContent =
                "Conectando...";


            playPauseButton.textContent =
                "⏳";


            audioPlayer.src =
                currentRadio.url;


            audioPlayer.load();


            await audioPlayer.play();


            playPauseButton.textContent =
                "⏹";


            playerStatus.innerHTML = `
                <span class="radio-live">
                    <span class="radio-live-dot"></span>
                    AO VIVO
                </span>
            `;


            renderRadios(
                searchInput.value
            );


        } catch (error) {

            console.error(
                "Erro ao iniciar rádio:",
                error
            );


            playPauseButton.textContent =
                "▶";


            playerStatus.textContent =
                "Não foi possível iniciar a rádio.";

        }

    }
);


/* ==========================================
   CONTROLE DE VOLUME
========================================== */

volumeControl.addEventListener(
    "input",
    () => {

        const volume =
            Number(volumeControl.value);

        audioPlayer.volume =
            volume;

        volumeValue.textContent =
            Math.round(
                volume * 100
            );

        localStorage.setItem(
            VOLUME_STORAGE_KEY,
            volume
        );

        
        if (volume > 0) {

            previousVolume =
                volume;

            muteButton.textContent =
                "🔊";

            muteButton.setAttribute(
                "aria-label",
                "Mutar"
            );

            muteButton.setAttribute(
                "title",
                "Mutar"
            );

        } else {

            muteButton.textContent =
                "🔇";

            muteButton.setAttribute(
                "aria-label",
                "Ativar som"
            );

            muteButton.setAttribute(
                "title",
                "Ativar som"
            );

        }

    }
);


/* ==========================================
   MUTAR / DESMUTAR
========================================== */

muteButton.addEventListener(
    "click",
    () => {

        if (audioPlayer.volume > 0) {

            previousVolume =
                audioPlayer.volume;

            audioPlayer.volume =
                0;

            volumeControl.value =
                0;

            volumeValue.textContent =
                "0";

            localStorage.setItem(
                VOLUME_STORAGE_KEY,
                0
            );

            muteButton.textContent =
                "🔇";

            muteButton.setAttribute(
                "aria-label",
                "Ativar som"
            );

            muteButton.setAttribute(
                "title",
                "Ativar som"
            );

        } else {

            const volume =
                previousVolume > 0
                    ? previousVolume
                    : 0.8;

            audioPlayer.volume =
                volume;

            volumeControl.value =
                volume;

            volumeValue.textContent =
                Math.round(
                    volume * 100
                );

            localStorage.setItem(
                VOLUME_STORAGE_KEY,
                volume
            );


            muteButton.textContent =
                "🔊";

            muteButton.setAttribute(
                "aria-label",
                "Mutar"
            );

            muteButton.setAttribute(
                "title",
                "Mutar"
            );

        }

    }
);


/* ==========================================
   PESQUISA
========================================== */

searchInput.addEventListener(
    "input",
    () => {

        renderRadios(
            searchInput.value
        );

    }
);

/* ==========================================
   ORDENAÇÃO
========================================== */

sortSelect.addEventListener(
    "change",
    () => {

        currentSort =
            sortSelect.value;

        renderRadios(
            searchInput.value
        );

    }
);



/* ==========================================
   EVENTOS DO PLAYER
========================================== */

audioPlayer.addEventListener(
    "playing",
    () => {

        playPauseButton.textContent =
            "⏹";


        playerStatus.innerHTML = `
            <span class="player-live">
                <span class="radio-live-dot"></span>
                AO VIVO
            </span>
        `;

        renderRadios(
            searchInput.value
        );

    }
);

audioPlayer.addEventListener(
    "waiting",
    () => {

        if (
            currentRadio
        ) {

            playerStatus.textContent =
                "Bufferizando...";

        }

    }
);


audioPlayer.addEventListener(
    "error",
    () => {

        playPauseButton.textContent =
            "▶";


        playerStatus.textContent =
            "Erro ao acessar o stream.";

    }
);


/* ==========================================
   LOADING
========================================== */

function showLoading() {

    radioApp.innerHTML = `

        <div class="loading">

            <div class="loading-icon">
                📻
            </div>

            <p>
                Carregando suas rádios...
            </p>

        </div>

    `;

}


/* ==========================================
   ERRO
========================================== */

function showError() {

    radioApp.innerHTML = `

        <div class="empty">

            <div class="empty-icon">
                ⚠️
            </div>

            <div>
                Não foi possível carregar
                a playlist.
            </div>

            <p>
                Verifique sua conexão
                e tente novamente.
            </p>

        </div>

    `;

}


/* ==========================================
   PROTEGER TEXTO HTML
========================================== */

function escapeHTML(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}
