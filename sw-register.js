if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js")
            .then(() => console.log("ServiceWorker registrado"))
            .catch((err) => console.error("Error al registrar ServiceWorker:", err));
    });
}