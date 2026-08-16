/* ===== DJ WILMER EN VIVO - App logic ===== */

const STREAM_URL = "https://icecast.crispro941.cl/8006/stream";
const STATUS_URL = "https://icecast.crispro941.cl/cp/get_info.php?p=8006";
const ORIGINAL_LOGO = "icons/icon-512.png";

// Elementos
const radio = document.getElementById("radio");
const playBtn = document.getElementById("floating-play-pause-btn");
const icon = playBtn.querySelector("i");
const volumeSlider = document.getElementById("floating-volume-slider");
const stationLogo = document.getElementById("station-logo");
const floatingLogo = document.getElementById("floating-logo");
const stationInfo = document.getElementById("station-info");
const metadataEl = document.getElementById("metadata");
const trackArtist = document.getElementById("track-artist");
const trackTitle = document.getElementById("track-title");

let isPlaying = false;

/* ===== Reloj en vivo ===== */
function actualizarHora() {
    const ahora = new Date();
    const horas = ahora.getHours().toString().padStart(2, "0");
    const minutos = ahora.getMinutes().toString().padStart(2, "0");
    const segundos = ahora.getSeconds().toString().padStart(2, "0");
    document.getElementById("hora-actual").textContent = horas + ":" + minutos + ":" + segundos;
}
setInterval(actualizarHora, 1000);
actualizarHora();

/* ===== Reproducción ===== */
function togglePlay() {
    if (!isPlaying) {
        radio.play()
            .then(() => {
                isPlaying = true;
                icon.classList.remove("fa-play");
                icon.classList.add("fa-pause");
                playBtn.classList.add("playing");
                document.querySelectorAll(".rotate-logo").forEach(l => l.classList.add("playing"));
                document.body.classList.add("playing-bg");
                syncEqualizer();
            })
            .catch(err => {
                if (err.name === "NotAllowedError") {
                    mostrarToast("⚠️ Activa el sonido y vuelve a intentarlo");
                } else {
                    console.error("Error al reproducir:", err);
                    mostrarToast("⚠️ No se pudo reproducir el audio");
                }
            });
    } else {
        radio.pause();
        isPlaying = false;
        icon.classList.remove("fa-pause");
        icon.classList.add("fa-play");
        playBtn.classList.remove("playing");
        document.querySelectorAll(".rotate-logo").forEach(l => l.classList.remove("playing"));
        document.body.classList.remove("playing-bg");
        syncEqualizer();
    }
}

playBtn.addEventListener("click", togglePlay);

// Permitir tocar en la tarjeta / logo para reproducir
stationLogo.addEventListener("click", () => {
    if (!isPlaying) togglePlay();
});

/* ===== Temas y efectos ===== */
const THEME_NAMES = {
    fuego: "Tema Fuego",
    neon: "Tema Neón",
    violeta: "Tema Violeta",
    oceano: "Tema Océano",
    oro: "Tema Oro",
    rosa: "Tema Rosa"
};

const themeNameEl = document.getElementById("theme-name");
const particlesBox = document.getElementById("particles");
const fxParticles = document.getElementById("fx-particles");
const fxEqualizer = document.getElementById("fx-equalizer");
const fxNeon = document.getElementById("fx-neon");
const equalizerEl = document.getElementById("equalizer");

function aplicarTema(theme) {
    document.body.setAttribute("data-theme", theme);
    if (themeNameEl) themeNameEl.textContent = THEME_NAMES[theme] || theme;
    document.querySelectorAll(".theme-dot").forEach(d => {
        d.classList.toggle("active", d.dataset.theme === theme);
    });
    try { localStorage.setItem("djw_theme", theme); } catch (e) {}
}

function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem("djw_theme"); } catch (e) {}
    aplicarTema(saved && (saved in THEME_NAMES) ? saved : "fuego");
}

document.querySelectorAll(".theme-dot").forEach(dot => {
    dot.addEventListener("click", () => aplicarTema(dot.dataset.theme));
});

/* ===== Partículas ===== */
function crearParticula() {
    const p = document.createElement("span");
    p.className = "particle";
    const size = 5 + Math.random() * 7;
    p.style.width = size + "px";
    p.style.height = size + "px";
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = `radial-gradient(circle, rgba(255,255,255,0.9) 0%, ${getComputedStyle(document.body).getPropertyValue("--accent")} 100%)`;
    p.style.animationDuration = (8 + Math.random() * 10).toFixed(1) + "s";
    p.style.animationDelay = (Math.random() * 8).toFixed(1) + "s";
    p.style.opacity = 0;
    particlesBox.appendChild(p);
}

