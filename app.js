/* ================================================
   PixFit — app.js
   Batch Image Resizer with ZIP download support
   ================================================ */

'use strict';

// ─── State ──────────────────────────────────────
// linkMode: 0 = free | 1 = square (W = H) | 2 = ratio (original image ratio)
const state = {
    image:       null,
    fileName:    'image',
    fileExt:     'png',
    mimeType:    'image/png',
    dims:        [],
    linkMode:    0,
    aspectRatio: 1,
};

// ─── DOM Refs ────────────────────────────────────
const $ = id => document.getElementById(id);

const els = {
    imageInput:       $('imageInput'),
    dropZone:         $('dropZone'),
    imagePreview:     $('imagePreview'),
    uploadPlaceholder:$('uploadPlaceholder'),
    changeOverlay:    $('changeOverlay'),
    imageMeta:        $('imageMeta'),
    metaFileName:     $('metaFileName'),
    metaDimensions:   $('metaDimensions'),

    inputWidth:       $('inputWidth'),
    inputHeight:      $('inputHeight'),
    linkBtn:          $('linkBtn'),
    linkIcon:         $('linkIcon'),
    linkModeLabel:    $('linkModeLabel'),
    addDimBtn:        $('addDimBtn'),

    dimsCount:        $('dimsCount'),
    dimsEmpty:        $('dimsEmpty'),
    dimsList:         $('dimsList'),
    clearAllBtn:      $('clearAllBtn'),

    downloadBtn:      $('downloadBtn'),
    statusText:       $('statusText'),

    progressOverlay:  $('progressOverlay'),
    progressSub:      $('progressSub'),
    progressFill:     $('progressFill'),

    toast:            $('toast'),
    toastIcon:        $('toastIcon'),
    toastMsg:         $('toastMsg'),
};

// ─── Image Upload ────────────────────────────────

els.imageInput.addEventListener('change', e => {
    if (e.target.files && e.target.files[0]) {
        loadImageFile(e.target.files[0]);
    }
});

// Drag & Drop
els.dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    els.dropZone.classList.add('drag-active');
});
['dragleave', 'dragend'].forEach(ev => {
    els.dropZone.addEventListener(ev, () => {
        els.dropZone.classList.remove('drag-active');
    });
});
els.dropZone.addEventListener('drop', e => {
    e.preventDefault();
    els.dropZone.classList.remove('drag-active');
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        toast('Only image files are supported.', 'error');
        return;
    }
    els.imageInput.files = e.dataTransfer.files;
    loadImageFile(file);
});

