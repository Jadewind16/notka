#!/bin/bash
# Script to clean up test database and test files
# Part of Notka project - follows SE class best practices

echo "🧹 Cleaning test data..."
echo ""

# Clean test database
echo "1. Dropping notka_test database..."
if mongosh --quiet notka_test --eval "db.dropDatabase()" 2>/dev/null; then
    echo "   ✅ Test database dropped"
else
    echo "   ⚠️  Could not drop test database (may not exist)"
fi

# Clean test files from uploads
echo ""
echo "2. Removing test files from uploads/..."
UPLOAD_DIR="/home/jadewind/notka/uploads"
if [ -d "$UPLOAD_DIR" ]; then
    # Count files before cleanup
    BEFORE=$(ls -1 "$UPLOAD_DIR" | grep -v ".gitkeep" | wc -l)
    
    # Remove files with test-related names
    rm -f "$UPLOAD_DIR"/*test* 2>/dev/null
    rm -f "$UPLOAD_DIR"/*delete_me* 2>/dev/null
    rm -f "$UPLOAD_DIR"/*textbook* 2>/dev/null
    rm -f "$UPLOAD_DIR"/*download_test* 2>/dev/null
    rm -f "$UPLOAD_DIR"/*retrieve_test* 2>/dev/null
    rm -f "$UPLOAD_DIR"/*large.pdf* 2>/dev/null
    
    # Count files after cleanup
    AFTER=$(ls -1 "$UPLOAD_DIR" | grep -v ".gitkeep" | wc -l)
    REMOVED=$((BEFORE - AFTER))
    
    if [ $REMOVED -gt 0 ]; then
        echo "   ✅ Removed $REMOVED test files"
    else
        echo "   ✅ No test files found"
    fi
else
    echo "   ✅ Upload directory clean"
fi

# Clean Python cache files
echo ""
echo "3. Cleaning Python cache..."
cd /home/jadewind/notka/backend
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null
find . -name "*.pyc" -delete 2>/dev/null
echo "   ✅ Python cache cleaned"

# Optional: Clean orphaned files (files not in production DB)
echo ""
echo "4. Checking for orphaned files..."
ORPHANED=0
if command -v mongosh &> /dev/null; then
    # Get list of files referenced in production database
    DB_FILES=$(mongosh --quiet notka --eval "db.notes.find({file_path: {\$exists: true}}, {file_path: 1, _id: 0}).toArray().map(n => n.file_path).join('\n')" 2>/dev/null)
    
    # Check each file in uploads
    for file in "$UPLOAD_DIR"/*; do
        filename=$(basename "$file")
        if [ "$filename" != ".gitkeep" ]; then
            # Check if file is referenced in database
            if ! echo "$DB_FILES" | grep -q "$filename"; then
                # File is orphaned (not in database)
                # Only remove if it looks like a test file (has common test names)
                if [[ "$filename" == *"delete_me"* ]] || \
                   [[ "$filename" == *"test"* ]] || \
                   [[ "$filename" == *"large"* ]] || \
                   [[ "$filename" == *"textbook"* ]] || \
                   [[ "$filename" == *"download"* ]] || \
                   [[ "$filename" == *"retrieve"* ]]; then
                    rm -f "$file" 2>/dev/null
                    ((ORPHANED++))
                fi
            fi
        fi
    done
    
    if [ $ORPHANED -gt 0 ]; then
        echo "   ✅ Removed $ORPHANED orphaned test files"
    else
        echo "   ✅ No orphaned files found"
    fi
else
    echo "   ⚠️  mongosh not available, skipping orphan check"
fi

echo ""
echo "✅ All test data cleaned!"
echo ""
echo "Summary:"
echo "  • Test database: Dropped"
echo "  • Test files: Removed"
echo "  • Python cache: Cleaned"
echo ""
echo "Verify with:"
echo "  mongosh notka_test --eval 'db.notes.countDocuments()'"
echo "  ls -lh uploads/ | wc -l"