function initParticulas() {
    if (!particlesBox) return;
    particlesBox.innerHTML = "";
    if (!fxParticles.checked) return;
    const count = window.innerWidth < 768 ? 14 : 26;
    for (let i = 0; i < count; i++) crearParticula();
}

fxParticles.addEventListener("change", initParticulas);

// Actualizar color de partículas al cambiar tema
const observerTema = new MutationObserver(() => initParticulas());
if (document.body) observerTema.observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });

/* ===== Estado de efectos ===== */
function actualizarEfectos() {
    document.body.classList.toggle("fx-eq-off", !fxEqualizer.checked);
    document.body.classList.toggle("fx-neon-off", !fxNeon.checked);
}

fxEqualizer.addEventListener("change", () => {
    actualizarEfectos();
    syncEqualizer();
});
fxNeon.addEventListener("change", actualizarEfectos);

function syncEqualizer() {
    if (equalizerEl) equalizerEl.classList.toggle("active", isPlaying && fxEqualizer.checked);
}

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initParticulas();
    actualizarEfectos();
    syncEqualizer();
});

// Controles de medios del sistema (Media Session)
if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => { if (!isPlaying) togglePlay(); });
    navigator.mediaSession.setActionHandler("pause", () => { if (isPlaying) togglePlay(); });
    navigator.mediaSession.setActionHandler("stop", () => { if (isPlaying) togglePlay(); });

    // Control de volumen nativo
    try {
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
    } catch (e) { /* opcional */ }
}

/* ===== Volumen ===== */
radio.volume = volumeSlider.value / 100;
volumeSlider.addEventListener("input", () => {
    const vol = volumeSlider.value / 100;
    radio.volume = vol;
});

// Persistir volumen
try {
    const savedVol = localStorage.getItem("djw_volume");
    if (savedVol !== null) {
        const v = Math.max(0, Math.min(100, parseFloat(savedVol)));
        volumeSlider.value = v;
        radio.volume = v / 100;
    }
} catch (e) { /* ignore */ }

volumeSlider.addEventListener("change", () => {
    try { localStorage.setItem("djw_volume", volumeSlider.value); } catch (e) {}
});

/* ===== Metadata en vivo (fetch + polling) ===== */

function setArtwork(src) {
    if (stationLogo) stationLogo.src = src;
    if (floatingLogo) floatingLogo.src = src;
}

function resetStationVisual() {
    setArtwork(ORIGINAL_LOGO);
    if (stationInfo) stationInfo.style.background = `url('${ORIGINAL_LOGO}') center/cover no-repeat`;
}

function mostrarToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(mostrarToast._t);
    mostrarToast._t = setTimeout(() => t.classList.remove("show"), 2500);
}

function setMediaMetadata(title, artist, art) {
    if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist || "DJ Wilmer",
            album: "Live Show",
            artwork: [
                { src: art || ORIGINAL_LOGO, sizes: "512x512", type: "image/png" }
            ]
        });
    }
}