function loadImageFile(file) {
    // Parse name / ext
    const parts = file.name.split('.');
    state.fileExt  = parts.pop().toLowerCase();
    state.fileName = parts.join('.');

    // Determine MIME type for canvas export
    const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/png' };
    state.mimeType = mimeMap[state.fileExt] || 'image/png';

    const reader = new FileReader();

    reader.onerror = () => {
        toast('Failed to read file. It may be corrupt or inaccessible.', 'error');
    };

    reader.onload = evt => {
        const img = new Image();
        img.onload = () => {
            state.image = img;
            state.aspectRatio = img.width / img.height;

            // UI — show preview
            els.imagePreview.src        = evt.target.result;
            els.imagePreview.classList.remove('hidden');
            els.uploadPlaceholder.classList.add('hidden');
            els.changeOverlay.classList.remove('hidden');

            // Meta pills
            els.metaFileName.textContent  = file.name;
            els.metaFileName.title        = file.name;
            els.metaDimensions.textContent = `${img.width} × ${img.height}`;
            els.imageMeta.classList.remove('hidden');

            refreshDownloadBtn();
            toast('Image loaded!', 'success');

            // Warn about GIF animation loss
            if (state.fileExt === 'gif') {
                toast('GIFs are exported as static PNG frames (animation not preserved).', 'warning');
            }
        };
        img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
}

// ─── Link Button — Three-Mode Cycle ─────────────
//   0 = free      → W and H are independent
//   1 = square    → W always equals H  (icon sets, favicons)
//   2 = ratio     → follows original image aspect ratio

const LINK_MODES = [
    { mode: 0, icon: 'fa-solid fa-link-slash',   cls: '',              title: 'Free (click to lock square)',        label: 'Free'   },
    { mode: 1, icon: 'fa-solid fa-square',        cls: 'active-square', title: 'Square — W = H (click for ratio)',  label: 'Square' },
    { mode: 2, icon: 'fa-solid fa-crop-simple',   cls: 'active-ratio',  title: 'Ratio — keeps image proportions (click to free)', label: 'Ratio' },
];

function applyLinkMode(mode) {
    state.linkMode = mode;
    const cfg = LINK_MODES[mode];

    // Update button visuals
    els.linkBtn.className   = `link-btn ${cfg.cls}`;
    els.linkIcon.className  = cfg.icon;
    els.linkBtn.title       = cfg.title;

    // Show tooltip briefly
    els.linkModeLabel.textContent = cfg.label;
    els.linkModeLabel.classList.add('visible');
    clearTimeout(applyLinkMode._timer);
    applyLinkMode._timer = setTimeout(() => {
        els.linkModeLabel.classList.remove('visible');
    }, 1200);

    // Immediately sync height if a width value exists
    const w = parseInt(els.inputWidth.value);
    if (w > 0) syncFromWidth(w);
}

function syncFromWidth(w) {
    if (state.linkMode === 1) {
        els.inputHeight.value = w;
    } else if (state.linkMode === 2) {
        els.inputHeight.value = Math.round(w / (state.aspectRatio || 1)) || '';
    }
}
function syncFromHeight(h) {
    if (state.linkMode === 1) {
        els.inputWidth.value = h;
    } else if (state.linkMode === 2) {
        els.inputWidth.value = Math.round(h * (state.aspectRatio || 1)) || '';
    }
}

els.linkBtn.addEventListener('click', () => {
    applyLinkMode((state.linkMode + 1) % 3);
});

els.inputWidth.addEventListener('input', () => {
    if (state.linkMode === 0) return;
    const w = parseInt(els.inputWidth.value);
    if (w > 0) syncFromWidth(w);
    else els.inputHeight.value = '';
});

els.inputHeight.addEventListener('input', () => {
    if (state.linkMode === 0) return;
    const h = parseInt(els.inputHeight.value);
    if (h > 0) syncFromHeight(h);
    else els.inputWidth.value = '';
});

// ─── Add Dimension ───────────────────────────────

els.addDimBtn.addEventListener('click', () => {
    const w = parseInt(els.inputWidth.value);
    const h = parseInt(els.inputHeight.value);

    if (!w || !h || w <= 0 || h <= 0) {
        toast('Enter a valid width and height first.', 'warning');
        return;
    }
    if (w > 8000 || h > 8000) {
        toast('Maximum size is 8000 × 8000 px.', 'warning');
        return;
    }

    addDim(w, h);
    els.inputWidth.value  = '';
    els.inputHeight.value = '';
    els.inputWidth.focus();
});

// Allow Enter key to add dimension
[els.inputWidth, els.inputHeight].forEach(input => {
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') els.addDimBtn.click();
    });
});

// Quick-add chips
document.querySelectorAll('.quick-chip').forEach(btn => {
    btn.addEventListener('click', () => {
        addDim(parseInt(btn.dataset.w), parseInt(btn.dataset.h));
    });
});

// Clear all
els.clearAllBtn.addEventListener('click', () => {
    state.dims = [];
    renderDims();
    refreshDownloadBtn();
    toast('Dimensions cleared.', 'info');
});

function addDim(w, h) {
    const exists = state.dims.some(d => d.w === w && d.h === h);
    if (exists) {
        toast(`${w} × ${h} is already in the list.`, 'warning');
        return;
    }
    state.dims.push({ w, h });
    renderDims();
    refreshDownloadBtn();
}

function removeDim(index) {
    state.dims.splice(index, 1);
    renderDims();
    refreshDownloadBtn();
}

// ─── Render Dimension List ───────────────────────

