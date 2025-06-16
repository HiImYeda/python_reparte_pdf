import os
import json
import base64
import logging
from io import BytesIO
from flask import Flask, request, jsonify, render_template
from PyPDF2 import PdfReader, PdfWriter
from pdf2image import convert_from_bytes
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

@app.route('/')
def index():
    """Render the main page with PDF upload form."""
    return render_template('index.html')

@app.route('/api/split-pdf', methods=['POST'])
def split_pdf():
    """
    API endpoint to split PDF pages and return base64-encoded individual pages.
    
    Expected JSON payload:
    {
        "pdf_base64": "base64-encoded-pdf-data"
    }
    
    Returns:
    {
        "success": true,
        "pages": [
            {
                "page_number": 1,
                "base64": "base64-encoded-page-data"
            },
            ...
        ],
        "total_pages": N
    }
    """
    try:
        # Validate request content type
        if not request.is_json:
            return jsonify({
                "success": False,
                "error": "Content-Type must be application/json"
            }), 400
        
        data = request.get_json()
        
        # Validate required fields
        if not data or 'pdf_base64' not in data:
            return jsonify({
                "success": False,
                "error": "Missing 'pdf_base64' field in request body"
            }), 400
        
        pdf_base64 = data['pdf_base64']
        
        if not pdf_base64:
            return jsonify({
                "success": False,
                "error": "'pdf_base64' field cannot be empty"
            }), 400
        
        # Decode base64 PDF data
        try:
            pdf_data = base64.b64decode(pdf_base64)
        except Exception as e:
            logging.error(f"Base64 decode error: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Invalid base64 encoding"
            }), 400
        
        # Create PDF reader from decoded data
        try:
            pdf_stream = BytesIO(pdf_data)
            pdf_reader = PdfReader(pdf_stream)
        except Exception as e:
            logging.error(f"PDF reading error: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Invalid PDF file or corrupted data"
            }), 400
        
        # Check if PDF has pages
        if len(pdf_reader.pages) == 0:
            return jsonify({
                "success": False,
                "error": "PDF file contains no pages"
            }), 400
        
        # Convert PDF to images first
        try:
            images = convert_from_bytes(pdf_data, dpi=200, fmt='PNG')
            logging.debug(f"Successfully converted PDF to {len(images)} images")
        except Exception as e:
            logging.error(f"Error converting PDF to images: {str(e)}")
            return jsonify({
                "success": False,
                "error": f"Error converting PDF to images: {str(e)}"
            }), 500

        # Split PDF into individual pages and convert to images
        pages_data = []
        
        for page_num, page in enumerate(pdf_reader.pages, 1):
            try:
                # Create a new PDF writer for this page
                pdf_writer = PdfWriter()
                pdf_writer.add_page(page)
                
                # Write the single page to a BytesIO buffer
                page_buffer = BytesIO()
                pdf_writer.write(page_buffer)
                page_buffer.seek(0)
                
                # Encode the page as base64
                page_base64 = base64.b64encode(page_buffer.getvalue()).decode('utf-8')
                
                # Convert corresponding image to base64
                image_base64 = None
                if page_num <= len(images):
                    image = images[page_num - 1]  # 0-indexed
                    image_buffer = BytesIO()
                    image.save(image_buffer, format='PNG')
                    image_buffer.seek(0)
                    image_base64 = base64.b64encode(image_buffer.getvalue()).decode('utf-8')
                
                pages_data.append({
                    "page_number": page_num,
                    "pdf_base64": page_base64,
                    "image_base64": image_base64
                })
                
                logging.debug(f"Successfully processed page {page_num}")
                
            except Exception as e:
                logging.error(f"Error processing page {page_num}: {str(e)}")
                return jsonify({
                    "success": False,
                    "error": f"Error processing page {page_num}: {str(e)}"
                }), 500
        
        # Return successful response
        response = {
            "success": True,
            "pages": pages_data,
            "total_pages": len(pages_data)
        }
        
        logging.info(f"Successfully split PDF into {len(pages_data)} pages")
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"Unexpected error in split_pdf: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large errors."""
    return jsonify({
        "success": False,
        "error": "File too large. Please upload a smaller PDF file."
    }), 413

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    """Handle method not allowed errors."""
    return jsonify({
        "success": False,
        "error": "Method not allowed"
    }), 405

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
