const PLAYLIST_URL =
    "https://gist.githubusercontent.com/NatoFer0/c5174eb31972b0fddbb5e4bb460f0bc2/raw/radios.m3u";


const audioPlayer =
    document.getElementById("audioPlayer");

const radioApp =
    document.getElementById("radioApp");

const searchInput =
    document.getElementById("searchInput");

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

let previousVolume =
    Number(volumeControl.value);


let radios = [];

let currentRadio = null;


/* ==========================================
   ÍCONES DAS CATEGORIAS
========================================== */

const categoryIcons = {

    "Brasil": "🇧🇷",

    "Argentina": "🇦🇷",

    "Uruguai": "🇺🇾",

    "Uruguay": "🇺🇾",

    "Chile": "🇨🇱",

    "Paraguai": "🇵🇾",

    "Paraguay": "🇵🇾",

    "México": "🇲🇽",

    "Mexico": "🇲🇽",

    "Colômbia": "🇨🇴",

    "Colombia": "🇨🇴",

    "Peru": "🇵🇪",

    "Estados Unidos": "🇺🇸",

    "USA": "🇺🇸",

    "Noruega": "🇳🇴",

    "República Dominicana": "🇩🇴",

    "Republica Dominicana": "🇩🇴",

    "Porto Rico": "🇵🇷",

    "Disney": "🏰",

    "Outras": "🌎"
};


/* ==========================================
   INICIALIZAÇÃO
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        audioPlayer.volume =
            Number(volumeControl.value);

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

    let currentCategory =
        "Outras";


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
         * EXTGRP define a categoria
         * que será usada pela próxima rádio.
         */

        if (
            line.startsWith("#EXTGRP:")
        ) {

            currentCategory =
                line
                    .substring(8)
                    .trim() ||
                "Outras";


            /*
             * Se já existe uma rádio sendo
             * montada, aplica a categoria.
             */

            if (
                currentRadioData
            ) {

                currentRadioData.category =
                    currentCategory;

            }


            continue;
        }


        /*
         * EXTINF contém o nome da rádio.
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
                    currentCategory,

                url: ""

            };


            continue;
        }


        /*
         * A linha seguinte ao EXTINF
         * normalmente é a URL.
         */

        if (
            !line.startsWith("#") &&
            currentRadioData
        ) {

            currentRadioData.url =
                line;


            radios.push(
                currentRadioData
            );


            currentRadioData =
                null;

        }

    }

}



/* ==========================================
   ORGANIZAR CATEGORIAS
========================================== */

function organizeCategories() {

    const categories = {};


    radios.forEach(
        radio => {

            let category =
                radio.category ||
                "Outras";


            /*
             * Todas as rádios Disney
             * ficam juntas na categoria Disney.
             */

            if (
                radio.name
                    .toLowerCase()
                    .includes("disney")
            ) {

                category =
                    "Disney";

            }


            /*
             * Caso a categoria esteja vazia.
             */

            if (!category.trim()) {

                category =
                    "Outras";

            }


            radio.displayCategory =
                category;


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


    return categories;

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


    filteredRadios.forEach(
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


    Object.entries(categories)
        .forEach(
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

        <div class="radio-country">
            ${escapeHTML(
                radio.displayCategory ||
                radio.category ||
                "Outras"
            )}
        </div>

        <button
            class="radio-play"
            type="button"
            title="Tocar rádio"
        >
            ${isCurrent ? "⏸" : "▶"}
        </button>

    `;


    /*
     * Clicar no card toca a rádio.
     */

    card.addEventListener(
        "click",
        () => {

            playRadio(
                radio
            );

        }
    );


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

            playRadio(
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
            "⏸";


        playerStatus.textContent =
            "Ao vivo";


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
   PLAY / PAUSE
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
         * Se estiver pausado,
         * tenta continuar.
         */

        if (
            audioPlayer.paused
        ) {

            try {

                await audioPlayer.play();


                playPauseButton.textContent =
                    "⏸";


                playerStatus.textContent =
                    "Ao vivo";


                renderRadios(
                    searchInput.value
                );


            } catch (error) {

                console.error(
                    error
                );


                playerStatus.textContent =
                    "Não foi possível iniciar a rádio.";

            }


            return;

        }


        /*
         * Caso esteja tocando,
         * pausa.
         */

        audioPlayer.pause();


        playPauseButton.textContent =
            "▶";


        playerStatus.textContent =
            "Pausado";


        renderRadios(
            searchInput.value
        );

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
   EVENTOS DO PLAYER
========================================== */

audioPlayer.addEventListener(
    "playing",
    () => {

        playPauseButton.textContent =
            "⏸";


        playerStatus.textContent =
            "Ao vivo";


        renderRadios(
            searchInput.value
        );

    }
);


audioPlayer.addEventListener(
    "pause",
    () => {

        /*
         * Não sobrescreve o estado
         * enquanto estiver carregando.
         */

        if (
            audioPlayer.src
        ) {

            playPauseButton.textContent =
                "▶";

        }

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