function renderDims() {
    const count = state.dims.length;

    // Count badge
    els.dimsCount.textContent = count;
    els.dimsCount.classList.add('bump');
    setTimeout(() => els.dimsCount.classList.remove('bump'), 250);

    // Clear all button
    if (count > 0) {
        els.clearAllBtn.classList.remove('hidden');
    } else {
        els.clearAllBtn.classList.add('hidden');
    }

    // List
    if (count === 0) {
        els.dimsEmpty.style.display = '';
        els.dimsList.innerHTML = '';
        return;
    }

    els.dimsEmpty.style.display = 'none';
    els.dimsList.innerHTML = '';

    state.dims.forEach((dim, i) => {
        const chip = document.createElement('div');
        chip.className = 'dim-chip';
        chip.innerHTML = `
            <span>${dim.w}</span>
            <span class="chip-sep">×</span>
            <span>${dim.h}</span>
            <button class="chip-remove" title="Remove" aria-label="Remove ${dim.w}×${dim.h}">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        chip.querySelector('.chip-remove').addEventListener('click', () => removeDim(i));
        els.dimsList.appendChild(chip);
    });
}

// ─── Download Button State ───────────────────────

function refreshDownloadBtn() {
    const ready = state.image !== null && state.dims.length > 0;
    els.downloadBtn.disabled = !ready;
}

// ─── Batch Download as ZIP ───────────────────────

els.downloadBtn.addEventListener('click', handleDownload);

async function handleDownload() {
    if (!state.image || state.dims.length === 0) return;

    // Check JSZip is available
    if (typeof JSZip === 'undefined') {
        toast('JSZip library not loaded. Please check your connection.', 'error');
        return;
    }

    const zip    = new JSZip();
    const folder = zip.folder(state.fileName || 'pixfit-exports');
    const total  = state.dims.length;

    // Show progress overlay
    showProgress(true);
    updateProgress(0, total);

    try {
        for (let i = 0; i < total; i++) {
            const { w, h } = state.dims[i];
            updateProgress(i + 1, total);

            const blob = await resizeToBlob(state.image, w, h, state.mimeType);
            const ext  = state.mimeType === 'image/jpeg' ? 'jpg'
                       : state.mimeType === 'image/webp'  ? 'webp'
                       : 'png';
            folder.file(`${state.fileName}_${w}x${h}.${ext}`, blob);
        }

        // Generate ZIP
        els.progressSub.textContent = 'Building ZIP…';
        const zipBlob = await zip.generateAsync(
            { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 4 } },
            metadata => {
                const pct = Math.round(metadata.percent);
                els.progressFill.style.width = pct + '%';
            }
        );

        // Download using FileSaver (or fallback)
        const zipName = `${state.fileName}_pixfit_${total}sizes.zip`;
        if (typeof saveAs !== 'undefined') {
            saveAs(zipBlob, zipName);
        } else {
            const url = URL.createObjectURL(zipBlob);
            const a   = document.createElement('a');
            a.href    = url;
            a.download = zipName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        showProgress(false);
        toast(`${total} image${total > 1 ? 's' : ''} packed into ZIP! ✓`, 'success');
        if (statusTimer) clearTimeout(statusTimer);
        els.statusText.textContent = 'ZIP downloaded ✓';
        statusTimer = setTimeout(() => els.statusText.textContent = '', 4000);

    } catch (err) {
        console.error('[PixFit] Download error:', err);
        showProgress(false);
        toast('Something went wrong. Please try again.', 'error');
    }
}

// ─── Canvas Resize Helper ────────────────────────

function resizeToBlob(img, w, h, mimeType) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // Use best quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);

        const quality = mimeType === 'image/jpeg' || mimeType === 'image/webp' ? 0.92 : undefined;
        canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error(`Failed to create blob for ${w}×${h}`));
        }, mimeType, quality);
    });
}

// ─── Progress Overlay ────────────────────────────

function showProgress(visible) {
    if (visible) {
        els.progressOverlay.classList.remove('hidden');
        els.progressFill.style.width = '0%';
    } else {
        els.progressOverlay.classList.add('hidden');
    }
}

function updateProgress(current, total) {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    els.progressFill.style.width = pct + '%';
    els.progressSub.textContent  = `${current} of ${total} image${total > 1 ? 's' : ''}`;
}

// ─── Toast ───────────────────────────────────────

let toastTimer = null;
let statusTimer = null;

function toast(message, type = 'info') {
    const iconMap = {
        success: 'fa-solid fa-circle-check',
        error:   'fa-solid fa-circle-exclamation',
        warning: 'fa-solid fa-triangle-exclamation',
        info:    'fa-solid fa-circle-info',
    };

    els.toastMsg.textContent  = message;
    els.toastIcon.className   = `toast-icon ${iconMap[type] || iconMap.info}`;
    els.toast.className       = `toast ${type}`;

    // Clear previous timer
    if (toastTimer) clearTimeout(toastTimer);

    // Auto-hide after 3.5s
    toastTimer = setTimeout(() => {
        els.toast.classList.add('hidden');
    }, 3500);
}

// ─── Init ────────────────────────────────────────

renderDims();
refreshDownloadBtn();