async function obtenerCaratula(artist, song) {
    try {
        const query = encodeURIComponent(`${artist} ${song}`);
        const res = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=1`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].artworkUrl100.replace("100x100", "600x600");
        }
    } catch (e) { /* ignore */ }
    return null;
}

async function actualizarMetadata() {
    try {
        const res = await fetch(STATUS_URL, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const payload = await res.json();

        const title = payload.streamTitle || payload.title || "";
        const serverArt = payload.art || "";

        if (title) {
            metadataEl.textContent = "🎶 " + title;

            let artist = "DJ Wilmer";
            let song = title;

            if (title.includes("-")) {
                const parts = title.split("-");
                artist = parts[0].trim();
                song = parts.slice(1).join("-").trim();
            }
            trackArtist.textContent = artist;
            trackTitle.textContent = song;

            // 1. Carátula oficial del servidor
            if (serverArt) {
                setArtwork(serverArt);
                if (stationInfo) stationInfo.style.background = `url('${serverArt}') center/cover no-repeat`;
            } else {
                // 2. Fallback: búsqueda en iTunes
                const art = await obtenerCaratula(artist, song);
                if (art) {
                    setArtwork(art);
                    if (stationInfo) stationInfo.style.background = `url('${art}') center/cover no-repeat`;
                }
            }
            setMediaMetadata(song, artist, serverArt || undefined);
        } else {
            resetStationVisual();
        }
    } catch (err) {
        console.error("Error al obtener metadata:", err);
        if (metadataEl) metadataEl.textContent = "⚠️ Sin metadata";
    }
}

// Polling cada 15 s (el servidor responde aplicación/json, EventSource no aplica)
setInterval(actualizarMetadata, 15000);
actualizarMetadata();

/* ===== Compartir ===== */
document.getElementById("boton-compartir").addEventListener("click", async () => {
    const shareData = {
        title: "DJ WILMER EN VIVO",
        text: "Escucha DJ Wilmer en vivo desde tu dispositivo",
        url: window.location.href
    };
    if (navigator.share) {
        try { await navigator.share(shareData); }
        catch (err) { if (err.name !== "AbortError") console.error("Error al compartir:", err); }
    } else {
        const text = encodeURIComponent(shareData.text + " " + shareData.url);
        window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    }
});

/* ===== Menú lateral ===== */
const toggleBtn = document.getElementById("menu-toggle");
const sidebarMenu = document.getElementById("sidebar-menu");
const sidebarOverlay = document.getElementById("sidebar-overlay");

function openMenu() {
    sidebarMenu.classList.add("open");
    sidebarOverlay.classList.add("show");
}

function closeMenu() {
    sidebarMenu.classList.remove("open");
    sidebarOverlay.classList.remove("show");
}

toggleBtn.addEventListener("click", () => {
    sidebarMenu.classList.contains("open") ? closeMenu() : openMenu();
});

sidebarOverlay.addEventListener("click", closeMenu);

document.getElementById("menu-inicio").addEventListener("click", (e) => {
    e.preventDefault();
    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("menu-chat").addEventListener("click", (e) => {
    e.preventDefault();
    closeMenu();
    mostrarChat();
});

document.getElementById("menu-privacidad").addEventListener("click", (e) => {
    e.preventDefault();
    closeMenu();
    mostrarPrivacidad();
});

/* ===== Chat ===== */
const chatSection = document.getElementById("chat-section");
const chatInput = document.getElementById("chat-input");

function persistChat() {
    try {
        localStorage.setItem("djw_chat", chatBox.innerHTML);
    } catch (e) {}
}

function loadChat() {
    try {
        const saved = localStorage.getItem("djw_chat");
        if (saved) chatBox.innerHTML = saved;
    } catch (e) {}
}

const chatBox = document.getElementById("chat-box");
loadChat();

window.mostrarChat = function () {
    chatSection.classList.add("open");
    setTimeout(() => chatInput.focus(), 300);
};

window.cerrarChat = function () {
    chatSection.classList.remove("open");
};

window.enviarMensaje = function () {
    const msg = chatInput.value.trim();
    if (msg !== "") {
        const div = document.createElement("div");
        div.className = "chat-msg";
        div.textContent = "Tú: " + msg;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        chatInput.value = "";
        persistChat();
    }
};

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") enviarMensaje();
});

/* ===== Privacidad ===== */
const privacySection = document.getElementById("privacy-section");

window.mostrarPrivacidad = function () {
    privacySection.classList.add("open");
};

window.cerrarPrivacidad = function () {
    privacySection.classList.remove("open");
};

/* ===== Registrar antes-instalación (PWA) ===== */

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    mostrarToast("📲 Instala la app en tu dispositivo");
});

document.getElementById("menu-instalar").addEventListener("click", async (e) => {
    e.preventDefault();
    closeMenu();
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        if (outcome === "accepted") mostrarToast("✅ Instalando...");
        else mostrarToast("Instalación cancelada");
        window.deferredPrompt = null;
    } else {
        mostrarToast("Ya instalada o no disponible en este navegador");
    }
});

window.addEventListener("appinstalled", () => {
    window.deferredPrompt = null;
    mostrarToast("✅ App instalada");
});

/* ===== Controles de teclado ===== */
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        togglePlay();
    }
    if (e.code === "ArrowUp") {
        volumeSlider.value = Math.min(100, parseInt(volumeSlider.value) + 5);
        radio.volume = volumeSlider.value / 100;
        persistVolume();
    }
    if (e.code === "ArrowDown") {
        volumeSlider.value = Math.max(0, parseInt(volumeSlider.value) - 5);
        radio.volume = volumeSlider.value / 100;
        persistVolume();
    }
});

function persistVolume() {
    try { localStorage.setItem("djw_volume", volumeSlider.value); } catch (e) {}
}