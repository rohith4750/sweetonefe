# Login Page Assets

## Logo Image

1. **Place your Sweetone logo** in this folder (`public/assets/`) with the name:
   - `sweetone-logo.png` - The oval golden logo with "Sweetone" text

2. **Recommended Logo Specifications:**
   - **Format**: PNG with transparent background (recommended) or JPG
   - **Size**: 240x240px or higher (will be displayed at 120px width)
   - **Background**: Transparent PNG works best
   - **File Size**: Optimize to keep under 500KB

## Background Image

## How to Add Your Background Image

1. **Place your promotional image** in this folder (`public/assets/`) with the following names:
   - `login-background.jpg` - Standard resolution (1920x1080 or higher recommended)
   - `login-background@2x.jpg` - High DPI/Retina display (2x resolution, e.g., 3840x2160)
   - `login-background@3x.jpg` - Ultra high resolution (3x resolution, e.g., 5760x3240)

2. **Recommended Image Specifications:**
   - **Format**: JPG or PNG (JPG recommended for smaller file size)
   - **Standard Resolution**: 1920x1080px minimum (Full HD)
   - **High DPI**: 3840x2160px (4K) for @2x version
   - **Ultra High**: 5760x3240px for @3x version
   - **File Size**: Optimize images to keep file sizes reasonable (under 2MB per image)
   - **Aspect Ratio**: 16:9 or 21:9 works best

3. **Image Optimization Tips:**
   - Use tools like TinyPNG, ImageOptim, or Squoosh to compress images
   - Ensure good quality/clarity for the login page
   - The image will be displayed with `background-size: cover` to fill the entire viewport

4. **Quick Setup (Single Image):**
   If you only have one image, name it `login-background.jpg` and place it here. The CSS will automatically use it for all resolutions.

## Note
The CSS is configured to automatically use the appropriate image resolution based on the user's device pixel ratio for optimal clarity and performance.

