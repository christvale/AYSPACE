"use strict";

/* =========================================
   1. PENGATURAN DAN PENGAMBILAN ELEMEN
========================================= */

const STORAGE_KEY = "dearYouWishboard_v1";
const MAX_MESSAGES = 500;

const form = document.getElementById("messageForm");
const senderNameInput = document.getElementById("senderName");
const anonymousInput = document.getElementById("anonymous");
const categoryInput = document.getElementById("category");
const messageTextInput = document.getElementById("messageText");
const stickerInput = document.getElementById("sticker");
const agreeRulesInput = document.getElementById("agreeRules");

const charCount = document.getElementById("charCount");
const messageGrid = document.getElementById("messageGrid");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");
const sortMessages = document.getElementById("sortMessages");

const totalMessagesElement = document.getElementById("totalMessages");
const totalLikesElement = document.getElementById("totalLikes");
const resultCountElement = document.getElementById("resultCount");
const toastElement = document.getElementById("toast");

document.getElementById("currentYear").textContent =
    new Date().getFullYear();


/* =========================================
   2. DATA DAN PENYIMPANAN
========================================= */

let messages = loadMessages();
let toastTimer = null;

const allowedCategories = [
    "Harapan",
    "Terima Kasih",
    "Penyemangat",
    "Curhat",
    "Pesan Rahasia",
    "Persahabatan"
];

const allowedColors = [
    "pink",
    "lavender",
    "cream",
    "mint",
    "blue"
];

const allowedStickers = [
    "♡",
    "🌷",
    "🧸",
    "⭐",
    "☁️",
    "🦋",
    "🌈",
    "💌"
];


/* Membaca data yang tersimpan di browser */

function loadMessages() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return [];
        }

        const parsedData = JSON.parse(savedData);

        if (!Array.isArray(parsedData)) {
            return [];
        }

        // Validasi struktur dasar setiap pesan.
        return parsedData
            .filter((item) => {
                return (
                    item &&
                    typeof item.id === "string" &&
                    typeof item.message === "string" &&
                    typeof item.name === "string" &&
                    typeof item.date === "string"
                );
            })
            .map((item) => ({
                id: item.id,
                name: item.name.slice(0, 30),
                anonymous: item.anonymous === true,
                category: allowedCategories.includes(item.category)
                    ? item.category
                    : "Harapan",
                message: item.message.slice(0, 500),
                color: allowedColors.includes(item.color)
                    ? item.color
                    : "pink",
                sticker: allowedStickers.includes(item.sticker)
                    ? item.sticker
                    : "♡",
                date: item.date,
                likes: Number.isSafeInteger(item.likes) &&
                    item.likes >= 0
                    ? item.likes
                    : 0,
                liked: item.liked === true
            }))
            .slice(0, MAX_MESSAGES);
    } catch (error) {
        console.error("Gagal membaca penyimpanan:", error);
        return [];
    }
}


/* Menyimpan semua pesan ke localStorage */

function saveMessages() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(messages)
        );

        document.getElementById("storageInfo").textContent =
            "Papan lokal · Browser ini";

        return true;
    } catch (error) {
        console.error("Gagal menyimpan pesan:", error);

        document.getElementById("storageInfo").textContent =
            "Penyimpanan tidak tersedia";

        showToast(
            "Penyimpanan gagal. Ruang browser mungkin penuh."
        );

        return false;
    }
}


/* =========================================
   3. NOTIFIKASI
========================================= */

function showToast(text) {
    toastElement.textContent = text;
    toastElement.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toastElement.classList.remove("show");
    }, 2800);
}


/* =========================================
   4. FORM DAN PENGHITUNG KARAKTER
========================================= */

// Saat mode anonim aktif, nama tidak perlu diisi.

anonymousInput.addEventListener("change", () => {
    senderNameInput.disabled = anonymousInput.checked;

    if (anonymousInput.checked) {
        senderNameInput.value = "";
    }

    senderNameInput.placeholder = anonymousInput.checked
        ? "Nama disembunyikan saat anonim aktif"
        : "Tulis nama atau nama samaran...";

    senderNameInput.setAttribute(
        "aria-label",
        anonymousInput.checked
            ? "Nama pengirim disembunyikan"
            : "Nama pengirim"
    );
});

messageTextInput.addEventListener("input", () => {
    const length = messageTextInput.value.length;

    charCount.textContent = `${length} / 500`;

    charCount.style.color = length >= 450
        ? "#bd6d91"
        : "#b5a2b0";
});


/* Membuat ID unik untuk masing-masing pesan */

function createMessageId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}


