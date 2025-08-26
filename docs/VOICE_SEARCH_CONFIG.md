# Voice Search Configuration

## Overview

Voice search functionality in the weather app is **disabled by default** for privacy and user
experience reasons.

## Default Configuration

- `autoStart: false` - Voice search does not start automatically
- Users must explicitly enable and trigger voice search
- No automatic listening or voice data collection without user consent

## How to Enable Voice Search

### For Developers

```typescript
import { useVoiceSearch, DEFAULT_VOICE_SEARCH_CONFIG } from './utils/useVoiceSearch';

// To enable voice search, override the autoStart setting
const voiceSearch = useVoiceSearch({
  ...DEFAULT_VOICE_SEARCH_CONFIG,
  autoStart: true, // Only enable if user has given explicit consent
});
```

### For End Users

Voice search must be manually activated through UI controls. It will never start automatically to
protect user privacy.

## Privacy Considerations

- Voice search requires microphone permissions
- No voice data is stored or transmitted without user action
- All voice processing happens locally in the browser
- Users have full control over when voice search is active

## Browser Support

- Chrome/Chromium-based browsers: Full support
- Firefox: Limited support
- Safari: Limited support
- Edge: Full support

## Configuration Options

- `language`: Default 'en-US'
- `timeout`: Default 10 seconds
- `autoStart`: **Always false by default**
- `continuous`: Default false
- `interimResults`: Default true
