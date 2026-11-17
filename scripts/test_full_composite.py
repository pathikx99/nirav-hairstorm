import numpy as np
from PIL import Image

# Load assets
model_img = Image.open('frontend/public/avatar/avatar_front_model.jpg')
clean_bg = Image.open('frontend/public/avatar/hair_front_clean_bg.jpg')
alpha_img = Image.open('frontend/public/avatar/hair_front_alpha.png')
zones_img = Image.open('frontend/public/avatar/hair_front_zones.png')
protect_img = Image.open('frontend/public/avatar/hair_front_features_protect.png')

model_arr = np.array(model_img, dtype=np.float32)
clean_bg_arr = np.array(clean_bg, dtype=np.float32)
hair_alpha = np.array(alpha_img, dtype=np.float32) / 255.0
zones_arr = np.array(zones_img, dtype=np.float32) / 255.0

h, w, _ = model_arr.shape

# Color math
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
chroma = np.sqrt(origA**2 + origB**2)
y_coords, x_coords = np.mgrid[:h, :w]

# 1. Anatomical Eye Aperture
d_left = ((x_coords - 397.0) / 21.0)**2 + ((y_coords - 350.0) / 8.0)**2
d_right = ((x_coords - 510.0) / 21.0)**2 + ((y_coords - 349.0) / 8.0)**2
in_eyeball_opening = (d_left <= 1.0) | (d_right <= 1.0)
is_sclera = in_eyeball_opening & (origL >= 0.48) & (chroma < 0.038)
is_iris = in_eyeball_opening & ~is_sclera

# 2. Lip mask
is_lip_box = (y_coords >= 425) & (y_coords <= 495) & (x_coords >= 400) & (x_coords <= 500)
protect_arr = np.array(protect_img, dtype=np.float32) / 255.0
lip_mask = np.where(is_lip_box, protect_arr, 0.0)

# 3. Master Skin Mask (Natural face contour, chin, neck)
# Cheek contours:
# Left contour: x_min from forehead (360) down cheek (360) to jaw (390)
# Right contour: x_max from forehead (540) down cheek (540) to jaw (510)
# Under hair strands (hair_alpha > 0.05): the dermis extends smoothly under the inner hair strands
# up to 25px into the hair so there's never a gap between hair and skin.
# Let's check skin condition:
is_human_skin = (origA > 0.015) & (origB > 0.010) & (origL > 0.18)
# Vertical range: from top of forehead (y=200) down to collar (y=593)
in_vertical_range = (y_coords >= 200) & (y_coords <= 593)
# Horizontal cheek envelope: between hair outer envelope x in [330..570]
in_horiz_envelope = (x_coords >= 330) & (x_coords <= 570)
# Collar line feather
neck_collar_fade = np.clip((origL - 0.16) / 0.12, 0.0, 1.0)
is_near_collar = (y_coords >= 580) & (y_coords <= 595) & (x_coords >= 350) & (x_coords <= 540)

skin_mask = np.where(in_vertical_range & in_horiz_envelope & is_human_skin, 1.0, 0.0)
skin_mask[is_near_collar] *= neck_collar_fade[is_near_collar]
# Exclude eyeball sclera and iris from skin tone
skin_mask[is_sclera | is_iris] = 0.0

import scipy.ndimage as ndimage
skin_mask_smoothed = ndimage.gaussian_filter(skin_mask, sigma=1.0)

# Skin transfer for Ebony
ebony_skin_oklab = [0.5040, 0.0513, 0.0457]
ebony_lip_oklab = [0.4705, 0.0598, 0.0279]
ebony_iris_oklab = [0.4085, 0.0261, 0.0188]
base_skin_oklab = [0.8285, 0.0335, 0.0279]
base_lip_oklab = [0.5559, 0.0738, 0.0314]
base_iris_oklab = [0.4624, 0.0200, 0.0212]

