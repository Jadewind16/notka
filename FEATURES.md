# Notka - Features Documentation

## Overview
Notka is a study note management system that allows students to take notes and link them directly to specific pages or slides in lecture materials (PDFs, PowerPoints, etc.).

## Core Features

### 1. Note Creation
- **Title & Content**: Create text-based notes with a title and detailed content
- **Timestamps**: Automatic timestamp tracking for when notes are created
- **Quick Entry**: Simple form-based interface for rapid note-taking during lectures

### 2. File Upload & Management
- **Supported Formats**:
  - PDF documents (textbooks, lecture notes)
  - PowerPoint presentations (.ppt, .pptx)
- **File Storage**: Secure file storage with uploaded materials linked to notes
- **File Viewing**: Embedded file viewer to review materials without leaving the app

### 3. Page/Slide Reference System (Key Feature)
- **Page Linking**: Associate notes with specific page numbers in PDFs or slide numbers in presentations
- **Direct Navigation**: Click to jump directly to the referenced page/slide
- **Context Preservation**: Maintain connection between notes and source material for efficient review

**Example Workflow:**
1. Upload "Lecture_5_Algorithms.pdf"
2. Create note: "Quick Sort has O(n log n) average complexity" → Link to Page 23
3. Review later: Click "Go to Page 23" → Opens PDF at that exact page

### 4. Note Management
- **View All Notes**: Dashboard showing all notes in an organized grid
- **Delete Notes**: Remove notes and associated files
- **File Preview**: Quick preview of linked files

## Planned Features (v2.0)

### Enhanced Note Management
- **Edit Notes**: Modify existing notes and update page references
- **Search Functionality**: Full-text search across all notes
- **Filtering**: Filter by date, file type, or tags

### Organization Features
- **Tags/Categories**: Organize notes by subject, topic, or custom categories
- **Collections**: Group related notes (e.g., "Midterm 1 Study Materials")
- **Favorites**: Mark important notes for quick access

### Advanced File Handling
- **Multiple Files per Note**: Link one note to multiple documents
- **File Format Support**: Add support for Word docs, images, videos
- **Annotations**: Highlight or annotate directly on PDFs

### Collaboration
- **Share Notes**: Share individual notes or collections with classmates
- **Export Options**: Export notes as PDF, Markdown, or plain text
- **Cloud Sync**: Sync notes across devices

### Study Tools
- **Flashcards**: Generate flashcards from notes
- **Quiz Mode**: Test yourself on material
- **Study Stats**: Track study time and progress

## Technical Architecture

### Current Stack (v1.0)
- **Backend**: Node.js + Express
- **Frontend**: EJS templates
- **Database**: MongoDB
- **File Storage**: Local filesystem

### Migration to (v2.0)
- **Backend**: Python + FastAPI (async, better performance)
- **Frontend**: React (modern UI, better UX)
- **Database**: MongoDB (maintained)
- **File Storage**: Local with cloud backup option

## Use Cases

### During Lectures
1. Upload lecture slides at the beginning of class
2. Take quick notes as professor explains concepts
3. Link each note to the relevant slide number
4. Focus on understanding, not copying entire slides

### During Study Sessions
1. Review notes list
2. Click on a note to see your summary
3. Click "Go to Page X" to see the original slide/page
4. Context switching between your notes and source material is instant

### Exam Preparation
1. Filter notes by date range or topic
2. Review all notes for a specific chapter
3. Jump to source materials for concepts you need to review
4. Export notes for offline study

## Why Notka?

**Problem**: Students often take notes separate from lecture materials, making it hard to find the context later.

**Solution**: Notka keeps your notes and source materials linked together, so you always have context.

**Benefit**: Faster review, better retention, less time searching for "where was that slide?"