/* =========================================
   5. MENGIRIM PESAN BARU
========================================= */

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const anonymous = anonymousInput.checked;

    const name = anonymous
        ? "Anonim"
        : senderNameInput.value.trim();

    const message = messageTextInput.value.trim();

    const category = categoryInput.value;

    const selectedColor = document.querySelector(
        'input[name="cardColor"]:checked'
    );

    const color = selectedColor
        ? selectedColor.value
        : "pink";

    const sticker = stickerInput.value;

    // Validasi nama.
    if (!anonymous && !name) {
        showToast("Isi nama atau aktifkan mode anonim.");
        senderNameInput.focus();
        return;
    }

    // Validasi panjang nama.
    if (name.length > 30) {
        showToast("Nama maksimal 30 karakter.");
        return;
    }

    // Validasi pesan.
    if (message.length < 3 || message.length > 500) {
        showToast(
            "Pesan harus terdiri dari 3 sampai 500 karakter."
        );
        messageTextInput.focus();
        return;
    }

    // Pastikan semua pilihan sesuai daftar yang diizinkan.
    if (!allowedCategories.includes(category)) {
        showToast("Kategori pesan tidak valid.");
        return;
    }

    if (!allowedColors.includes(color)) {
        showToast("Warna kartu tidak valid.");
        return;
    }

    if (!allowedStickers.includes(sticker)) {
        showToast("Stiker tidak valid.");
        return;
    }

    if (!agreeRulesInput.checked) {
        showToast("Silakan setujui aturan papan pesan.");
        return;
    }

    if (messages.length >= MAX_MESSAGES) {
        showToast(
            "Papan mencapai batas 500 pesan. Hapus pesan lama dahulu."
        );
        return;
    }

    const newMessage = {
        id: createMessageId(),
        name: name,
        anonymous: anonymous,
        category: category,
        message: message,
        color: color,
        sticker: sticker,
        date: new Date().toISOString(),
        likes: 0,
        liked: false
    };

    // Simpan data lama agar bisa dikembalikan jika gagal.
    const previousMessages = messages;

    messages = [newMessage, ...messages];

    if (!saveMessages()) {
        messages = previousMessages;
        return;
    }

    // Kosongkan formulir setelah berhasil disimpan.
    messageTextInput.value = "";
    senderNameInput.value = "";
    charCount.textContent = "0 / 500";
    agreeRulesInput.checked = false;

    document.querySelector(
        'input[name="cardColor"][value="pink"]'
    ).checked = true;

    stickerInput.value = "♡";
    categoryInput.value = "Harapan";

    anonymousInput.checked = true;
    anonymousInput.dispatchEvent(
        new Event("change")
    );

    renderMessages();

    showToast("Pesan berhasil ditambahkan. Terima kasih ♡");

    // Arahkan pengunjung ke papan pesan.
    document.getElementById("papan").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});


/* =========================================
   6. FORMAT TANGGAL
========================================= */

function formatDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Tanggal tidak diketahui";
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(date);
}


/* =========================================
   7. MEMBUAT KARTU PESAN
========================================= */

/*
  Gunakan textContent untuk teks yang dikirim pengunjung.
  Jangan memasukkan pesan langsung ke innerHTML karena
  teks pengguna bisa mengandung kode HTML berbahaya.
*/

function createMessageCard(item) {
    const card = document.createElement("article");

    card.className = `message-card color-${item.color}`;
    card.dataset.id = item.id;

    const top = document.createElement("div");
    top.className = "card-top";

    const badge = document.createElement("span");
    badge.className = "category-badge";
    badge.textContent = item.category;

    const sticker = document.createElement("span");
    sticker.className = "card-sticker";
    sticker.textContent = item.sticker;
    sticker.setAttribute("aria-hidden", "true");

    top.append(badge, sticker);

    const heading = document.createElement("h3");
    heading.textContent = getMessageTitle(item.category);

    const content = document.createElement("p");
    content.className = "message-content";
    content.textContent = item.message;

    const bottom = document.createElement("div");
    bottom.className = "card-bottom";

    const senderInfo = document.createElement("div");
    senderInfo.className = "sender-info";

    const sender = document.createElement("span");
    sender.className = "sender-name";
    sender.textContent = `♡ ${item.name}`;

    const date = document.createElement("span");
    date.className = "message-date";
    date.textContent = formatDate(item.date);

    senderInfo.append(sender, date);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    // Tombol suka.
    const likeButton = document.createElement("button");
    likeButton.type = "button";
    likeButton.className = "like-button";

    if (item.liked) {
        likeButton.classList.add("liked");
    }

    likeButton.textContent = `♥ ${item.likes}`;
    likeButton.setAttribute(
        "aria-label",
        item.liked ? "Batalkan suka" : "Sukai pesan"
    );
    likeButton.setAttribute(
        "aria-pressed",
        String(item.liked)
    );

    likeButton.addEventListener("click", () => {
        toggleLike(item.id);
    });

    // Tombol hapus.
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "×";
    deleteButton.title = "Hapus pesan dari browser ini";
    deleteButton.setAttribute(
        "aria-label",
        "Hapus pesan ini dari browser"
    );

    deleteButton.addEventListener("click", () => {
        deleteMessage(item.id);
    });

    actions.append(likeButton, deleteButton);
    bottom.append(senderInfo, actions);

    card.append(top, heading, content, bottom);

    return card;
}


