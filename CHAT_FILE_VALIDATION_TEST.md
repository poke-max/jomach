# Chat File Validation and CV Attachment - Testing Guide

## Features Added

### 1. PDF File Validation
- **Error message for non-PDF files**: When a user tries to upload a file that is not a PDF, they will see the error "Solo se permiten archivos PDF"
- **File size validation**: Files larger than 10MB will show the error "El archivo no puede ser mayor a 10MB"
- **Error display**: Errors appear in red text below the attachment options and auto-dismiss after 3 seconds

### 2. "Attach My CV" Option
- **CV Button**: A new button "Adjuntar mi CV" (desktop) / "Mi CV" (mobile) appears when the user has a CV uploaded in their profile
- **CV Validation**: If the user doesn't have a CV in their profile, they'll see the error "No tienes un CV subido en tu perfil"
- **Automatic CV Attachment**: Uses the CV URL from the user's profile (`userProfile.cvUrl`)

## Manual Testing Steps

### Test PDF Validation

1. **Open a chat conversation**
2. **Click the paperclip icon** to show attachment options
3. **Click "PDF" button** to open file selector
4. **Try to select a non-PDF file** (e.g., .txt, .jpg, .docx)
   - ✅ **Expected**: Red error message "Solo se permiten archivos PDF" appears
   - ✅ **Expected**: Error disappears after 3 seconds
   - ✅ **Expected**: File is not uploaded

5. **Try to select a PDF file larger than 10MB**
   - ✅ **Expected**: Red error message "El archivo no puede ser mayor a 10MB" appears
   - ✅ **Expected**: Error disappears after 3 seconds
   - ✅ **Expected**: File is not uploaded

6. **Select a valid PDF file (under 10MB)**
   - ✅ **Expected**: No error message
   - ✅ **Expected**: File uploads successfully
   - ✅ **Expected**: Message appears in chat with PDF icon and filename

### Test CV Attachment

#### Case 1: User has CV in profile
1. **Ensure user has uploaded a CV in their profile**
   - Go to Profile → Upload CV (PDF)
2. **Open a chat conversation**
3. **Click the paperclip icon**
4. **Verify "Adjuntar mi CV" / "Mi CV" button appears**
   - ✅ **Expected**: Button is visible with user icon
   - ✅ **Expected**: Button has orange/amber styling
5. **Click the CV button**
   - ✅ **Expected**: CV uploads automatically
   - ✅ **Expected**: Message appears with filename "CV - [User Name].pdf"
   - ✅ **Expected**: Attachment options close automatically

#### Case 2: User has no CV in profile
1. **Ensure user has no CV uploaded** (remove from profile if needed)
2. **Open a chat conversation**
3. **Click the paperclip icon**
4. **Verify "Adjuntar mi CV" / "Mi CV" button does NOT appear**
   - ✅ **Expected**: Only "PDF" button is visible
5. **If you manually trigger the CV function** (for testing):
   - ✅ **Expected**: Error message "No tienes un CV subido en tu perfil"

### Test Error Handling

1. **Test file input reset**
   - Try to upload invalid file
   - Try to upload the same invalid file again
   - ✅ **Expected**: Error shows both times (input resets properly)

2. **Test multiple errors**
   - Try invalid file type, then oversized file
   - ✅ **Expected**: Each error shows appropriately

3. **Test error auto-dismiss**
   - Trigger any error
   - ✅ **Expected**: Error disappears after exactly 3 seconds

## Code Changes Summary

### New Features
- Added `fileError` state for error messages
- Added `userProfile` from AuthContext to access CV
- Added `handleAttachCV()` function for CV attachment
- Enhanced `handleFileSelect()` with PDF validation
- Added CV button to both mobile and desktop attachment options
- Added error display in both mobile and desktop layouts

### Validation Rules
- **File type**: Must be `application/pdf`
- **File size**: Maximum 10MB
- **CV availability**: Must exist in `userProfile.cvUrl`

### UI Improvements
- Error messages in red text
- CV button with distinct orange styling
- Auto-dismissing errors (3 seconds)
- Input reset after invalid file selection
- Responsive design for both mobile and desktop

## Files Modified
- `src/components/ChatScreen.jsx` - Main implementation
- Added FaUserTie icon import for CV button

## Dependencies
- Uses existing `userProfile` from AuthContext
- Uses existing `messagesService.sendMessage()` for file messages
- Uses existing error handling patterns from the app