k_skin = np.maximum(0.01, origL / base_skin_oklab[0])
skinL = np.clip(ebony_skin_oklab[0] * (k_skin ** 0.89), 0.03, 0.98)
spec_mask = origL > 0.70
skinL[spec_mask] = np.minimum(0.98, skinL[spec_mask] + ((origL[spec_mask] - 0.70) / 0.30) * 0.15 * 0.08)
skinA = ebony_skin_oklab[1] + (origA - base_skin_oklab[1]) * 0.88
skinB = ebony_skin_oklab[2] + (origB - base_skin_oklab[2]) * 0.88
lin_sk_r, lin_sk_g, lin_sk_b = oklab_to_lin(skinL, skinA, skinB)
skin_rgb = lin_to_srgb(np.stack([lin_sk_r, lin_sk_g, lin_sk_b], axis=-1))

# Lips
k_lip = np.maximum(0.01, origL / base_lip_oklab[0])
lipL = np.clip(ebony_lip_oklab[0] * (k_lip ** 0.95), 0.05, 0.95)
lipA = ebony_lip_oklab[1] + (origA - base_lip_oklab[1]) * 0.70
lipB = ebony_lip_oklab[2] + (origB - base_lip_oklab[2]) * 0.70
lin_lip_r, lin_lip_g, lin_lip_b = oklab_to_lin(lipL, lipA, lipB)
lip_rgb = lin_to_srgb(np.stack([lin_lip_r, lin_lip_g, lin_lip_b], axis=-1))

# Iris
k_iris = np.maximum(0.01, origL / base_iris_oklab[0])
irisL = np.clip(ebony_iris_oklab[0] * (k_iris ** 0.90), 0.05, 0.95)
irisA = ebony_iris_oklab[1] + (origA - base_iris_oklab[1]) * 0.60
irisB = ebony_iris_oklab[2] + (origB - base_iris_oklab[2]) * 0.60
lin_ir_r, lin_ir_g, lin_ir_b = oklab_to_lin(irisL, irisA, irisB)
iris_rgb = lin_to_srgb(np.stack([lin_ir_r, lin_ir_g, lin_ir_b], axis=-1))

# 4. Underlying Plate (Dermis + Background)
# Where skin is present, underlying plate is skin_rgb. Outside skin, it is clean_bg_arr.
# Smoothly blend between clean_bg and model where hair strands live:
plate = clean_bg_arr.copy()
# On face dermis:
plate = plate * (1.0 - skin_mask_smoothed[:,:,None]) + skin_rgb * skin_mask_smoothed[:,:,None]
# On non-skin inner face (e.g. eyes/sclera):
non_skin_face = in_vertical_range & in_horiz_envelope & (skin_mask_smoothed < 0.1) & ~is_near_collar
plate = np.where(non_skin_face[:,:,None], model_arr, plate)

# Blend lips OVER skin
plate = plate * (1.0 - lip_mask[:,:,None]) + lip_rgb * lip_mask[:,:,None]

# Blend iris
iris_blend = np.where(is_iris, 0.85, 0.0)[:,:,None]
plate = plate * (1.0 - iris_blend) + iris_rgb * iris_blend

# 5. Composite hair over plate
# For Ebony preset, Level 2 Natural Black hair: #2c2622
# OKLab for #2c2622: L=0.25, a=0.015, b=0.02
meanHairL = 0.44
k_hair = np.maximum(0.04, origL / meanHairL)
target_hair_L = 0.25
out_hair_L = np.clip(target_hair_L * (k_hair ** 1.05), 0.08, 0.96)
out_hair_A = 0.015 + (origA - 0.025) * 0.15
out_hair_B = 0.020 + (origB - 0.035) * 0.15

lin_h_r, lin_h_g, lin_h_b = oklab_to_lin(out_hair_L, out_hair_A, out_hair_B)
hair_rgb = lin_to_srgb(np.stack([lin_h_r, lin_h_g, lin_h_b], axis=-1))

# Final composite
final_composite = plate * (1.0 - hair_alpha[:,:,None]) + hair_rgb * hair_alpha[:,:,None]

out_img = Image.fromarray(final_composite.astype(np.uint8))
crop_test = out_img.crop((200, 200, 800, 850))
crop_test.save('/home/lord-kratos/.gemini/antigravity/brain/b64d942c-d36c-484a-86d1-93d67a5d3e1a/test_full_composite.png')
print('Saved test_full_composite.png!')
