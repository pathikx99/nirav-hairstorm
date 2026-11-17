import numpy as np
from PIL import Image

# Load assets
model_img = Image.open('frontend/public/avatar/avatar_front_model.jpg')
clean_bg = Image.open('frontend/public/avatar/hair_front_clean_bg.jpg')
alpha_img = Image.open('frontend/public/avatar/hair_front_alpha.png')
skin_img = Image.open('frontend/public/avatar/hair_front_skin.png')
protect_img = Image.open('frontend/public/avatar/hair_front_features_protect.png')

model_arr = np.array(model_img, dtype=np.float32)
clean_bg_arr = np.array(clean_bg, dtype=np.float32)
alpha_arr = np.array(alpha_img, dtype=np.float32) / 255.0
skin_arr = np.array(skin_img, dtype=np.float32) / 255.0
protect_arr = np.array(protect_img, dtype=np.float32) / 255.0

h, w, _ = model_arr.shape

# Color conversions
def srgb_to_lin(srgb):
    s = srgb / 255.0
    return np.where(s <= 0.04045, s / 12.92, ((s + 0.055) / 1.055) ** 2.4)

def lin_to_srgb(lin):
    c = np.clip(lin, 0.0, 1.0)
    s = np.where(c <= 0.0031308, 12.92 * c, 1.055 * (c ** (1.0 / 2.4)) - 0.055)
    return np.clip(s * 255.0, 0.0, 255.0)

def lin_to_oklab(r, g, b):
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_ = np.cbrt(np.maximum(1e-8, l))
    m_ = np.cbrt(np.maximum(1e-8, m))
    s_ = np.cbrt(np.maximum(1e-8, s))
    L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    return L, a, b_

def oklab_to_lin(L, a, b):
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l = l_ ** 3
    m = m_ ** 3
    s = s_ ** 3
    r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    b_ = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return r, g, b_

lin_model = srgb_to_lin(model_arr)
origL, origA, origB = lin_to_oklab(lin_model[:,:,0], lin_model[:,:,1], lin_model[:,:,2])

# Ebony profile
target_skin_oklab = [0.5040, 0.0513, 0.0457]
target_lip_oklab = [0.4705, 0.0598, 0.0279]
target_iris_oklab = [0.4085, 0.0261, 0.0188]
base_skin_oklab = [0.8285, 0.0335, 0.0279]
base_lip_oklab = [0.5559, 0.0738, 0.0314]
base_iris_oklab = [0.4624, 0.0200, 0.0212]
gamma = 0.89
spec_luster = 0.15

# Compute Ebony Skin everywhere
k_skin = np.maximum(0.01, origL / base_skin_oklab[0])
skinL = np.clip(target_skin_oklab[0] * (k_skin ** gamma), 0.03, 0.98)
# Highlight retention
spec_mask = origL > 0.70
skinL[spec_mask] = np.minimum(0.98, skinL[spec_mask] + ((origL[spec_mask] - 0.70) / 0.30) * spec_luster * 0.08)
skinA = target_skin_oklab[1] + (origA - base_skin_oklab[1]) * 0.88
skinB = target_skin_oklab[2] + (origB - base_skin_oklab[2]) * 0.88

lin_skin_r, lin_skin_g, lin_skin_b = oklab_to_lin(skinL, skinA, skinB)
skin_rgb = lin_to_srgb(np.stack([lin_skin_r, lin_skin_g, lin_skin_b], axis=-1))

# Compute Ebony Lips
k_lip = np.maximum(0.01, origL / base_lip_oklab[0])
lipL = np.clip(target_lip_oklab[0] * (k_lip ** 0.95), 0.05, 0.95)
lipA = target_lip_oklab[1] + (origA - base_lip_oklab[1]) * 0.70
lipB = target_lip_oklab[2] + (origB - base_lip_oklab[2]) * 0.70
lin_lip_r, lin_lip_g, lin_lip_b = oklab_to_lin(lipL, lipA, lipB)
lip_rgb = lin_to_srgb(np.stack([lin_lip_r, lin_lip_g, lin_lip_b], axis=-1))

# Compute Iris
k_iris = np.maximum(0.01, origL / base_iris_oklab[0])
irisL = np.clip(target_iris_oklab[0] * (k_iris ** 0.90), 0.05, 0.95)
irisA = target_iris_oklab[1] + (origA - base_iris_oklab[1]) * 0.60
irisB = target_iris_oklab[2] + (origB - base_iris_oklab[2]) * 0.60
lin_iris_r, lin_iris_g, lin_iris_b = oklab_to_lin(irisL, irisA, irisB)
iris_rgb = lin_to_srgb(np.stack([lin_iris_r, lin_iris_g, lin_iris_b], axis=-1))

# Grid coords
y_coords, x_coords = np.mgrid[:h, :w]

# Lip mask (vermilion & lips)
is_lip_box = (y_coords >= 430) & (y_coords <= 500) & (x_coords >= 400) & (x_coords <= 500)
lip_alpha = np.where(is_lip_box, protect_arr, 0.0)

# Eyeball Aperture
d_left = ((x_coords - 397.0) / 22.0)**2 + ((y_coords - 350.0) / 8.5)**2
d_right = ((x_coords - 510.0) / 22.0)**2 + ((y_coords - 349.0) / 8.5)**2
in_eyeball = (d_left <= 1.0) | (d_right <= 1.0)

chroma = np.sqrt(origA**2 + origB**2)
# Sclera is strictly inside eyeball aperture, bright, and low chroma
is_sclera = in_eyeball & (origL >= 0.46) & (chroma < 0.038)
# Iris is inside eyeball aperture, darker or colored
is_iris = in_eyeball & ~is_sclera

# Base facial skin plate: start with model_arr, apply skin_rgb everywhere skin_arr is active
# Also include neck collar extension: y in [570..595], x in [350..540] where origL > 0.18
neck_collar_ext = (y_coords >= 570) & (y_coords <= 595) & (x_coords >= 350) & (x_coords <= 540) & (origL > 0.18)
# Smooth fade as origL approaches collar (0.18 to 0.15)
neck_collar_alpha = np.clip((origL - 0.15) / 0.10, 0.0, 1.0)

eff_skin_mask = np.maximum(skin_arr, np.where(neck_collar_ext, neck_collar_alpha, 0.0))
# Sclera does NOT get skin color
eff_skin_mask = np.where(is_sclera, 0.0, eff_skin_mask)
# Iris adapts via iris_rgb
eff_skin_mask = np.where(is_iris, 0.0, eff_skin_mask)

# Composite facial plate:
# 1. Base skin
facial_plate = model_arr * (1.0 - eff_skin_mask[:,:,None]) + skin_rgb * eff_skin_mask[:,:,None]
# 2. Lips blend OVER the recolored skin plate (ZERO white border!)
facial_plate = facial_plate * (1.0 - lip_alpha[:,:,None]) + lip_rgb * lip_alpha[:,:,None]
# 3. Iris blend
iris_alpha = np.where(is_iris, 0.85, 0.0)
facial_plate = facial_plate * (1.0 - iris_alpha[:,:,None]) + iris_rgb * iris_alpha[:,:,None]

# Save cropped result for visual inspection
out_img = Image.fromarray(facial_plate.astype(np.uint8))
crop_test = out_img.crop((200, 200, 800, 850))
crop_test.save('/home/lord-kratos/.gemini/antigravity/brain/b64d942c-d36c-484a-86d1-93d67a5d3e1a/test_ebony_perfect.png')
print('Rendered test_ebony_perfect.png successfully!')
