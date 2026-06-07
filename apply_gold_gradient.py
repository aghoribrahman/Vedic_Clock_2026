import os
from PIL import Image, ImageDraw, ImageOps

def create_vertical_gradient(size, top_color, bottom_color):
    """Creates a vertical linear gradient image."""
    base = Image.new('RGB', size, top_color)
    top = base.copy()
    bottom = Image.new('RGB', size, bottom_color)
    mask = Image.new('L', size)
    mask_data = []
    for y in range(size[1]):
        mask_data.extend([int(255 * (y / size[1]))] * size[0])
    mask.putdata(mask_data)
    base.paste(bottom, (0, 0), mask)
    return base

def recolor_digits():
    source_dir = 'assets/numbers'
    
    # Gold yellow gradient colors
    top_color = (255, 230, 100)    # Bright yellow-gold
    bottom_color = (200, 110, 0)   # Deep orange-gold
    
    files = [f'{i}.png' for i in range(10)] + ['colon.png']
    
    for filename in files:
        filepath = os.path.join(source_dir, filename)
        if not os.path.exists(filepath):
            continue
            
        print(f"Processing {filepath}...")
        img = Image.open(filepath).convert("RGBA")
        
        # 1. Extract Alpha channel to preserve transparency
        alpha = img.getchannel('A')
        
        # 2. Get luminance/texture of the original image
        # Convert to grayscale to use as a texture map
        gray = ImageOps.grayscale(img)
        
        # We can increase the contrast slightly to make the texture pop
        gray = ImageOps.autocontrast(gray, cutoff=2)
        
        # 3. Create a golden gradient the same size as the image
        gradient = create_vertical_gradient(img.size, top_color, bottom_color)
        
        # 4. Multiply the gradient by the grayscale texture
        # To do this, we treat the grayscale as a brightness mask on the gradient
        from PIL import ImageChops
        # Convert gray back to RGB for multiply
        gray_rgb = gray.convert('RGB')
        colored_rgb = ImageChops.multiply(gradient, gray_rgb)
        
        # 5. But wait, if the original image was dark, it will be very dark.
        # Let's use overlay or soft light, or just multiply with a brightened gray
        # Actually, if we want it bright gold, let's brighten the gray first
        enhancer = ImageEnhance.Brightness(gray_rgb)
        bright_gray = enhancer.enhance(1.5)
        final_rgb = ImageChops.multiply(gradient, bright_gray)
        
        # 6. Put the alpha channel back
        final_img = final_rgb.convert("RGBA")
        final_img.putalpha(alpha)
        
        final_img.save(filepath)

if __name__ == "__main__":
    import PIL.ImageEnhance as ImageEnhance
    recolor_digits()
    print("Done!")
