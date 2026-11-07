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

function renderGallery() {
    galleryGrid.innerHTML = "";

    if (!prompts || prompts.length === 0) {
        galleryGrid.innerHTML = `
            <div class="empty-state">
                <h3>No images added yet</h3>
                <p>Click on "+ Upload Picture" above to upload your first image and prompt to Amazon S3.</p>
            </div>
        `;
        return;
    }

    prompts.forEach((item, index) => {
        const imgUrl = item.imageUrl || item.image_url || "";
        const title = item.title || "Untitled";

        const card = document.createElement("article");
        card.className = "card";
        card.onclick = () => openDetail(index);

        card.innerHTML = `
            <div class="card-img-wrap">
                <img src="${imgUrl}" alt="${title}" loading="lazy" onerror="this.closest('.card').style.display='none'">
            </div>
            <div class="card-title">${title}</div>
        `;

        galleryGrid.appendChild(card);
    });
}

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
