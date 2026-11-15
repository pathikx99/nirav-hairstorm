import cv2
import numpy as np

def segment_front():
    img = cv2.imread('frontend/public/models/model_front.jpg')
    h, w, _ = img.shape
    
    mask = np.zeros((h, w), np.uint8)
    mask[90:1000, 130:770] = cv2.GC_PR_FGD
    
    # Background
    mask[0:90, :] = cv2.GC_BGD
    mask[:, 0:130] = cv2.GC_BGD
    mask[:, 780:] = cv2.GC_BGD
    mask[1000:, :] = cv2.GC_BGD
    mask[560:1000, 360:540] = cv2.GC_BGD
    cv2.ellipse(mask, (448, 360), (75, 120), 0, 0, 360, cv2.GC_BGD, -1)
    cv2.rectangle(mask, (410, 470), (490, 560), cv2.GC_BGD, -1)
    
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    cv2.grabCut(img, mask, None, bgdModel, fgdModel, 4, cv2.GC_INIT_WITH_MASK)
    
    hair_bin = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hair_bin[gray < 45] = 0
    hair_bin[750:, :170] = 0
    hair_bin[750:, 730:] = 0
    
    # Keep only largest connected component to remove isolated bokeh artifacts
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(hair_bin)
    if num_labels > 1:
        largest_idx = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        hair_clean = np.where(labels == largest_idx, 255, 0).astype(np.uint8)
    else:
        hair_clean = hair_bin
        
    hair_smooth = cv2.GaussianBlur(hair_clean, (9, 9), 3)
    cv2.imwrite('frontend/public/models/mask_front_hair.png', hair_smooth)
    print("Clean front hair mask saved.")

    # Skin mask:
    skin_mask = np.zeros((h, w), np.uint8)
    cv2.ellipse(skin_mask, (448, 350), (86, 125), 0, 0, 360, 255, -1)
    # Neck polygon connecting to collar
    pts = np.array([[390, 455], [506, 455], [515, 560], [380, 560]], np.int32)
    cv2.fillPoly(skin_mask, [pts], 255)
    
    # Mask out hair area from skin
    skin_mask[hair_clean > 100] = 0
    
    # Exclude eyes and lips
    cv2.ellipse(skin_mask, (388, 335), (28, 18), 0, 0, 360, 0, -1)
    cv2.ellipse(skin_mask, (508, 335), (28, 18), 0, 0, 360, 0, -1)
    cv2.ellipse(skin_mask, (448, 445), (34, 20), 0, 0, 360, 0, -1)
    
    skin_smooth = cv2.GaussianBlur(skin_mask, (15, 15), 5)
    cv2.imwrite('frontend/public/models/mask_front_skin.png', skin_smooth)
    print("Clean front skin mask saved.")

def segment_back():
    img = cv2.imread('frontend/public/models/model_back.jpg')
    h, w, _ = img.shape
    
    mask = np.zeros((h, w), np.uint8)
    mask[130:1040, 210:690] = cv2.GC_PR_FGD
    mask[:130, :] = cv2.GC_BGD
    mask[:, :200] = cv2.GC_BGD
    mask[:, 700:] = cv2.GC_BGD
    mask[1050:, :] = cv2.GC_BGD
    mask[450:900, 150:230] = cv2.GC_BGD
    mask[450:900, 670:750] = cv2.GC_BGD
    
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    cv2.grabCut(img, mask, None, bgdModel, fgdModel, 4, cv2.GC_INIT_WITH_MASK)
    
    hair_bin = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hair_bin[gray < 40] = 0
    hair_bin[940:, :260] = 0
    hair_bin[940:, 640:] = 0
    
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(hair_bin)
    if num_labels > 1:
        largest_idx = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        hair_clean = np.where(labels == largest_idx, 255, 0).astype(np.uint8)
    else:
        hair_clean = hair_bin
        
    hair_smooth = cv2.GaussianBlur(hair_clean, (9, 9), 3)
    cv2.imwrite('frontend/public/models/mask_back_hair.png', hair_smooth)
    print("Clean back hair mask saved.")

if __name__ == '__main__':
    segment_front()
    segment_back()
