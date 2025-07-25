# Audio Files for Dots2Squares

## Required Files

### countdown.mp3
- **Purpose**: 5-second countdown sound for turn timer
- **Duration**: Exactly 5 seconds
- **Format**: MP3, 44.1kHz, stereo
- **Volume**: Normalized to prevent audio spikes on mobile
- **Requirements**: 
  - Must be optimized for mobile playback
  - Should work without autoplay (user interaction required)
  - Compressed for fast loading on mobile networks

## Mobile Audio Notes

- Audio is disabled by default for mobile compatibility
- Users must tap the sound toggle to enable audio
- This follows mobile browser autoplay policies
- Audio files should be small and compressed for mobile performance

## Implementation

The audio system is designed to work across all devices including:
- iOS Safari (with audio restrictions)
- Android Chrome/Firefox  
- Desktop browsers
- Progressive Web Apps

To add the countdown.mp3 file:
1. Create a 5-second countdown sound effect
2. Export as MP3 (128kbps recommended)
3. Place in this `/public/sounds/` directory
4. Test on mobile devices to ensure compatibility 