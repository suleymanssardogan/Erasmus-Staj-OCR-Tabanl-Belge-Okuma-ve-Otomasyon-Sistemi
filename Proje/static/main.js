// OCR Belge Sistemi JavaScript
let processedText = '';
let selectedFile = null;

// DOM Elements
const uploadArea = document.querySelector('.upload-area');
const fileInput = document.getElementById('fileInput');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const statusMessage = document.getElementById('statusMessage');
const resultArea = document.getElementById('resultArea');
const resultActions = document.getElementById('resultActions');
const processBtn = document.getElementById('processBtn');

// Initialize drag and drop functionality
function initializeDragAndDrop() {
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
}

// Drag and drop event handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.style.borderColor = '#764ba2';
    uploadArea.style.backgroundColor = 'rgba(118,75,162,0.1)';
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.backgroundColor = 'rgba(102,126,234,0.05)';
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.backgroundColor = 'rgba(102,126,234,0.05)';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFiles(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFiles(files[0]);
    }
}

// Handle selected files
function handleFiles(file) {
    selectedFile = file;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        showStatus('Desteklenmeyen dosya formatı! Lütfen JPG, PNG, GIF, BMP, TIFF veya PDF dosyası seçin.', 'error');
        return;
    }
    
    // Validate file size (16MB limit)
    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
        showStatus('Dosya boyutu çok büyük! Maksimum 16MB olmalıdır.', 'error');
        return;
    }
    
    // Update upload area
    updateUploadArea(file);
    showStatus(`${file.name} dosyası seçildi. İşleme hazır.`, 'success');
}

// Update upload area with file info
function updateUploadArea(file) {
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    uploadArea.innerHTML = `
        <div class="upload-icon">✅</div>
        <div class="upload-text">${file.name}</div>
        <div class="upload-subtext">Boyut: ${fileSize} MB - Dosya başarıyla yüklendi</div>
    `;
}

// Process document with Flask API
async function processDocument() {
    if (!selectedFile) {
        showStatus('Lütfen önce bir dosya seçin!', 'error');
        return;
    }
    
    // Disable process button
    processBtn.disabled = true;
    processBtn.innerHTML = '<span>⏳</span> İşleniyor...';
    
    // Show progress bar
    showProgress();
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
        // Start progress animation
        animateProgress();
        
        // Send request to Flask API
        const response = await fetch('/api/ocr', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        // Hide progress bar
        hideProgress();
        
        if (result.success) {
            // Display extracted text
            processedText = result.extracted_text;
            displayResult(processedText, result.filename);
            showStatus(`✅ OCR işlemi başarıyla tamamlandı! ${result.file_size} karakter çıkarıldı.`, 'success');
        } else {
            showStatus(`❌ Hata: ${result.error}`, 'error');
        }
        
    } catch (error) {
        hideProgress();
        showStatus(`❌ Bağlantı hatası: ${error.message}`, 'error');
        console.error('OCR Error:', error);
    } finally {
        // Re-enable process button
        processBtn.disabled = false;
        processBtn.innerHTML = '<span>🔍</span> Metni Çıkar';
    }
}

// Animate progress bar
function animateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90; // Don't complete until actual response
        
        progressFill.style.width = progress + '%';
        
        // Clear interval if we've reached 90%
        if (progress >= 90) {
            clearInterval(interval);
        }
    }, 200);
    
    // Store interval ID for potential cleanup
    return interval;
}

// Show progress bar
function showProgress() {
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    showStatus('📄 Belge işleniyor, lütfen bekleyin...', 'success');
}

// Hide progress bar
function hideProgress() {
    // Complete the progress bar
    progressFill.style.width = '100%';
    
    setTimeout(() => {
        progressBar.style.display = 'none';
        progressFill.style.width = '0%';
    }, 500);
}

