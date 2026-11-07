let prompts = [];

const galleryGrid = document.getElementById("galleryGrid");
const detailModal = document.getElementById("detailModal");
const detailImg = document.getElementById("detailImg");
const detailTitle = document.getElementById("detailTitle");
const detailPrompt = document.getElementById("detailPrompt");
const copyPromptBtn = document.getElementById("copyPromptBtn");
const closeDetailBtn = document.getElementById("closeDetailBtn");

let currentActivePrompt = "";

async function loadPromptsFromServer() {
    try {
        const res = await fetch("/prompts");
        if (res.ok) {
            prompts = await res.json();
            renderGallery();
        }
    } catch (err) {
        console.error("Failed to load prompts from server:", err);
    }
}

function layoutMasonry() {
    const grid = galleryGrid;
    const cards = Array.from(grid.querySelectorAll(".card"));
    if (cards.length === 0) {
        grid.style.height = "auto";
        return;
    }

    const gap = 22;
    const gridWidth = grid.clientWidth || (window.innerWidth > 1150 ? 1110 : window.innerWidth - 40);
    const minColWidth = 250;

    let colCount = Math.floor((gridWidth + gap) / (minColWidth + gap));
    if (colCount < 1) colCount = 1;
    if (colCount > 4) colCount = 4;

    const colWidth = (gridWidth - (colCount - 1) * gap) / colCount;
    const colHeights = new Array(colCount).fill(0);

    grid.style.position = "relative";

    cards.forEach((card) => {
        card.style.position = "absolute";
        card.style.width = `${colWidth}px`;

        // Pick column with minimum height (leftmost column on tie)
        let minCol = 0;
        let minH = colHeights[0];
        for (let c = 1; c < colCount; c++) {
            if (colHeights[c] < minH) {
                minH = colHeights[c];
                minCol = c;
            }
        }

        const left = minCol * (colWidth + gap);
        const top = minH;

        card.style.left = `${left}px`;
        card.style.top = `${top}px`;

        colHeights[minCol] += card.offsetHeight + gap;
    });

    const maxHeight = Math.max(...colHeights);
    grid.style.height = `${maxHeight}px`;
}

function renderGallery() {
    galleryGrid.innerHTML = "";

    const validPrompts = (prompts || []).filter(item => item && (item.imageUrl || item.image_url));

    if (validPrompts.length === 0) {
        galleryGrid.innerHTML = `
            <div class="empty-state">
                <h3>No images added yet</h3>
                <p>Click on "+ Upload Picture" above to upload your first image and prompt to Amazon S3.</p>
            </div>
        `;
        galleryGrid.style.height = "auto";
        return;
    }

    validPrompts.forEach((item, index) => {
        const imgUrl = item.imageUrl || item.image_url || "";
        const title = item.title || "Untitled";

        const card = document.createElement("article");
        card.className = "card";
        const originalIndex = prompts.indexOf(item);
        card.onclick = () => openDetail(originalIndex >= 0 ? originalIndex : index);

        card.innerHTML = `
            <div class="card-img-wrap">
                <img src="${imgUrl}" alt="${title}" loading="lazy">
            </div>
            <div class="card-title">${title}</div>
        `;

        const img = card.querySelector("img");
        img.onload = () => layoutMasonry();
        img.onerror = () => {
            card.remove();
            layoutMasonry();
        };

        galleryGrid.appendChild(card);
    });

    layoutMasonry();
    setTimeout(layoutMasonry, 50);
    setTimeout(layoutMasonry, 200);
    setTimeout(layoutMasonry, 500);
    setTimeout(layoutMasonry, 1000);
}

let resizeTimeout;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        layoutMasonry();
    }, 50);
});

function openDetail(index) {
    const item = prompts[index];
    detailImg.src = item.imageUrl || item.image_url || "";
    detailTitle.textContent = item.title || "Untitled";
    detailPrompt.textContent = item.prompt || "";
    currentActivePrompt = item.prompt || "";

    copyPromptBtn.textContent = "Copy Prompt";
    detailModal.classList.add("open");
}

function closeDetail() {
    detailModal.classList.remove("open");
}

closeDetailBtn.onclick = closeDetail;
detailModal.onclick = (e) => {
    if (e.target === detailModal) closeDetail();
};

copyPromptBtn.onclick = () => {
    navigator.clipboard.writeText(currentActivePrompt).then(() => {
        copyPromptBtn.textContent = "Copied to Clipboard!";
        setTimeout(() => {
            copyPromptBtn.textContent = "Copy Prompt";
        }, 1500);
    });
};

const uploadModal = document.getElementById("uploadModal");
const openUploadBtn = document.getElementById("openUploadBtn");
const closeUploadBtn = document.getElementById("closeUploadBtn");
const cancelUploadBtn = document.getElementById("cancelUploadBtn");
const uploadForm = document.getElementById("uploadForm");
const submitUploadBtn = document.getElementById("submitUploadBtn");

openUploadBtn.onclick = () => uploadModal.classList.add("open");
closeUploadBtn.onclick = () => uploadModal.classList.remove("open");
cancelUploadBtn.onclick = () => uploadModal.classList.remove("open");

uploadModal.onclick = (e) => {
    if (e.target === uploadModal) uploadModal.classList.remove("open");
};

// Press ESC to close any modal
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeDetail();
        uploadModal.classList.remove("open");
    }
});

uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const pinVal = document.getElementById("uploadPin").value.trim();
    if (pinVal.length !== 4) {
        alert("Please enter a 4-digit PIN.");
        return;
    }

    submitUploadBtn.textContent = "Uploading...";
    submitUploadBtn.disabled = true;

    const formData = new FormData();
    formData.append("image", document.getElementById("imageFile").files[0]);
    formData.append("title", document.getElementById("imgTitle").value);
    formData.append("prompt", document.getElementById("imgPrompt").value);
    formData.append("pin", pinVal);

    try {
        const res = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (res.ok) {
            uploadModal.classList.remove("open");
            uploadForm.reset();
            await loadPromptsFromServer();
        } else {
            alert("Upload error: " + data.error);
        }
    } catch (err) {
        alert("Upload failed: " + err.message);
    } finally {
        submitUploadBtn.textContent = "Upload to S3";
        submitUploadBtn.disabled = false;
    }
});

loadPromptsFromServer();
