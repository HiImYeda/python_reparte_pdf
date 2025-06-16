// PDF Page Splitter JavaScript Application

class PDFSplitter {
    constructor() {
        this.pdfFile = null;
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.fileInput = document.getElementById('pdfFile');
        this.splitBtn = document.getElementById('splitBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressBar = document.getElementById('progressBar');
        this.alertContainer = document.getElementById('alertContainer');
        this.resultsSection = document.getElementById('resultsSection');
        this.pagesContainer = document.getElementById('pagesContainer');
    }

    attachEventListeners() {
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.splitBtn.addEventListener('click', () => this.splitPDF());
        this.clearBtn.addEventListener('click', () => this.clearAll());
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        
        if (!file) {
            this.splitBtn.disabled = true;
            this.clearBtn.disabled = true;
            this.pdfFile = null;
            return;
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            this.showAlert('Please select a valid PDF file.', 'danger');
            this.fileInput.value = '';
            return;
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            this.showAlert('File size exceeds 10MB. Please select a smaller file.', 'danger');
            this.fileInput.value = '';
            return;
        }

        this.pdfFile = file;
        this.splitBtn.disabled = false;
        this.clearBtn.disabled = false;
        this.clearAlert();
        this.hideResults();
    }

    async splitPDF() {
        if (!this.pdfFile) {
            this.showAlert('Please select a PDF file first.', 'warning');
            return;
        }

        try {
            // Show progress
            this.showProgress();
            this.splitBtn.disabled = true;

            // Convert file to base64
            const base64Data = await this.fileToBase64(this.pdfFile);
            
            // Make API request
            const response = await fetch('/api/split-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pdf_base64: base64Data
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(
                    `Successfully split PDF into ${result.total_pages} page(s)!`, 
                    'success'
                );
                this.displayResults(result.pages);
            } else {
                this.showAlert(`Error: ${result.error}`, 'danger');
            }

        } catch (error) {
            console.error('Error splitting PDF:', error);
            this.showAlert(`Error: ${error.message}`, 'danger');
        } finally {
            this.hideProgress();
            this.splitBtn.disabled = false;
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove data URL prefix (data:application/pdf;base64,)
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    displayResults(pages) {
        this.resultsSection.style.display = 'block';
        this.pagesContainer.innerHTML = '';

        pages.forEach(page => {
            const pageCard = this.createPageCard(page);
            this.pagesContainer.appendChild(pageCard);
        });
    }

    createPageCard(page) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-3';

        const imagePreview = page.image_base64 ? 
            `<img src="data:image/png;base64,${page.image_base64}" class="card-img-top" style="height: 200px; object-fit: contain; background-color: white;" alt="Page ${page.page_number} preview">` : 
            `<div class="card-img-top d-flex align-items-center justify-content-center" style="height: 200px; background-color: #f8f9fa;">
                <i class="fas fa-file-pdf fa-3x text-muted"></i>
            </div>`;

        col.innerHTML = `
            <div class="card h-100">
                ${imagePreview}
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="card-title mb-0">
                        <i class="fas fa-file-pdf me-2"></i>
                        Page ${page.page_number}
                    </h6>
                    <span class="badge bg-secondary">${this.formatFileSize(page.pdf_base64 || page.base64)}</span>
                </div>
                <div class="card-body">
                    <div class="d-grid gap-2">
                        <button class="btn btn-outline-primary btn-sm" onclick="pdfSplitter.downloadPage(${page.page_number}, '${page.pdf_base64 || page.base64}')">
                            <i class="fas fa-download me-2"></i>
                            Download PDF
                        </button>
                        ${page.image_base64 ? `
                        <button class="btn btn-outline-success btn-sm" onclick="pdfSplitter.downloadImage(${page.page_number}, '${page.image_base64}')">
                            <i class="fas fa-image me-2"></i>
                            Download PNG
                        </button>
                        ` : ''}
                        <button class="btn btn-outline-secondary btn-sm" onclick="pdfSplitter.copyBase64('${page.pdf_base64 || page.base64}')">
                            <i class="fas fa-copy me-2"></i>
                            Copy PDF Base64
                        </button>
                        ${page.image_base64 ? `
                        <button class="btn btn-outline-info btn-sm" onclick="pdfSplitter.copyBase64('${page.image_base64}')">
                            <i class="fas fa-image me-2"></i>
                            Copy Image Base64
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        return col;
    }

    downloadPage(pageNumber, base64Data) {
        try {
            // Convert base64 to blob
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `page_${pageNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showAlert(`PDF da página ${pageNumber} baixado com sucesso!`, 'success');
        } catch (error) {
            console.error('Error downloading page:', error);
            this.showAlert(`Erro ao baixar página ${pageNumber}: ${error.message}`, 'danger');
        }
    }

    downloadImage(pageNumber, base64Data) {
        try {
            // Convert base64 to blob
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `page_${pageNumber}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showAlert(`Imagem da página ${pageNumber} baixada com sucesso!`, 'success');
        } catch (error) {
            console.error('Error downloading image:', error);
            this.showAlert(`Erro ao baixar imagem da página ${pageNumber}: ${error.message}`, 'danger');
        }
    }

    async copyBase64(base64Data) {
        try {
            await navigator.clipboard.writeText(base64Data);
            this.showAlert('Base64 data copied to clipboard!', 'success');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            this.showAlert('Error copying to clipboard', 'danger');
        }
    }

    formatFileSize(base64String) {
        // Approximate file size from base64 length
        const sizeInBytes = (base64String.length * 3) / 4;
        if (sizeInBytes < 1024) {
            return `${Math.round(sizeInBytes)} B`;
        } else if (sizeInBytes < 1024 * 1024) {
            return `${Math.round(sizeInBytes / 1024)} KB`;
        } else {
            return `${Math.round(sizeInBytes / (1024 * 1024))} MB`;
        }
    }

    showProgress() {
        this.progressContainer.style.display = 'block';
        this.progressBar.style.width = '100%';
    }

    hideProgress() {
        this.progressContainer.style.display = 'none';
        this.progressBar.style.width = '0%';
    }

    showAlert(message, type) {
        this.alertContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${this.getAlertIcon(type)} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }

    clearAlert() {
        this.alertContainer.innerHTML = '';
    }

    getAlertIcon(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    hideResults() {
        this.resultsSection.style.display = 'none';
        this.pagesContainer.innerHTML = '';
    }

    clearAll() {
        // Reset file input
        this.fileInput.value = '';
        this.pdfFile = null;
        
        // Disable buttons
        this.splitBtn.disabled = true;
        this.clearBtn.disabled = true;
        
        // Clear UI elements
        this.clearAlert();
        this.hideResults();
        this.hideProgress();
        
        this.showAlert('All data cleared successfully.', 'info');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.pdfSplitter = new PDFSplitter();
});
