# Implementation Plan — Manual Song Search Enhancement

This plan outlines the steps to add a manual song search feature to TukarTa, allowing users to find and add songs without relying solely on screenshots.

## User Review Required

> [!IMPORTANT]
> - **API Key**: We will use the free API key `123` for TheAudioDB as suggested.
> - **Flow Integration**: The manual search will be integrated into the onboarding flow and accessible from the dashboard's "Add Song" entry points.
> - **Data Storage**: Songs found via search will be saved to the user's library with metadata (genre, artist image) from TheAudioDB.

## Proposed Changes

### 1. Documentation Update

#### [MODIFY] [TECH_STACK.md](file:///c:/Users/Admin/Documents/GEC%20PROJECT/Personal/TukarTa/docs/TECH_STACK.md)
- Add TheAudioDB to the "Lyrics Source" or a new "Metadata Source" section.
- Update the API strategy section to reflect the use of LRCLIB + TheAudioDB combo.

### 2. Utilities & Services

#### [NEW] [musicApi.ts](file:///c:/Users/Admin/Documents/GEC%20PROJECT/Personal/TukarTa/utils/musicApi.ts)
- Implement `searchSongs(query: string)` using LRCLIB (`https://lrclib.net/api/search?q=`).
- Implement `getArtistMetadata(artistName: string)` using TheAudioDB (`https://www.theaudiodb.com/api/v1/json/123/search.php?s=`).
- Combine these into a service that returns enriched song data.

### 3. UI Implementation

#### [MODIFY] [upload.tsx](file:///c:/Users/Admin/Documents/GEC%20PROJECT/Personal/TukarTa/app/onboarding/upload.tsx)
- Add a "Search Manually" button/alternative for users who don't want to upload screenshots.

#### [MODIFY] [review.tsx](file:///c:/Users/Admin/Documents/GEC%20PROJECT/Personal/TukarTa/app/onboarding/review.tsx)
- Link the "+ Add song manually" button to the new manual search screen.

#### [NEW] [manual-search.tsx](file:///c:/Users/Admin/Documents/GEC%20PROJECT/Personal/TukarTa/app/onboarding/manual-search.tsx)
- Implementation of the search interface:
    - Search bar with debounced input.
    - Results list showing title, artist, and album.
    - Glassmorphic result cards.
    - Background fetching of genre/image from TheAudioDB upon selection.
    - Selection confirmation and adding to the list.

### 4. Integration

#### [MODIFY] [index.tsx](file:///c:/Users/Admin/Documents/GEC%20PROJECT/Personal/TukarTa/app/%28tabs%29/index.tsx)
- Ensure "Quick Actions" can lead to song addition (either scan or manual).

## Open Questions

- **BPM and Key**: These will remain manual entry fields as discussed. Should we provide a "guess" based on the song data if available in the future? (Out of scope for this MVP).
- **Navigation**: Should manual search be a modal or a push screen? (I'll go with push for now to match the onboarding feel).

## Verification Plan

### Automated Tests
- I'll use the browser tool to test the LRCLIB and TheAudioDB endpoints directly to ensure they return the expected data formats.

### Manual Verification
- Test the search functionality with various artist/song names.
- Verify that metadata (genre, artist image) is correctly retrieved and displayed.
- Ensure the song is added to the review list or user library correctly.
