# PDF Page Splitter Application

## Overview

This is a Flask-based web application that allows users to upload PDF files and split them into individual pages. The application provides a clean, user-friendly interface for PDF manipulation using PyPDF2 library and returns split pages as base64-encoded data.

## System Architecture

The application follows a simple client-server architecture:

- **Frontend**: HTML/CSS/JavaScript interface using Bootstrap for styling
- **Backend**: Flask web server with Python
- **PDF Processing**: PyPDF2 library for PDF manipulation
- **Deployment**: Gunicorn WSGI server for production deployment

## Key Components

### Backend Components

1. **Flask Application (`app.py`)**
   - Main Flask application with two routes:
     - `/` - Serves the main HTML interface
     - `/api/split-pdf` - API endpoint for PDF processing
   - Uses PyPDF2 for PDF manipulation
   - Returns base64-encoded individual pages

2. **Application Entry Point (`main.py`)**
   - Simple wrapper to run the Flask application
   - Configured for development mode with debug enabled

### Frontend Components

1. **HTML Template (`templates/index.html`)**
   - Bootstrap-based dark theme interface
   - File upload form with PDF validation
   - Progress indicators and result display areas
   - Responsive design for mobile compatibility

2. **JavaScript Application (`static/js/app.js`)**
   - Client-side PDF file validation (type and size checks)
   - AJAX communication with backend API
   - Progress tracking and user feedback
   - Dynamic UI updates for results display

### Configuration Files

1. **Project Configuration (`pyproject.toml`)**
   - Python dependencies including Flask, PyPDF2, and database libraries
   - Minimum Python version requirement (3.11+)

2. **Replit Configuration (`.replit`)**
   - Deployment target set to autoscale
   - Gunicorn server configuration
   - PostgreSQL package included for future database needs

## Data Flow

1. **File Upload**: User selects PDF file through web interface
2. **Client Validation**: JavaScript validates file type and size (max 10MB)
3. **Base64 Encoding**: File is converted to base64 on client side
4. **API Request**: Base64 data sent to `/api/split-pdf` endpoint
5. **Server Processing**: PyPDF2 splits PDF into individual pages
6. **Response**: Each page returned as base64-encoded data with metadata
7. **Display**: Client renders individual pages for download/preview

## External Dependencies

### Python Libraries
- **Flask**: Web framework for HTTP server and routing
- **PyPDF2**: PDF manipulation and page splitting
- **Gunicorn**: WSGI HTTP Server for deployment
- **psycopg2-binary**: PostgreSQL adapter (for future database features)
- **email-validator**: Email validation utilities

### Frontend Libraries
- **Bootstrap**: CSS framework for responsive UI
- **Font Awesome**: Icon library for enhanced UX

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

1. **Development**: Flask development server with debug mode
2. **Production**: Gunicorn WSGI server binding to all interfaces on port 5000
3. **Scaling**: Autoscale deployment target for handling varying loads
4. **Database Ready**: PostgreSQL package included for future database integration

The deployment uses a parallel workflow system with automatic port detection and reload capabilities for development.

## Changelog

- June 16, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.