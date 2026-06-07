from PIL import Image

img = Image.open('assets/images/Core Dial Frame .png').convert('RGB')
cx, cy = img.width // 2, img.height // 2

for r in range(250, 310):
    p = img.getpixel((cx + r, cy))
    brightness = sum(p)
    if brightness > 150: # assuming gold is brighter than the dark globe
        print(f"Frame starts around r={r}, color={p}")
        break