// Display OCR result
function displayResult(text, filename) {
    if (!text || text.trim() === '') {
        resultArea.innerHTML = `
            <div class="result-placeholder">
                ⚠️ Bu belgede okunabilir metin bulunamadı.<br>
                <small>Belgenin kalitesini kontrol edin veya farklı bir dosya deneyin.</small>
            </div>
        `;
        return;
    }
    
    resultArea.innerHTML = `
        <div class="result-content">${text}</div>
        <div style="margin-top: 15px; padding: 10px; background: rgba(102,126,234,0.1); border-radius: 8px; font-size: 0.9rem; color: #666;">
            📄 Dosya: ${filename} | 📝 Karakter sayısı: ${text.length} | ⏰ ${new Date().toLocaleString('tr-TR')}
        </div>
    `;
    resultActions.style.display = 'flex';
}

// Show status message
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';
    
    // Auto hide after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
}

// Copy text to clipboard
async function copyText() {
    if (!processedText) {
        showStatus('Kopyalanacak metin bulunamadı!', 'error');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(processedText);
        showStatus('📋 Metin başarıyla panoya kopyalandı!', 'success');
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = processedText;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showStatus('📋 Metin başarıyla panoya kopyalandı!', 'success');
        } catch (fallbackError) {
            showStatus('❌ Kopyalama işlemi başarısız oldu.', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// Download text as file
function downloadText() {
    if (!processedText) {
        showStatus('İndirilecek metin bulunamadı!', 'error');
        return;
    }
    
    const blob = new Blob([processedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    a.href = url;
    a.download = `ocr-result-${timestamp}.txt`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('💾 Dosya başarıyla indirildi!', 'success');
}

// Clear all data
function clearAll() {
    // Reset file input
    fileInput.value = '';
    selectedFile = null;
    
    // Reset upload area
    uploadArea.innerHTML = `
        <div class="upload-icon">📎</div>
        <div class="upload-text">Belgenizi buraya sürükleyin</div>
        <div class="upload-subtext">veya tıklayarak seçin (JPG, PNG, PDF)</div>
    `;
    
    // Reset result area
    resultArea.innerHTML = 'Henüz bir belge işlenmedi. Lütfen sol taraftan bir belge yükleyin.';
    resultArea.className = 'result-placeholder';
    resultActions.style.display = 'none';
    
    // Hide progress
    progressBar.style.display = 'none';
    progressFill.style.width = '0%';
    
    // Clear processed text
    processedText = '';
    
    // Re-enable process button
    processBtn.disabled = false;
    processBtn.innerHTML = '<span>🔍</span> Metni Çıkar';
    
    showStatus('🗑️ Tüm veriler temizlendi.', 'success');
}

// Add interactive effects to feature cards
function initializeFeatureCards() {
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.background = 'rgba(255, 255, 255, 1)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.background = 'rgba(255, 255, 255, 0.95)';
        });
    });
}

// Health check function
async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        const result = await response.json();
        
        if (result.status === 'healthy') {
            console.log('✅ Server is healthy:', result.message);
        }
    } catch (error) {
        console.warn('⚠️ Server health check failed:', error.message);
    }
}

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + U: Upload file
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            fileInput.click();
        }
        
        // Ctrl/Cmd + Enter: Process document
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (selectedFile) {
                processDocument();
            }
        }
        
        // Ctrl/Cmd + C: Copy text (when result is visible)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && processedText && !window.getSelection().toString()) {
            e.preventDefault();
            copyText();
        }
        
        // Escape: Clear all
        if (e.key === 'Escape') {
            clearAll();
        }
    });
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 OCR Belge Sistemi yüklendi');
    
    initializeDragAndDrop();
    initializeFeatureCards();
    initializeKeyboardShortcuts();
    checkServerHealth();
    
    // Show welcome message
    showStatus('👋 OCR Belge Sistemi\'ne hoş geldiniz! Bir belge seçerek başlayabilirsiniz.', 'success');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkServerHealth();
    }
});

// Export functions for global access (if needed)
window.processDocument = processDocument;
window.copyText = copyText;
window.downloadText = downloadText;
window.clearAll = clearAll;