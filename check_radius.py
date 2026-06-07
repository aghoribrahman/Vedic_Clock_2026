from PIL import Image

img = Image.open('assets/images/Core Dial Frame .png').convert('RGB')
cx, cy = img.width // 2, img.height // 2

# Check horizontal distance from center to where color changes significantly from the brass globe
# The globe is dark brown/black with gold lines. The frame is bright gold.
for r in range(10, 500):
    p = img.getpixel((cx + r, cy))
    # print r and color to find the boundary
    if r % 50 == 0:
        print(f"r={r}, color={p}")
