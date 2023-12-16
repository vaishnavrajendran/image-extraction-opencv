import cv2

image = cv2.imread('skew.png')

gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
gray = cv2.bitwise_not(gray)
cv2.imshow('gray not', gray)
thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
cv2.imshow('thresh', thresh)
coords = np.colum_stack(np.where(thresh > 0))
print('coord', coords)
angle = cv2.minAreaRect(coords)[-1]

if angle < -45
    angle = -(90 + angle)

else:
    angle = -angle

(h, w) = image.shape[:2]
center = (w //2, h//2)
M = cv2.getRotationMatrix2D(center, angle, 1.0)
rotated = cv2.wrapAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATION)

print(" angle: {:.3f}".format(angle))
cv2.imshow("Input", image)
cv2.imshow("Rotated", rotated)
cv2.waitKey(0)
cv2.destroyAllWindows()