/* Judul kartu sesuai kategori pesan */

function getMessageTitle(category) {
    const titles = {
        "Harapan": "Sebuah harapan kecil...",
        "Terima Kasih": "Untuk seseorang yang berarti ♡",
        "Penyemangat": "Kamu pasti bisa!",
        "Curhat": "Sedikit cerita dari hati...",
        "Pesan Rahasia": "Ada sesuatu yang ingin disampaikan...",
        "Persahabatan": "Untuk teman terbaik..."
    };

    return titles[category] || "Sebuah pesan kecil...";
}


/* =========================================
   8. PENCARIAN DAN FILTER
========================================= */

function getFilteredMessages() {
    const searchTerm = searchInput.value
        .trim()
        .toLocaleLowerCase("id-ID");

    const selectedCategory = filterCategory.value;

    let filtered = messages.filter((item) => {
        const matchesCategory =
            selectedCategory === "Semua" ||
            item.category === selectedCategory;

        const searchableText = [
            item.name,
            item.message,
            item.category
        ].join(" ").toLocaleLowerCase("id-ID");

        const matchesSearch =
            searchableText.includes(searchTerm);

        return matchesCategory && matchesSearch;
    });

    switch (sortMessages.value) {
        case "oldest":
            filtered.sort(
                (a, b) =>
                    new Date(a.date).getTime() -
                    new Date(b.date).getTime()
            );
            break;

        case "popular":
            filtered.sort(
                (a, b) =>
                    b.likes - a.likes ||
                    new Date(b.date).getTime() -
                    new Date(a.date).getTime()
            );
            break;

        case "newest":
        default:
            filtered.sort(
                (a, b) =>
                    new Date(b.date).getTime() -
                    new Date(a.date).getTime()
            );
    }

    return filtered;
}


/* =========================================
   9. MENAMPILKAN PESAN KE PAPAN
========================================= */

function renderMessages() {
    const filteredMessages = getFilteredMessages();

    // Kosongkan tampilan kartu sebelumnya.
    messageGrid.replaceChildren();

    // Buat kartu baru.
    filteredMessages.forEach((item) => {
        const card = createMessageCard(item);
        messageGrid.appendChild(card);
    });

    // Pesan kosong hanya tampil jika tidak ada hasil.
    emptyState.hidden = filteredMessages.length > 0;

    // Perbarui teks jumlah hasil.
    resultCountElement.textContent =
        `${filteredMessages.length} pesan ditemukan`;

    // Perbarui statistik seluruh papan.
    totalMessagesElement.textContent =
        messages.length.toLocaleString("id-ID");

    const totalLikes = messages.reduce(
        (sum, item) => sum + item.likes,
        0
    );

    totalLikesElement.textContent =
        totalLikes.toLocaleString("id-ID");
}


/* =========================================
   10. TOMBOL SUKA
========================================= */

function toggleLike(id) {
    const index = messages.findIndex(
        (item) => item.id === id
    );

    if (index === -1) {
        return;
    }

    const previousMessages = messages;

    messages = messages.map((item) => {
        if (item.id !== id) {
            return item;
        }

        const nextLiked = !item.liked;

        return {
            ...item,
            liked: nextLiked,
            likes: Math.max(
                0,
                item.likes + (nextLiked ? 1 : -1)
            )
        };
    });

    if (!saveMessages()) {
        messages = previousMessages;
        return;
    }

    renderMessages();
}


/* =========================================
   11. MENGHAPUS PESAN
========================================= */

function deleteMessage(id) {
    const item = messages.find(
        (message) => message.id === id
    );

    if (!item) {
        return;
    }

    const confirmed = window.confirm(
        "Hapus pesan ini dari penyimpanan browser ini? " +
        "Tindakan ini tidak dapat dibatalkan."
    );

    if (!confirmed) {
        return;
    }

    const previousMessages = messages;

    messages = messages.filter(
        (message) => message.id !== id
    );

    if (!saveMessages()) {
        messages = previousMessages;
        return;
    }

    renderMessages();

    showToast("Pesan berhasil dihapus dari browser ini.");
}


/* =========================================
   12. EVENT PENCARIAN DAN FILTER
========================================= */

searchInput.addEventListener("input", renderMessages);

filterCategory.addEventListener("change", renderMessages);

sortMessages.addEventListener("change", renderMessages);


/* =========================================
   13. INISIALISASI WEBSITE
========================================= */

// Tampilkan data yang sudah tersimpan.
renderMessages();

// Atur keadaan awal mode anonim.
anonymousInput.dispatchEvent(
    new Event("change")
);

// Perbarui jumlah karakter awal.
charCount.textContent =
    `${messageTextInput.value.length} / 500`;