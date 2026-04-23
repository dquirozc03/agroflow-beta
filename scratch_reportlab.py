from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet
import traceback

styles = getSampleStyleSheet()

try:
    p = Paragraph("<b>R&M FORWARDING</b>", styles["Normal"])
    print("R&M SUCCESS. Output text:", p.getPlainText())
except Exception as e:
    print("R&M FAILED:", e)

try:
    p = Paragraph("<b>R&amp;M FORWARDING</b>", styles["Normal"])
    print("R&amp;M SUCCESS. Output text:", p.getPlainText())
except Exception as e:
    print("R&amp;M FAILED:", e)

try:
    p = Paragraph("<b>R&M; FORWARDING</b>", styles["Normal"])
    print("R&M; SUCCESS. Output text:", p.getPlainText())
except Exception as e:
    print("R&M; FAILED:", e)
