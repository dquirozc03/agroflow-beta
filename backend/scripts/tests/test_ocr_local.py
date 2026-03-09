import pytesseract
try:
    print("Tesseract Version:", pytesseract.get_tesseract_version())
    print("Tesseract Cmd:", pytesseract.pytesseract.tesseract_cmd)
except Exception as e:
    print("Error:", e)
